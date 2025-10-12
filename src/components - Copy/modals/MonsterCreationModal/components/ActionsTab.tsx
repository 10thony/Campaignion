import React, { useState } from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Button } from "../../../ui/button";
import { Textarea } from "../../../ui/textarea";
import { Checkbox } from "../../../ui/checkbox";
import { Badge } from "../../../ui/badge";
import { Separator } from "../../../ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { ErrorDisplay } from "../../shared";
import { MonsterFormProps } from "../types/monsterForm";
import { useMonsterForm } from "../hooks/useMonsterForm";
import { 
  Sword, 
  Shield, 
  Crown, 
  Home, 
  Globe, 
  Plus, 
  X, 
  ChevronDown, 
  Check,
  Copy,
  Loader2
} from "lucide-react";

const ActionsTab: React.FC<MonsterFormProps> = ({
  formData,
  setField,
  errors,
  isReadOnly = false,
}) => {
  const { 
    selectedActions, 
    setSelectedActions, 
    databaseActions, 
    setDatabaseActions,
    addAction,
    updateAction,
    removeAction
  } = useMonsterForm();

  const [loadingActions, setLoadingActions] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    database: false,
    actions: true,
    reactions: false,
    legendary: false,
    lair: false,
    regional: false,
  });

  const actionTypes = [
    { key: "actions", label: "Actions", icon: <Sword className="h-4 w-4" />, description: "Standard actions the monster can take" },
    { key: "reactions", label: "Reactions", icon: <Shield className="h-4 w-4" />, description: "Reactions the monster can take" },
    { key: "legendaryActions", label: "Legendary Actions", icon: <Crown className="h-4 w-4" />, description: "Special actions for legendary monsters" },
    { key: "lairActions", label: "Lair Actions", icon: <Home className="h-4 w-4" />, description: "Actions available in the monster's lair" },
    { key: "regionalEffects", label: "Regional Effects", icon: <Globe className="h-4 w-4" />, description: "Environmental effects around the monster" },
  ] as const;

  const toggleExpanded = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleActionToggle = (actionId: string, checked: boolean) => {
    if (checked) {
      setSelectedActions([...selectedActions, actionId as any]);
    } else {
      setSelectedActions(selectedActions.filter(id => id !== actionId));
    }
  };

  const copyActionToManual = (action: { name: string; description: string }) => {
    addAction("actions", { name: action.name, description: action.description });
  };

  const renderDatabaseActions = () => {
    if (isReadOnly) return null;

    return (
      <FormSection
        title="Database Actions"
        description="Select pre-defined actions from the database"
        icon={<Copy className="h-5 w-5" />}
      >
        <Collapsible open={expandedSections.database} onOpenChange={() => toggleExpanded("database")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Database Actions ({selectedActions.length} selected)</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4">
            {loadingActions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading actions...</span>
              </div>
            ) : (
              <>
                {databaseActions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No database actions available.</p>
                    <p className="text-sm mt-2">Sample actions will be loaded here in a full implementation.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {databaseActions.map((action, index) => (
                      <Card key={index} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{action.name}</CardTitle>
                            <div className="flex gap-2">
                              <Checkbox
                                checked={selectedActions.includes(index.toString() as any)}
                                onCheckedChange={(checked) => handleActionToggle(index.toString(), checked as boolean)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyActionToManual(action)}
                                title="Copy to manual actions"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm">
                            {action.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Sample Actions Section */}
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Load sample monster actions
                      const sampleActions = [
                        { name: "Multiattack", description: "The monster makes two attacks." },
                        { name: "Bite", description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (1d10 + 3) piercing damage." },
                        { name: "Claw", description: "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage." },
                        { name: "Fire Breath", description: "The monster exhales fire in a 15-foot cone. Each creature in that area must make a DC 13 Dexterity saving throw, taking 24 (7d6) fire damage on a failed save, or half as much damage on a successful one." },
                        { name: "Frightful Presence", description: "Each creature of the monster's choice within 120 feet of it must succeed on a DC 15 Wisdom saving throw or become frightened for 1 minute." },
                      ];
                      setDatabaseActions(sampleActions);
                    }}
                    disabled={databaseActions.length > 0}
                  >
                    Load Sample Actions
                  </Button>
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </FormSection>
    );
  };

  const renderManualActions = (actionType: typeof actionTypes[0]) => {
    const actions = formData[actionType.key] as { name: string; description: string }[];
    
    return (
      <FormSection
        title={actionType.label}
        description={actionType.description}
        icon={actionType.icon}
        key={actionType.key}
      >
        <Collapsible 
          open={expandedSections[actionType.key as keyof typeof expandedSections]} 
          onOpenChange={() => toggleExpanded(actionType.key)}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>{actionType.label} ({actions.length})</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4">
            {actions.map((action, index) => (
              <Card key={index} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`${actionType.key}-name-${index}`}>Action Name</Label>
                      {!isReadOnly ? (
                        <Input
                          id={`${actionType.key}-name-${index}`}
                          value={action.name}
                          onChange={(e) => updateAction(actionType.key as any, index, 'name', e.target.value)}
                          placeholder="Enter action name"
                        />
                      ) : (
                        <div className="font-medium">{action.name || "Unnamed Action"}</div>
                      )}
                    </div>
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(actionType.key as any, index)}
                        className="ml-2 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor={`${actionType.key}-description-${index}`}>Description</Label>
                    {!isReadOnly ? (
                      <Textarea
                        id={`${actionType.key}-description-${index}`}
                        value={action.description}
                        onChange={(e) => updateAction(actionType.key as any, index, 'description', e.target.value)}
                        placeholder="Enter action description"
                        rows={3}
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md border">
                        <span className="text-sm">{action.description || "No description"}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={() => addAction(actionType.key as any)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {actionType.label.slice(0, -1)}
              </Button>
            )}

            {actions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No {actionType.label.toLowerCase()} defined.</p>
                {!isReadOnly && (
                  <p className="text-sm mt-2">Click "Add {actionType.label.slice(0, -1)}" to get started.</p>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <ErrorDisplay errors={errors} field={actionType.key} variant="inline" />
      </FormSection>
    );
  };

  return (
    <div className="space-y-6">
      {/* Selected Actions Summary */}
      {selectedActions.length > 0 && (
        <FormSection
          title="Selected Database Actions"
          description="Actions selected from the database"
          icon={<Check className="h-5 w-5" />}
        >
          <div className="flex flex-wrap gap-2">
            {selectedActions.map((actionId, index) => (
              <Badge key={actionId} variant="secondary" className="flex items-center gap-1">
                Database Action {index + 1}
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleActionToggle(actionId, false)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </FormSection>
      )}

      {/* Database Actions */}
      {renderDatabaseActions()}

      <Separator />

      {/* Manual Actions */}
      <div className="space-y-6">
        <div className="text-lg font-semibold">Manual Actions</div>
        {actionTypes.map(renderManualActions)}
      </div>

      {/* Action Guidelines */}
      {!isReadOnly && (
        <FormSection
          title="Action Guidelines"
          description="Tips for creating effective monster actions"
          icon={<Sword className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold mb-2">Action Types:</h4>
              <ul className="space-y-1">
                <li>• <strong>Actions:</strong> Main combat actions</li>
                <li>• <strong>Reactions:</strong> Triggered responses</li>
                <li>• <strong>Legendary:</strong> For CR 5+ monsters</li>
                <li>• <strong>Lair:</strong> Location-specific actions</li>
                <li>• <strong>Regional:</strong> Area-wide effects</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Attack Format:</h4>
              <ul className="space-y-1">
                <li>• Include attack bonus: "+5 to hit"</li>
                <li>• Specify reach/range: "reach 5 ft."</li>
                <li>• Target info: "one target"</li>
                <li>• Damage: "8 (1d10 + 3) piercing"</li>
                <li>• Additional effects as needed</li>
              </ul>
            </div>
          </div>
        </FormSection>
      )}
    </div>
  );
};

export default ActionsTab; 