import React, { useState } from "react";
import type { Item, ItemType, ItemRarity, ArmorType, DamageRoll } from "../types/item";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { calculateDurability } from "../utils/equipmentUtils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { 
  AlertCircle, 
  ArrowLeft, 
  Package,
  Sparkles,
  Info,
  Shield,
  Sword,
  Zap,
  Settings,
  Plus,
  X
} from "lucide-react";

interface ItemCreationFormProps {
  onSubmitSuccess: (itemId: string) => void;
  onCancel: () => void;
}

const itemTypes: ItemType[] = [
  "Weapon",
  "Armor",
  "Potion",
  "Scroll",
  "Wondrous Item",
  "Ring",
  "Rod",
  "Staff",
  "Wand",
  "Ammunition",
  "Adventuring Gear",
  "Tool",
  "Mount",
  "Vehicle",
  "Treasure",
  "Other",
];

const itemRarities: ItemRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
  "Artifact",
  "Unique",
];

const armorTypes: ArmorType[] = ["Light", "Medium", "Heavy", "Shield"];

const damageTypes = [
  "BLUDGEONING", "PIERCING", "SLASHING", "ACID", "COLD", "FIRE", "FORCE",
  "LIGHTNING", "NECROTIC", "POISON", "PSYCHIC", "RADIANT", "THUNDER"
];

const diceTypes = ["D4", "D6", "D8", "D10", "D12", "D20"];

