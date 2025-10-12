import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
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
  BookOpen,
  Shield,
  Sparkles
} from "lucide-react";

interface ActionCreationFormProps {
  onSubmitSuccess: () => void;
  onCancel: () => void;
  editingActionId?: Id<"actions"> | null;
}

const ActionCreationForm: React.FC<ActionCreationFormProps> = ({
  onSubmitSuccess,
  onCancel,
  editingActionId,
}) => {
  const { user } = useUser();
  const createAction = useMutation(api.actions.createAction);
  const updateAction = useMutation(api.actions.updateAction);
  const action = useQuery(api.actions.getActionsByIds, {
    ids: editingActionId ? [editingActionId] : [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    actionCost: "Action" as "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special",
    type: "COMMONLY_AVAILABLE_UTILITY" as "MELEE_ATTACK" | "RANGED_ATTACK" | "SPELL" | "COMMONLY_AVAILABLE_UTILITY" | "CLASS_FEATURE" | "BONUS_ACTION" | "REACTION" | "OTHER",
    requiresConcentration: false,
    sourceBook: "PHB",
    // Optional fields based on type
    className: "",
    usesPer: "Long Rest" as "Short Rest" | "Long Rest" | "Day" | "Special" | undefined,
    maxUses: "",
    spellLevel: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined,
    castingTime: "",
    range: "",
    components: {
      verbal: false,
      somatic: false,
      material: "" as string | undefined,
    } as {
      verbal: boolean;
      somatic: boolean;
      material?: string;
    },
    duration: "",
    savingThrow: {
      ability: "",
      onSave: "",
    },
  });

  useEffect(() => {
    if (action && action[0]) {
      const actionData = action[0];
      setFormData({
        name: actionData.name,
        description: actionData.description,
        actionCost: actionData.actionCost,
        type: actionData.type,
        requiresConcentration: actionData.requiresConcentration,
        sourceBook: actionData.sourceBook,
        className: actionData.className || "",
        usesPer: actionData.usesPer,
        maxUses: actionData.maxUses?.toString() || "",
        spellLevel: actionData.spellLevel,
        castingTime: actionData.castingTime || "",
        range: actionData.range || "",
        components: actionData.components || {
          verbal: false,
          somatic: false,
          material: "",
        },
        duration: actionData.duration || "",
        savingThrow: actionData.savingThrow || {
          ability: "",
          onSave: "",
        },
      });
    }
  }, [action]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (editingActionId) {
        await updateAction({
          id: editingActionId,
          ...formData,
        });
      } else {
        await createAction({
          ...formData,
          clerkId: user!.id,
        });
      }
      onSubmitSuccess();
    } catch (error) {
      console.error("Error saving action:", error);
      setError(error instanceof Error ? error.message : "Failed to save action");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleComponentChange = (component: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [component]: value,
      },
    }));
  };

  // const getActionTypeIcon = (type: string) => {
  //   switch (type) {
  //     case "SPELL":
  //       return <Sparkles className="h-4 w-4" />;
  //     case "CLASS_FEATURE":
  //       return <Shield className="h-4 w-4" />;
  //     case "MELEE_ATTACK":
  //     case "RANGED_ATTACK":
  //       return <Sword className="h-4 w-4" />;
  //     default:
  //       return <Zap className="h-4 w-4" />;
  //   }
  // };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Actions List
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editingActionId ? "Edit Action" : "Create New Action"}
            </h1>
            <p className="text-muted-foreground">
              {editingActionId ? "Update action details" : "Define a new action or ability"}
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="class" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Class Feature
            </TabsTrigger>
            <TabsTrigger value="spell" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Spell Details
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core details about the action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Action Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter action name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="actionCost">Action Cost *</Label>
                    <Select value={formData.actionCost} onValueChange={(value) => handleChange({ target: { name: 'actionCost', value } } as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Action">Action</SelectItem>
                        <SelectItem value="Bonus Action">Bonus Action</SelectItem>
                        <SelectItem value="Reaction">Reaction</SelectItem>
                        <SelectItem value="No Action">No Action</SelectItem>
                        <SelectItem value="Special">Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleChange({ target: { name: 'type', value } } as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMMONLY_AVAILABLE_UTILITY">Commonly Available Utility</SelectItem>
                        <SelectItem value="CLASS_FEATURE">Class Feature</SelectItem>
                        <SelectItem value="SPELL">Spell</SelectItem>
                        <SelectItem value="MELEE_ATTACK">Melee Attack</SelectItem>
                        <SelectItem value="RANGED_ATTACK">Ranged Attack</SelectItem>
                        <SelectItem value="BONUS_ACTION">Bonus Action</SelectItem>
                        <SelectItem value="REACTION">Reaction</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sourceBook">Source Book *</Label>
                    <Input
                      id="sourceBook"
                      name="sourceBook"
                      value={formData.sourceBook}
                      onChange={handleChange}
                      placeholder="e.g., PHB, DMG"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresConcentration"
                    name="requiresConcentration"
                    checked={formData.requiresConcentration}
                    onCheckedChange={(checked) => handleChange({ target: { name: 'requiresConcentration', type: 'checkbox', checked } } as any)}
                  />
                  <Label htmlFor="requiresConcentration" className="text-sm font-normal">
                    Requires Concentration
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter a detailed description of the action..."
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Class Feature Tab */}
          <TabsContent value="class" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Class Feature Details
                </CardTitle>
                <CardDescription>
                  Additional details for class-specific features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="className">Class Name *</Label>
                    <Input
                      id="className"
                      name="className"
                      value={formData.className}
                      onChange={handleChange}
                      placeholder="e.g., Fighter, Wizard"
                      required={formData.type === "CLASS_FEATURE"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usesPer">Uses Per</Label>
                    <Select value={formData.usesPer || ""} onValueChange={(value) => handleChange({ target: { name: 'usesPer', value } } as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select usage period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Long Rest">Long Rest</SelectItem>
                        <SelectItem value="Short Rest">Short Rest</SelectItem>
                        <SelectItem value="Day">Day</SelectItem>
                        <SelectItem value="Special">Special</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Max Uses</Label>
                    <Input
                      id="maxUses"
                      name="maxUses"
                      value={formData.maxUses}
                      onChange={handleChange}
                      placeholder="e.g., 3, 1/rest, etc."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spell Details Tab */}
          <TabsContent value="spell" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Spell Details
                </CardTitle>
                <CardDescription>
                  Spell-specific information and components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="spellLevel">Spell Level *</Label>
                    <Select value={formData.spellLevel?.toString() || "0"} onValueChange={(value) => handleChange({ target: { name: 'spellLevel', value: parseInt(value) } } as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            {level === 0 ? "Cantrip" : `Level ${level}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="castingTime">Casting Time *</Label>
                    <Input
                      id="castingTime"
                      name="castingTime"
                      value={formData.castingTime}
                      onChange={handleChange}
                      placeholder="e.g., 1 action, 1 minute"
                      required={formData.type === "SPELL"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="range">Range *</Label>
                    <Input
                      id="range"
                      name="range"
                      value={formData.range}
                      onChange={handleChange}
                      placeholder="e.g., Self, 60 feet, Touch"
                      required={formData.type === "SPELL"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g., Instantaneous, 1 hour, Concentration"
                    required={formData.type === "SPELL"}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium">Components</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verbal"
                        checked={formData.components.verbal}
                        onCheckedChange={(checked) => handleComponentChange("verbal", checked)}
                      />
                      <Label htmlFor="verbal" className="text-sm font-normal">
                        Verbal (V)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="somatic"
                        checked={formData.components.somatic}
                        onCheckedChange={(checked) => handleComponentChange("somatic", checked)}
                      />
                      <Label htmlFor="somatic" className="text-sm font-normal">
                        Somatic (S)
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material">Material Components</Label>
                    <Input
                      id="material"
                      value={formData.components.material || ""}
                      onChange={(e) => handleComponentChange("material", e.target.value)}
                      placeholder="e.g., A piece of iron, 50gp worth of diamond dust"
                    />
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
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : (editingActionId ? "Save Changes" : "Create Action")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ActionCreationForm; 