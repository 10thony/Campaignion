import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Textarea } from "../../../ui/textarea";
import { ErrorDisplay } from "../../shared";
import { MonsterFormProps } from "../types/monsterForm";
import { Eye, Languages, Zap } from "lucide-react";

const MovementSensesTab: React.FC<MonsterFormProps> = ({
  formData,
  setField,
  setNestedField,
  errors,
  isReadOnly = false,
}) => {
  const renderField = (fieldName: string, value: any, type: "text" | "number" = "text") => {
    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border">
          <span className="text-sm font-medium text-muted-foreground">{fieldName}:</span>
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
          <span className="ml-2">{value || "None"}</span>
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
        placeholder={type === "number" ? "0" : `e.g., ${childField === "darkvision" ? "60 ft." : "30 ft."}`}
        className={errors[`${parentField}.${childField}`] ? "border-destructive" : ""}
        min={type === "number" ? "0" : undefined}
      />
    );
  };

  const damageTypes = [
    "acid", "bludgeoning", "cold", "fire", "force", "lightning", 
    "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"
  ];

  const conditions = [
    "blinded", "charmed", "deafened", "exhaustion", "frightened", "grappled",
    "incapacitated", "invisible", "paralyzed", "petrified", "poisoned", 
    "prone", "restrained", "stunned", "unconscious"
  ];

  const handleArrayInput = (fieldName: string, value: string) => {
    const items = value.split(",").map(item => item.trim()).filter(item => item);
    if (setField) setField(fieldName as any, items);
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Special Senses"
        description="Special vision abilities and perception"
        icon={<Eye className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="darkvision">Darkvision</Label>
            {renderNestedField("senses", "darkvision", formData.senses.darkvision)}
            <p className="text-xs text-muted-foreground">Range in feet (e.g., "60 ft.")</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blindsight">Blindsight</Label>
            {renderNestedField("senses", "blindsight", formData.senses.blindsight)}
            <p className="text-xs text-muted-foreground">Range in feet (e.g., "30 ft.")</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tremorsense">Tremorsense</Label>
            {renderNestedField("senses", "tremorsense", formData.senses.tremorsense)}
            <p className="text-xs text-muted-foreground">Range in feet (e.g., "60 ft.")</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="truesight">Truesight</Label>
            {renderNestedField("senses", "truesight", formData.senses.truesight)}
            <p className="text-xs text-muted-foreground">Range in feet (e.g., "120 ft.")</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passivePerception">Passive Perception</Label>
            {renderNestedField("senses", "passivePerception", formData.senses.passivePerception, "number")}
            <ErrorDisplay errors={errors} field="senses.passivePerception" variant="inline" />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Languages"
        description="Communication abilities"
        icon={<Languages className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <Label htmlFor="languages">Languages</Label>
          {!isReadOnly ? (
            <Textarea
              id="languages"
              value={formData.languages}
              onChange={(e) => setField && setField("languages", e.target.value)}
              placeholder="e.g., Common, Draconic, telepathy 60 ft."
              rows={3}
            />
          ) : (
            <div className="p-3 bg-muted rounded-md border">
              <span className="text-sm">{formData.languages || "None"}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            List languages known, including special communication methods like telepathy
          </p>
        </div>
      </FormSection>

      <FormSection
        title="Damage Resistances & Immunities"
        description="Damage type resistances, immunities, and vulnerabilities"
        icon={<Zap className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="damageVulnerabilities">Damage Vulnerabilities</Label>
            {!isReadOnly ? (
              <Input
                id="damageVulnerabilities"
                value={formData.damageVulnerabilities.join(", ")}
                onChange={(e) => handleArrayInput("damageVulnerabilities", e.target.value)}
                placeholder="e.g., fire, cold"
              />
            ) : (
              <div className="p-3 bg-muted rounded-md border">
                <span className="text-sm">{formData.damageVulnerabilities.join(", ") || "None"}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Separate damage types with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="damageResistances">Damage Resistances</Label>
            {!isReadOnly ? (
              <Input
                id="damageResistances"
                value={formData.damageResistances.join(", ")}
                onChange={(e) => handleArrayInput("damageResistances", e.target.value)}
                placeholder="e.g., bludgeoning, piercing, slashing from nonmagical attacks"
              />
            ) : (
              <div className="p-3 bg-muted rounded-md border">
                <span className="text-sm">{formData.damageResistances.join(", ") || "None"}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Separate damage types with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="damageImmunities">Damage Immunities</Label>
            {!isReadOnly ? (
              <Input
                id="damageImmunities"
                value={formData.damageImmunities.join(", ")}
                onChange={(e) => handleArrayInput("damageImmunities", e.target.value)}
                placeholder="e.g., fire, poison"
              />
            ) : (
              <div className="p-3 bg-muted rounded-md border">
                <span className="text-sm">{formData.damageImmunities.join(", ") || "None"}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Separate damage types with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditionImmunities">Condition Immunities</Label>
            {!isReadOnly ? (
              <Input
                id="conditionImmunities"
                value={formData.conditionImmunities.join(", ")}
                onChange={(e) => handleArrayInput("conditionImmunities", e.target.value)}
                placeholder="e.g., charmed, frightened, poisoned"
              />
            ) : (
              <div className="p-3 bg-muted rounded-md border">
                <span className="text-sm">{formData.conditionImmunities.join(", ") || "None"}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Separate conditions with commas
            </p>
          </div>
        </div>

        {/* Helpful reference section for non-readonly mode */}
        {!isReadOnly && (
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <h4 className="font-semibold mb-2">Common Damage Types:</h4>
                <p>{damageTypes.join(", ")}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Common Conditions:</h4>
                <p>{conditions.join(", ")}</p>
              </div>
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        title="Skills & Saving Throws"
        description="Proficiency bonuses for skills and saving throws"
        icon={<Zap className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="skills">Skill Proficiencies</Label>
            {!isReadOnly ? (
              <Textarea
                id="skills"
                value={formData.skills.join(", ")}
                onChange={(e) => handleArrayInput("skills", e.target.value)}
                placeholder="e.g., Perception +6, Stealth +4, Athletics +3"
                rows={3}
              />
            ) : (
              <div className="p-3 bg-muted rounded-md border">
                <span className="text-sm">{formData.skills.join(", ") || "None"}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Include skill name and bonus (e.g., "Perception +6")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="savingThrows">Saving Throw Proficiencies</Label>
            {!isReadOnly ? (
              <Textarea
                id="savingThrows"
                value={formData.savingThrows.join(", ")}
                onChange={(e) => handleArrayInput("savingThrows", e.target.value)}
                placeholder="e.g., Dex +4, Wis +3"
                rows={3}
              />
            ) : (
              <div className="p-3 bg-muted rounded-md border">
                <span className="text-sm">{formData.savingThrows.join(", ") || "None"}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Include ability abbreviation and bonus (e.g., "Dex +4")
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  );
};

export default MovementSensesTab; 