import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { MonsterFormData, monsterSchema, DND_SIZES, DND_CHALLENGE_RATINGS, DND_HIT_DICE, calculateAbilityModifier } from "@/lib/validation/schemas"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { ActionManager } from "@/components/ActionManager"
import { InventoryCreationManager } from "@/components/InventoryCreationManager"
import { useGPTGeneration } from "@/lib/gptGeneration"
import { toast } from "sonner"
import { calculateInitiativeBreakdown, formatInitiativeBreakdown } from "@/lib/initiativeUtils"
import { Target } from "lucide-react"
import { useQueryWithAuth } from "@/hooks/useConvexWithAuth"

interface Monster {
  _id: string
  name: string
  source?: string
  size: string
  type: string
  alignment: string
  armorClass: number
  hitPoints: number
  hitDice: {
    count: number
    die: string
  }
  speed: {
    walk?: string
    swim?: string
    fly?: string
    burrow?: string
    climb?: string
  }
  abilityScores: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  challengeRating: string
  proficiencyBonus: number
  senses: {
    passivePerception: number
    darkvision?: string
    blindsight?: string
    tremorsense?: string
    truesight?: string
  }
  challengeRatingValue?: number
  legendaryActionCount?: number
  lairActionCount?: number
  initiative?: number
  abilityModifiers?: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  actions?: string[] // Action IDs
  traits?: Array<{
    name: string
    description: string
  }>
  reactions?: string[] // Action IDs
  legendaryActions?: string[] // Action IDs
  lairActions?: string[] // Action IDs
  inventory?: {
    capacity: number
    items: Array<{ itemId: string; quantity: number }>
  }
  equipment?: {
    headgear?: string
    armwear?: string
    chestwear?: string
    legwear?: string
    footwear?: string
    mainHand?: string
    offHand?: string
    accessories: string[]
  }
  equipmentBonuses?: {
    armorClass: number
    abilityScores: {
      strength: number
      dexterity: number
      constitution: number
      intelligence: number
      wisdom: number
      charisma: number
    }
  }
  createdAt?: number
  creatorId?: string
}

interface MonsterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit" | "view"
  monster?: Monster
  onSuccess?: () => void
}

