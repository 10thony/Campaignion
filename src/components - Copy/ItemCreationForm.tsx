import React, { useState } from "react";
import type { Item, ItemType, ItemRarity, ArmorType, DamageRoll, AbilityModifiers } from "../types/item";
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

const ItemCreationForm: React.FC<ItemCreationFormProps> = ({
  onSubmitSuccess,
  onCancel,
}) => {
  const { user } = useUser();
  const createItem = useMutation(api.items.createItem);

  const [formData, setFormData] = useState<Partial<Item>>({
    name: "",
    type: itemTypes[0], // Default to the first type
    rarity: itemRarities[0], // Default to the first rarity
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

  // Additional state for enhanced equipment system
  const [autocalculateDurability, setAutocalculateDurability] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
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

      // Ensure all required fields are present and properly typed
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
              Define a new magical or mundane item for your campaign
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
                placeholder="Enter the name of the item (e.g., 'Sword of Life Stealing')"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the name of the item (e.g., "Sword of Life Stealing").
              </p>
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
                <p className="text-sm text-muted-foreground">
                  Select the category of the item (e.g., Weapon, Armor).
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Choose the rarity level of the item (e.g., Common, Legendary).
                </p>
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
              <p className="text-sm text-muted-foreground">
                Describe the item's appearance, history, and basic properties.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Effects & Properties
            </CardTitle>
            <CardDescription>
              Magical effects and special properties of the item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="effects">Magical Effects</Label>
              <Textarea
                id="effects"
                name="effects"
                value={formData.effects || ""}
                onChange={handleChange}
                placeholder="Describe any magical effects, abilities, or special properties..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Describe any magical effects, abilities, or special properties the item possesses.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="attunement"
                name="attunement"
                checked={formData.attunement || false}
                onCheckedChange={(checked) => setFormData({ ...formData, attunement: checked as boolean })}
              />
              <Label htmlFor="attunement" className="text-sm font-normal">
                Requires Attunement
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Check if this item requires attunement to use its magical properties.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Physical Properties
            </CardTitle>
            <CardDescription>
              Weight, cost, and other physical characteristics
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
                <p className="text-sm text-muted-foreground">
                  Weight in pounds (e.g., 3.5 for a sword).
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Cost in gold pieces (e.g., 1500 for a rare item).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
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

export default ItemCreationForm;
