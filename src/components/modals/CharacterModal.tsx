import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { CharacterFormData, characterSchema, DND_ALIGNMENTS, calculateAbilityModifier } from "@/lib/validation/schemas"
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

interface Character {
  _id: string
  name: string
  race: string
  class: string
  background: string
  alignment?: string
  level: number
  abilityScores: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  hitPoints: number
  armorClass: number
  speed?: string
  skills: string[]
  savingThrows: string[]
  proficiencies: string[]
  characterType?: "PlayerCharacter" | "NonPlayerCharacter"
  createdAt?: number
  creatorId?: string
}

interface CharacterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit" | "view"
  character?: Character
  characterType: "PlayerCharacter" | "NonPlayerCharacter"
  onSuccess?: () => void
}

// Common D&D 5e skills
const DND_SKILLS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
  "History", "Insight", "Intimidation", "Investigation", "Medicine",
  "Nature", "Perception", "Performance", "Persuasion", "Religion",
  "Sleight of Hand", "Stealth", "Survival"
]

// Common D&D 5e saving throws
const DND_SAVING_THROWS = [
  "Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"
]

export function CharacterModal({
  open,
  onOpenChange,
  mode,
  character,
  characterType,
  onSuccess,
}: CharacterModalProps) {
  const createPlayerCharacter = useMutation(api.characters.createPlayerCharacter)
  const createNPC = useMutation(api.characters.createNPC)
  
  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: character?.name || "",
      race: character?.race || "",
      class: character?.class || "",
      background: character?.background || "",
      alignment: character?.alignment || "",
      level: character?.level || 1,
      abilityScores: {
        strength: character?.abilityScores?.strength || 10,
        dexterity: character?.abilityScores?.dexterity || 10,
        constitution: character?.abilityScores?.constitution || 10,
        intelligence: character?.abilityScores?.intelligence || 10,
        wisdom: character?.abilityScores?.wisdom || 10,
        charisma: character?.abilityScores?.charisma || 10,
      },
      hitPoints: character?.hitPoints || 1,
      armorClass: character?.armorClass || 10,
      speed: character?.speed || "",
      skills: character?.skills || [],
      savingThrows: character?.savingThrows || [],
      proficiencies: character?.proficiencies || [],
    },
  })

  React.useEffect(() => {
    if (character && (mode === "edit" || mode === "view")) {
      form.reset({
        name: character.name,
        race: character.race,
        class: character.class,
        background: character.background,
        alignment: character.alignment || "",
        level: character.level,
        abilityScores: character.abilityScores,
        hitPoints: character.hitPoints,
        armorClass: character.armorClass,
        speed: character.speed || "",
        skills: character.skills,
        savingThrows: character.savingThrows,
        proficiencies: character.proficiencies,
      })
    } else if (mode === "create") {
      form.reset({
        name: "",
        race: "",
        class: "",
        background: "",
        alignment: "",
        level: 1,
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        hitPoints: 1,
        armorClass: 10,
        speed: "30 ft.",
        skills: [],
        savingThrows: [],
        proficiencies: [],
      })
    }
  }, [character, mode, form])

  const onSubmit = async (data: CharacterFormData) => {
    try {
      const cleanData = {
        ...data,
        alignment: data.alignment || undefined,
        speed: data.speed || undefined,
      }

      if (mode === "create") {
        if (characterType === "PlayerCharacter") {
          await createPlayerCharacter(cleanData)
        } else {
          await createNPC(cleanData)
        }
      }
      // TODO: Add edit functionality when mutation is available
      
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Failed to save character:", error)
      // TODO: Show toast notification for error
    }
  }

  const getTitle = () => {
    const prefix = characterType === "PlayerCharacter" ? "Character" : "NPC"
    switch (mode) {
      case "create":
        return `Create ${prefix}`
      case "edit":
        return `Edit ${prefix}`
      case "view":
        return `${prefix} Details`
      default:
        return prefix
    }
  }

  const getDescription = () => {
    const entityType = characterType === "PlayerCharacter" ? "player character" : "NPC"
    switch (mode) {
      case "create":
        return `Create a new ${entityType} for your D&D campaign.`
      case "edit":
        return `Edit ${entityType} details and stats.`
      case "view":
        return `View ${entityType} character sheet.`
      default:
        return ""
    }
  }

  const isReadOnly = mode === "view"
  const isSubmitting = form.formState.isSubmitting

  // Multi-select helper functions (simplified for demo)
  const handleSkillsChange = (value: string) => {
    const currentSkills = form.getValues("skills")
    const newSkills = currentSkills.includes(value)
      ? currentSkills.filter(skill => skill !== value)
      : [...currentSkills, value]
    form.setValue("skills", newSkills)
  }

  const handleSavingThrowsChange = (value: string) => {
    const currentSaves = form.getValues("savingThrows")
    const newSaves = currentSaves.includes(value)
      ? currentSaves.filter(save => save !== value)
      : [...currentSaves, value]
    form.setValue("savingThrows", newSaves)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                        <FormLabel>Character Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter character name..."
                            {...field}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          The character's name (2-100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Character level (1-20)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="race"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Race *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Human, Elf, Dwarf..."
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
                    name="class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Fighter, Wizard, Rogue..."
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
                    name="background"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Soldier, Noble, Criminal..."
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
                    name="alignment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alignment</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Lawful Good, Chaotic Neutral..."
                            {...field}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Character's moral and ethical outlook
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="speed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Speed</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 30 ft., 25 ft., 35 ft..."
                            {...field}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Movement speed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Combat Stats */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Combat Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hitPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hit Points *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum hit points (1-1000)
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
                        <FormLabel>Armor Class *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Armor class (1-30)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                              min="1"
                              max="30"
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

              {/* Skills & Proficiencies */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Skills & Proficiencies</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Skills</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {DND_SKILLS.map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`skill-${skill}`}
                            checked={form.watch("skills").includes(skill)}
                            onChange={() => handleSkillsChange(skill)}
                            disabled={isReadOnly}
                          />
                          <label htmlFor={`skill-${skill}`} className="text-sm">
                            {skill}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Saving Throw Proficiencies</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {DND_SAVING_THROWS.map((save) => (
                        <div key={save} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`save-${save}`}
                            checked={form.watch("savingThrows").includes(save)}
                            onChange={() => handleSavingThrowsChange(save)}
                            disabled={isReadOnly}
                          />
                          <label htmlFor={`save-${save}`} className="text-sm">
                            {save}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="proficiencies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Proficiencies</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter other proficiencies (weapons, tools, languages) separated by commas..."
                            {...field}
                            value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                            onChange={(e) => field.onChange(e.target.value.split(",").map(p => p.trim()).filter(p => p))}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormDescription>
                          Weapons, tools, languages, etc. (comma-separated)
                        </FormDescription>
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
                  {mode === "create" ? `Create ${characterType === "PlayerCharacter" ? "Character" : "NPC"}` : "Save Changes"}
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