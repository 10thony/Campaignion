import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Checkbox } from "../ui/checkbox"
import { Slider } from "../ui/slider"
import { 
  Loader2, 
  Crown, 
  Users, 
  UserPlus, 
  StickyNote, 
  Star,
  BookOpen,
  Scroll,
  Shield,
  Coins,
  Church,
  Building,
  Sword,
  GraduationCap,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"

import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { factionSchema, FactionFormData } from "../../lib/validation/schemas"
import { useAuthenticationGuard, useModalAccess } from "../../hooks/useAuthenticationGuard"

// Faction Types with appropriate D&D icons
const FACTION_TYPE_OPTIONS = [
  { value: "Government", label: "Government", icon: Crown, description: "Ruling bodies and official organizations" },
  { value: "Religious", label: "Religious", icon: Church, description: "Churches, temples, and spiritual orders" },
  { value: "Mercantile", label: "Mercantile", icon: Coins, description: "Trade guilds and commercial enterprises" },
  { value: "Criminal", label: "Criminal", icon: Shield, description: "Thieves' guilds and underground organizations" },
  { value: "Military", label: "Military", icon: Sword, description: "Armed forces and warrior orders" },
  { value: "Scholarly", label: "Scholarly", icon: GraduationCap, description: "Academies, libraries, and research institutions" },
  { value: "Other", label: "Other", icon: BookOpen, description: "Custom faction type" },
] as const

const INFLUENCE_OPTIONS = [
  { value: "Local", label: "Local", description: "Limited to a single settlement or area" },
  { value: "Regional", label: "Regional", description: "Spans multiple settlements or a region" },
  { value: "National", label: "National", description: "Country-wide influence and reach" },
  { value: "International", label: "International", description: "Multi-national or planar influence" },
] as const

const RESOURCES_OPTIONS = [
  { value: "Poor", label: "Poor", description: "Limited resources and struggling financially" },
  { value: "Modest", label: "Modest", description: "Basic resources to meet essential needs" },
  { value: "Wealthy", label: "Wealthy", description: "Substantial resources and comfortable funding" },
  { value: "Rich", label: "Rich", description: "Extensive resources with significant wealth" },
  { value: "Aristocratic", label: "Aristocratic", description: "Vast wealth rivaling nobility" },
] as const

interface Faction {
  _id: Id<"factions">
  name: string
  description: string
  campaignId: Id<"campaigns">
  goals?: string[]
  leaderNpcIds?: Id<"characters">[]
  alliedFactionIds?: Id<"factions">[]
  enemyFactionIds?: Id<"factions">[]
  reputation?: Array<{
    playerCharacterId: string
    score: number
  }>
  factionType?: "Government" | "Religious" | "Mercantile" | "Criminal" | "Military" | "Scholarly" | "Other"
  influence?: "Local" | "Regional" | "National" | "International"
  resources?: "Poor" | "Modest" | "Wealthy" | "Rich" | "Aristocratic"
  publicInformation?: string
  factionSecrets?: string
  dmNotes?: string
  createdAt?: number
  updatedAt?: number
}

interface FactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "read" | "create" | "edit"
  faction?: Faction
  onSuccess?: () => void
  defaultTab?: string
}

