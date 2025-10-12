import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { ErrorDisplay } from "../../shared";
import { MonsterFormProps } from "../types/monsterForm";
import { Shield, Heart, Zap } from "lucide-react";

const CombatStatsTab: React.FC<MonsterFormProps> = ({
  formData,
  setField,
  setNestedField,
  errors,
  isReadOnly = false,
}) => {
  const hitDiceOptions = ["d4", "d6", "d8", "d10", "d12"];

  const renderField = (fieldName: string, value: any, type: "text" | "number" = "text", options?: string[]) => {
    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border">
          <span className="text-sm font-medium text-muted-foreground">{fieldName}:</span>
          <span className="ml-2">{value || "Not specified"}</span>
        </div>
      );
    }

    if (options) {
      return (
        <Select value={value} onValueChange={(val) => setField ? setField(fieldName as any, val) : () => {}}>
          <SelectTrigger className={errors[fieldName] ? "border-destructive" : ""}>
            <SelectValue placeholder={`Select ${fieldName.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={type}
        value={value}
        onChange={(e) => {
          const newValue = type === "number" ? parseInt(e.target.value) || 0 : e.target.value;
          if (setField) setField(fieldName as any, newValue);
        }}
        placeholder={`Enter ${fieldName.toLowerCase()}`}
        className={errors[fieldName] ? "border-destructive" : ""}
        min={type === "number" ? "0" : undefined}
      />
    );
  };

  const renderNestedField = (parentField: string, childField: string, value: any, type: "text" | "number" = "text") => {
    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border">
          <span className="text-sm font-medium text-muted-foreground">{childField}:</span>
          <span className="ml-2">{value || "Not specified"}</span>
        </div>
      );
    }

    return (
      <Input
        type={type}
        value={value}
        onChange={(e) => {
          const newValue = type === "number" ? parseInt(e.target.value) || 0 : e.target.value;
          if (setNestedField) setNestedField(parentField as any, childField as any, newValue);
        }}
        placeholder={`Enter ${childField.toLowerCase()}`}
        className={errors[`${parentField}.${childField}`] ? "border-destructive" : ""}
        min={type === "number" ? "0" : undefined}
      />
    );
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Combat Statistics"
        description="Armor class, hit points, and combat-related attributes"
        icon={<Shield className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="armorClass">Armor Class *</Label>
            {renderField("armorClass", formData.armorClass, "number")}
            <ErrorDisplay errors={errors} field="armorClass" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="armorType">Armor Type</Label>
            {renderField("armorType", formData.armorType)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="proficiencyBonus">Proficiency Bonus</Label>
            {renderField("proficiencyBonus", formData.proficiencyBonus, "number")}
            <ErrorDisplay errors={errors} field="proficiencyBonus" variant="inline" />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Hit Points & Hit Dice"
        description="Health and hit dice configuration"
        icon={<Heart className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hitPoints">Hit Points *</Label>
            {renderField("hitPoints", formData.hitPoints, "number")}
            <ErrorDisplay errors={errors} field="hitPoints" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hitDiceCount">Hit Dice Count</Label>
            {renderNestedField("hitDice", "count", formData.hitDice.count, "number")}
            <ErrorDisplay errors={errors} field="hitDice.count" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hitDiceType">Hit Dice Type</Label>
            {!isReadOnly ? (
              <Select
                value={formData.hitDice.die}
                onValueChange={(value) => {
                  if (setNestedField) setNestedField("hitDice" as any, "die" as any, value as any);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hitDiceOptions.map((die) => (
                    <SelectItem key={die} value={die}>
                      {die}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-muted rounded-md border">
                <span className="text-sm font-medium text-muted-foreground">die:</span>
                <span className="ml-2">{formData.hitDice.die}</span>
              </div>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Movement Speeds"
        description="Different types of movement speeds"
        icon={<Zap className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(formData.speed).map(([movementType, speed]) => (
            <div key={movementType} className="space-y-2">
              <Label htmlFor={movementType}>
                {movementType.charAt(0).toUpperCase() + movementType.slice(1)}
                {movementType === "walk" ? " *" : ""}
              </Label>
              {renderNestedField("speed", movementType, speed)}
              {movementType === "walk" && (
                <p className="text-xs text-muted-foreground">
                  Required - e.g., "30 ft."
                </p>
              )}
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );
};

export default CombatStatsTab; 