import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { 
  ExtendedCharacterFormData,
  characterSchema, 
  extendedCharacterSchema,
} from "@/lib/validation/schemas"
import { ParsedCharacterData } from "@/lib/characterImport"
import { CharacterImportCard, CharacterImportPreview, PdfImportCard } from "@/components/characterImport"
import { InventoryCreationManager } from "@/components/InventoryCreationManager"
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
// Select components - keeping import for potential future use
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { AbilityScoreGenerator } from "@/components/AbilityScoreGenerator"
import { ActionManager } from "@/components/ActionManager"
import { Loader2, AlertCircle, CheckCircle, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useQueryWithAuth, useMutationWithAuth } from "@/hooks/useConvexWithAuth"
import { mapEquipmentToForm } from "@/lib/characterImport"
import { useGPTGeneration } from "@/lib/gptGeneration"
import { toast } from "sonner"

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
  actions?: string[]
  characterType?: "player" | "npc"
  createdAt?: number
  creatorId?: string
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
}

interface CharacterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit" | "view"
  character?: Character
  characterType: "player" | "npc"
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
  const actionsQuery = useQueryWithAuth(api.actions.getAllActions) || []
  const createActionWithAuth = useMutationWithAuth(api.actions.createAction)
  const { generate, isGenerating } = useGPTGeneration()
  
  // Import states
  const [importedData, setImportedData] = useState<ParsedCharacterData | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  
  const form = useForm<ExtendedCharacterFormData>({
    resolver: zodResolver(mode === "create" ? extendedCharacterSchema : characterSchema),
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

  // State for selected actions
  const [selectedActionIds, setSelectedActionIds] = React.useState<string[]>(
    (character as any)?.actions || []
  )

  // State for multiclass management
  const [isMulticlass, setIsMulticlass] = useState(false)

  // State for inventory and equipment
  const [inventory, setInventory] = useState({
    capacity: 150, // Default capacity based on 15 × 10 (base strength)
    items: [] as Array<{ itemId: string; quantity: number }>
  })
  
  const [equipment, setEquipment] = useState<{
    headgear?: string
    armwear?: string
    chestwear?: string
    legwear?: string
    footwear?: string
    mainHand?: string
    offHand?: string
    accessories: string[]
  }>({
    headgear: undefined,
    armwear: undefined,
    chestwear: undefined,
    legwear: undefined,
    footwear: undefined,
    mainHand: undefined,
    offHand: undefined,
    accessories: []
  })
  
  const [equipmentBonuses, setEquipmentBonuses] = useState({
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
      
      // Load existing character data for view/edit mode
      if (character.inventory) {
        setInventory(character.inventory)
      }
      
      if (character.equipment) {
        setEquipment(character.equipment)
      }
      
      if (character.equipmentBonuses) {
        setEquipmentBonuses(character.equipmentBonuses)
      }
      
      if (character.actions) {
        setSelectedActionIds(character.actions)
      }
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
      
      // Reset state for create mode
      setInventory({
        capacity: 150,
        items: []
      })
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
      setSelectedActionIds([])
    }
  }, [character, mode, form])

  // Import handlers
  const handleImportSuccess = (characterId: string, characterData: ParsedCharacterData) => {
    setImportedData(characterData)
    setImportError(null)
    
    // If we have a characterId, the character was already saved to the server
    if (characterId) {
      console.log('Character successfully imported to server:', characterId)
      // Could show a success toast or redirect to the character page
      onSuccess?.()
      onOpenChange(false)
      return
    }
    
    // Convert imported data to form format
    const formData: Partial<ExtendedCharacterFormData> = {
      name: characterData.name,
      race: characterData.race,
      subrace: characterData.subrace,
      class: characterData.classes[0]?.name || "Fighter", // Primary class for backward compatibility
      classes: characterData.classes.map(cls => {
        // Validate hit die value
        const validHitDice = ['d6', 'd8', 'd10', 'd12'] as const;
        const hitDie = validHitDice.includes(cls.hitDie as any) ? cls.hitDie as 'd6' | 'd8' | 'd10' | 'd12' : 'd8';
        
        return {
          name: cls.name,
          level: cls.level,
          hitDie,
          features: cls.features,
          subclass: cls.subclass,
        };
      }),
      background: characterData.background,
      alignment: characterData.alignment,
      level: characterData.level,
      abilityScores: characterData.abilityScores,
      baseAbilityScores: characterData.baseAbilityScores,
      racialAbilityScoreImprovements: characterData.racialAbilityScoreImprovements,
      hitPoints: characterData.hitPoints,
      maxHitPoints: characterData.maxHitPoints,
      currentHitPoints: characterData.currentHitPoints,
      tempHitPoints: characterData.tempHitPoints,
      hitDice: characterData.hitDice?.map(hd => {
        // Validate die value
        const validDice = ['d6', 'd8', 'd10', 'd12'] as const;
        const die = validDice.includes(hd.die as any) ? hd.die as 'd6' | 'd8' | 'd10' | 'd12' : 'd8';
        
        return {
          die,
          current: hd.current,
          max: hd.max,
        };
      }),
      armorClass: characterData.armorClass,
      baseArmorClass: characterData.baseArmorClass,
      speed: characterData.speed,
      speeds: characterData.speeds,
      skills: characterData.skills,
      skillProficiencies: characterData.skillProficiencies,
      savingThrows: characterData.savingThrows,
      savingThrowProficiencies: characterData.savingThrowProficiencies,
      proficiencies: characterData.proficiencies,
      weaponProficiencies: characterData.weaponProficiencies,
      armorProficiencies: characterData.armorProficiencies,
      toolProficiencies: characterData.toolProficiencies,
      traits: characterData.traits,
      racialTraits: characterData.racialTraits,
      languages: characterData.languages,
      initiative: characterData.initiative,
      passivePerception: characterData.passivePerception,
      passiveInvestigation: characterData.passiveInvestigation,
      passiveInsight: characterData.passiveInsight,
      spellcastingAbility: (['Intelligence', 'Wisdom', 'Charisma'] as const).includes(characterData.spellcastingAbility as any) 
                           ? characterData.spellcastingAbility as 'Intelligence' | 'Wisdom' | 'Charisma' 
                           : undefined,
      spellSaveDC: characterData.spellSaveDC,
      spellAttackBonus: characterData.spellAttackBonus,
      spellSlots: characterData.spellSlots,
      spellsKnown: characterData.spellsKnown,
      cantripsKnown: characterData.cantripsKnown,
      features: characterData.features,
      feats: characterData.feats,
      inspiration: characterData.inspiration,
      deathSaves: characterData.deathSaves,
      importedFrom: (characterData as any).importedFrom ?? (characterData as any).importSource,
      importData: (characterData as any).importData ?? (characterData as any).originalData,
      
      // Enhanced equipment and actions mapping
      // Do not inject invalid inventory shape into the form; hydrate via local state
      // equipment/inventory are managed via local component state and saved on submit
      
      // Equipment bonuses (default values)
      equipmentBonuses: {
        armorClass: 0,
        abilityScores: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0,
        }
      },
    }

    // Update form with imported data
    form.reset(formData)
    
    // Set multiclass flag if character has multiple classes
    if (characterData.classes.length > 1) {
      setIsMulticlass(true)
    }

    // Hydrate inventory/equipment/currency via converter from parsed data
    try {
      const mapped = mapEquipmentToForm((characterData as any).parsedEquipment || (characterData as any).equipment || {}) as any
      if (mapped?.inventory) setInventory(mapped.inventory)
      if (mapped?.equipment) setEquipment(mapped.equipment as any)
    } catch {}

    // Set equipment data if available from import
    if (characterData.equipment) {
      setEquipment({
        headgear: characterData.equipment.headgear,
        armwear: characterData.equipment.armwear,
        chestwear: characterData.equipment.chestwear,
        legwear: characterData.equipment.legwear,
        footwear: characterData.equipment.footwear,
        mainHand: characterData.equipment.mainHand,
        offHand: characterData.equipment.offHand,
        accessories: characterData.equipment.accessories || []
      })
    }
    
    // Resolve actions by name to IDs; create if missing, then set selectedActionIds
    ;(async () => {
      const importedNames: string[] = (characterData as any).actions || (characterData as any).parsedActions?.allNames || []
      if (!importedNames || importedNames.length === 0) return
      const existing = Array.isArray(actionsQuery) ? actionsQuery : []
      const resolved: string[] = []
      for (const name of importedNames) {
        const found = existing.find((a: any) => a.name?.toLowerCase() === String(name).toLowerCase())
        if (found?._id) {
          resolved.push(found._id)
          continue
        }
        try {
          const createdId = await createActionWithAuth({
            name: String(name),
            description: `Imported action: ${name}`,
            actionCost: 'Action',
            type: 'OTHER',
            requiresConcentration: false,
            sourceBook: 'Imported',
          } as any)
          if (createdId) resolved.push(createdId as unknown as string)
        } catch {}
      }
      if (resolved.length > 0) setSelectedActionIds(resolved)
    })()

    // Automatically switch to basic info tab after successful import
    // Use a small timeout to ensure the form has been reset
    setTimeout(() => {
      const basicTab = document.querySelector('[value="basic"]') as HTMLButtonElement
      if (basicTab) {
        basicTab.click()
      }
    }, 100)
  }

  const handleImportError = (error: string) => {
    setImportError(error)
    setImportedData(null)
  }

  const onSubmit = async (data: ExtendedCharacterFormData) => {
    try {
      // Clean the data and add inventory/equipment information
      const cleanData = {
        ...data,
        // Add inventory and equipment data
        inventory: {
          capacity: inventory.capacity,
          items: inventory.items
        },
        equipment: equipment,
        equipmentBonuses: equipmentBonuses,
        // Calculate final ability scores including equipment bonuses
        abilityScores: {
          strength: data.abilityScores.strength + equipmentBonuses.abilityScores.strength,
          dexterity: data.abilityScores.dexterity + equipmentBonuses.abilityScores.dexterity,
          constitution: data.abilityScores.constitution + equipmentBonuses.abilityScores.constitution,
          intelligence: data.abilityScores.intelligence + equipmentBonuses.abilityScores.intelligence,
          wisdom: data.abilityScores.wisdom + equipmentBonuses.abilityScores.wisdom,
          charisma: data.abilityScores.charisma + equipmentBonuses.abilityScores.charisma,
        },
        // Calculate final armor class including equipment bonuses
        armorClass: data.armorClass + equipmentBonuses.armorClass,
        // Add actions if selected
        actions: selectedActionIds,
      }

      if (mode === "create") {
        if (characterType === "player") {
          await createPlayerCharacter(cleanData)
        } else {
          await createNPC(cleanData)
        }
      }
      // TODO: Add edit functionality when mutation is available
      
      onSuccess?.()
      onOpenChange(false)
      form.reset()
      setSelectedActionIds([])
      setImportedData(null)
      setImportError(null)
      setIsMulticlass(false)
      // Reset inventory and equipment state
      setInventory({
        capacity: 150,
        items: []
      })
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
    } catch (error) {
      console.error("Failed to save character:", error)
      // TODO: Show toast notification for error
    }
  }

  const getTitle = () => {
    const prefix = characterType === "player" ? "Character" : "NPC"
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
    const entityType = characterType === "player" ? "player character" : "NPC"
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

  // Handle GPT generation
  const handleGenerateWithGPT = async () => {
    try {
      toast.info("Generating character with GPT...", { duration: 2000 })
      const result = await generate("character")
      
      if (result.success && result.data) {
        // Populate form with generated data
        form.reset({
          name: result.data.name || "",
          race: result.data.race || "",
          class: result.data.class || "",
          background: result.data.background || "",
          alignment: result.data.alignment || "",
          level: result.data.level || 1,
          abilityScores: result.data.abilityScores || {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
          },
          hitPoints: result.data.hitPoints || 1,
          armorClass: result.data.armorClass || 10,
          speed: result.data.speed || "30 ft.",
          proficiencyBonus: result.data.proficiencyBonus || 2,
          skills: result.data.skills || [],
          savingThrows: result.data.savingThrows || [],
          proficiencies: result.data.proficiencies || [],
          languages: result.data.languages || [],
          traits: result.data.traits || [],
        })
        
        toast.success("Character generated successfully! Review and adjust as needed.", {
          duration: 3000,
        })
      } else {
        toast.error(result.error || "Failed to generate character")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate character")
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
            {mode === "create" && !importedData && (
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
            <Tabs defaultValue={mode === "create" && !importedData ? "import" : "basic"} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                {mode === "create" && (
                  <TabsTrigger value="import">Import</TabsTrigger>
                )}
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="stats">Stats & Scores</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              {/* Import Tab */}
              {mode === "create" && (
                <TabsContent value="import" className="space-y-6">
                  {importedData ? (
                    /* Show import success and preview */
                    <div className="space-y-6">
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Import Successful!</strong> Character data has been imported and populated into the form tabs. 
                          You can now review and edit the information in the other tabs before saving.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <h4 className="font-medium">Quick Summary</h4>
                          <div className="p-4 border rounded-lg bg-background">
                            <div className="space-y-2 text-sm">
                              <div><strong>Name:</strong> {importedData.name}</div>
                              <div><strong>Race:</strong> {importedData.race}</div>
                              <div><strong>Classes:</strong> {importedData.classes.map(c => `${c.name} ${c.level}`).join(', ')}</div>
                              <div><strong>Total Level:</strong> {importedData.level}</div>
                              <div><strong>Background:</strong> {importedData.background}</div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setImportedData(null)
                              setImportError(null)
                            }}
                          >
                            Import Different Character
                          </Button>
                        </div>
                        
                        <CharacterImportPreview
                          characterData={importedData}
                          className="h-fit"
                          showConfidenceFlags={true}
                          onCharacterDataChange={(updatedData) => {
                            setImportedData(updatedData)
                            // Also update the form with the new data
                            handleImportSuccess('', updatedData)
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Show import interface */
                    <div className="space-y-6">
                      <Tabs defaultValue="json" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="json">JSON Import</TabsTrigger>
                          <TabsTrigger value="pdf">PDF Import</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="json" className="space-y-4">
                          <CharacterImportCard
                            onImportSuccess={handleImportSuccess}
                            onImportError={handleImportError}
                            disabled={isSubmitting}
                          />
                        </TabsContent>
                        
                        <TabsContent value="pdf" className="space-y-4">
                          <PdfImportCard
                            onImportSuccess={handleImportSuccess}
                            onImportError={handleImportError}
                            disabled={isSubmitting}
                          />
                        </TabsContent>
                      </Tabs>
                      
                      {importError && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            {importError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="basic" className="space-y-6">
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
                </div>
              </TabsContent>

              <TabsContent value="classes" className="space-y-6">
                <div className="grid gap-6">
                  {/* Multiclass Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Class Configuration</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure single class or multiclass character
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="multiclass-toggle"
                        checked={isMulticlass}
                        onChange={(e) => setIsMulticlass(e.target.checked)}
                        disabled={isReadOnly}
                      />
                      <label htmlFor="multiclass-toggle" className="text-sm">
                        Multiclass Character
                      </label>
                    </div>
                  </div>

                  {!isMulticlass ? (
                    /* Single Class */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          name="subrace"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subclass</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Champion, Evocation, Thief..."
                                  {...field}
                                  disabled={isReadOnly}
                                />
                              </FormControl>
                              <FormDescription>
                                Subclass or archetype (optional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Multiclass */
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Configure each class and its level. The total levels will be calculated automatically.
                      </div>
                      
                      {/* Display imported multiclass data */}
                      {importedData && importedData.classes.length > 1 ? (
                        <div className="space-y-3">
                          <h5 className="font-medium">Imported Classes:</h5>
                          {importedData.classes.map((cls, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Class</label>
                                  <div className="text-lg">{cls.name}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Level</label>
                                  <div className="text-lg">{cls.level}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Hit Die</label>
                                  <div className="text-lg">{cls.hitDie}</div>
                                </div>
                              </div>
                              {cls.subclass && (
                                <div className="mt-2">
                                  <label className="text-sm font-medium">Subclass</label>
                                  <div>{cls.subclass}</div>
                                </div>
                              )}
                              {cls.features && cls.features.length > 0 && (
                                <div className="mt-2">
                                  <label className="text-sm font-medium">Features</label>
                                  <div className="text-sm text-muted-foreground">
                                    {cls.features.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-sm text-blue-800">
                              <strong>Total Character Level:</strong> {importedData.classes.reduce((sum, cls) => sum + cls.level, 0)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Multiclass configuration UI for manual entry */
                        <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                          <p>Multiclass configuration UI</p>
                          <p className="text-xs">
                            This feature will allow adding/removing classes and setting individual levels
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Display total level if multiclass */}
                  {isMulticlass && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium">
                        Total Character Level: {form.watch("level") || 1}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                <div className="grid gap-6">
              {/* Ability Scores */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Ability Scores</h4>
                
                {/* Ability Score Generator */}
                <AbilityScoreGenerator
                  initialValues={form.watch("abilityScores") ?? {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10,
                  }}
                  onChange={(scores) => {
                    form.setValue("abilityScores", scores);
                  }}
                  disabled={isReadOnly}
                />
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
              </TabsContent>

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

              <TabsContent value="actions" className="space-y-6">
                <ActionManager
                  mode="character"
                  selectedActionIds={selectedActionIds}
                  onActionIdsChange={setSelectedActionIds}
                  disabled={isReadOnly}
                />
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
                  {mode === "create" ? `Create ${characterType === "player" ? "Character" : "NPC"}` : "Save Changes"}
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