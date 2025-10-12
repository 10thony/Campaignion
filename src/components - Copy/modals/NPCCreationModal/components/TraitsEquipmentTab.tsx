import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { CharacterFormProps } from "../types/npcForm";
import { Package, Languages, Sword } from "lucide-react";
import EquipmentManager from "../../../EquipmentManager";

const TraitsEquipmentTab: React.FC<CharacterFormProps> = ({
  formData,
  setField,
  // setNestedField,
  // errors,
  isReadOnly = false,
}) => {
  const languageOptions = [
    "Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin",
    "Halfling", "Orc", "Abyssal", "Celestial", "Draconic", "Deep Speech",
    "Infernal", "Primordial", "Sylvan", "Undercommon"
  ];

  const renderArrayField = (fieldName: string, value: string[], placeholder: string, helpText: string) => {
    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border">
          <span className="text-sm font-medium text-muted-foreground">{fieldName}:</span>
          <div className="mt-1">
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {value.map((item, index) => (
                  <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">None specified</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <Input
          value={value.join(", ")}
          onChange={(e) => setField(fieldName as any, e.target.value.split(", ").filter(item => item.trim()))}
          placeholder={placeholder}
        />
        <p className="text-sm text-muted-foreground">{helpText}</p>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Traits"
        description="Character traits and special abilities"
        icon={<Package className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <Label htmlFor="traits">Character Traits</Label>
          {renderArrayField(
            "traits",
            formData.traits,
            "e.g., Darkvision, Fey Ancestry, Relentless Endurance",
            "Enter character traits separated by commas"
          )}
        </div>
      </FormSection>

      <FormSection
        title="Languages"
        description="Languages this character can speak"
        icon={<Languages className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <Label htmlFor="languages">Languages</Label>
          {renderArrayField(
            "languages",
            formData.languages,
            "e.g., Common, Elvish, Undercommon",
            `Enter languages separated by commas. Available: ${languageOptions.join(", ")}`
          )}
        </div>
      </FormSection>

      <FormSection
        title="Equipment"
        description="Items and equipment this character carries"
        icon={<Sword className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {/* Legacy Equipment Field */}
          <div className="space-y-2">
            <Label htmlFor="equipment">Legacy Equipment</Label>
            {renderArrayField(
              "equipment",
              formData.equipment,
              "e.g., Longsword, Chain Mail, Backpack, Rations",
              "Enter equipment items separated by commas (for backward compatibility)"
            )}
          </div>

          {/* New Equipment Manager */}
          {formData.inventory && formData.equipmentSlots && (
            <div className="space-y-2">
              <Label>Equipment & Inventory Management</Label>
              <EquipmentManager
                equipment={formData.equipmentSlots}
                inventory={formData.inventory}
                equipmentBonuses={formData.equipmentBonuses}
                abilityScores={formData.abilityScores}
                onEquipmentChange={(equipment) => setField('equipmentSlots', equipment)}
                onInventoryChange={(inventory) => setField('inventory', inventory)}
                onBonusesChange={(bonuses) => setField('equipmentBonuses', bonuses)}
                isReadOnly={isReadOnly}
              />
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
};

export default TraitsEquipmentTab; 