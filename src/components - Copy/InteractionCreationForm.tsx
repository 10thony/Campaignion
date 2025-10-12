import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { 
  AlertCircle, 
  ArrowLeft, 
  Users,
  MapPin,
  Target
} from "lucide-react";

interface InteractionCreationFormProps {
  onSubmitSuccess: () => void;
  onCancel: () => void;
  editingInteractionId?: Id<"interactions"> | null;
}

const InteractionCreationForm: React.FC<InteractionCreationFormProps> = ({
  onSubmitSuccess,
  onCancel,
  editingInteractionId,
}) => {
  const { user } = useUser();
  const createInteraction = useMutation(api.interactions.createInteraction);
  const updateInteraction = useMutation(api.interactions.updateInteraction);
  const interaction = useQuery(
    api.interactions.getInteractionById,
    editingInteractionId ? { id: editingInteractionId } : "skip"
  );
  const quests = useQuery(api.quests.getAllQuests);
  const questTasks = useQuery(api.questTasks.getAllQuestTasks);
  const playerCharacters = useQuery(api.characters.getAllCharacters);
  const npcs = useQuery(api.npcs.getAllNpcs);
  const monsters = useQuery(api.monsters.getAllMonsters);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    questId: "",
    questTaskId: "",
    playerCharacterIds: [] as Id<"playerCharacters">[],
    npcIds: [] as Id<"npcs">[],
    monsterIds: [] as Id<"monsters">[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (interaction) {
      setFormData({
        name: interaction.name,
        description: interaction.description || "",
        questId: interaction.relatedQuestId || "",
        questTaskId: interaction.questTaskId || "",
        playerCharacterIds: interaction.playerCharacterIds || [],
        npcIds: interaction.npcIds || [],
        monsterIds: interaction.monsterIds || [],
      });
    }
  }, [interaction]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setErrors({ general: "User not authenticated" });
      return;
    }

    setIsSubmitting(true);

    try {
      const interactionData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        clerkId: user.id,
        questId: formData.questId ? (formData.questId as Id<"quests">) : undefined,
        questTaskId: formData.questTaskId ? (formData.questTaskId as Id<"questTasks">) : undefined,
        playerCharacterIds: formData.playerCharacterIds.length > 0 ? formData.playerCharacterIds : undefined,
        npcIds: formData.npcIds.length > 0 ? formData.npcIds : undefined,
        monsterIds: formData.monsterIds.length > 0 ? formData.monsterIds : undefined,
      };

      if (editingInteractionId) {
        await updateInteraction({
          id: editingInteractionId,
          ...interactionData,
        });
      } else {
        await createInteraction(interactionData);
      }

      onSubmitSuccess();
    } catch (error) {
      console.error("Error saving interaction:", error);
      setErrors({ general: "Failed to save interaction. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCharacterToggle = (characterId: Id<"playerCharacters">) => {
    const newCharacterIds = formData.playerCharacterIds.includes(characterId)
      ? formData.playerCharacterIds.filter(id => id !== characterId)
      : [...formData.playerCharacterIds, characterId];
    handleInputChange("playerCharacterIds", newCharacterIds);
  };

  const handleNpcToggle = (npcId: Id<"npcs">) => {
    const newNpcIds = formData.npcIds.includes(npcId)
      ? formData.npcIds.filter(id => id !== npcId)
      : [...formData.npcIds, npcId];
    handleInputChange("npcIds", newNpcIds);
  };

  const handleMonsterToggle = (monsterId: Id<"monsters">) => {
    const newMonsterIds = formData.monsterIds.includes(monsterId)
      ? formData.monsterIds.filter(id => id !== monsterId)
      : [...formData.monsterIds, monsterId];
    handleInputChange("monsterIds", newMonsterIds);
  };

  const filteredQuestTasks = questTasks?.filter(task => 
    !formData.questId || task.questId === formData.questId
  ) || [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interactions
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editingInteractionId ? "Edit Interaction" : "Create New Interaction"}
            </h1>
            <p className="text-muted-foreground">
              {editingInteractionId ? "Update interaction details" : "Define a new interaction between characters"}
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants
            </TabsTrigger>
            <TabsTrigger value="context" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Context
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              {/* Removed Gift icon */}
              Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Core details about the interaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Interaction Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter interaction name"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the interaction..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants
                </CardTitle>
                <CardDescription>
                  Select characters, NPCs, and monsters involved in this interaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Player Characters */}
                <div className="space-y-3">
                  <Label>Player Characters</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {playerCharacters?.map((character) => (
                      <div key={character._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`char-${character._id}`}
                          checked={formData.playerCharacterIds.includes(character._id)}
                          onCheckedChange={() => handleCharacterToggle(character._id)}
                        />
                        <Label htmlFor={`char-${character._id}`} className="text-sm cursor-pointer">
                          {character.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* NPCs */}
                <div className="space-y-3">
                  <Label>NPCs</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {npcs?.map((npc) => (
                      <div key={npc._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`npc-${npc._id}`}
                          checked={formData.npcIds.includes(npc._id)}
                          onCheckedChange={() => handleNpcToggle(npc._id)}
                        />
                        <Label htmlFor={`npc-${npc._id}`} className="text-sm cursor-pointer">
                          {npc.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Monsters */}
                <div className="space-y-3">
                  <Label>Monsters</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {monsters?.map((monster) => (
                      <div key={monster._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`monster-${monster._id}`}
                          checked={formData.monsterIds.includes(monster._id)}
                          onCheckedChange={() => handleMonsterToggle(monster._id)}
                        />
                        <Label htmlFor={`monster-${monster._id}`} className="text-sm cursor-pointer">
                          {monster.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="context" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Quest Context
                </CardTitle>
                <CardDescription>
                  Associate this interaction with quests and tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="questId">Associated Quest</Label>
                  <Select
                    value={formData.questId || "none"}
                    onValueChange={(value) => handleInputChange("questId", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a quest (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No quest</SelectItem>
                      {quests?.map((quest) => (
                        <SelectItem key={quest._id} value={quest._id}>
                          {quest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questTaskId">Associated Quest Task</Label>
                  <Select
                    value={formData.questTaskId || "none"}
                    onValueChange={(value) => handleInputChange("questTaskId", value === "none" ? "" : value)}
                    disabled={!formData.questId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.questId ? "Select a task (optional)" : "Select a quest first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No task</SelectItem>
                      {filteredQuestTasks.map((task) => (
                        <SelectItem key={task._id} value={task._id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* Removed Gift icon */}
                  Rewards
                </CardTitle>
                <CardDescription>
                  Configure rewards for completing this interaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  {/* Removed Gift icon */}
                  <p>Reward configuration coming soon...</p>
                  <p className="text-sm">This feature will allow you to set XP, gold, and item rewards.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (editingInteractionId ? "Update Interaction" : "Create Interaction")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InteractionCreationForm; 