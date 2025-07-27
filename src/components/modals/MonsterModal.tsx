import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { MonsterFormData, monsterSchema, DND_SIZES, DND_ALIGNMENTS, DND_CHALLENGE_RATINGS, DND_HIT_DICE, calculateAbilityModifier } from "@/lib/validation/schemas"
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
import { Loader2 } from "lucide-react"

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Combat Stats */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Combat Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Speed */}
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

              {/* Ability Scores */}
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

              {/* Challenge Rating & Actions */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Challenge & Special Abilities</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Senses */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Senses</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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