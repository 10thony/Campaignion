import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { 
  Package, 
  Shield, 
  Sword, 
  ShirtIcon,
  Crown,
  Footprints,
  Hand,
  Gem,
  Plus,
  Trash2,
  AlertCircle,
  Zap,
  Heart,
  Eye,
  Wrench,
  Star
} from "lucide-react";
import { Equipment, Inventory, EquipmentBonuses, Item, AbilityScores } from "../types/character";
import { 
  calculateInventoryCapacity, 
  calculateEquipmentBonuses, 
  validateEquipmentSlot, 
  getDurabilityColor, 
  getDurabilityPercentage 
} from "../utils/equipmentUtils";

interface EquipmentManagerProps {
  equipment: Equipment;
  inventory: Inventory;
  equipmentBonuses?: EquipmentBonuses;
  abilityScores: AbilityScores;
  onEquipmentChange: (equipment: Equipment) => void;
  onInventoryChange: (inventory: Inventory) => void;
  onBonusesChange?: (bonuses: EquipmentBonuses) => void;
  isReadOnly?: boolean;
  campaignId?: Id<"campaigns">;
}

const EquipmentManager: React.FC<EquipmentManagerProps> = ({
  equipment,
  inventory,
  equipmentBonuses,
  abilityScores,
  onEquipmentChange,
  onInventoryChange,
  onBonusesChange,
  isReadOnly = false,
  campaignId
}) => {
  const { user } = useUser();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  // Get available items for the campaign
  const availableItems = useQuery(
    api.items.getItemsByCampaign,
    user?.id && campaignId ? { clerkId: user.id, campaignId } : "skip"
  );

  // Get item details for equipped items
  const equippedItemIds = [
    equipment.headgear,
    equipment.armwear,
    equipment.chestwear,
    equipment.legwear,
    equipment.footwear,
    equipment.mainHand,
    equipment.offHand,
    ...equipment.accessories
  ].filter(Boolean) as Id<"items">[];

  const equippedItems = useQuery(
    api.items.getItemsByIds,
    user?.id && equippedItemIds.length > 0 ? { clerkId: user.id, itemIds: equippedItemIds } : "skip"
  );

  // Get inventory item details
  const inventoryItems = useQuery(
    api.items.getItemsByIds,
    user?.id && inventory.items.length > 0 ? { clerkId: user.id, itemIds: inventory.items as Id<"items">[] } : "skip"
  );

  const equipmentSlots = [
    { key: 'headgear', label: 'Head', icon: <Crown className="h-4 w-4" />, allowedTypes: ['Armor', 'Accessory'] },
    { key: 'armwear', label: 'Arms', icon: <Shield className="h-4 w-4" />, allowedTypes: ['Armor', 'Accessory'] },
    { key: 'chestwear', label: 'Chest', icon: <ShirtIcon className="h-4 w-4" />, allowedTypes: ['Armor'] },
    { key: 'legwear', label: 'Legs', icon: <ShirtIcon className="h-4 w-4" />, allowedTypes: ['Armor'] },
    { key: 'footwear', label: 'Feet', icon: <Footprints className="h-4 w-4" />, allowedTypes: ['Armor', 'Accessory'] },
    { key: 'mainHand', label: 'Main Hand', icon: <Sword className="h-4 w-4" />, allowedTypes: ['Weapon', 'Shield'] },
    { key: 'offHand', label: 'Off Hand', icon: <Hand className="h-4 w-4" />, allowedTypes: ['Weapon', 'Shield', 'Accessory'] },
    { key: 'accessories', label: 'Accessories', icon: <Gem className="h-4 w-4" />, allowedTypes: ['Accessory'], multiple: true }
  ];

  const handleEquipItem = (itemId: Id<"items">, slot: string) => {
    if (isReadOnly) return;

    const newEquipment = { ...equipment };
    
    if (slot === 'accessories') {
      newEquipment.accessories = [...newEquipment.accessories, itemId];
    } else {
      (newEquipment as any)[slot] = itemId;
    }

    // Remove item from inventory
    const newInventory = {
      ...inventory,
      items: inventory.items.filter(id => id !== itemId)
    };

    onEquipmentChange(newEquipment);
    onInventoryChange(newInventory);
    
    // Recalculate bonuses
    if (onBonusesChange && equippedItems) {
      const foundItem = availableItems?.find((item: Item) => item._id === itemId);
      const updatedItems = foundItem ? equippedItems.concat(foundItem) : equippedItems;
      const newBonuses = calculateEquipmentBonuses(updatedItems, abilityScores);
      onBonusesChange(newBonuses);
    }
  };

  const handleUnequipItem = (itemId: Id<"items">, slot: string) => {
    if (isReadOnly) return;

    const newEquipment = { ...equipment };
    
    if (slot === 'accessories') {
      newEquipment.accessories = newEquipment.accessories.filter(id => id !== itemId);
    } else {
      (newEquipment as any)[slot] = undefined;
    }

    // Add item to inventory
    const newInventory = {
      ...inventory,
      items: [...inventory.items, itemId]
    };

    onEquipmentChange(newEquipment);
    onInventoryChange(newInventory);
    
    // Recalculate bonuses
    if (onBonusesChange && equippedItems) {
      const updatedItems = equippedItems.filter((item: Item) => item._id !== itemId);
      const newBonuses = calculateEquipmentBonuses(updatedItems, abilityScores);
      onBonusesChange(newBonuses);
    }
  };

  const handleAddToInventory = (itemId: Id<"items">) => {
    if (isReadOnly) return;

    const newInventory = {
      ...inventory,
      items: [...inventory.items, itemId]
    };

    onInventoryChange(newInventory);
    setShowAddItem(false);
  };

  const handleRemoveFromInventory = (itemId: Id<"items">) => {
    if (isReadOnly) return;

    const newInventory = {
      ...inventory,
      items: inventory.items.filter(id => id !== itemId)
    };

    onInventoryChange(newInventory);
  };

  const getItemForSlot = (slot: string) => {
    if (slot === 'accessories') return null;
    const itemId = (equipment as any)[slot];
    return equippedItems?.find((item: Item) => item._id === itemId) || null;
  };

  const getAccessoryItems = () => {
    if (!equippedItems) return [];
    return equippedItems.filter((item: Item) => item._id && equipment.accessories.includes(item._id));
  };

  const renderDurabilityBar = (item: Item) => {
    if (!item.durability) return null;
    
    const percentage = getDurabilityPercentage(item.durability);
    const color = getDurabilityColor(percentage);
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  const renderEquipmentSlot = (slot: typeof equipmentSlots[0]) => {
    const item = getItemForSlot(slot.key);
    
    return (
      <Card key={slot.key} className="h-32">
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            {slot.icon}
            <h4 className="text-sm font-medium">{slot.label}</h4>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {item ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{item.name}</span>
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnequipItem(item._id, slot.key)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {renderDurabilityBar(item)}
              <Badge variant="secondary" className="text-xs">
                {item.rarity}
              </Badge>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <div className="text-sm">Empty</div>
              {!isReadOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSelectedSlot(slot.key)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Equip
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAccessoriesSlot = () => {
    const accessories = getAccessoryItems();
    
    return (
      <Card className="col-span-2">
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            <Gem className="h-4 w-4" />
            <h4 className="text-sm font-medium">Accessories</h4>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {accessories.length > 0 ? (
            <div className="space-y-2">
              {accessories.map((item: Item) => (
                <div key={item._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    {renderDurabilityBar(item)}
                  </div>
                                      {!isReadOnly && item._id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnequipItem(item._id!, 'accessories')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <div className="text-sm">No accessories</div>
              {!isReadOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSelectedSlot('accessories')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderInventorySection = () => {
    const inventoryCapacity = calculateInventoryCapacity(abilityScores.strength);
    const usedCapacity = inventory.items.length;
    const capacityPercentage = (usedCapacity / inventoryCapacity) * 100;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory
          </CardTitle>
          <CardDescription>
            {usedCapacity} / {inventoryCapacity} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Capacity Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Capacity</span>
              <span>{usedCapacity}/{inventoryCapacity}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  capacityPercentage > 90 ? 'bg-red-500' : 
                  capacityPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
          </div>

          {/* Add Item Button */}
          {!isReadOnly && (
            <div className="mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddItem(!showAddItem)}
                disabled={usedCapacity >= inventoryCapacity}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          )}

          {/* Add Item Selection */}
          {showAddItem && !isReadOnly && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <Label className="text-sm font-medium mb-2 block">Select Item to Add</Label>
              <div className="space-y-2">
                {availableItems?.filter((item: Item) => 
                  item._id && 
                  !inventory.items.includes(item._id) && 
                  !equippedItemIds.includes(item._id)
                ).map((item: Item) => (
                  <div key={item._id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.type} • {item.rarity}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => item._id && handleAddToInventory(item._id)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Items */}
          <div className="space-y-2">
            {inventoryItems && inventoryItems.length > 0 ? (
              inventoryItems.map((item: Item) => (
                <div key={item._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.type} • {item.rarity}</div>
                    {renderDurabilityBar(item)}
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSlot('equip');
                          // You could implement auto-equip logic here
                        }}
                      >
                        Equip
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => item._id && handleRemoveFromInventory(item._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No items in inventory</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEquipmentBonuses = () => {
    if (!equipmentBonuses) return null;

    const bonusIcons = {
      strength: <Zap className="h-4 w-4" />,
      dexterity: <Eye className="h-4 w-4" />,
      constitution: <Heart className="h-4 w-4" />,
      intelligence: <Star className="h-4 w-4" />,
      wisdom: <Shield className="h-4 w-4" />,
      charisma: <Gem className="h-4 w-4" />
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Equipment Bonuses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Armor Class</span>
              <Badge variant="secondary">+{equipmentBonuses.armorClass}</Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(equipmentBonuses.abilityScores).map(([ability, bonus]) => (
                <div key={ability} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {bonusIcons[ability as keyof typeof bonusIcons]}
                    <span className="text-sm capitalize">{ability}</span>
                  </div>
                  <Badge variant={bonus > 0 ? "default" : "secondary"}>
                    {bonus > 0 ? '+' : ''}{bonus}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Equipment Slots */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Equipment Slots</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {equipmentSlots.filter(slot => slot.key !== 'accessories').map(renderEquipmentSlot)}
          {renderAccessoriesSlot()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory */}
        {renderInventorySection()}

        {/* Equipment Bonuses */}
        {renderEquipmentBonuses()}
      </div>

      {/* Item Selection Modal */}
      {selectedSlot && !isReadOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle>Select Item to Equip</CardTitle>
              <CardDescription>Choose an item from your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inventoryItems?.filter((item: Item) => {
                  const slot = equipmentSlots.find(s => s.key === selectedSlot);
                  return slot?.allowedTypes.includes(item.type);
                }).map((item: Item) => (
                  <div key={item._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.type} • {item.rarity}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (item._id) {
                          handleEquipItem(item._id, selectedSlot);
                          setSelectedSlot(null);
                        }
                      }}
                    >
                      Equip
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedSlot(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EquipmentManager; 