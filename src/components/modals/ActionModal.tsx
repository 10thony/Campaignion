import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { ActionFormData, actionSchema } from "@/lib/validation/schemas"
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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Sparkles, Sword, Zap, Shield, BookOpen } from "lucide-react"
import { useGPTGeneration } from "@/lib/gptGeneration"
import { toast } from "sonner"

interface Action {
  _id: string
  name: string
  description: string
  actionCost: "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special"
  type: string
  requiresConcentration: boolean
  sourceBook: string
  category: "general" | "class_specific" | "race_specific" | "feat_specific"
  attackBonusAbilityScore?: string
  isProficient?: boolean
  damageRolls?: Array<{
    dice: { count: number; type: string }
    modifier: number
    damageType: string
  }>
  spellLevel?: number
  castingTime?: string
  range?: string
  components?: {
    verbal: boolean
    somatic: boolean
    material?: string
  }
  duration?: string
  savingThrow?: {
    ability: string
    onSave: string
  }
  spellEffectDescription?: string
  requiredClass?: string
  requiredLevel?: number
  requiredSubclass?: string
  usesPer?: "Short Rest" | "Long Rest" | "Day" | "Special"
  maxUses?: number | string
  isBaseAction?: boolean
  tags?: string[]
  prerequisites?: string[]
  createdAt?: number
}

interface ActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit" | "view"
  action?: Action
  onSuccess?: () => void
}

const ACTION_COSTS = ["Action", "Bonus Action", "Reaction", "No Action", "Special"] as const
const ACTION_TYPES = [
  "MELEE_ATTACK",
  "RANGED_ATTACK",
  "SPELL",
  "COMMONLY_AVAILABLE_UTILITY",
  "CLASS_FEATURE",
  "BONUS_ACTION",
  "REACTION",
  "OTHER"
] as const
const ACTION_CATEGORIES = ["general", "class_specific", "race_specific", "feat_specific"] as const
const DAMAGE_TYPES = [
  "BLUDGEONING", "PIERCING", "SLASHING", "ACID", "COLD", "FIRE",
  "FORCE", "LIGHTNING", "NECROTIC", "POISON", "PSYCHIC", "RADIANT", "THUNDER"
] as const
const DICE_TYPES = ["D4", "D6", "D8", "D10", "D12", "D20"] as const

