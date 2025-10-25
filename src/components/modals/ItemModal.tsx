import React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ItemFormData, itemSchema, DND_ITEM_TYPES, DND_RARITIES, DND_ARMOR_TYPES } from "@/lib/validation/schemas"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { useGPTGeneration } from "@/lib/gptGeneration"
import { toast } from "sonner"

interface Item {
  _id: string
  name: string
  type: string
  rarity: string
  description: string
  effects?: string
  weight?: number
  cost?: number
  attunement?: boolean
  typeOfArmor?: string
  armorClass?: number
  abilityModifiers?: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
  }
  createdAt?: number
  creatorId?: string
}

interface ItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit" | "view"
  item?: Item
  onSuccess?: () => void
}

export function ItemModal({
  open,
  onOpenChange,
  mode,
  item,
  onSuccess,
}: ItemModalProps) {
  const createItem = useMutation(api.items.createItem)
  const { generate, isGenerating } = useGPTGeneration()
  
  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || "",
      type: item?.type as any || "Other",
      rarity: item?.rarity as any || "Common",
      description: item?.description || "",
      effects: item?.effects || "",
      weight: item?.weight || undefined,
      cost: item?.cost || undefined,
      attunement: item?.attunement || false,
      typeOfArmor: item?.typeOfArmor as any || undefined,
      armorClass: item?.armorClass || undefined,
      abilityModifiers: {
        strength: item?.abilityModifiers?.strength || undefined,
        dexterity: item?.abilityModifiers?.dexterity || undefined,
        constitution: item?.abilityModifiers?.constitution || undefined,
        intelligence: item?.abilityModifiers?.intelligence || undefined,
        wisdom: item?.abilityModifiers?.wisdom || undefined,
        charisma: item?.abilityModifiers?.charisma || undefined,
      },
    },
  })

  // Watch the item type to show/hide conditional fields
  const itemType = useWatch({ control: form.control, name: "type" })

  React.useEffect(() => {
    if (item && (mode === "edit" || mode === "view")) {
      form.reset({
        name: item.name,
        type: item.type as any,
        rarity: item.rarity as any,
        description: item.description,
        effects: item.effects || "",
        weight: item.weight || undefined,
        cost: item.cost || undefined,
        attunement: item.attunement || false,
        typeOfArmor: item.typeOfArmor as any || undefined,
        armorClass: item.armorClass || undefined,
        abilityModifiers: {
          strength: item.abilityModifiers?.strength || undefined,
          dexterity: item.abilityModifiers?.dexterity || undefined,
          constitution: item.abilityModifiers?.constitution || undefined,
          intelligence: item.abilityModifiers?.intelligence || undefined,
          wisdom: item.abilityModifiers?.wisdom || undefined,
          charisma: item.abilityModifiers?.charisma || undefined,
        },
      })
    } else if (mode === "create") {
      form.reset({
        name: "",
        type: "Other",
        rarity: "Common",
        description: "",
        effects: "",
        weight: undefined,
        cost: undefined,
        attunement: false,
        typeOfArmor: undefined,
        armorClass: undefined,
        abilityModifiers: {
          strength: undefined,
          dexterity: undefined,
          constitution: undefined,
          intelligence: undefined,
          wisdom: undefined,
          charisma: undefined,
        },
      })
    }
  }, [item, mode, form])

  const onSubmit = async (data: ItemFormData) => {
    try {
      // Clean up optional fields - remove undefined values
      const cleanData = {
        ...data,
        effects: data.effects || undefined,
        weight: data.weight || undefined,
        cost: data.cost || undefined,
        typeOfArmor: data.typeOfArmor || undefined,
        armorClass: data.armorClass || undefined,
        abilityModifiers: Object.keys(data.abilityModifiers || {}).length > 0 
          ? Object.fromEntries(
              Object.entries(data.abilityModifiers || {}).filter(([, value]) => value !== undefined && value !== null)
            )
          : undefined,
      }

      if (mode === "create") {
        await createItem(cleanData)
      }
      // TODO: Add edit functionality when mutation is available
      
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Failed to save item:", error)
      // TODO: Show toast notification for error
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Create Item"
      case "edit":
        return "Edit Item"
      case "view":
        return "Item Details"
      default:
        return "Item"
    }
  }

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Create a new magical or mundane item for your D&D campaign."
      case "edit":
        return "Edit item properties and effects."
      case "view":
        return "View item details and properties."
      default:
        return ""
    }
  }

  const isReadOnly = mode === "view"
  const isSubmitting = form.formState.isSubmitting
  const isArmor = itemType === "Armor"

  // Handle GPT generation
  const handleGenerateWithGPT = async () => {
    try {
      toast.info("Generating item with GPT...", { duration: 2000 })
      const result = await generate("item")
      
      if (result.success && result.data) {
        // Populate form with generated data
        form.reset({
          name: result.data.name || "",
          type: result.data.type || "Other",
          rarity: result.data.rarity || "Common",
          description: result.data.description || "",
          effects: result.data.effects || "",
          weight: result.data.weight,
          cost: result.data.cost,
          attunement: result.data.attunement || false,
          typeOfArmor: result.data.typeOfArmor,
          armorClass: result.data.armorClass,
          abilityModifiers: result.data.abilityModifiers || {
            strength: undefined,
            dexterity: undefined,
            constitution: undefined,
            intelligence: undefined,
            wisdom: undefined,
            charisma: undefined,
          },
        })
        
        toast.success("Item generated successfully! Review and adjust as needed.", {
          duration: 3000,
        })
      } else {
        toast.error(result.error || "Failed to generate item")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate item")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle>{getTitle()}</DialogTitle>
              <DialogDescription>{getDescription()}</DialogDescription>
            </div>
            {mode === "create" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateWithGPT}
                disabled={isGenerating || isSubmitting}
                className="ml-4"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with GPT
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter item name..."
                            {...field}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          The name of the item (2-100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isReadOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select item type..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DND_ITEM_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The category of this item
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rarity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rarity *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isReadOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rarity..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DND_RARITIES.map((rarity) => (
                              <SelectItem key={rarity} value={rarity}>
                                {rarity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How rare and valuable this item is
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attunement"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={isReadOnly}
                            className="mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Requires Attunement</FormLabel>
                          <FormDescription>
                            Whether this item requires attunement to use
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the item's appearance, history, and basic properties..."
                          className="min-h-[100px]"
                          {...field}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormDescription>
                        Physical description and lore (max 1000 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Properties */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Properties</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Item weight in pounds..."
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Weight of the item in pounds
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost (gp)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Cost in gold pieces..."
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Market value in gold pieces
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="effects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Magical Effects</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe any magical effects, abilities, or special properties..."
                          className="min-h-[80px]"
                          {...field}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormDescription>
                        Mechanical effects and special abilities (max 500 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Armor-specific fields */}
              {isArmor && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Armor Properties</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="typeOfArmor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Armor Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select armor type..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DND_ARMOR_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The category of armor
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="armorClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Armor Class</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Base AC value..."
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>
                            Base armor class value (1-30)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Ability Modifiers */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Ability Score Modifiers</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: "strength", label: "Strength" },
                    { name: "dexterity", label: "Dexterity" },
                    { name: "constitution", label: "Constitution" },
                    { name: "intelligence", label: "Intelligence" },
                    { name: "wisdom", label: "Wisdom" },
                    { name: "charisma", label: "Charisma" },
                  ].map(({ name, label }) => {
                    const value = form.getValues(`abilityModifiers.${name}` as any)
                    return (
                      <FormField
                        key={name}
                        control={form.control}
                        name={`abilityModifiers.${name}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              {isReadOnly ? (
                                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
                                  {value ? (value > 0 ? `+${value}` : `${value}`) : "—"}
                                </div>
                              ) : (
                                <Input
                                  type="number"
                                  placeholder="+/-"
                                  {...field}
                                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  value={field.value || ""}
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Bonuses or penalties this item applies to ability scores (-5 to +10)
                </p>
              </div>
            </div>

            {!isReadOnly && (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "create" ? "Create Item" : "Save Changes"}
                </Button>
              </DialogFooter>
            )}

            {isReadOnly && (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 