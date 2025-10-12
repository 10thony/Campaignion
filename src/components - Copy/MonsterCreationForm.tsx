import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, CheckCircle, ArrowLeft, Plus, X } from "lucide-react";

interface MonsterCreationFormProps {
  onSubmitSuccess: () => void;
  onCancel: () => void;
  editingMonsterId?: Id<"monsters"> | null;
}

interface MonsterFormData {
  name: string;
  source: string;
  page: string;
  size: "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
  type: string;
  tags: string[];
  alignment: string;
  armorClass: number;
  armorType: string;
  hitPoints: number;
  hitDice: {
    count: number;
    die: "d4" | "d6" | "d8" | "d10" | "d12";
  };
  proficiencyBonus: number;
  speed: {
    walk?: string;
    swim?: string;
    fly?: string;
    burrow?: string;
    climb?: string;
  };
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  savingThrows: string[];
  skills: string[];
  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: {
    darkvision?: string;
    blindsight?: string;
    tremorsense?: string;
    truesight?: string;
    passivePerception: number;
  };
  languages: string;
  challengeRating: string;
  experiencePoints: number;
  traits: Array<{ name: string; description: string }>;
  actions: Array<{ name: string; description: string }>;
  reactions: Array<{ name: string; description: string }>;
  legendaryActions: Array<{ name: string; description: string }>;
  lairActions: Array<{ name: string; description: string }>;
  regionalEffects: Array<{ name: string; description: string }>;
  environment: string[];
  clerkId?: string;
}

