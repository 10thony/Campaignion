import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "../../../ui/button";
import { Checkbox } from "../../../ui/checkbox";
import { Badge } from "../../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { FormSection } from "../../shared";
import { CharacterFormData, CharacterType } from "../types/npcForm";
import { Zap, Loader2, Plus, Eye } from "lucide-react";

interface ActionsTabProps {
  formData: CharacterFormData;
  setField: (field: keyof CharacterFormData, value: any) => void;
  setNestedField: (field: keyof CharacterFormData, nestedField: string, value: any) => void;
  errors: Record<string, string>;
  isReadOnly: boolean;
  characterType: CharacterType;
}

const ActionsTab: React.FC<ActionsTabProps> = ({
  formData,
  setField,
  setNestedField,
  errors,
  isReadOnly,
  characterType,
}) => {
  const { user } = useUser();
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get available actions based on class
  const availableActions = useQuery(api.actions.getActionsByClass, {
    className: formData.class || "",
  });

  const loadSampleActions = useMutation(api.actions.loadSampleActionsFromJson);

  const handleActionToggle = (actionId: Id<"actions">) => {
    if (isReadOnly) return;

    const currentActions = formData.actions || [];
    const newActions = currentActions.includes(actionId)
      ? currentActions.filter(id => id !== actionId)
      : [...currentActions, actionId];
    
    setField("actions", newActions);
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

  const handleSelectAllActions = () => {
    if (isReadOnly || !availableActions) return;
    const allActionIds = availableActions.map(action => action._id);
    setField("actions", allActionIds);
  };

  const handleClearAllActions = () => {
    if (isReadOnly) return;
    setField("actions", []);
  };

  const selectedCount = formData.actions?.length || 0;
  const totalCount = availableActions?.length || 0;

  return (
    <div className="space-y-6">
      <FormSection
        title="Action Management"
        description={`Manage actions for this ${characterType === "PlayerCharacter" ? "player character" : "NPC"}`}
        icon={<Zap className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Actions define what this character can do in combat and other situations.
            Actions are typically determined by class, level, and special abilities.
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive rounded-md p-3">
              {error}
            </div>
          )}

          {formData.class && !isReadOnly && (
            <div className="flex flex-wrap gap-2">
              {totalCount > 0 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllActions}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Select All ({totalCount})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllActions}
                    disabled={selectedCount === 0}
                  >
                    Clear All
                  </Button>
                </>
              )}
              <div className="text-sm text-muted-foreground flex items-center">
                Selected: {selectedCount} / {totalCount}
              </div>
            </div>
          )}
        </div>
      </FormSection>

      {formData.class ? (
        <FormSection
          title={`Available Actions for ${formData.class}`}
          description="Select the actions this character can perform"
          icon={<Zap className="h-5 w-5" />}
        >
          {availableActions && availableActions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableActions.map((action) => {
                const isSelected = (formData.actions || []).includes(action._id);
                return (
                  <Card key={action._id} className={`cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleActionToggle(action._id)}
                          disabled={isReadOnly}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{action.name}</h4>
                            {isReadOnly && (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{action.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{action.type}</Badge>
                            <Badge variant="secondary" className="text-xs">{action.actionCost}</Badge>
                            {action.requiresConcentration && (
                              <Badge variant="destructive" className="text-xs">Concentration</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="space-y-4">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <h4 className="font-medium text-lg mb-2">No Actions Available</h4>
                    <p className="text-muted-foreground mb-4">
                      No actions found for the {formData.class} class.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Load sample actions to get started with common D&D actions for all classes.
                    </p>
                    {!isReadOnly && (
                      <Button
                        onClick={handleLoadSampleActions}
                        disabled={isLoadingActions}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        {isLoadingActions ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {isLoadingActions ? "Loading Actions..." : "Load Sample Actions"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </FormSection>
      ) : (
        <FormSection
          title="Select a Class First"
          description="Actions are available once you select a character class"
          icon={<Zap className="h-5 w-5" />}
        >
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h4 className="font-medium text-lg mb-2">Choose a Class</h4>
                  <p className="text-muted-foreground">
                    Please select a class from the Basic Info tab to see available actions.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Each D&D class has unique actions and abilities that define their combat and role-playing capabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </FormSection>
      )}

      {errors.actions && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive rounded-md p-3">
          {errors.actions}
        </div>
      )}

      {(formData.actions?.length || 0) > 0 && (
        <FormSection
          title="Selected Actions Summary"
          description="Overview of all selected actions for this character"
          icon={<Eye className="h-5 w-5" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {formData.actions?.length} action{(formData.actions?.length || 0) !== 1 ? 's' : ''} selected
              </span>
              {!isReadOnly && formData.actions && formData.actions.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllActions}
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {formData.actions?.map((actionId) => {
                const action = availableActions?.find(a => a._id === actionId);
                if (!action) return null;
                
                return (
                  <div key={actionId} className="flex items-center justify-between p-2 bg-muted rounded border">
                    <span className="text-sm font-medium truncate">{action.name}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">{action.type}</Badge>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActionToggle(actionId)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FormSection>
      )}
    </div>
  );
};

export default ActionsTab; 