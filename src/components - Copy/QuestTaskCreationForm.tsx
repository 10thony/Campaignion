import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { 
  AlertCircle, 
  ArrowLeft, 
  BookOpen,
  MapPin,
  Users,
  Package,
  Link,
  CheckSquare
} from "lucide-react";

interface QuestTaskFormData {
  title: string;
  description: string;
  type: "Fetch" | "Kill" | "Speak" | "Explore" | "Puzzle" | "Deliver" | "Escort" | "Custom";
  status: "NotStarted" | "InProgress" | "Completed" | "Failed";
  dependsOn: Id<"questTasks">[];
  assignedTo: Id<"playerCharacters">[];
  locationId?: Id<"locations">;
  targetNpcId?: Id<"npcs">;
  requiredItemIds: Id<"items">[];
  interactions: Id<"interactions">[];
}

const QuestTaskCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const { questId } = useParams<{ questId: string }>();
  const { user } = useUser();
  const createQuestTask = useMutation(api.questTasks.createQuestTask);
  
  // Fetch related data
  const quest = useQuery(api.quests.getQuestById, { id: questId as Id<"quests"> });
  const locations = useQuery(api.locations.list);
  const items = useQuery(api.items.getItems);
  const npcs = useQuery(api.npcs.getAllNpcs);
  const characters = useQuery(api.characters.getAllCharacters);
  const interactions = useQuery(api.interactions.getAllInteractions);
  const existingTasks = useQuery(api.questTasks.getQuestTasksByQuest, { questId: questId as Id<"quests"> });

  const [formData, setFormData] = useState<QuestTaskFormData>({
    title: "",
    description: "",
    type: "Custom",
    status: "NotStarted",
    dependsOn: [],
    assignedTo: [],
    requiredItemIds: [],
    interactions: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleMultiSelectChange = (
    field: keyof QuestTaskFormData,
    value: Id<any>
  ) => {
    setFormData((prev) => {
      const currentArray = prev[field] as Id<any>[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((id) => id !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [field]: newArray,
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!questId) {
      newErrors.submit = "Quest ID is missing";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user || !questId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        questId: questId as Id<"quests">,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        status: formData.status,
        dependsOn: formData.dependsOn.length > 0 ? formData.dependsOn : undefined,
        assignedTo: formData.assignedTo.length > 0 ? formData.assignedTo : undefined,
        locationId: formData.locationId,
        targetNpcId: formData.targetNpcId,
        requiredItemIds: formData.requiredItemIds.length > 0 ? formData.requiredItemIds : undefined,
        interactions: formData.interactions.length > 0 ? formData.interactions : undefined,
        clerkId: user.id,
      };

      await createQuestTask({
        ...taskData,
      });
      navigate(`/quests/${questId}`);
    } catch (error) {
      console.error("Error creating quest task:", error);
      setErrors({ submit: "Failed to create quest task. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/quests/${questId}`);
  };

  if (!user || !questId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading quest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quest
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Quest Task</h1>
            <p className="text-muted-foreground">
              For quest: <span className="font-medium">{quest.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.submit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="dependencies" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Dependencies
            </TabsTrigger>
            <TabsTrigger value="assignment" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assignment
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location & Target
            </TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Requirements
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core details about the quest task
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter task title"
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter task description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Task Type</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange({ target: { name: 'type', value } } as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fetch">Fetch</SelectItem>
                        <SelectItem value="Kill">Kill</SelectItem>
                        <SelectItem value="Speak">Speak</SelectItem>
                        <SelectItem value="Explore">Explore</SelectItem>
                        <SelectItem value="Puzzle">Puzzle</SelectItem>
                        <SelectItem value="Deliver">Deliver</SelectItem>
                        <SelectItem value="Escort">Escort</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange({ target: { name: 'status', value } } as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NotStarted">Not Started</SelectItem>
                        <SelectItem value="InProgress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Dependencies
                </CardTitle>
                <CardDescription>
                  Tasks that must be completed before this task can be started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label className="text-base font-medium">Depends On (Other Tasks)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select tasks that must be completed first
                  </p>
                  {existingTasks && existingTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {existingTasks.map((task: any) => (
                        <div key={task._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`task-${task._id}`}
                            checked={formData.dependsOn.includes(task._id)}
                            onCheckedChange={() => handleMultiSelectChange("dependsOn", task._id)}
                          />
                          <Label 
                            htmlFor={`task-${task._id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {task.title}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {task.status}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No existing tasks to depend on</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignment Tab */}
          <TabsContent value="assignment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assignment
                </CardTitle>
                <CardDescription>
                  Player characters assigned to this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label className="text-base font-medium">Assigned To (Player Characters)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select characters responsible for this task
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {characters?.map((character: any) => (
                      <div key={character._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`character-${character._id}`}
                          checked={formData.assignedTo.includes(character._id)}
                          onCheckedChange={() => handleMultiSelectChange("assignedTo", character._id)}
                        />
                        <Label 
                          htmlFor={`character-${character._id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {character.name}
                          <Badge variant="outline" className="ml-2 text-xs">
                            Level {character.level}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location & Target Tab */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Target
                </CardTitle>
                <CardDescription>
                  Where this task takes place and who is involved
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="locationId">Location</Label>
                  <Select 
                    value={formData.locationId || "none"} 
                    onValueChange={(value) => handleInputChange({ target: { name: 'locationId', value: value === "none" ? "" : value } } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No location</SelectItem>
                      {locations?.map((location: any) => (
                        <SelectItem key={location._id} value={location._id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetNpcId">Target NPC</Label>
                  <Select 
                    value={formData.targetNpcId || "none"} 
                    onValueChange={(value) => handleInputChange({ target: { name: 'targetNpcId', value: value === "none" ? "" : value } } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a target NPC (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No target NPC</SelectItem>
                      {npcs?.map((npc: any) => (
                        <SelectItem key={npc._id} value={npc._id}>
                          {npc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Requirements
                </CardTitle>
                <CardDescription>
                  Items and interactions needed for this task
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Required Items</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select items required to complete this task
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items?.map((item: any) => (
                      <div key={item._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`item-${item._id}`}
                          checked={formData.requiredItemIds.includes(item._id)}
                          onCheckedChange={() => handleMultiSelectChange("requiredItemIds", item._id)}
                        />
                        <Label 
                          htmlFor={`item-${item._id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {item.name}
                          {item.rarity && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.rarity}
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium">Related Interactions</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select interactions related to this task
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {interactions?.map((interaction: any) => (
                      <div key={interaction._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`interaction-${interaction._id}`}
                          checked={formData.interactions.includes(interaction._id)}
                          onCheckedChange={() => handleMultiSelectChange("interactions", interaction._id)}
                        />
                        <Label 
                          htmlFor={`interaction-${interaction._id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {interaction.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
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
            {isSubmitting ? "Creating Task..." : "Create Task"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuestTaskCreationForm; 