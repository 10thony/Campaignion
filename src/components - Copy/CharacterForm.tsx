import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { CharacterFormData, AbilityScores, RACES, CLASSES, BACKGROUNDS, ALIGNMENTS } from "../types/character";
import { Id } from "../../convex/_generated/dataModel";
import { 
  rollAbilityScore, 
  getRacialBonuses, 
  getAbilityModifier,
  getClassSavingThrows,
  getClassSkills,
  getBackgroundSkills,
  calculateHitPoints,
  calculateArmorClass,
  getProficiencyBonus
} from "../types/dndRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import "./CharacterForm.css";

interface CharacterFormProps {
  onSuccess?: () => void;
  defaultCharacterType?: "PlayerCharacter" | "NonPlayerCharacter";
}

const CharacterForm: React.FC<CharacterFormProps> = ({ onSuccess, defaultCharacterType = "PlayerCharacter" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { user } = useUser();
  const createCharacter = useMutation(api.characters.createPlayerCharacter);
  const loadSampleActions = useMutation(api.actions.loadSampleActionsFromJson);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<Id<"actions">[]>([]);
  const [racialBonusesApplied, setRacialBonusesApplied] = useState(false);
  const [appliedRace, setAppliedRace] = useState<string>("");

  // Get user's database ID
  const userRecord = useQuery(api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );

  const [formData, setFormData] = useState<CharacterFormData>({
    name: "",
    class: "",
    race: "",
    background: "",
    alignment: "",
    characterType: defaultCharacterType,
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    factionId: "",
  });

  // Get available actions based on class
  const availableActions = useQuery(api.actions.getActionsByClass, {
    className: formData.class || "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset racial bonuses applied state when race changes
    if (name === "race") {
      setRacialBonusesApplied(false);
      setAppliedRace("");
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset racial bonuses applied state when race changes
    if (name === "race") {
      setRacialBonusesApplied(false);
      setAppliedRace("");
    }
  };

  const handleAbilityScoreChange = (ability: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      abilityScores: {
        ...prev.abilityScores,
        [ability]: Math.max(1, Math.min(20, value)),
      },
    }));

    // Reset racial bonuses applied state when manually changing scores
    if (racialBonusesApplied) {
      setRacialBonusesApplied(false);
      setAppliedRace("");
    }
  };

  const handleRollAbilityScore = (ability: string) => {
    const rolledScore = rollAbilityScore();
    handleAbilityScoreChange(ability, rolledScore);
  };

  const handleRollAllAbilityScores = () => {
    const newAbilityScores = {
      strength: rollAbilityScore(),
      dexterity: rollAbilityScore(),
      constitution: rollAbilityScore(),
      intelligence: rollAbilityScore(),
      wisdom: rollAbilityScore(),
      charisma: rollAbilityScore(),
    };
    
    setFormData((prev) => ({
      ...prev,
      abilityScores: newAbilityScores,
    }));

    // Reset racial bonuses applied state when rolling new scores
    setRacialBonusesApplied(false);
    setAppliedRace("");
  };

  const handleApplyRacialBonuses = () => {
    if (!formData.race) {
      setError("Please select a race first to apply racial bonuses");
      return;
    }

    // Check if racial bonuses have already been applied for this race
    if (racialBonusesApplied && appliedRace === formData.race) {
      setError(`${formData.race} racial bonuses have already been applied. You can only apply racial bonuses once per race.`);
      return;
    }

    // If a different race was previously applied, reset the bonuses first
    if (racialBonusesApplied && appliedRace !== formData.race) {
      setError(`You have already applied ${appliedRace} racial bonuses. Please roll new ability scores or change back to ${appliedRace} to apply different racial bonuses.`);
      return;
    }

    const racialBonuses = getRacialBonuses(formData.race);
    setFormData((prev) => ({
      ...prev,
      abilityScores: {
        ...prev.abilityScores,
        ...Object.entries(racialBonuses).reduce((acc, [ability, bonus]) => {
          acc[ability as keyof typeof prev.abilityScores] = 
            (prev.abilityScores[ability as keyof typeof prev.abilityScores] || 0) + (bonus || 0);
          return acc;
        }, {} as typeof prev.abilityScores),
      },
    }));

    // Mark racial bonuses as applied for this race
    setRacialBonusesApplied(true);
    setAppliedRace(formData.race);
    setError(null); // Clear any previous errors
  };

  const getRacialBonusDescription = (race: string): string => {
    const bonuses = getRacialBonuses(race);
    const bonusEntries = Object.entries(bonuses)
      .map(([ability, bonus]) => `${ability} +${bonus}`)
      .join(", ");
    return bonusEntries || "No racial bonuses";
  };

  const calculateTotalPoints = () => {
    return Object.values(formData.abilityScores).reduce((sum, score) => sum + score, 0);
  };

  const getAbilityScoreMethod = () => {
    const total = calculateTotalPoints();
    if (total >= 70 && total <= 80) return "Standard Array (72-78)";
    if (total >= 60 && total <= 85) return "Point Buy (27 points)";
    if (total > 85) return "Rolled (High)";
    if (total < 60) return "Rolled (Low)";
    return "Custom";
  };

  const handleActionToggle = (actionId: Id<"actions">) => {
    setSelectedActions((prev) => {
      if (prev.includes(actionId)) {
        return prev.filter(id => id !== actionId);
      } else {
        return [...prev, actionId];
      }
    });
  };

  const calculateFinalAbilityScores = (): AbilityScores => {
    const racialBonuses = getRacialBonuses(formData.race);
    const finalScores: AbilityScores = { ...formData.abilityScores };

    Object.entries(racialBonuses).forEach(([ability, bonus]) => {
      if (bonus) {
        finalScores[ability as keyof AbilityScores] += bonus;
      }
    });

    return finalScores;
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Character name is required");
      return false;
    }
    if (!formData.race) {
      setError("Race is required");
      return false;
    }
    if (!formData.class) {
      setError("Class is required");
      return false;
    }
    if (!formData.background) {
      setError("Background is required");
      return false;
    }

    // Validate ability scores
    const scores = Object.values(formData.abilityScores);
    if (scores.some(score => score < 1 || score > 20)) {
      setError("Ability scores must be between 1 and 20");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!userRecord) {
      setError("User not found. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const finalAbilityScores = calculateFinalAbilityScores();
      
      const characterData = {
        name: formData.name.trim(),
        class: formData.class,
        race: formData.race,
        background: formData.background,
        alignment: formData.alignment || undefined,
        characterType: formData.characterType,
        abilityScores: finalAbilityScores,
        clerkId: user?.id || "",
        factionId: formData.factionId ? formData.factionId as Id<"factions"> : undefined,
        actions: selectedActions,
        level: 1,
        experiencePoints: 0,
        hitPoints: calculateHitPoints(formData.class, finalAbilityScores.constitution),
        armorClass: calculateArmorClass(finalAbilityScores.dexterity),
        proficiencyBonus: getProficiencyBonus(1),
        savingThrows: getClassSavingThrows(formData.class),
        skills: [
          ...new Set([
            ...getClassSkills(formData.class),
            ...getBackgroundSkills(formData.background),
          ]),
        ],
        proficiencies: [], // Add empty proficiencies array
      };

      await createCharacter(characterData);

      if (onSuccess) {
        onSuccess();
      } else if (returnTo) {
        navigate(returnTo);
      } else {
        navigate("/characters");
      }
    } catch (err) {
      console.error("Error creating character:", err);
      setError("Failed to create character. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (returnTo) {
      navigate(returnTo);
    } else {
      navigate("/characters");
    }
  };

  const handleLoadSampleActions = async () => {
    if (!user?.id) {
      setError("Please sign in to load sample actions");
      return;
    }

    setIsLoadingActions(true);
    setError(null);
    
    try {
      await loadSampleActions({ clerkId: user.id });
      // The query will automatically refetch after the mutation
    } catch (err) {
      console.error("Error loading sample actions:", err);
      setError("Failed to load sample actions. Please try again.");
    } finally {
      setIsLoadingActions(false);
    }
  };

  const getProgressBarColor = (total: number) => {
    if (total >= 70 && total <= 80) return "bg-green-500";
    if (total >= 60 && total <= 85) return "bg-blue-500";
    if (total > 85) return "bg-yellow-500";
    if (total < 60) return "bg-red-500";
    return "bg-gray-500";
  };

  const getMethodDescription = (method: string) => {
    switch (method) {
      case "Standard Array (72-78)":
        return "Standard array of ability scores (15, 14, 13, 12, 10, 8)";
      case "Point Buy (27 points)":
        return "Point buy system with 27 points to distribute";
      case "Rolled (High)":
        return "Rolled ability scores above typical range";
      case "Rolled (Low)":
        return "Rolled ability scores below typical range";
      default:
        return "Custom ability score method";
    }
  };

  const getWarning = (total: number) => {
    if (total > 85) return "Very high ability scores - consider re-rolling";
    if (total < 60) return "Very low ability scores - consider re-rolling";
    return null;
  };

  const AbilityScoresFeedback: React.FC<{ totalPoints: number; method: string }> = ({ totalPoints, method }) => {
    const min = 60;
    const max = 85;
    const percent = Math.min(100, Math.max(0, ((totalPoints - min) / (max - min)) * 100));
    const color = getProgressBarColor(totalPoints);
    const warning = getWarning(totalPoints);
    const methodDescription = getMethodDescription(method);

    return (
      <div className="ability-scores-feedback">
        <div className="points-progress-bar">
          <div className={`progress-bar-fill ${color}`} style={{ width: `${percent}%` }} />
          <span className="points-label">
            <strong>{totalPoints} points</strong>
            <Badge variant="secondary" className="ml-2" title={methodDescription}>
              {method}
            </Badge>
          </span>
        </div>
        {warning && (
          <div className="points-warning">
            <span>⚠️ {warning}</span>
          </div>
        )}
        <div className="summary-note">
          <small>
            💡 <strong>D&D 5e Methods:</strong> Standard Array (72-78), Point Buy (27), or Roll 4d6 drop lowest
          </small>
        </div>
      </div>
    );
  };

  const finalAbilityScores = calculateFinalAbilityScores();

  return (
    <div className="character-form">
      <h2 className="form-section-title">
        Create New {defaultCharacterType === "NonPlayerCharacter" ? "NPC" : "Character"}
      </h2>

      {error && (
        <div className="form-error bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Character Name *</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="race">Race *</Label>
                <Select value={formData.race} onValueChange={(value) => handleSelectChange("race", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Race" />
                  </SelectTrigger>
                  <SelectContent>
                    {RACES.map((race: string) => (
                      <SelectItem key={race} value={race}>{race}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={formData.class} onValueChange={(value) => handleSelectChange("class", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((cls: string) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="background">Background *</Label>
                <Select value={formData.background} onValueChange={(value) => handleSelectChange("background", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Background" />
                  </SelectTrigger>
                  <SelectContent>
                    {BACKGROUNDS.map((background: string) => (
                      <SelectItem key={background} value={background}>{background}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alignment">Alignment</Label>
                <Select value={formData.alignment} onValueChange={(value) => handleSelectChange("alignment", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Alignment (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALIGNMENTS.map((alignment: string) => (
                      <SelectItem key={alignment} value={alignment}>{alignment}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="characterType">Character Type *</Label>
                <Select value={formData.characterType} onValueChange={(value) => handleSelectChange("characterType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PlayerCharacter">Player Character</SelectItem>
                    <SelectItem value="NonPlayerCharacter">Non-Player Character</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ability Scores Section */}
        <Card>
          <CardHeader>
            <CardTitle>Ability Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {racialBonusesApplied && appliedRace && (
              <div className="racial-bonus-indicator">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✓ {appliedRace} Racial Bonuses Applied: {getRacialBonusDescription(appliedRace)}
                </Badge>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRollAllAbilityScores}
              >
                Roll All (4d6 drop lowest)
              </Button>
              {formData.race && (
                <Button
                  type="button"
                  variant={racialBonusesApplied && appliedRace === formData.race ? "default" : "outline"}
                  onClick={handleApplyRacialBonuses}
                  disabled={racialBonusesApplied && appliedRace === formData.race}
                  title={racialBonusesApplied && appliedRace === formData.race 
                    ? `${appliedRace} bonuses already applied` 
                    : `Apply ${formData.race} racial bonuses: ${getRacialBonusDescription(formData.race)}`}
                >
                  {racialBonusesApplied && appliedRace === formData.race 
                    ? `✓ ${formData.race} Bonuses Applied` 
                    : `Apply ${formData.race} Bonuses`}
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              💡 <strong>Racial Bonuses:</strong> Each race provides specific ability score bonuses. 
              You can only apply racial bonuses once per character. 
              Manual changes to ability scores will reset the bonus status.
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(formData.abilityScores).map(([ability, score]) => {
                const finalValue = finalAbilityScores[ability as keyof AbilityScores];
                const modifier = getAbilityModifier(finalValue);
                const racialBonus = finalValue - score;

                return (
                  <div key={ability} className="space-y-2">
                    <Label htmlFor={ability} className="capitalize">{ability}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        id={ability}
                        value={score}
                        onChange={(e) =>
                          handleAbilityScoreChange(ability, parseInt(e.target.value) || 10)
                        }
                        min="1"
                        max="20"
                        className="w-16"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRollAbilityScore(ability)}
                        title="Roll 4d6, drop lowest"
                      >
                        🎲
                      </Button>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">
                        {finalValue}
                        {racialBonus > 0 && (
                          <span className="text-green-600"> (+{racialBonus})</span>
                        )}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {modifier >= 0 ? "+" : ""}{modifier}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <AbilityScoresFeedback totalPoints={calculateTotalPoints()} method={getAbilityScoreMethod()} />
          </CardContent>
        </Card>

        {/* Character Preview */}
        {formData.race && formData.class && formData.background && (
          <Card>
            <CardHeader>
              <CardTitle>Character Preview - {formData.characterType === "PlayerCharacter" ? "Player Character" : "NPC"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-sm">
                  <strong>Hit Points:</strong>{" "}
                  {calculateHitPoints(formData.class, finalAbilityScores.constitution)}
                </div>
                <div className="text-sm">
                  <strong>Armor Class:</strong>{" "}
                  {calculateArmorClass(finalAbilityScores.dexterity)}
                </div>
                <div className="text-sm">
                  <strong>Proficiency Bonus:</strong> +{getProficiencyBonus(1)}
                </div>
                {formData.characterType === "PlayerCharacter" && (
                  <div className="text-sm">
                    <strong>Starting Experience Points:</strong> 0
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Saving Throws:</strong>{" "}
                  {getClassSavingThrows(formData.class).join(", ")}
                </div>
                <div className="text-sm">
                  <strong>Skills:</strong>{" "}
                  {[
                    ...new Set([
                      ...getClassSkills(formData.class),
                      ...getBackgroundSkills(formData.background),
                    ]),
                  ].join(", ")}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions Section */}
        {formData.class && (
          <Card>
            <CardHeader>
              <CardTitle>Available Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {availableActions && availableActions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableActions.map((action) => (
                    <div key={action._id} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        checked={selectedActions.includes(action._id)}
                        onCheckedChange={() => handleActionToggle(action._id)}
                      />
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium">{action.name}</h4>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{action.type}</Badge>
                          <Badge variant="secondary">{action.actionCost}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No actions available for {formData.class} class.</p>
                  <p className="text-sm mt-2 mb-4">
                    Load sample actions to get started with common D&D actions.
                  </p>
                  <Button
                    onClick={handleLoadSampleActions}
                    disabled={isLoadingActions}
                    variant="outline"
                  >
                    {isLoadingActions ? "Loading Actions..." : "Load Sample Actions"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading 
              ? `Creating ${formData.characterType === "PlayerCharacter" ? "Character" : "NPC"}...` 
              : `Create ${formData.characterType === "PlayerCharacter" ? "Character" : "NPC"}`
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CharacterForm;