export function MonsterModal({
  open,
  onOpenChange,
  mode,
  monster,
  onSuccess,
}: MonsterModalProps) {
  const createMonster = useMutation(api.monsters.createMonster)
  const updateMonster = useMutation(api.monsters.updateMonster)
  const actionsQuery = useQueryWithAuth(api.actions.getAllActions) || []
  const { generate, isGenerating } = useGPTGeneration()
  
  // State for managing action IDs (matching character implementation)
  const [selectedActionIds, setSelectedActionIds] = React.useState<string[]>(
    (monster as any)?.actions || []
  )
  
  // State for managing special abilities (traits remain inline, others use action IDs)
  const [inlineTraits, setInlineTraits] = React.useState<Array<{ name: string; description: string }>>(
    monster?.traits || []
  )
  const [selectedReactionIds, setSelectedReactionIds] = React.useState<string[]>(
    (monster as any)?.reactions || []
  )
  const [selectedLegendaryActionIds, setSelectedLegendaryActionIds] = React.useState<string[]>(
    (monster as any)?.legendaryActions || []
  )
  const [selectedLairActionIds, setSelectedLairActionIds] = React.useState<string[]>(
    (monster as any)?.lairActions || []
  )
  
  // State for inventory and equipment
  const [inventory, setInventory] = React.useState<{
    capacity: number
    items: Array<{ itemId: string; quantity: number }>
  }>(monster?.inventory || { capacity: 150, items: [] })
  
  const [equipment, setEquipment] = React.useState<{
    headgear?: string
    armwear?: string
    chestwear?: string
    legwear?: string
    footwear?: string
    mainHand?: string
    offHand?: string
    accessories: string[]
  }>(monster?.equipment || {
    headgear: undefined,
    armwear: undefined,
    chestwear: undefined,
    legwear: undefined,
    footwear: undefined,
    mainHand: undefined,
    offHand: undefined,
    accessories: []
  })
  
  const [equipmentBonuses, setEquipmentBonuses] = React.useState<{
    armorClass: number
    abilityScores: {
      strength: number
      dexterity: number
      constitution: number
      intelligence: number
      wisdom: number
      charisma: number
    }
  }>(monster?.equipmentBonuses || {
    armorClass: 0,
    abilityScores: {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0
    }
  })
  
  const form = useForm<MonsterFormData>({
    resolver: zodResolver(monsterSchema),
    defaultValues: {
      name: monster?.name || "",
      source: monster?.source || "",
      size: monster?.size as any || "Medium",
      type: monster?.type || "",
      alignment: monster?.alignment || "",
      armorClass: monster?.armorClass || 10,
      hitPoints: monster?.hitPoints || 1,
      hitDice: {
        count: monster?.hitDice?.count || 1,
        die: monster?.hitDice?.die as any || "d8",
      },
      speed: {
        walk: monster?.speed?.walk || "",
        swim: monster?.speed?.swim || "",
        fly: monster?.speed?.fly || "",
        burrow: monster?.speed?.burrow || "",
        climb: monster?.speed?.climb || "",
      },
      abilityScores: {
        strength: monster?.abilityScores?.strength || 10,
        dexterity: monster?.abilityScores?.dexterity || 10,
        constitution: monster?.abilityScores?.constitution || 10,
        intelligence: monster?.abilityScores?.intelligence || 10,
        wisdom: monster?.abilityScores?.wisdom || 10,
        charisma: monster?.abilityScores?.charisma || 10,
      },
      challengeRating: monster?.challengeRating || "0",
      proficiencyBonus: monster?.proficiencyBonus || 2,
      senses: {
        passivePerception: monster?.senses?.passivePerception || 10,
        darkvision: monster?.senses?.darkvision || "",
        blindsight: monster?.senses?.blindsight || "",
        tremorsense: monster?.senses?.tremorsense || "",
        truesight: monster?.senses?.truesight || "",
      },
      challengeRatingValue: monster?.challengeRatingValue || undefined,
      legendaryActionCount: monster?.legendaryActionCount || undefined,
      lairActionCount: monster?.lairActionCount || undefined,
      actions: monster?.actions || [],
    },
  })

  React.useEffect(() => {
    if (monster && (mode === "edit" || mode === "view")) {
      form.reset({
        name: monster.name,
        source: monster.source || "",
        size: monster.size as any,
        type: monster.type,
        alignment: monster.alignment,
        armorClass: monster.armorClass,
        hitPoints: monster.hitPoints,
        hitDice: {
          count: monster.hitDice.count,
          die: monster.hitDice.die as any,
        },
        speed: {
          walk: monster.speed.walk || "",
          swim: monster.speed.swim || "",
          fly: monster.speed.fly || "",
          burrow: monster.speed.burrow || "",
          climb: monster.speed.climb || "",
        },
        abilityScores: monster.abilityScores,
        challengeRating: monster.challengeRating,
        proficiencyBonus: monster.proficiencyBonus,
        senses: {
          passivePerception: monster.senses.passivePerception,
          darkvision: monster.senses.darkvision || "",
          blindsight: monster.senses.blindsight || "",
          tremorsense: monster.senses.tremorsense || "",
          truesight: monster.senses.truesight || "",
        },
        challengeRatingValue: monster.challengeRatingValue || undefined,
        legendaryActionCount: monster.legendaryActionCount || undefined,
        lairActionCount: monster.lairActionCount || undefined,
        actions: monster.actions || [],
      })
      setSelectedActionIds((monster as any)?.actions || [])
      setInlineTraits(monster.traits || [])
      setSelectedReactionIds((monster as any)?.reactions || [])
      setSelectedLegendaryActionIds((monster as any)?.legendaryActions || [])
      setSelectedLairActionIds((monster as any)?.lairActions || [])
      // Set inventory and equipment state
      setInventory(monster.inventory || { capacity: 150, items: [] })
      setEquipment(monster.equipment || {
        headgear: undefined,
        armwear: undefined,
        chestwear: undefined,
        legwear: undefined,
        footwear: undefined,
        mainHand: undefined,
        offHand: undefined,
        accessories: []
      })
      setEquipmentBonuses(monster.equipmentBonuses || {
        armorClass: 0,
        abilityScores: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0
        }
      })
    } else if (mode === "create") {
      form.reset({
        name: "",
        source: "",
        size: "Medium",
        type: "",
        alignment: "",
        armorClass: 10,
        hitPoints: 1,
        hitDice: { count: 1, die: "d8" },
        speed: { walk: "30 ft.", swim: "", fly: "", burrow: "", climb: "" },
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        challengeRating: "0",
        proficiencyBonus: 2,
        senses: {
          passivePerception: 10,
          darkvision: "",
          blindsight: "",
          tremorsense: "",
          truesight: "",
        },
        challengeRatingValue: undefined,
        legendaryActionCount: undefined,
        lairActionCount: undefined,
        actions: [],
      })
      setSelectedActionIds([])
      setInlineTraits([])
      setSelectedReactionIds([])
      setSelectedLegendaryActionIds([])
      setSelectedLairActionIds([])
      // Reset inventory and equipment
      setInventory({ capacity: 150, items: [] })
      setEquipment({
        headgear: undefined,
        armwear: undefined,
        chestwear: undefined,
        legwear: undefined,
        footwear: undefined,
        mainHand: undefined,
        offHand: undefined,
        accessories: []
      })
      setEquipmentBonuses({
        armorClass: 0,
        abilityScores: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0
        }
      })
    }
  }, [monster, mode, form])

  const onSubmit = async (data: MonsterFormData) => {
    try {
      // Clean up optional string fields
      const cleanData = {
        ...data,
        source: data.source || undefined,
        speed: {
          walk: data.speed.walk || undefined,
          swim: data.speed.swim || undefined,
          fly: data.speed.fly || undefined,
          burrow: data.speed.burrow || undefined,
          climb: data.speed.climb || undefined,
        },
        senses: {
          ...data.senses,
          darkvision: data.senses.darkvision || undefined,
          blindsight: data.senses.blindsight || undefined,
          tremorsense: data.senses.tremorsense || undefined,
          truesight: data.senses.truesight || undefined,
        },
        challengeRatingValue: data.challengeRatingValue || undefined,
        legendaryActionCount: data.legendaryActionCount || undefined,
        lairActionCount: data.lairActionCount || undefined,
        actions: selectedActionIds.length > 0 ? selectedActionIds : [],
        traits: inlineTraits.length > 0 ? inlineTraits : undefined,
        reactions: selectedReactionIds.length > 0 ? selectedReactionIds : [],
        legendaryActions: selectedLegendaryActionIds.length > 0 ? selectedLegendaryActionIds : [],
        lairActions: selectedLairActionIds.length > 0 ? selectedLairActionIds : [],
        // Include inventory and equipment
        inventory,
        equipment,
        equipmentBonuses,
      }

      if (mode === "create") {
        await createMonster(cleanData)
      } else if (mode === "edit" && monster) {
        await updateMonster({
          monsterId: monster._id,
          ...cleanData,
        })
      }
      
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Failed to save monster:", error)
      // TODO: Show toast notification for error
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Create Monster"
      case "edit":
        return "Edit Monster"
      case "view":
        return "Monster Details"
      default:
        return "Monster"
    }
  }

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Create a new monster or NPC for your D&D campaign."
      case "edit":
        return "Edit monster stats and abilities."
      case "view":
        return "View monster stat block and abilities."
      default:
        return ""
    }
  }

  const isReadOnly = mode === "view"
  const isSubmitting = form.formState.isSubmitting

  // Handle GPT generation
  const handleGenerateWithGPT = async () => {
    try {
      toast.info("Generating monster with GPT...", { duration: 2000 })
      const result = await generate("monster")
      
      if (result.success && result.data) {
        // Populate form with generated data
        form.reset({
          name: result.data.name || "",
          source: result.data.source || "Custom Creation",
          size: result.data.size || "Medium",
          type: result.data.type || "",
          alignment: result.data.alignment || "",
          armorClass: result.data.armorClass || 10,
          hitPoints: result.data.hitPoints || 1,
          hitDice: result.data.hitDice || { count: 1, die: "d8" },
          speed: result.data.speed || { walk: "30 ft." },
          abilityScores: result.data.abilityScores || {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
          },
          challengeRating: result.data.challengeRating || "0",
          proficiencyBonus: result.data.proficiencyBonus || 2,
          senses: result.data.senses || { passivePerception: 10 },
          challengeRatingValue: result.data.challengeRatingValue,
          legendaryActionCount: result.data.legendaryActionCount,
          lairActionCount: result.data.lairActionCount,
          actions: result.data.actions || [],
        })
        
        // Update inline actions and special abilities
        setInlineActions(result.data.actions || [])
        setInlineTraits(result.data.traits || [])
        setInlineReactions(result.data.reactions || [])
        setInlineLegendaryActions(result.data.legendaryActions || [])
        setInlineLairActions(result.data.lairActions || [])
        
        toast.success("Monster generated successfully! Review and adjust as needed.", {
          duration: 3000,
        })
      } else {
        toast.error(result.error || "Failed to generate monster")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate monster")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] flex flex-col p-0">
        <div className="flex-shrink-0 px-6 pt-6 pb-4">
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
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="traits">Traits</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="reactions">Reactions</TabsTrigger>
                <TabsTrigger value="legendary">Legendary</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                {/* Basic Information section content */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name Field */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monster Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter monster name..."
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>
                            The name of the monster (2-100 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Source Field */}
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Monster Manual, Homebrew..."
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>
                            Where this monster comes from
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Size, Type, Alignment Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Size Select */}
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DND_SIZES.map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Type Field */}
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., humanoid, beast, dragon..."
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Alignment Field */}
                    <FormField
                      control={form.control}
                      name="alignment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alignment *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., chaotic evil, neutral..."
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-6">
                {/* Combat Stats Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Combat Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Armor Class Field */}
                    <FormField
                      control={form.control}
                      name="armorClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Armor Class *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>AC (1-30)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Hit Points Field */}
                    <FormField
                      control={form.control}
                      name="hitPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hit Points *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>Max HP (1-1000)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Proficiency Bonus Field */}
                    <FormField
                      control={form.control}
                      name="proficiencyBonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proficiency Bonus *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>Prof. bonus (2-9)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Initiative Display */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <h4 className="text-sm font-medium">Initiative Modifier</h4>
                    </div>
                    <div className="pl-6 space-y-1">
                      {(() => {
                        const abilityScores = form.watch("abilityScores") || monster?.abilityScores || {
                          strength: 10,
                          dexterity: 10,
                          constitution: 10,
                          intelligence: 10,
                          wisdom: 10,
                          charisma: 10,
                        };
                        
                        // Get current equipment bonuses
                        const currentEquipmentBonuses = equipmentBonuses || monster?.equipmentBonuses || {
                          armorClass: 0,
                          abilityScores: {
                            strength: 0,
                            dexterity: 0,
                            constitution: 0,
                            intelligence: 0,
                            wisdom: 0,
                            charisma: 0,
                          },
                        };
                        
                        // Calculate ability modifiers from scores (including equipment bonuses)
                        const totalDexterity = (abilityScores?.dexterity || 10) + (currentEquipmentBonuses?.abilityScores?.dexterity || 0);
                        const abilityModifiers = {
                          dexterity: Math.floor((totalDexterity - 10) / 2),
                        };
                        
                        const entity = {
                          abilityScores,
                          abilityModifiers,
                          dexterity: abilityScores?.dexterity,
                          equipmentBonuses: currentEquipmentBonuses,
                        };
                        
                        const breakdown = calculateInitiativeBreakdown(entity);
                        const modifierText = breakdown.totalModifier >= 0 
                          ? `+${breakdown.totalModifier}` 
                          : `${breakdown.totalModifier}`;
                        
                        return (
                          <>
                            <div className="text-2xl font-bold text-purple-600">
                              {modifierText}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatInitiativeBreakdown(breakdown)}
                            </div>
                            {breakdown.hasAdvantage && (
                              <div className="text-xs text-green-600 font-medium">
                                Has Advantage
                              </div>
                            )}
                            {breakdown.hasDisadvantage && (
                              <div className="text-xs text-red-600 font-medium">
                                Has Disadvantage
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Hit Dice Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hitDice.count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hit Dice Count *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>Number of hit dice (1-100)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hitDice.die"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hit Die Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select die..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DND_HIT_DICE.map((die) => (
                                <SelectItem key={die} value={die}>
                                  {die}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                {/* Speed Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Speed</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { name: "walk", label: "Walk", placeholder: "30 ft." },
                      { name: "swim", label: "Swim", placeholder: "30 ft." },
                      { name: "fly", label: "Fly", placeholder: "60 ft." },
                      { name: "burrow", label: "Burrow", placeholder: "20 ft." },
                      { name: "climb", label: "Climb", placeholder: "30 ft." },
                    ].map(({ name, label, placeholder }) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={`speed.${name}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={placeholder}
                                {...field}
                                disabled={isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
                {/* Ability Scores Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Ability Scores</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[
                      { name: "strength", label: "STR" },
                      { name: "dexterity", label: "DEX" },
                      { name: "constitution", label: "CON" },
                      { name: "intelligence", label: "INT" },
                      { name: "wisdom", label: "WIS" },
                      { name: "charisma", label: "CHA" },
                    ].map(({ name, label }) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={`abilityScores.${name}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                disabled={isReadOnly}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value ? `(${calculateAbilityModifier(field.value) >= 0 ? '+' : ''}${calculateAbilityModifier(field.value)})` : ''}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
                {/* Senses Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Senses</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Passive Perception Field */}
                    <FormField
                      control={form.control}
                      name="senses.passivePerception"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passive Perception *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>Passive Perception (1-30)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Darkvision Field */}
                    <FormField
                      control={form.control}
                      name="senses.darkvision"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Darkvision</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 60 ft."
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Blindsight Field */}
                    <FormField
                      control={form.control}
                      name="senses.blindsight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blindsight</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 30 ft."
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tremorsense Field */}
                    <FormField
                      control={form.control}
                      name="senses.tremorsense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tremorsense</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 60 ft."
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Truesight Field */}
                    <FormField
                      control={form.control}
                      name="senses.truesight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Truesight</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 120 ft."
                              {...field}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Traits Tab */}
              <TabsContent value="traits" className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Traits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Challenge Rating Field */}
                    <FormField
                      control={form.control}
                      name="challengeRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Challenge Rating *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select CR..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DND_CHALLENGE_RATINGS.map((cr) => (
                                <SelectItem key={cr} value={cr}>
                                  {cr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Legendary Actions Field */}
                    <FormField
                      control={form.control}
                      name="legendaryActionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legendary Actions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>0-5</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Lair Actions Field */}
                    <FormField
                      control={form.control}
                      name="lairActionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lair Actions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <FormDescription>0-5</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Traits Management */}
                <ActionManager
                  mode="monster"
                  inlineActions={inlineTraits}
                  onInlineActionsChange={setInlineTraits}
                  disabled={isReadOnly}
                />
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-6">
                <ActionManager
                  mode="character"
                  selectedActionIds={selectedActionIds}
                  onActionIdsChange={setSelectedActionIds}
                  disabled={isReadOnly}
                />
              </TabsContent>

              {/* Reactions Tab */}
              <TabsContent value="reactions" className="space-y-6">
                <ActionManager
                  mode="character"
                  selectedActionIds={selectedReactionIds}
                  onActionIdsChange={setSelectedReactionIds}
                  disabled={isReadOnly}
                />
              </TabsContent>

              {/* Legendary Tab */}
              <TabsContent value="legendary" className="space-y-6">
                <div className="space-y-6">
                  {/* Legendary Actions */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Legendary Actions</h4>
                    <ActionManager
                      mode="character"
                      selectedActionIds={selectedLegendaryActionIds}
                      onActionIdsChange={setSelectedLegendaryActionIds}
                      disabled={isReadOnly}
                    />
                  </div>
                  
                  {/* Lair Actions */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Lair Actions</h4>
                    <ActionManager
                      mode="character"
                      selectedActionIds={selectedLairActionIds}
                      onActionIdsChange={setSelectedLairActionIds}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-6">
                <InventoryCreationManager
                  inventory={inventory}
                  equipment={equipment}
                  equipmentBonuses={equipmentBonuses}
                  abilityScores={form.watch("abilityScores")}
                  onInventoryChange={setInventory}
                  onEquipmentChange={setEquipment}
                  onBonusesChange={setEquipmentBonuses}
                  canEdit={!isReadOnly}
                  isReadOnly={isReadOnly}
                />
              </TabsContent>
            </Tabs>
            </div>
            {!isReadOnly && (
              <div className="flex-shrink-0 border-t px-6 py-4">
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
                    {mode === "create" ? "Create Monster" : "Save Changes"}
                  </Button>
                </DialogFooter>
              </div>
            )}
            {isReadOnly && (
              <div className="flex-shrink-0 border-t px-6 py-4">
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 