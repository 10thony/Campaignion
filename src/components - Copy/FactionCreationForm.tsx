import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";
import { 
  AlertCircle, 
  ArrowLeft, 
  Users,
  Target,
  Shield,
  Sword,
  Plus,
  X
} from "lucide-react";

interface FactionCreationFormProps {
  editingFactionId?: Id<"factions"> | null;
}

const FactionCreationForm: React.FC<FactionCreationFormProps> = ({
  editingFactionId,
}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const createFaction = useMutation(api.factions.createFaction);
  const updateFaction = useMutation(api.factions.updateFaction);
  const faction = useQuery(
    api.factions.getFactionById,
    editingFactionId ? { factionId: editingFactionId } : "skip"
  );

  // Fetch NPCs and factions for dropdowns
  const npcs = useQuery(api.npcs.getAllNpcs);
  const factions = useQuery(api.factions.getFactions, {});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goals: [] as string[],
    leaderNpcIds: [] as Id<"npcs">[],
    alliedFactionIds: [] as Id<"factions">[],
    enemyFactionIds: [] as Id<"factions">[],
    reputation: [] as Array<{
      playerCharacterId: Id<"playerCharacters">;
      score: number;
    }>,
  });

  const [newGoal, setNewGoal] = useState("");

  useEffect(() => {
    if (faction && editingFactionId) {
      setFormData({
        name: faction.name,
        description: faction.description,
        goals: faction.goals || [],
        leaderNpcIds: faction.leaderNpcIds || [],
        alliedFactionIds: faction.alliedFactionIds || [],
        enemyFactionIds: faction.enemyFactionIds || [],
        reputation: faction.reputation || [],
      });
    }
  }, [faction, editingFactionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // For now, we'll use a default campaign ID
      // In a real app, you'd get this from context or props
      const defaultCampaignId = "default" as Id<"campaigns">;

      if (editingFactionId) {
        await updateFaction({
          factionId: editingFactionId,
          ...formData,
        });
      } else {
        await createFaction({
          campaignId: defaultCampaignId,
          ...formData,
          clerkId: user!.id,
        });
      }
      navigate("/factions");
    } catch (error) {
      console.error("Error saving faction:", error);
      setError(error instanceof Error ? error.message : "Failed to save faction");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (field: keyof typeof formData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value],
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter(id => id !== value),
        };
      }
    });
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()],
      }));
      setNewGoal("");
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const handleCancel = () => {
    navigate("/factions");
  };

  // Filter out the current faction from the factions list when editing
  const availableFactions = factions?.filter(f => !editingFactionId || f._id !== editingFactionId) || [];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Factions List
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editingFactionId ? "Edit Faction" : "Create New Faction"}
            </h1>
            <p className="text-muted-foreground">
              {editingFactionId ? "Update faction details" : "Define a new faction with goals and relationships"}
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="leadership" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leadership
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              Relationships
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core details about the faction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Faction Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter faction name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter a detailed description of the faction..."
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Faction Goals
                </CardTitle>
                <CardDescription>
                  Define the primary objectives and aspirations of this faction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newGoal">Add New Goal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newGoal"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Enter a new goal..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                    />
                    <Button type="button" variant="outline" onClick={addGoal}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {formData.goals.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Goals</Label>
                    <div className="space-y-2">
                      {formData.goals.map((goal, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="flex-1">{goal}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGoal(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.goals.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No goals defined yet. Add some goals to define the faction's objectives.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leadership Tab */}
          <TabsContent value="leadership" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Leadership
                </CardTitle>
                <CardDescription>
                  Select NPCs who lead this faction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {npcs?.map((npc) => (
                    <div key={npc._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`leader-${npc._id}`}
                        checked={formData.leaderNpcIds.includes(npc._id)}
                        onCheckedChange={(checked) => handleMultiSelectChange("leaderNpcIds", npc._id, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`leader-${npc._id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {npc.name}
                        <Badge variant="outline" className="ml-2 text-xs">
                          Level {npc.level}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
                {(!npcs || npcs.length === 0) && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No NPCs available. Create some NPCs first to assign as faction leaders.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Allied Factions
                </CardTitle>
                <CardDescription>
                  Select factions that are friendly or allied with this faction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableFactions.map((faction) => (
                    <div key={faction._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`allied-${faction._id}`}
                        checked={formData.alliedFactionIds.includes(faction._id)}
                        onCheckedChange={(checked) => handleMultiSelectChange("alliedFactionIds", faction._id, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`allied-${faction._id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {faction.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {availableFactions.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No other factions available to form alliances with.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sword className="h-5 w-5" />
                  Enemy Factions
                </CardTitle>
                <CardDescription>
                  Select factions that are hostile or opposed to this faction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableFactions.map((faction) => (
                    <div key={faction._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`enemy-${faction._id}`}
                        checked={formData.enemyFactionIds.includes(faction._id)}
                        onCheckedChange={(checked) => handleMultiSelectChange("enemyFactionIds", faction._id, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`enemy-${faction._id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {faction.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {availableFactions.length === 0 && (
                  <div className="text-center py-8">
                    <Sword className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No other factions available to mark as enemies.</p>
                  </div>
                )}
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
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : (editingFactionId ? "Save Changes" : "Create Faction")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FactionCreationForm; 