export function ActionModal({
  open,
  onOpenChange,
  mode,
  action,
  onSuccess,
}: ActionModalProps) {
  const createAction = useMutation(api.actions.createAction)
  const { generate, isGenerating } = useGPTGeneration()

  const form = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      name: action?.name || "",
      description: action?.description || "",
      actionCost: action?.actionCost || "Action",
      type: action?.type as any || "OTHER",
      requiresConcentration: action?.requiresConcentration || false,
      sourceBook: action?.sourceBook || "Homebrew",
      category: action?.category || "general",
      attackBonusAbilityScore: action?.attackBonusAbilityScore || "",
      isProficient: action?.isProficient || false,
      damageRolls: action?.damageRolls || [],
      spellLevel: action?.spellLevel,
      castingTime: action?.castingTime || "",
      range: action?.range || "",
      components: action?.components || {
        verbal: false,
        somatic: false,
        material: "",
      },
      duration: action?.duration || "",
      savingThrow: action?.savingThrow,
      spellEffectDescription: action?.spellEffectDescription || "",
      requiredClass: action?.requiredClass || "",
      requiredLevel: action?.requiredLevel,
      requiredSubclass: action?.requiredSubclass || "",
      usesPer: action?.usesPer,
      maxUses: action?.maxUses,
      isBaseAction: action?.isBaseAction || false,
      tags: action?.tags || [],
      prerequisites: action?.prerequisites || [],
    },
  })

  React.useEffect(() => {
    if (action && (mode === "edit" || mode === "view")) {
      form.reset({
        name: action.name,
        description: action.description,
        actionCost: action.actionCost,
        type: action.type as any,
        requiresConcentration: action.requiresConcentration,
        sourceBook: action.sourceBook,
        category: action.category,
        attackBonusAbilityScore: action.attackBonusAbilityScore || "",
        isProficient: action.isProficient || false,
        damageRolls: action.damageRolls || [],
        spellLevel: action.spellLevel,
        castingTime: action.castingTime || "",
        range: action.range || "",
        components: action.components || {
          verbal: false,
          somatic: false,
          material: "",
        },
        duration: action.duration || "",
        savingThrow: action.savingThrow,
        spellEffectDescription: action.spellEffectDescription || "",
        requiredClass: action.requiredClass || "",
        requiredLevel: action.requiredLevel,
        requiredSubclass: action.requiredSubclass || "",
        usesPer: action.usesPer,
        maxUses: action.maxUses,
        isBaseAction: action.isBaseAction || false,
        tags: action.tags || [],
        prerequisites: action.prerequisites || [],
      })
    } else if (mode === "create") {
      form.reset({
        name: "",
        description: "",
        actionCost: "Action",
        type: "OTHER",
        requiresConcentration: false,
        sourceBook: "Homebrew",
        category: "general",
        attackBonusAbilityScore: "",
        isProficient: false,
        damageRolls: [],
        spellLevel: undefined,
        castingTime: "",
        range: "",
        components: {
          verbal: false,
          somatic: false,
          material: "",
        },
        duration: "",
        savingThrow: undefined,
        spellEffectDescription: "",
        requiredClass: "",
        requiredLevel: undefined,
        requiredSubclass: "",
        usesPer: undefined,
        maxUses: undefined,
        isBaseAction: false,
        tags: [],
        prerequisites: [],
      })
    }
  }, [action, mode, form])

  const onSubmit = async (data: ActionFormData) => {
    try {
      await createAction({
        ...data,
        // Clean up optional fields
        attackBonusAbilityScore: data.attackBonusAbilityScore || undefined,
        castingTime: data.castingTime || undefined,
        range: data.range || undefined,
        duration: data.duration || undefined,
        spellEffectDescription: data.spellEffectDescription || undefined,
        requiredClass: data.requiredClass || undefined,
        requiredSubclass: data.requiredSubclass || undefined,
        components: data.components && (data.components.verbal || data.components.somatic || data.components.material)
          ? {
              verbal: data.components.verbal,
              somatic: data.components.somatic,
              material: data.components.material || undefined,
            }
          : undefined,
      })

      toast.success(mode === "create" ? "Action created successfully!" : "Action updated successfully!")
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save action")
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Create New Action"
      case "edit":
        return "Edit Action"
      case "view":
        return action?.name || "View Action"
      default:
        return "Action"
    }
  }

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Add a new action, spell, or ability to your library"
      case "edit":
        return "Modify the action details"
      case "view":
        return "View action information"
      default:
        return ""
    }
  }

  // Handle GPT generation
  const handleGenerateWithGPT = async () => {
    try {
      toast.info("Generating action with GPT...", { duration: 2000 })
      const result = await generate("action")
      
      if (result.success && result.data) {
        // Populate form with generated data
        form.reset({
          name: result.data.name || "",
          description: result.data.description || "",
          actionCost: result.data.actionCost || "Action",
          type: result.data.type || "OTHER",
          requiresConcentration: result.data.requiresConcentration || false,
          sourceBook: result.data.sourceBook || "Homebrew",
          category: result.data.category || "general",
          attackBonusAbilityScore: result.data.attackBonusAbilityScore || "",
          isProficient: result.data.isProficient || false,
          damageRolls: result.data.damageRolls || [],
          spellLevel: result.data.spellLevel,
          castingTime: result.data.castingTime || "",
          range: result.data.range || "",
          components: result.data.components || {
            verbal: false,
            somatic: false,
            material: "",
          },
          duration: result.data.duration || "",
          savingThrow: result.data.savingThrow,
          spellEffectDescription: result.data.spellEffectDescription || "",
          requiredClass: result.data.requiredClass || "",
          requiredLevel: result.data.requiredLevel,
          requiredSubclass: result.data.requiredSubclass || "",
          usesPer: result.data.usesPer,
          maxUses: result.data.maxUses,
          isBaseAction: result.data.isBaseAction || false,
          tags: result.data.tags || [],
          prerequisites: result.data.prerequisites || [],
        })
        
        toast.success("Action generated successfully! Review and adjust as needed.", {
          duration: 3000,
        })
      } else {
        toast.error(result.error || "Failed to generate action")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate action")
    }
  }

  const isReadOnly = mode === "view"
  const isSubmitting = form.formState.isSubmitting
  const actionType = form.watch("type")

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
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">
                  <Sword className="h-4 w-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="mechanics">
                  <Zap className="h-4 w-4 mr-2" />
                  Mechanics
                </TabsTrigger>
                <TabsTrigger value="requirements">
                  <Shield className="h-4 w-4 mr-2" />
                  Requirements
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Name*</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isReadOnly} placeholder="e.g., Fireball, Sword Strike, Hide" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description*</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={isReadOnly}
                            rows={4}
                            placeholder="Describe what this action does, including mechanics and effects..."
                          />
                        </FormControl>
                        <FormDescription>
                          Include mechanical details, effects, and how the action works
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="actionCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action Cost*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select action cost" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ACTION_COSTS.map((cost) => (
                                <SelectItem key={cost} value={cost}>
                                  {cost}
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
                          <FormLabel>Action Type*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ACTION_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sourceBook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Book*</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isReadOnly} placeholder="e.g., PHB, Homebrew" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ACTION_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="requiresConcentration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Requires Concentration</FormLabel>
                            <FormDescription>
                              Check if this action requires concentration (typically for spells)
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Mechanics Tab */}
              <TabsContent value="mechanics" className="space-y-4">
                <div className="grid gap-4">
                  {(actionType === "SPELL" || actionType === "CLASS_FEATURE") && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="spellLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spell Level</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                                disabled={isReadOnly}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                                    <SelectItem key={level} value={level.toString()}>
                                      {level === 0 ? "Cantrip" : `Level ${level}`}
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
                          name="castingTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Casting Time</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={isReadOnly} placeholder="1 action" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="range"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Range</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={isReadOnly} placeholder="60 feet" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isReadOnly} placeholder="Instantaneous" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <FormLabel>Components</FormLabel>
                        <div className="flex items-center space-x-4">
                          <FormField
                            control={form.control}
                            name="components.verbal"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isReadOnly}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Verbal</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="components.somatic"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isReadOnly}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Somatic</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="components.material"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isReadOnly}
                                  placeholder="Material components (if any)"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="spellEffectDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spell Effect Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                disabled={isReadOnly}
                                rows={3}
                                placeholder="Describe the magical effects..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="usesPer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uses Per</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Short Rest">Short Rest</SelectItem>
                              <SelectItem value="Long Rest">Long Rest</SelectItem>
                              <SelectItem value="Day">Per Day</SelectItem>
                              <SelectItem value="Special">Special</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxUses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Uses</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isReadOnly}
                              placeholder="e.g., 3"
                              value={field.value?.toString() || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                field.onChange(value === "" ? undefined : isNaN(Number(value)) ? value : Number(value))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="requiredClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Class</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isReadOnly} placeholder="e.g., Wizard, Fighter" />
                          </FormControl>
                          <FormDescription>Leave empty for general actions</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requiredLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Level</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              disabled={isReadOnly}
                              placeholder="1-20"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="requiredSubclass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Subclass</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isReadOnly} placeholder="e.g., Evocation, Champion" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="isBaseAction"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isReadOnly}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Core D&D Action</FormLabel>
                            <FormDescription>
                              Check if this is a base D&D action (Attack, Dodge, Hide, etc.)
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
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
                  {mode === "create" ? "Create Action" : "Save Changes"}
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

