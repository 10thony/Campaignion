import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  AlertCircle, 
  ArrowLeft, 
  Shield,
  Sword,
  Zap,
  Eye,
  Heart,
  Target,
  Plus,
  X
} from "lucide-react";

interface MonsterFormProps {
  onSubmitSuccess: () => void;
  onCancel: () => void;
  editingMonsterId?: Id<"monsters"> | null;
}

const MonsterForm: React.FC<MonsterFormProps> = ({
  onSubmitSuccess,
  onCancel,
  editingMonsterId,
}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [formData, setFormData] = useState({
    name: "",
    source: "",
    page: "",
    size: "Medium" as "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan",
    type: "",
    tags: [] as string[],
    alignment: "",
    armorClass: 10,
    armorType: "",
    hitPoints: 10,
    hitDice: { count: 1, die: "d8" as "d4" | "d6" | "d8" | "d10" | "d12" },
    proficiencyBonus: 2,
    speed: { walk: "30 ft.", swim: "", fly: "", burrow: "", climb: "" } as {
      walk?: string;
      swim?: string;
      fly?: string;
      burrow?: string;
      climb?: string;
    },
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    savingThrows: [] as string[],
    skills: [] as string[],
    damageVulnerabilities: [] as string[],
    damageResistances: [] as string[],
    damageImmunities: [] as string[],
    conditionImmunities: [] as string[],
    senses: {
      darkvision: "",
      blindsight: "",
      tremorsense: "",
      truesight: "",
      passivePerception: 10,
    } as {
      darkvision?: string;
      blindsight?: string;
      tremorsense?: string;
      truesight?: string;
      passivePerception: number;
    },
    languages: "",
    challengeRating: "1/4",
    experiencePoints: 50,
    traits: [] as Array<{ name: string; description: string }>,
    actions: [] as Array<{ name: string; description: string }>,
    reactions: [] as Array<{ name: string; description: string }>,
    legendaryActions: [] as Array<{ name: string; description: string }>,
    lairActions: [] as Array<{ name: string; description: string }>,
    regionalEffects: [] as Array<{ name: string; description: string }>,
    environment: [] as string[],
    clerkId: user?.id,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: { ...(prev[parentField as keyof typeof prev] as Record<string, any>), [childField]: value }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) newErrors.push("Name is required");
    if (!formData.type.trim()) newErrors.push("Type is required");
    if (!formData.alignment.trim()) newErrors.push("Alignment is required");
    if (formData.armorClass < 0) newErrors.push("Armor Class must be positive");
    if (formData.hitPoints <= 0) newErrors.push("Hit Points must be positive");
    if (formData.hitDice.count <= 0) newErrors.push("Hit Dice count must be positive");
    if (formData.proficiencyBonus < 0) newErrors.push("Proficiency Bonus must be non-negative");
    if (formData.senses.passivePerception < 0) newErrors.push("Passive Perception must be non-negative");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingMonsterId) {
        await updateMonster({
          id: editingMonsterId,
          ...formData,
        });
      } else {
        await createMonster({
          ...formData,
          clerkId: user!.id,
        });
      }
      
      // Navigate based on returnTo parameter
      if (returnTo === 'campaign-form') {
        navigate("/campaigns/new");
      } else {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("Error saving monster:", error);
      setErrors(["Failed to save monster. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (returnTo === 'campaign-form') {
      navigate("/campaigns/new");
    } else {
      onCancel();
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const addTrait = () => {
    setFormData(prev => ({ ...prev, traits: [...prev.traits, { name: "", description: "" }] }));
  };

  const updateTrait = (index: number, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      traits: prev.traits.map((trait, i) => i === index ? { ...trait, [field]: value } : trait)
    }));
  };

  const removeTrait = (index: number) => {
    setFormData(prev => ({ ...prev, traits: prev.traits.filter((_, i) => i !== index) }));
  };

  const addAction = () => {
    setFormData(prev => ({ ...prev, actions: [...prev.actions, { name: "", description: "" }] }));
  };

  const updateAction = (index: number, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => i === index ? { ...action, [field]: value } : action)
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({ ...prev, actions: prev.actions.filter((_, i) => i !== index) }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Monsters
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editingMonsterId ? "Edit Monster" : "Create New Monster"}
            </h1>
            <p className="text-muted-foreground">
              {editingMonsterId ? "Update monster details" : "Define a new monster for your campaign"}
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="combat" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              Combat
            </TabsTrigger>
            <TabsTrigger value="abilities" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Abilities
            </TabsTrigger>
            <TabsTrigger value="senses" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Senses
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Core details about the monster
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
                      placeholder="Enter monster name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                      placeholder="e.g., Dragon, Undead, Humanoid"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Select
                      value={formData.size}
                      onValueChange={(value) => handleInputChange("size", value)}
                    >
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
                    <Select
                      value={formData.alignment}
                      onValueChange={(value) => handleInputChange("alignment", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        {alignmentOptions.map((option) => (
                          <SelectItem key={option.alignment} value={option.alignment}>
                            {option.alignment}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="challengeRating">Challenge Rating</Label>
                    <Select
                      value={formData.challengeRating}
                      onValueChange={(value) => handleInputChange("challengeRating", value)}
                    >
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
                      placeholder="Page number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="combat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sword className="h-5 w-5" />
                  Combat Statistics
                </CardTitle>
                <CardDescription>
                  Armor class, hit points, and combat-related stats
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
                      onChange={(e) => handleInputChange("armorClass", parseInt(e.target.value))}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="armorType">Armor Type</Label>
                    <Input
                      id="armorType"
                      value={formData.armorType}
                      onChange={(e) => handleInputChange("armorType", e.target.value)}
                      placeholder="e.g., natural armor"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hitPoints">Hit Points *</Label>
                    <Input
                      id="hitPoints"
                      type="number"
                      value={formData.hitPoints}
                      onChange={(e) => handleInputChange("hitPoints", parseInt(e.target.value))}
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
                      onChange={(e) => handleNestedChange("hitDice", "count", parseInt(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hitDiceType">Hit Dice Type</Label>
                    <Select
                      value={formData.hitDice.die}
                      onValueChange={(value) => handleNestedChange("hitDice", "die", value)}
                    >
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
                      onChange={(e) => handleInputChange("proficiencyBonus", parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Ability Scores
                </CardTitle>
                <CardDescription>
                  Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(formData.abilityScores).map(([ability, score]) => (
                    <div key={ability} className="space-y-2">
                      <Label htmlFor={ability}>{ability.charAt(0).toUpperCase() + ability.slice(1)}</Label>
                      <Input
                        id={ability}
                        type="number"
                        value={score}
                        onChange={(e) => handleNestedChange("abilityScores", ability, parseInt(e.target.value))}
                        min="1"
                        max="30"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Speed
                </CardTitle>
                <CardDescription>
                  Movement speeds for different types of movement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

          <TabsContent value="senses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Senses
                </CardTitle>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passivePerception">Passive Perception</Label>
                  <Input
                    id="passivePerception"
                    type="number"
                    value={formData.senses.passivePerception}
                    onChange={(e) => handleNestedChange("senses", "passivePerception", parseInt(e.target.value))}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Traits
                </CardTitle>
                <CardDescription>
                  Special abilities and traits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.traits.map((trait, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <Label>Trait {index + 1}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTrait(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Trait name"
                      value={trait.name}
                      onChange={(e) => updateTrait(index, 'name', e.target.value)}
                    />
                    <Textarea
                      placeholder="Trait description"
                      value={trait.description}
                      onChange={(e) => updateTrait(index, 'description', e.target.value)}
                      rows={3}
                    />
                  </div>
                ))}
                <Button type="button" onClick={addTrait} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trait
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sword className="h-5 w-5" />
                  Actions
                </CardTitle>
                <CardDescription>
                  Combat and special actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.actions.map((action, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <Label>Action {index + 1}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAction(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Action name"
                      value={action.name}
                      onChange={(e) => updateAction(index, 'name', e.target.value)}
                    />
                    <Textarea
                      placeholder="Action description"
                      value={action.description}
                      onChange={(e) => updateAction(index, 'description', e.target.value)}
                      rows={3}
                    />
                  </div>
                ))}
                <Button type="button" onClick={addAction} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (editingMonsterId ? "Update Monster" : "Create Monster")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MonsterForm; 