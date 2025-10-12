import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Textarea } from "../../../ui/textarea";
import { Button } from "../../../ui/button";
import { MonsterFormProps } from "../types/monsterForm";
import { Languages, Sword, Zap, Crown } from "lucide-react";

const TraitsActionsTab: React.FC<MonsterFormProps> = ({
  formData,
  setField,
  // errors,
}) => {
  const addTrait = () => {
    const newTraits = [...formData.traits, { name: "", description: "" }];
    setField("traits", newTraits);
  };

  const updateTrait = (index: number, field: "name" | "description", value: string) => {
    const newTraits = [...formData.traits];
    newTraits[index] = { ...newTraits[index], [field]: value };
    setField("traits", newTraits);
  };

  const removeTrait = (index: number) => {
    const newTraits = formData.traits.filter((_, i) => i !== index);
    setField("traits", newTraits);
  };

  const addAction = () => {
    const newActions = [...formData.actions, { name: "", description: "" }];
    setField("actions", newActions);
  };

  const updateAction = (index: number, field: "name" | "description", value: string) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setField("actions", newActions);
  };

  const removeAction = (index: number) => {
    const newActions = formData.actions.filter((_, i) => i !== index);
    setField("actions", newActions);
  };

  const addReaction = () => {
    const newReactions = [...formData.reactions, { name: "", description: "" }];
    setField("reactions", newReactions);
  };

  const updateReaction = (index: number, field: "name" | "description", value: string) => {
    const newReactions = [...formData.reactions];
    newReactions[index] = { ...newReactions[index], [field]: value };
    setField("reactions", newReactions);
  };

  const removeReaction = (index: number) => {
    const newReactions = formData.reactions.filter((_, i) => i !== index);
    setField("reactions", newReactions);
  };

  const addLegendaryAction = () => {
    const newLegendaryActions = [...formData.legendaryActions, { name: "", description: "" }];
    setField("legendaryActions", newLegendaryActions);
  };

  const updateLegendaryAction = (index: number, field: "name" | "description", value: string) => {
    const newLegendaryActions = [...formData.legendaryActions];
    newLegendaryActions[index] = { ...newLegendaryActions[index], [field]: value };
    setField("legendaryActions", newLegendaryActions);
  };

  const removeLegendaryAction = (index: number) => {
    const newLegendaryActions = formData.legendaryActions.filter((_, i) => i !== index);
    setField("legendaryActions", newLegendaryActions);
  };

  const renderActionList = (
    items: Array<{ name: string; description: string }>,
    title: string,
    icon: React.ReactNode,
    addFunction: () => void,
    updateFunction: (index: number, field: "name" | "description", value: string) => void,
    removeFunction: (index: number) => void
  ) => (
    <FormSection title={title} description={`${title} for this monster`} icon={icon}>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Action {index + 1}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeFunction(index)}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Action name"
                value={item.name}
                onChange={(e) => updateFunction(index, "name", e.target.value)}
              />
              <Textarea
                placeholder="Action description"
                value={item.description}
                onChange={(e) => updateFunction(index, "description", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addFunction} className="w-full">
          Add {title.slice(0, -1)}
        </Button>
      </div>
    </FormSection>
  );

  return (
    <div className="space-y-6">
      {renderActionList(
        formData.traits,
        "Traits",
        <Languages className="h-5 w-5" />,
        addTrait,
        updateTrait,
        removeTrait
      )}

      {renderActionList(
        formData.actions,
        "Actions",
        <Sword className="h-5 w-5" />,
        addAction,
        updateAction,
        removeAction
      )}

      {renderActionList(
        formData.reactions,
        "Reactions",
        <Zap className="h-5 w-5" />,
        addReaction,
        updateReaction,
        removeReaction
      )}

      {renderActionList(
        formData.legendaryActions,
        "Legendary Actions",
        <Crown className="h-5 w-5" />,
        addLegendaryAction,
        updateLegendaryAction,
        removeLegendaryAction
      )}
    </div>
  );
};

export default TraitsActionsTab; 