const MonsterCreationForm: React.FC<MonsterCreationFormProps> = ({
  onSubmitSuccess,
  onCancel,
  editingMonsterId,
}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [formData, setFormData] = useState<MonsterFormData>({
    name: "",
    source: "",
    page: "",
    size: "Medium",
    type: "",
    tags: [],
    alignment: "",
    armorClass: 10,
    armorType: "",
    hitPoints: 10,
    hitDice: { count: 1, die: "d8" },
    proficiencyBonus: 2,
    speed: { walk: "30 ft.", swim: "", fly: "", burrow: "", climb: "" },
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    savingThrows: [],
    skills: [],
    damageVulnerabilities: [],
    damageResistances: [],
    damageImmunities: [],
    conditionImmunities: [],
    senses: {
      darkvision: "",
      blindsight: "",
      tremorsense: "",
      truesight: "",
      passivePerception: 10,
    },
    languages: "",
    challengeRating: "1/4",
    experiencePoints: 50,
    traits: [],
    actions: [],
    reactions: [],
    legendaryActions: [],
    lairActions: [],
    regionalEffects: [],
    environment: [],
    clerkId: user?.id,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Alignment options data
  const alignmentOptions = [
    { alignment: "Lawful good" },
    { alignment: "Lawful neutral" },
    { alignment: "Lawful evil" },
    { alignment: "Neutral good" },
    { alignment: "True neutral" },
    { alignment: "Neutral evil" },
    { alignment: "Chaotic good" },
    { alignment: "Chaotic neutral" },
    { alignment: "Chaotic evil" }
  ];

  const challengeRatings = [
    "0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
  ];

  const createMonster = useMutation(api.monsters.createMonster);
  const updateMonster = useMutation(api.monsters.updateMonster);
  const editingMonster = useQuery(
    api.monsters.getMonsterById,
    editingMonsterId ? { id: editingMonsterId } : "skip"
  );

  useEffect(() => {
    if (editingMonster && editingMonsterId) {
      setFormData({
        name: editingMonster.name,
        source: editingMonster.source || "",
        page: editingMonster.page || "",
        size: editingMonster.size,
        type: editingMonster.type,
        tags: editingMonster.tags || [],
        alignment: editingMonster.alignment,
        armorClass: editingMonster.armorClass,
        armorType: editingMonster.armorType || "",
        hitPoints: editingMonster.hitPoints,
        hitDice: editingMonster.hitDice,
        proficiencyBonus: editingMonster.proficiencyBonus,
        speed: editingMonster.speed || { walk: "30 ft.", swim: "", fly: "", burrow: "", climb: "" },
        abilityScores: editingMonster.abilityScores,
        savingThrows: editingMonster.savingThrows || [],
        skills: editingMonster.skills || [],
        damageVulnerabilities: editingMonster.damageVulnerabilities || [],
        damageResistances: editingMonster.damageResistances || [],
        damageImmunities: editingMonster.damageImmunities || [],
        conditionImmunities: editingMonster.conditionImmunities || [],
        senses: editingMonster.senses || { darkvision: "", blindsight: "", tremorsense: "", truesight: "", passivePerception: 10 },
        languages: editingMonster.languages || "",
        challengeRating: editingMonster.challengeRating,
        experiencePoints: editingMonster.experiencePoints || 0,
        traits: editingMonster.traits || [],
        actions: editingMonster.actions || [],
        reactions: editingMonster.reactions || [],
        legendaryActions: editingMonster.legendaryActions || [],
        lairActions: editingMonster.lairActions || [],
        regionalEffects: editingMonster.regionalEffects || [],
        environment: editingMonster.environment || [],
        clerkId: user?.id,
      });
    }
  }, [editingMonster, editingMonsterId]);

  const handleInputChange = (field: keyof MonsterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts fixing them
    if (validationAttempted && errors.length > 0) {
      setErrors([]);
      setValidationAttempted(false);
    }
  };

  const handleNestedChange = (parentField: keyof MonsterFormData, childField: string, value: any) => {
    setFormData(prev => {
      const parentValue = prev[parentField];
      if (typeof parentValue === 'object' && parentValue !== null) {
        return {
          ...prev,
          [parentField]: {
            ...parentValue,
            [childField]: value,
          },
        };
      }
      return prev;
    });
    
    if (validationAttempted && errors.length > 0) {
      setErrors([]);
      setValidationAttempted(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push("Name is required");
    }

    if (!formData.type.trim()) {
      newErrors.push("Type is required");
    }

    if (!formData.alignment) {
      newErrors.push("Alignment is required");
    }

    if (formData.armorClass < 0) {
      newErrors.push("Armor class must be 0 or greater");
    }

    if (formData.hitPoints < 1) {
      newErrors.push("Hit points must be 1 or greater");
    }

    if (formData.hitDice.count < 1) {
      newErrors.push("Hit dice count must be 1 or greater");
    }

    if (formData.proficiencyBonus < 0) {
      newErrors.push("Proficiency bonus must be 0 or greater");
    }

    if (formData.senses.passivePerception < 0) {
      newErrors.push("Passive perception must be 0 or greater");
    }

    setErrors(newErrors);
    setValidationAttempted(true);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingMonsterId) {
        await updateMonster({
          id: editingMonsterId,
          ...formData,
        });
      } else {
        // Ensure clerkId is a string before submitting
        const { clerkId, ...monsterDataWithoutClerkId } = formData;
        if (!user?.id) {
          throw new Error("User ID is required");
        }
        await createMonster({
          ...monsterDataWithoutClerkId,
          clerkId: user.id
        });
      }

      setShowSuccessMessage(true);
      setTimeout(() => {
        onSubmitSuccess();
      }, 1500);
    } catch (error) {
      console.error("Error saving monster:", error);
      setErrors(["Failed to save monster. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (returnTo === 'campaign-form') {
      navigate('/campaign-form');
    } else {
      onCancel();
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    handleInputChange("tags", formData.tags.filter((_, i) => i !== index));
  };

  const addTrait = () => {
    handleInputChange("traits", [...formData.traits, { name: "", description: "" }]);
  };

  const updateTrait = (index: number, field: 'name' | 'description', value: string) => {
    const updatedTraits = [...formData.traits];
    updatedTraits[index] = { ...updatedTraits[index], [field]: value };
    handleInputChange("traits", updatedTraits);
  };

  const removeTrait = (index: number) => {
    handleInputChange("traits", formData.traits.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {returnTo === 'campaign-form' ? "Back to Campaign Form" : "Back to Monsters"}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editingMonsterId ? "Edit Monster" : "Create New Monster"}
            </h1>
            <p className="text-muted-foreground">
              {editingMonsterId ? "Update monster details" : "Add a new monster to your collection"}
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Please fix the following errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Monster saved successfully! Redirecting...</strong>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="combat">Combat</TabsTrigger>
            <TabsTrigger value="abilities">Abilities</TabsTrigger>
            <TabsTrigger value="senses">Senses & Languages</TabsTrigger>
            <TabsTrigger value="actions">Actions & Traits</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core details about the monster including name, type, and classification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Monster name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                      placeholder="e.g., Dragon, Undead, Beast"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Select value={formData.size} onValueChange={(value) => handleInputChange("size", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tiny">Tiny</SelectItem>
                        <SelectItem value="Small">Small</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Large">Large</SelectItem>
                        <SelectItem value="Huge">Huge</SelectItem>
                        <SelectItem value="Gargantuan">Gargantuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alignment">Alignment *</Label>
                    <Select value={formData.alignment} onValueChange={(value) => handleInputChange("alignment", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select alignment..." />
                      </SelectTrigger>
                      <SelectContent>
                        {alignmentOptions.map((option, index) => (
                          <SelectItem key={index} value={option.alignment}>
                            {option.alignment}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challengeRating">Challenge Rating</Label>
                    <Select value={formData.challengeRating} onValueChange={(value) => handleInputChange("challengeRating", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {challengeRatings.map((cr) => (
                          <SelectItem key={cr} value={cr}>
                            {cr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source Book</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => handleInputChange("source", e.target.value)}
                      placeholder="e.g., Monster Manual"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="page">Page</Label>
                    <Input
                      id="page"
                      value={formData.page}
                      onChange={(e) => handleInputChange("page", e.target.value)}
                      placeholder="e.g., 42"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Combat Statistics Tab */}
          <TabsContent value="combat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Combat Statistics</CardTitle>
                <CardDescription>
                  Armor class, hit points, and combat-related attributes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="armorClass">Armor Class *</Label>
                    <Input
                      id="armorClass"
                      type="number"
                      value={formData.armorClass}
                      onChange={(e) => handleInputChange("armorClass", parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="armorType">Armor Type</Label>
                    <Input
                      id="armorType"
                      value={formData.armorType}
                      onChange={(e) => handleInputChange("armorType", e.target.value)}
                      placeholder="e.g., Natural Armor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hitPoints">Hit Points *</Label>
                    <Input
                      id="hitPoints"
                      type="number"
                      value={formData.hitPoints}
                      onChange={(e) => handleInputChange("hitPoints", parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hitDiceCount">Hit Dice Count</Label>
                    <Input
                      id="hitDiceCount"
                      type="number"
                      value={formData.hitDice.count}
                      onChange={(e) => handleNestedChange("hitDice", "count", parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hitDiceType">Hit Dice Type</Label>
                    <Select value={formData.hitDice.die} onValueChange={(value) => handleNestedChange("hitDice", "die", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="d4">d4</SelectItem>
                        <SelectItem value="d6">d6</SelectItem>
                        <SelectItem value="d8">d8</SelectItem>
                        <SelectItem value="d10">d10</SelectItem>
                        <SelectItem value="d12">d12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proficiencyBonus">Proficiency Bonus</Label>
                    <Input
                      id="proficiencyBonus"
                      type="number"
                      value={formData.proficiencyBonus}
                      onChange={(e) => handleInputChange("proficiencyBonus", parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Speed</CardTitle>
                <CardDescription>
                  Movement speeds for different types of movement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(formData.speed).map(([movementType, speed]) => (
                    <div key={movementType} className="space-y-2">
                      <Label htmlFor={movementType}>{movementType.charAt(0).toUpperCase() + movementType.slice(1)}</Label>
                      <Input
                        id={movementType}
                        value={speed}
                        onChange={(e) => handleNestedChange("speed", movementType, e.target.value)}
                        placeholder="e.g., 30 ft."
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ability Scores Tab */}
          <TabsContent value="abilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ability Scores</CardTitle>
                <CardDescription>
                  The six core ability scores that define the monster's capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(formData.abilityScores).map(([ability, score]) => (
                    <div key={ability} className="space-y-2">
                      <Label htmlFor={ability}>{ability.charAt(0).toUpperCase() + ability.slice(1)}</Label>
                      <Input
                        id={ability}
                        type="number"
                        value={score}
                        onChange={(e) => handleNestedChange("abilityScores", ability, parseInt(e.target.value) || 0)}
                        min="1"
                        max="30"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Senses & Languages Tab */}
          <TabsContent value="senses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Senses</CardTitle>
                <CardDescription>
                  Special senses and perception abilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="darkvision">Darkvision</Label>
                    <Input
                      id="darkvision"
                      value={formData.senses.darkvision}
                      onChange={(e) => handleNestedChange("senses", "darkvision", e.target.value)}
                      placeholder="e.g., 60 ft."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blindsight">Blindsight</Label>
                    <Input
                      id="blindsight"
                      value={formData.senses.blindsight}
                      onChange={(e) => handleNestedChange("senses", "blindsight", e.target.value)}
                      placeholder="e.g., 30 ft."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tremorsense">Tremorsense</Label>
                    <Input
                      id="tremorsense"
                      value={formData.senses.tremorsense}
                      onChange={(e) => handleNestedChange("senses", "tremorsense", e.target.value)}
                      placeholder="e.g., 60 ft."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="truesight">Truesight</Label>
                    <Input
                      id="truesight"
                      value={formData.senses.truesight}
                      onChange={(e) => handleNestedChange("senses", "truesight", e.target.value)}
                      placeholder="e.g., 120 ft."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passivePerception">Passive Perception</Label>
                    <Input
                      id="passivePerception"
                      type="number"
                      value={formData.senses.passivePerception}
                      onChange={(e) => handleNestedChange("senses", "passivePerception", parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="languages">Languages</Label>
                    <Input
                      id="languages"
                      value={formData.languages}
                      onChange={(e) => handleInputChange("languages", e.target.value)}
                      placeholder="e.g., Common, Draconic"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Experience</CardTitle>
                <CardDescription>
                  Experience points awarded for defeating this monster
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="experiencePoints">Experience Points</Label>
                  <Input
                    id="experiencePoints"
                    type="number"
                    value={formData.experiencePoints}
                    onChange={(e) => handleInputChange("experiencePoints", parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions & Traits Tab */}
          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Traits</CardTitle>
                <CardDescription>
                  Special abilities and characteristics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.traits.map((trait, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`trait-name-${index}`}>Trait {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTrait(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      id={`trait-name-${index}`}
                      value={trait.name}
                      onChange={(e) => updateTrait(index, 'name', e.target.value)}
                      placeholder="Trait name"
                    />
                    <Textarea
                      value={trait.description}
                      onChange={(e) => updateTrait(index, 'description', e.target.value)}
                      placeholder="Trait description"
                      rows={3}
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addTrait}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trait
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : editingMonsterId ? "Update Monster" : "Create Monster"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MonsterCreationForm; 