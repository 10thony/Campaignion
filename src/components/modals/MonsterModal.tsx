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
import { useGPTGeneration } from "@/lib/gptGeneration"
import { toast } from "sonner"

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
  actions?: Array<{
    name: string
    description: string
  }>
  traits?: Array<{
    name: string
    description: string
  }>
  reactions?: Array<{
    name: string
    description: string
  }>
  legendaryActions?: Array<{
    name: string
    description: string
  }>
  lairActions?: Array<{
    name: string
    description: string
  }>
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
  const { generate, isGenerating } = useGPTGeneration()
  
  // State for managing inline actions
  const [inlineActions, setInlineActions] = React.useState<Array<{ name: string; description: string }>>(
    monster?.actions || []
  )
  
  // State for managing special abilities
  const [inlineTraits, setInlineTraits] = React.useState<Array<{ name: string; description: string }>>(
    monster?.traits || []
  )
  const [inlineReactions, setInlineReactions] = React.useState<Array<{ name: string; description: string }>>(
    monster?.reactions || []
  )
  const [inlineLegendaryActions, setInlineLegendaryActions] = React.useState<Array<{ name: string; description: string }>>(
    monster?.legendaryActions || []
  )
  const [inlineLairActions, setInlineLairActions] = React.useState<Array<{ name: string; description: string }>>(
    monster?.lairActions || []
  )
  
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
      setInlineActions(monster.actions || [])
      setInlineTraits(monster.traits || [])
      setInlineReactions(monster.reactions || [])
      setInlineLegendaryActions(monster.legendaryActions || [])
      setInlineLairActions(monster.lairActions || [])
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
      setInlineActions([])
      setInlineTraits([])
      setInlineReactions([])
      setInlineLegendaryActions([])
      setInlineLairActions([])
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
        actions: inlineActions.length > 0 ? inlineActions : undefined,
        traits: inlineTraits.length > 0 ? inlineTraits : undefined,
        reactions: inlineReactions.length > 0 ? inlineReactions : undefined,
        legendaryActions: inlineLegendaryActions.length > 0 ? inlineLegendaryActions : undefined,
        lairActions: inlineLairActions.length > 0 ? inlineLairActions : undefined,
      }

      if (mode === "create") {
        await createMonster(cleanData)
      }
      // TODO: Add edit functionality when mutation is available
      
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="traits">Traits</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="reactions">Reactions</TabsTrigger>
                <TabsTrigger value="legendary">Legendary</TabsTrigger>
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
                  mode="monster"
                  inlineActions={inlineActions}
                  onInlineActionsChange={setInlineActions}
                  disabled={isReadOnly}
                />
              </TabsContent>

              {/* Reactions Tab */}
              <TabsContent value="reactions" className="space-y-6">
                <ActionManager
                  mode="monster"
                  inlineActions={inlineReactions}
                  onInlineActionsChange={setInlineReactions}
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
                      mode="monster"
                      inlineActions={inlineLegendaryActions}
                      onInlineActionsChange={setInlineLegendaryActions}
                      disabled={isReadOnly}
                    />
                  </div>
                  
                  {/* Lair Actions */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Lair Actions</h4>
                    <ActionManager
                      mode="monster"
                      inlineActions={inlineLairActions}
                      onInlineActionsChange={setInlineLairActions}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

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
                  {mode === "create" ? "Create Monster" : "Save Changes"}
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