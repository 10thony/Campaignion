import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Textarea } from "../../../ui/textarea";
import { Button } from "../../../ui/button";
import { MonsterFormProps } from "../types/monsterForm";
import { MapPin, Castle, Mountain, TreePine } from "lucide-react";

const EnvironmentTab: React.FC<MonsterFormProps> = ({
  formData,
  setField,
}) => {

  const addLairAction = () => {
    const newLairActions = [...formData.lairActions, { name: "", description: "" }];
    setField("lairActions", newLairActions);
  };

  const updateLairAction = (index: number, field: "name" | "description", value: string) => {
    const newLairActions = [...formData.lairActions];
    newLairActions[index] = { ...newLairActions[index], [field]: value };
    setField("lairActions", newLairActions);
  };

  const removeLairAction = (index: number) => {
    const newLairActions = formData.lairActions.filter((_, i) => i !== index);
    setField("lairActions", newLairActions);
  };

  const addRegionalEffect = () => {
    const newRegionalEffects = [...formData.regionalEffects, { name: "", description: "" }];
    setField("regionalEffects", newRegionalEffects);
  };

  const updateRegionalEffect = (index: number, field: "name" | "description", value: string) => {
    const newRegionalEffects = [...formData.regionalEffects];
    newRegionalEffects[index] = { ...newRegionalEffects[index], [field]: value };
    setField("regionalEffects", newRegionalEffects);
  };

  const removeRegionalEffect = (index: number) => {
    const newRegionalEffects = formData.regionalEffects.filter((_, i) => i !== index);
    setField("regionalEffects", newRegionalEffects);
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
              <Label className="text-sm font-medium">{title.slice(0, -1)} {index + 1}</Label>
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
                placeholder={`${title.slice(0, -1)} name`}
                value={item.name}
                onChange={(e) => updateFunction(index, "name", e.target.value)}
              />
              <Textarea
                placeholder={`${title.slice(0, -1)} description`}
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
      <FormSection
        title="Environment Types"
        description="Environments where this monster can be found"
        icon={<MapPin className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <Label htmlFor="environment">Environment Types</Label>
          <Input
            id="environment"
            value={formData.environment.join(", ")}
            onChange={(e) => setField("environment", e.target.value.split(", ").filter(env => env.trim()))}
            placeholder="e.g., Forest, Mountain, Underdark"
          />
          <p className="text-sm text-muted-foreground">
            Enter environment types separated by commas. Common types: Arctic, Coastal, Desert, Forest, Grassland, Hill, Mountain, Swamp, Underdark, Underwater, Urban
          </p>
        </div>
      </FormSection>

      {renderActionList(
        formData.lairActions,
        "Lair Actions",
        <Castle className="h-5 w-5" />,
        addLairAction,
        updateLairAction,
        removeLairAction
      )}

      {renderActionList(
        formData.regionalEffects,
        "Regional Effects",
        <Mountain className="h-5 w-5" />,
        addRegionalEffect,
        updateRegionalEffect,
        removeRegionalEffect
      )}

      <FormSection
        title="Environment Guidelines"
        description="Common environment types and their characteristics"
        icon={<TreePine className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Terrestrial Environments:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>Arctic:</strong> Cold, icy regions</li>
              <li>• <strong>Coastal:</strong> Shorelines and beaches</li>
              <li>• <strong>Desert:</strong> Hot, arid regions</li>
              <li>• <strong>Forest:</strong> Wooded areas</li>
              <li>• <strong>Grassland:</strong> Plains and prairies</li>
              <li>• <strong>Hill:</strong> Rolling hills</li>
              <li>• <strong>Mountain:</strong> High elevations</li>
              <li>• <strong>Swamp:</strong> Wet, marshy areas</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Special Environments:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>Underdark:</strong> Underground caverns</li>
              <li>• <strong>Underwater:</strong> Aquatic environments</li>
              <li>• <strong>Urban:</strong> Cities and towns</li>
            </ul>
            <h4 className="font-semibold mb-2 mt-4">Special Abilities:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>Lair Actions:</strong> Special abilities in their lair</li>
              <li>• <strong>Regional Effects:</strong> Environmental changes</li>
            </ul>
          </div>
        </div>
      </FormSection>
    </div>
  );
};

export default EnvironmentTab; 