export function FactionModal({
  open,
  onOpenChange,
  mode,
  faction,
  onSuccess,
  defaultTab = "basic",
}: FactionModalProps) {
  // CRITICAL: Authentication guard - ALL modals must include this
  const { user } = useAuthenticationGuard()
  
  // Authorization check with campaign-specific permissions
  const { canAccess, isCampaignMaster, isAdmin } = useModalAccess(
    mode,
    "faction",
    faction
  )
  
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Convex queries and mutations
  const campaigns = useQuery(api.campaigns.getMyCampaigns)
  const characters = useQuery(api.characters.getCharacters)
  const factions = useQuery(api.factions.getFactions, {})
  
  const createFaction = useMutation(api.factions.createFaction)
  const updateFaction = useMutation(api.factions.updateFaction)
  
  // State-specific behavior
  const isReadOnly = mode === "read"
  const isCreating = mode === "create"
  const isEditing = mode === "edit"
  
  const form = useForm<FactionFormData>({
    resolver: zodResolver(factionSchema),
    defaultValues: {
      name: faction?.name || "",
      description: faction?.description || "",
      campaignId: faction?.campaignId || "",
      goals: faction?.goals || [],
      leaderNpcIds: faction?.leaderNpcIds || [],
      alliedFactionIds: faction?.alliedFactionIds || [],
      enemyFactionIds: faction?.enemyFactionIds || [],
      reputation: faction?.reputation || [],
      factionType: faction?.factionType || "Other",
      influence: faction?.influence || "Local",
      resources: faction?.resources || "Modest",
      publicInformation: faction?.publicInformation || "",
      factionSecrets: faction?.factionSecrets || "",
      dmNotes: faction?.dmNotes || "",
    },
  })

  React.useEffect(() => {
    if (faction && (mode === "edit" || mode === "read")) {
      form.reset({
        name: faction.name,
        description: faction.description,
        campaignId: faction.campaignId,
        goals: faction.goals || [],
        leaderNpcIds: faction.leaderNpcIds || [],
        alliedFactionIds: faction.alliedFactionIds || [],
        enemyFactionIds: faction.enemyFactionIds || [],
        reputation: faction.reputation || [],
        factionType: faction.factionType || "Other",
        influence: faction.influence || "Local",
        resources: faction.resources || "Modest",
        publicInformation: faction.publicInformation || "",
        factionSecrets: faction.factionSecrets || "",
        dmNotes: faction.dmNotes || "",
      })
    }
  }, [faction, mode, form])

  const onSubmit = async (data: FactionFormData) => {
    setIsSubmitting(true)
    
    try {
      if (isCreating) {
        await createFaction(data)
        toast.success("Faction created successfully!")
      } else if (isEditing && faction) {
        await updateFaction({ 
          id: faction._id, 
          ...data 
        })
        toast.success("Faction updated successfully!")
      }
      
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save faction:", error)
      toast.error(`Failed to ${isCreating ? "create" : "update"} faction. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getModalTitle = () => {
    switch (mode) {
      case "create": return "Create Faction"
      case "edit": return "Edit Faction"
      case "read": return "Faction Details"
      default: return "Faction"
    }
  }

  const getReputationColor = (score: number) => {
    if (score >= 75) return "text-green-600"
    if (score >= 25) return "text-blue-600"
    if (score >= -25) return "text-yellow-600"
    if (score >= -75) return "text-orange-600"
    return "text-red-600"
  }

  const getReputationLabel = (score: number) => {
    if (score >= 75) return "Revered"
    if (score >= 25) return "Friendly"
    if (score >= -25) return "Neutral"
    if (score >= -75) return "Unfriendly"
    return "Hostile"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            {mode === "read" && "View faction details, relationships, and reputation"}
            {mode === "create" && "Create a new faction for your campaign"}
            {mode === "edit" && "Modify faction details and relationships"}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="leadership" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Leadership
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="reputation" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Reputation
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>
          
          <div className="overflow-y-auto flex-1 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6 m-0">
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Faction Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={isReadOnly}
                              placeholder="Enter faction name..." 
                            />
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
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              disabled={isReadOnly}
                              placeholder="Describe the faction's purpose, history, and general information..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="campaignId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select campaign" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {campaigns?.map((campaign) => (
                                <SelectItem key={campaign._id} value={campaign._id}>
                                  {campaign.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="factionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Faction Type</FormLabel>
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
                                {FACTION_TYPE_OPTIONS.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      <type.icon className="h-4 w-4" />
                                      {type.label}
                                    </div>
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
                        name="influence"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Influence</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select influence" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {INFLUENCE_OPTIONS.map((influence) => (
                                  <SelectItem key={influence.value} value={influence.value}>
                                    {influence.label}
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
                        name="resources"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resources</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select resources" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {RESOURCES_OPTIONS.map((resource) => (
                                  <SelectItem key={resource.value} value={resource.value}>
                                    {resource.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <Label>Faction Goals</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Add the faction's objectives and motivations
                      </p>
                      
                      {!isReadOnly && (
                        <div className="space-y-2">
                          {(form.watch("goals") || []).map((goal, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={goal}
                                onChange={(e) => {
                                  const goals = form.getValues("goals") || []
                                  goals[index] = e.target.value
                                  form.setValue("goals", goals)
                                }}
                                placeholder="Faction goal or objective..."
                                className="flex-1"
                                disabled={isReadOnly}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const goals = form.getValues("goals") || []
                                  goals.splice(index, 1)
                                  form.setValue("goals", goals)
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const goals = form.getValues("goals") || []
                              goals.push("")
                              form.setValue("goals", goals)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Goal
                          </Button>
                        </div>
                      )}
                      
                      {isReadOnly && (
                        <div className="space-y-2">
                          {(faction?.goals || []).map((goal, index) => (
                            <div key={index} className="p-3 bg-muted rounded text-sm">
                              {goal}
                            </div>
                          ))}
                          {(!faction?.goals || faction.goals.length === 0) && (
                            <p className="text-sm text-muted-foreground italic">No goals defined</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Leadership Tab */}
                <TabsContent value="leadership" className="space-y-6 m-0">
                  <FormField
                    control={form.control}
                    name="leaderNpcIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faction Leaders</FormLabel>
                        <FormDescription>
                          Select NPCs who lead or hold important positions in this faction
                        </FormDescription>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                          {characters?.filter(char => char.characterType === "npc").map((character) => (
                            <div key={character._id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(character._id) || false}
                                onCheckedChange={(checked) => {
                                  if (isReadOnly) return
                                  const current = field.value || []
                                  if (checked) {
                                    field.onChange([...current, character._id])
                                  } else {
                                    field.onChange(current.filter(id => id !== character._id))
                                  }
                                }}
                                disabled={isReadOnly}
                              />
                              <Label className="text-sm font-normal">
                                {character.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Relationships Tab */}
                <TabsContent value="relationships" className="space-y-6 m-0">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="alliedFactionIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allied Factions</FormLabel>
                          <FormDescription>
                            Factions that are friendly or allied with this faction
                          </FormDescription>
                          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                            {factions?.filter(f => f._id !== faction?._id).map((otherFaction) => (
                              <div key={otherFaction._id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(otherFaction._id) || false}
                                  onCheckedChange={(checked) => {
                                    if (isReadOnly) return
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, otherFaction._id])
                                    } else {
                                      field.onChange(current.filter(id => id !== otherFaction._id))
                                    }
                                  }}
                                  disabled={isReadOnly}
                                />
                                <Label className="text-sm font-normal">
                                  {otherFaction.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="enemyFactionIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enemy Factions</FormLabel>
                          <FormDescription>
                            Factions that are hostile or in conflict with this faction
                          </FormDescription>
                          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                            {factions?.filter(f => f._id !== faction?._id).map((otherFaction) => (
                              <div key={otherFaction._id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(otherFaction._id) || false}
                                  onCheckedChange={(checked) => {
                                    if (isReadOnly) return
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, otherFaction._id])
                                    } else {
                                      field.onChange(current.filter(id => id !== otherFaction._id))
                                    }
                                  }}
                                  disabled={isReadOnly}
                                />
                                <Label className="text-sm font-normal">
                                  {otherFaction.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Reputation Tab */}
                <TabsContent value="reputation" className="space-y-6 m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Player Character Reputation</CardTitle>
                      <CardDescription>
                        Track how this faction views each player character (-100 to +100)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {characters?.filter(char => char.characterType === "player").length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No player characters available for reputation tracking
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {characters?.filter(char => char.characterType === "player").map((character) => {
                            const reputationEntry = form.watch("reputation")?.find(
                              r => r.playerCharacterId === character._id
                            )
                            const score = reputationEntry?.score || 0
                            
                            return (
                              <div key={character._id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="font-medium">{character.name}</Label>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${getReputationColor(score)}`}>
                                      {score > 0 ? '+' : ''}{score}
                                    </span>
                                    <Badge variant="outline" className={getReputationColor(score)}>
                                      {getReputationLabel(score)}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {!isReadOnly && (
                                  <div className="px-3">
                                    <Slider
                                      value={[score]}
                                      onValueChange={(values) => {
                                        const newScore = values[0]
                                        const currentReputation = form.getValues("reputation") || []
                                        const existingIndex = currentReputation.findIndex(
                                          r => r.playerCharacterId === character._id
                                        )
                                        
                                        let newReputation
                                        if (existingIndex >= 0) {
                                          newReputation = [...currentReputation]
                                          newReputation[existingIndex].score = newScore
                                        } else {
                                          newReputation = [...currentReputation, {
                                            playerCharacterId: character._id,
                                            score: newScore
                                          }]
                                        }
                                        
                                        form.setValue("reputation", newReputation)
                                      }}
                                      min={-100}
                                      max={100}
                                      step={5}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                      <span>Hostile (-100)</span>
                                      <span>Neutral (0)</span>
                                      <span>Revered (+100)</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-6 m-0">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="publicInformation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Public Information</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              disabled={isReadOnly}
                              placeholder="Information that is commonly known about this faction..."
                              rows={4}
                            />
                          </FormControl>
                          <FormDescription>
                            This information is visible to all players
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="factionSecrets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Faction Secrets</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              disabled={isReadOnly}
                              placeholder="Hidden information and secrets about this faction..."
                              rows={4}
                              className="font-mono text-sm"
                            />
                          </FormControl>
                          <FormDescription>
                            Secret information only visible to DMs and administrators
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dmNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DM Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              disabled={isReadOnly}
                              placeholder="Private notes for the Dungeon Master..."
                              rows={4}
                              className="font-mono text-sm"
                            />
                          </FormControl>
                          <FormDescription>
                            These notes are only visible to DMs and administrators
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </form>
            </Form>
          </div>
        </Tabs>
        
        {/* State-specific footer actions */}
        <DialogFooter>
          {mode === "read" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
          {(mode === "create" || mode === "edit") && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Faction" : "Save Changes"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}