const ItemCreationFormEnhanced: React.FC<ItemCreationFormProps> = ({
  onSubmitSuccess,
  onCancel,
}) => {
  const { user } = useUser();
  const createItem = useMutation(api.items.createItem);

  const [formData, setFormData] = useState<Partial<Item>>({
    name: "",
    type: itemTypes[0],
    rarity: itemRarities[0],
    description: "",
    effects: "",
    weight: undefined,
    cost: undefined,
    attunement: false,
    
    // Enhanced equipment system fields
    typeOfArmor: undefined,
    durability: undefined,
    abilityModifiers: {},
    armorClass: undefined,
    damageRolls: [],
  });

  const [autocalculateDurability, setAutocalculateDurability] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else if (type === "number") {
      setFormData({
        ...formData,
        [name]: value ? parseFloat(value) : undefined,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAbilityModifierChange = (ability: string, value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    setFormData({
      ...formData,
      abilityModifiers: {
        ...formData.abilityModifiers,
        [ability]: numValue,
      },
    });
  };

  const addDamageRoll = () => {
    const newRoll: DamageRoll = {
      dice: { count: 1, type: "D6" },
      modifier: 0,
      damageType: "BLUDGEONING",
    };
    setFormData({
      ...formData,
      damageRolls: [...(formData.damageRolls || []), newRoll],
    });
  };

  const removeDamageRoll = (index: number) => {
    const newRolls = formData.damageRolls?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, damageRolls: newRolls });
  };

  const updateDamageRoll = (index: number, field: string, value: any) => {
    const newRolls = [...(formData.damageRolls || [])];
    if (field === "diceCount" || field === "diceType") {
      newRolls[index] = {
        ...newRolls[index],
        dice: {
          ...newRolls[index].dice,
          [field === "diceCount" ? "count" : "type"]: value,
        },
      };
    } else {
      newRolls[index] = { ...newRolls[index], [field]: value };
    }
    setFormData({ ...formData, damageRolls: newRolls });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Enhanced validation
    const requiredFields = {
      name: "Name",
      type: "Type",
      rarity: "Rarity",
      description: "Description"
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !formData[field as keyof typeof formData])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(", ")}`);
      setLoading(false);
      return;
    }

    try {
      // Calculate durability if auto-calculate is enabled
      let durability = formData.durability;
      if (autocalculateDurability && formData.rarity) {
        durability = calculateDurability(formData.rarity);
      }

      const itemData: any = {
        name: formData.name!,
        type: formData.type!,
        rarity: formData.rarity!,
        description: formData.description!,
        effects: formData.effects,
        weight: formData.weight,
        cost: formData.cost,
        attunement: formData.attunement,
        
        // Enhanced equipment system fields
        typeOfArmor: formData.typeOfArmor,
        durability: durability,
        abilityModifiers: formData.abilityModifiers,
        armorClass: formData.armorClass,
        damageRolls: formData.damageRolls,
      };

      const newItemId = await createItem({
        ...itemData,
        clerkId: user!.id,
      });
      onSubmitSuccess(newItemId);
    } catch (err) {
      console.error("Error creating item:", err);
      setError(err instanceof Error ? err.message : "Failed to create item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case "Common": return "bg-gray-100 text-gray-800";
      case "Uncommon": return "bg-green-100 text-green-800";
      case "Rare": return "bg-blue-100 text-blue-800";
      case "Very Rare": return "bg-purple-100 text-purple-800";
      case "Legendary": return "bg-orange-100 text-orange-800";
      case "Artifact": return "bg-red-100 text-red-800";
      case "Unique": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const isArmorItem = formData.type === "Armor";
  const isWeaponItem = formData.type === "Weapon";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Items
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Item</h1>
            <p className="text-muted-foreground">
              Define a new magical or mundane item with enhanced equipment properties
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="combat" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              Combat Stats
            </TabsTrigger>
            <TabsTrigger value="modifiers" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Modifiers
            </TabsTrigger>
            <TabsTrigger value="durability" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Durability
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Properties
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Core details about the item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Enter the name of the item"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select 
                      value={formData.type || ""} 
                      onValueChange={(value) => setFormData({ ...formData, type: value as ItemType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item type" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rarity">Rarity *</Label>
                    <Select 
                      value={formData.rarity || ""} 
                      onValueChange={(value) => setFormData({ ...formData, rarity: value as ItemRarity })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rarity" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemRarities.map((rarity) => (
                          <SelectItem key={rarity} value={rarity}>
                            <div className="flex items-center gap-2">
                              <span>{rarity}</span>
                              <Badge variant="outline" className={getRarityColor(rarity)}>
                                {rarity}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder="Provide a detailed description of the item..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effects">Magical Effects</Label>
                  <Textarea
                    id="effects"
                    name="effects"
                    value={formData.effects || ""}
                    onChange={handleChange}
                    placeholder="Describe any magical effects, abilities, or special properties..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Combat Stats Tab */}
          <TabsContent value="combat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sword className="h-5 w-5" />
                  Combat Statistics
                </CardTitle>
                <CardDescription>
                  Armor class, damage rolls, and combat-related properties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isArmorItem && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="typeOfArmor">Armor Type</Label>
                        <Select 
                          value={formData.typeOfArmor || ""} 
                          onValueChange={(value) => setFormData({ ...formData, typeOfArmor: value as ArmorType })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select armor type" />
                          </SelectTrigger>
                          <SelectContent>
                            {armorTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="armorClass">Armor Class</Label>
                        <Input
                          id="armorClass"
                          name="armorClass"
                          type="number"
                          value={formData.armorClass || ""}
                          onChange={handleChange}
                          placeholder="10"
                          min="0"
                          max="30"
                        />
                      </div>
                    </div>
                  </>
                )}

                {isWeaponItem && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Damage Rolls</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addDamageRoll}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Damage Roll
                      </Button>
                    </div>
                    
                    {formData.damageRolls?.map((roll, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Dice Count</Label>
                            <Input
                              type="number"
                              value={roll.dice.count}
                              onChange={(e) => updateDamageRoll(index, "diceCount", parseInt(e.target.value))}
                              min="1"
                              max="10"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Dice Type</Label>
                            <Select 
                              value={roll.dice.type} 
                              onValueChange={(value) => updateDamageRoll(index, "diceType", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {diceTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Modifier</Label>
                            <Input
                              type="number"
                              value={roll.modifier}
                              onChange={(e) => updateDamageRoll(index, "modifier", parseInt(e.target.value))}
                              min="-10"
                              max="10"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Damage Type</Label>
                            <div className="flex gap-2">
                              <Select 
                                value={roll.damageType} 
                                onValueChange={(value) => updateDamageRoll(index, "damageType", value)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {damageTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeDamageRoll(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {!isArmorItem && !isWeaponItem && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sword className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Combat stats are available for Armor and Weapon items.</p>
                    <p>Select "Armor" or "Weapon" as the item type to configure these properties.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ability Modifiers Tab */}
          <TabsContent value="modifiers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Ability Score Modifiers
                </CardTitle>
                <CardDescription>
                  Bonuses or penalties this item provides to ability scores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map((ability) => (
                    <div key={ability} className="space-y-2">
                      <Label htmlFor={ability} className="capitalize">{ability}</Label>
                      <Input
                        id={ability}
                        type="number"
                        value={formData.abilityModifiers?.[ability as keyof typeof formData.abilityModifiers] || ""}
                        onChange={(e) => handleAbilityModifierChange(ability, e.target.value)}
                        placeholder="0"
                        min="-5"
                        max="5"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter the ability score modifier this item provides (e.g., +1, -2). Leave blank for no modifier.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Durability Tab */}
          <TabsContent value="durability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Durability System
                </CardTitle>
                <CardDescription>
                  Configure how this item degrades with use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autocalculateDurability"
                    checked={autocalculateDurability}
                    onCheckedChange={(checked) => setAutocalculateDurability(checked as boolean)}
                  />
                  <Label htmlFor="autocalculateDurability">
                    Auto-calculate durability based on rarity
                  </Label>
                </div>

                {!autocalculateDurability && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="durabilityBase">Base Durability</Label>
                      <Input
                        id="durabilityBase"
                        type="number"
                        value={formData.durability?.baseDurability || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          durability: {
                            ...formData.durability,
                            baseDurability: parseInt(e.target.value) || 0,
                            current: formData.durability?.current || parseInt(e.target.value) || 0,
                            max: formData.durability?.max || parseInt(e.target.value) || 0,
                          }
                        })}
                        placeholder="10"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="durabilityMax">Max Durability</Label>
                      <Input
                        id="durabilityMax"
                        type="number"
                        value={formData.durability?.max || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          durability: {
                            ...formData.durability,
                            baseDurability: formData.durability?.baseDurability || 0,
                            max: parseInt(e.target.value) || 0,
                            current: Math.min(formData.durability?.current || 0, parseInt(e.target.value) || 0),
                          }
                        })}
                        placeholder="100"
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="durabilityCurrent">Current Durability</Label>
                      <Input
                        id="durabilityCurrent"
                        type="number"
                        value={formData.durability?.current || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          durability: {
                            ...formData.durability,
                            baseDurability: formData.durability?.baseDurability || 0,
                            max: formData.durability?.max || 0,
                            current: parseInt(e.target.value) || 0,
                          }
                        })}
                        placeholder="100"
                        min="0"
                        max={formData.durability?.max || 100}
                      />
                    </div>
                  </div>
                )}

                {autocalculateDurability && formData.rarity && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Durability will be automatically calculated based on the item's rarity ({formData.rarity}).
                      The system will generate appropriate base, max, and current durability values.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Physical & Magical Properties
                </CardTitle>
                <CardDescription>
                  Weight, cost, attunement, and other properties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      value={formData.weight || ""}
                      onChange={handleChange}
                      placeholder="0.0"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost (gp)</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      value={formData.cost || ""}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attunement"
                    name="attunement"
                    checked={formData.attunement || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, attunement: checked as boolean })}
                  />
                  <Label htmlFor="attunement">
                    Requires Attunement
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <Separator />
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Item..." : "Create Item"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ItemCreationFormEnhanced; 