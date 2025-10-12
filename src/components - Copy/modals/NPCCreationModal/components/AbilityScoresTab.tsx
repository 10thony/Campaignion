import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { ErrorDisplay } from "../../shared";
import { CharacterFormProps } from "../types/npcForm";
import { Zap, Brain, Heart, Eye, Shield, MessageSquare, Dice6, Star } from "lucide-react";
import { 
  rollAbilityScore, 
  getRacialBonuses, 
  getAbilityModifier
} from "../../../../types/dndRules";
import { AbilityScores } from "../../../../types/character";

const AbilityScoresTab: React.FC<CharacterFormProps> = ({
  formData,
  setField,
  setNestedField,
  errors,
  isReadOnly = false,
}) => {
  // We'll need access to the enhanced hook state for racial bonuses
  // For now, we'll simulate this with local state logic
  const [racialBonusesApplied, setRacialBonusesApplied] = React.useState(false);
  const [appliedRace, setAppliedRace] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const abilityScores = [
    { key: "strength", label: "Strength", icon: <Zap className="h-4 w-4" />, color: "text-red-500" },
    { key: "dexterity", label: "Dexterity", icon: <Eye className="h-4 w-4" />, color: "text-green-500" },
    { key: "constitution", label: "Constitution", icon: <Heart className="h-4 w-4" />, color: "text-orange-500" },
    { key: "intelligence", label: "Intelligence", icon: <Brain className="h-4 w-4" />, color: "text-blue-500" },
    { key: "wisdom", label: "Wisdom", icon: <Shield className="h-4 w-4" />, color: "text-purple-500" },
    { key: "charisma", label: "Charisma", icon: <MessageSquare className="h-4 w-4" />, color: "text-pink-500" },
  ];

  const getModifier = (score: number): string => {
    const modifier = getAbilityModifier(score);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const getModifierClass = (score: number): string => {
    const modifier = getAbilityModifier(score);
    if (modifier >= 3) return "text-green-600 font-semibold";
    if (modifier >= 1) return "text-green-500";
    if (modifier <= -3) return "text-red-600 font-semibold";
    if (modifier <= -1) return "text-red-500";
    return "text-gray-500";
  };

  const handleAbilityScoreChange = (ability: string, value: number) => {
    setNestedField("abilityScores", ability, Math.max(1, Math.min(30, value)));
    
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
    
    setField("abilityScores", newAbilityScores);
    
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
    const currentScores = { ...formData.abilityScores };
    
    // Apply racial bonuses
    Object.entries(racialBonuses).forEach(([ability, bonus]) => {
      if (bonus) {
        currentScores[ability as keyof AbilityScores] += bonus;
      }
    });

    setField("abilityScores", currentScores);

    // Mark racial bonuses as applied for this race
    setRacialBonusesApplied(true);
    setAppliedRace(formData.race);
    setError(null); // Clear any previous errors
  };

  const calculateFinalAbilityScores = (): AbilityScores => {
    // If racial bonuses are already applied, return the current scores
    if (racialBonusesApplied) {
      return formData.abilityScores;
    }
    
    // Otherwise, calculate what the final scores would be with racial bonuses
    const racialBonuses = getRacialBonuses(formData.race);
    const finalScores: AbilityScores = { ...formData.abilityScores };

    Object.entries(racialBonuses).forEach(([ability, bonus]) => {
      if (bonus) {
        finalScores[ability as keyof AbilityScores] += bonus;
      }
    });

    return finalScores;
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
        <div className="points-progress-bar relative bg-gray-200 rounded-full h-6 mb-2">
          <div className={`${color} h-full rounded-full transition-all duration-300`} style={{ width: `${percent}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
            <strong>{totalPoints} points</strong>
            <Badge variant="secondary" className="ml-2" title={methodDescription}>
              {method}
            </Badge>
          </span>
        </div>
        {warning && (
          <div className="points-warning text-yellow-600 text-sm mb-2">
            <span>⚠️ {warning}</span>
          </div>
        )}
        <div className="summary-note text-xs text-muted-foreground">
          <small>
            💡 <strong>D&D 5e Methods:</strong> Standard Array (72-78), Point Buy (27), or Roll 4d6 drop lowest
          </small>
        </div>
      </div>
    );
  };

  const finalAbilityScores = calculateFinalAbilityScores();

  const renderAbilityScoreField = (ability: typeof abilityScores[0]) => {
    const score = formData.abilityScores[ability.key as keyof typeof formData.abilityScores];
    const finalValue = finalAbilityScores[ability.key as keyof AbilityScores];
    const racialBonus = finalValue - score;
    
    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{ability.label}:</span>
            <span className="font-semibold">
              {finalValue}
              {racialBonus > 0 && (
                <span className="text-green-600 text-sm"> (+{racialBonus})</span>
              )}
            </span>
          </div>
          <div className={`text-xs mt-1 ${getModifierClass(finalValue)}`}>
            Modifier: {getModifier(finalValue)}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="number"
            value={score}
            onChange={(e) => handleAbilityScoreChange(ability.key, parseInt(e.target.value) || 0)}
            min="1"
            max="30"
            className={`flex-1 ${errors[`abilityScores.${ability.key}`] ? "border-destructive" : ""}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRollAbilityScore(ability.key)}
            title="Roll 4d6, drop lowest"
            className="px-2"
          >
            <Dice6 className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm">
          <span className="font-medium">
            {finalValue}
            {racialBonus > 0 && (
              <span className="text-green-600"> (+{racialBonus})</span>
            )}
          </span>
          <span className={`ml-2 ${getModifierClass(finalValue)}`}>
            {getModifier(finalValue)}
          </span>
        </div>
      </div>
    );
  };

  // Reset racial bonuses state when race changes (via effect)
  React.useEffect(() => {
    if (appliedRace && appliedRace !== formData.race) {
      setRacialBonusesApplied(false);
      setAppliedRace("");
    }
  }, [formData.race, appliedRace]);

  return (
    <div className="space-y-6">
      <FormSection
        title="Ability Score Generation"
        description="Generate and customize the six core D&D ability scores"
        icon={<Dice6 className="h-5 w-5" />}
      >
        {!isReadOnly && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRollAllAbilityScores}
                className="flex items-center gap-2"
              >
                <Dice6 className="h-4 w-4" />
                Roll All (4d6 drop lowest)
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              💡 <strong>Rolling:</strong> Each ability score is rolled using 4d6, dropping the lowest die.
              Racial bonuses can be applied after rolling or setting scores manually.
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        title="Racial Bonuses"
        description="Apply racial ability score bonuses based on character race"
        icon={<Star className="h-5 w-5" />}
      >
        {!isReadOnly && (
          <div className="space-y-4">
            {racialBonusesApplied && appliedRace && (
              <div className="racial-bonus-indicator">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✓ {appliedRace} Racial Bonuses Applied: {getRacialBonusDescription(appliedRace)}
                </Badge>
              </div>
            )}
            
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive rounded-md p-3">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {formData.race && (
                <Button
                  type="button"
                  variant={racialBonusesApplied && appliedRace === formData.race ? "default" : "outline"}
                  onClick={handleApplyRacialBonuses}
                  disabled={racialBonusesApplied && appliedRace === formData.race}
                  title={racialBonusesApplied && appliedRace === formData.race 
                    ? `${appliedRace} bonuses already applied` 
                    : `Apply ${formData.race} racial bonuses: ${getRacialBonusDescription(formData.race)}`}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  {racialBonusesApplied && appliedRace === formData.race 
                    ? `✓ ${formData.race} Bonuses Applied` 
                    : `Apply ${formData.race} Bonuses`}
                </Button>
              )}
              {!formData.race && (
                <div className="text-sm text-muted-foreground">
                  Please select a race from the Basic Info tab to apply racial bonuses.
                </div>
              )}
            </div>
            
            {formData.race && (
              <div className="text-sm text-muted-foreground">
                💡 <strong>Racial Bonuses for {formData.race}:</strong> {getRacialBonusDescription(formData.race)}
                <br />
                <span className="text-xs">
                  You can only apply racial bonuses once per character. 
                  Manual changes to ability scores will reset the bonus status.
                </span>
              </div>
            )}
          </div>
        )}
        
        {isReadOnly && racialBonusesApplied && appliedRace && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {appliedRace} Racial Bonuses Applied: {getRacialBonusDescription(appliedRace)}
          </Badge>
        )}
      </FormSection>

      <FormSection
        title="Ability Scores"
        description="The six core D&D ability scores (1-30 range)"
        icon={<Zap className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {abilityScores.map((ability) => (
            <div key={ability.key} className="space-y-2">
              <Label htmlFor={ability.key} className="flex items-center gap-2">
                <span className={ability.color}>{ability.icon}</span>
                {ability.label}
              </Label>
              {renderAbilityScoreField(ability)}
              <ErrorDisplay errors={errors} field={`abilityScores.${ability.key}`} variant="inline" />
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Ability Score Analysis"
        description="Overview and validation of ability score distribution"
        icon={<Brain className="h-5 w-5" />}
      >
        <AbilityScoresFeedback totalPoints={calculateTotalPoints()} method={getAbilityScoreMethod()} />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          {abilityScores.map((ability) => {
            const score = formData.abilityScores[ability.key as keyof typeof formData.abilityScores];
            const finalValue = finalAbilityScores[ability.key as keyof AbilityScores];
            const modifier = getModifier(finalValue);
            const modifierClass = getModifierClass(finalValue);
            const racialBonus = finalValue - score;
            
            return (
              <div key={ability.key} className="text-center p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className={ability.color}>{ability.icon}</span>
                  <span className="text-xs font-medium">{ability.label}</span>
                </div>
                <div className="text-lg font-bold">
                  {finalValue}
                  {racialBonus > 0 && (
                    <span className="text-green-600 text-sm"> (+{racialBonus})</span>
                  )}
                </div>
                <div className={`text-sm ${modifierClass}`}>{modifier}</div>
              </div>
            );
          })}
        </div>
      </FormSection>
    </div>
  );
};

export default AbilityScoresTab; 