import React from "react";
import { FormSection } from "../../shared";
import { Label } from "../../../ui/label";
import { MonsterFormProps } from "../types/monsterForm";
import { Package, Sword, Shield } from "lucide-react";
import EquipmentManager from "../../../EquipmentManager";

const EquipmentTab: React.FC<MonsterFormProps> = ({
  formData,
  setField,
  // setNestedField,
  // errors,
  isReadOnly = false,
}) => {
  return (
    <div className="space-y-6">
      <FormSection
        title="Equipment & Inventory"
        description="Manage the monster's equipment, inventory, and equipment bonuses"
        icon={<Package className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {/* Equipment Manager */}
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

          {/* Fallback for when new equipment system is not available */}
          {(!formData.inventory || !formData.equipmentSlots) && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800">
                <Shield className="h-5 w-5" />
                <div>
                  <h4 className="font-semibold">Equipment System Not Available</h4>
                  <p className="text-sm">
                    The enhanced equipment system is not available for this monster. 
                    Please use the Actions tab to define equipment-based abilities.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>

      {/* Equipment Guidelines */}
      {!isReadOnly && (
        <FormSection
          title="Equipment Guidelines"
          description="Tips for managing monster equipment"
          icon={<Sword className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Common Equipment:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Weapons (swords, claws, natural weapons)</li>
                <li>• Armor (natural armor, worn armor)</li>
                <li>• Shields and defensive items</li>
                <li>• Magic items and artifacts</li>
                <li>• Consumables and tools</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Equipment Bonuses:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Armor class improvements</li>
                <li>• Ability score bonuses</li>
                <li>• Special abilities from items</li>
                <li>• Damage resistance from equipment</li>
                <li>• Movement speed modifications</li>
              </ul>
            </div>
          </div>
        </FormSection>
      )}
    </div>
  );
};

export default EquipmentTab; 