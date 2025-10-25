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
import { 
  Loader2, 
  MapPin, 
  Users, 
  Trophy, 
  StickyNote, 
  ListTodo, 
  Clock, 
  Star,
  Calendar,
  Link,
  Award,
  BookOpen,
  Scroll,
  Target,
  CheckCircle,
  AlertCircle,
  Crown,
  Plus,
  X,
  Sparkles
} from "lucide-react"

import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { questSchema, QuestFormData } from "../../lib/validation/schemas"
import { useAuthenticationGuard, useModalAccess } from "../../hooks/useAuthenticationGuard"
import { QuestTaskManager } from "../quests/QuestTaskManager"
import { useGPTGeneration } from "@/lib/gptGeneration"

// Quest status options for D&D campaigns
const QUEST_STATUS_OPTIONS = [
  { value: "idle", label: "Not Started", description: "Quest has not been initiated", icon: Clock },
  { value: "in_progress", label: "In Progress", description: "Quest is currently active", icon: Target },
  { value: "completed", label: "Completed", description: "Quest has been successfully completed", icon: CheckCircle },
  { value: "NotStarted", label: "Pending", description: "Quest awaiting activation", icon: Clock },
  { value: "InProgress", label: "Active", description: "Quest is actively being pursued", icon: Target },
  { value: "Failed", label: "Failed", description: "Quest has failed or been abandoned", icon: AlertCircle },
] as const

const QUEST_TYPE_OPTIONS = [
  { value: "Main", label: "Main Quest", description: "Critical story quest", icon: Crown },
  { value: "Side", label: "Side Quest", description: "Optional additional content", icon: Star },
  { value: "Personal", label: "Personal Quest", description: "Character backstory related", icon: Users },
  { value: "Guild", label: "Guild Quest", description: "Organization-specific mission", icon: BookOpen },
  { value: "Faction", label: "Faction Quest", description: "Faction-related objective", icon: Scroll },
] as const

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy", description: "Low challenge, suitable for new players", icon: Star },
  { value: "Medium", label: "Medium", description: "Moderate challenge", icon: Star },
  { value: "Hard", label: "Hard", description: "High challenge, experienced players", icon: Star },
  { value: "Deadly", label: "Deadly", description: "Extreme challenge, risk of character death", icon: AlertCircle },
] as const

interface Quest {
  _id: Id<"quests">
  name: string
  description?: string
  campaignId?: Id<"campaigns">
  status: "idle" | "in_progress" | "completed" | "NotStarted" | "InProgress" | "Failed"
  questType?: "Main" | "Side" | "Personal" | "Guild" | "Faction"
  difficulty?: "Easy" | "Medium" | "Hard" | "Deadly"
  estimatedSessions?: number
  timelineEventId?: Id<"timelineEvents">
  completionXP?: number
  rewards?: {
    xp?: number
    gold?: number
    itemIds?: Id<"items">[]
  }
  involvedCharacterIds?: Id<"characters">[]
  requiredLevel?: number
  dmNotes?: string
  playerNotes?: string[]
  isRepeatable?: boolean
  prerequisiteQuestIds?: Id<"quests">[]
  locationId?: Id<"locations">
  taskIds?: Id<"questTasks">[]
  createdAt?: number
  updatedAt?: number
}

interface QuestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "read" | "create" | "edit"
  quest?: Quest
  onSuccess?: () => void
  defaultTab?: string
}

export function QuestModal({
  open,
  onOpenChange,
  mode,
  quest,
  onSuccess,
  defaultTab = "basic",
}: QuestModalProps) {
  // Error boundary for the modal
  const [hasError, setHasError] = React.useState(false)
  
  React.useEffect(() => {
    if (hasError) {
      console.error('QuestModal encountered an error, resetting state')
      setHasError(false)
    }
  }, [hasError])
  
  if (hasError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              An error occurred while loading the quest modal. Please try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setHasError(false)}>Retry</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  // CRITICAL: Authentication guard - ALL modals must include this
  const { user, isLoading: authLoading } = useAuthenticationGuard()
  
  // Show loading state while authentication is being determined
  if (authLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span>Loading...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  // If not authenticated, don't render the modal
  if (!user) {
    return null
  }
  
  // Authorization check with campaign-specific permissions
  const { canAccess, isCampaignMaster, isAdmin } = useModalAccess(
    mode,
    "quest",
    quest
  )
  
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Convex queries and mutations with proper null checks
  const campaigns = useQuery(api.campaigns.getMyCampaigns) || []
  const characters = useQuery(api.characters.getCharacters) || []
  const locations = useQuery(api.locations.getLocations) || []
  const items = useQuery(api.items.getItems) || []
  const timelineEvents = useQuery(
    api.timeline.getTimelineEventsByCampaign,
    quest?.campaignId ? { campaignId: quest.campaignId } : "skip"
  ) || []
  const questsForPrereqs = useQuery(
    api.quests.getQuestsByCampaign,
    quest?.campaignId ? { campaignId: quest.campaignId } : "skip"
  ) || []
  
  const createQuest = useMutation(api.quests.createQuest)
  const updateQuest = useMutation(api.quests.updateQuest)
  const { generate, isGenerating } = useGPTGeneration()
  
  // State-specific behavior
  const isReadOnly = mode === "read"
  const isCreating = mode === "create"
  const isEditing = mode === "edit"
  
  // Handle GPT generation
  const handleGenerateWithGPT = async () => {
    try {
      toast.info("Generating quest with GPT...", { duration: 2000 })
      const result = await generate("quest")
      
      if (result.success && result.data) {
        // Populate form with generated data
        form.reset({
          name: result.data.name || "",
          description: result.data.description || "",
          campaignId: form.getValues("campaignId") || "__no_campaign__",
          status: result.data.status || "idle",
          questType: result.data.questType || "Side",
          difficulty: result.data.difficulty,
          estimatedSessions: result.data.estimatedSessions,
          timelineEventId: "__no_timeline_event__",
          completionXP: result.data.completionXP || result.data.rewards?.xp,
          rewards: result.data.rewards || { xp: undefined, gold: undefined, itemIds: [] },
          involvedCharacterIds: [],
          requiredLevel: result.data.requiredLevel,
          dmNotes: result.data.dmNotes || "",
          playerNotes: [],
          isRepeatable: result.data.isRepeatable || false,
          prerequisiteQuestIds: [],
          locationId: "__no_location__",
        })
        
        toast.success("Quest generated successfully! Review and adjust as needed.", {
          duration: 3000,
        })
      } else {
        toast.error(result.error || "Failed to generate quest")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate quest")
    }
  }
  
  const form = useForm<QuestFormData>({
    resolver: zodResolver(questSchema),
    defaultValues: {
      name: quest?.name || "",
      description: quest?.description || "",
      campaignId: quest?.campaignId || "__no_campaign__",
      status: quest?.status || "idle",
      questType: quest?.questType || "Side",
      difficulty: quest?.difficulty || undefined,
      estimatedSessions: quest?.estimatedSessions || undefined,
              timelineEventId: quest?.timelineEventId || "__no_timeline_event__",
      completionXP: quest?.completionXP || undefined,
      rewards: quest?.rewards || { xp: undefined, gold: undefined, itemIds: [] },
      involvedCharacterIds: quest?.involvedCharacterIds || [],
      requiredLevel: quest?.requiredLevel || undefined,
      dmNotes: quest?.dmNotes || "",
      playerNotes: quest?.playerNotes || [],
      isRepeatable: quest?.isRepeatable || false,
      prerequisiteQuestIds: quest?.prerequisiteQuestIds || [],
      locationId: quest?.locationId || "__no_location__",
    },
  })

  React.useEffect(() => {
    if (quest && (mode === "edit" || mode === "read")) {
      form.reset({
        name: quest.name,
        description: quest.description || "",
        campaignId: quest.campaignId || "__no_campaign__",
        status: quest.status,
        questType: quest.questType || "Side",
        difficulty: quest.difficulty || undefined,
        estimatedSessions: quest.estimatedSessions || undefined,
        timelineEventId: quest.timelineEventId || "__no_timeline_event__",
        completionXP: quest.completionXP || undefined,
        rewards: quest.rewards || { xp: undefined, gold: undefined, itemIds: [] },
        involvedCharacterIds: quest.involvedCharacterIds || [],
        requiredLevel: quest.requiredLevel || undefined,
        dmNotes: quest.dmNotes || "",
        playerNotes: quest.playerNotes || [],
        isRepeatable: quest.isRepeatable || false,
        prerequisiteQuestIds: quest.prerequisiteQuestIds || [],
        locationId: quest.locationId || "__no_location__",
      })
    }
  }, [quest, mode, form])

  const onSubmit = async (data: QuestFormData) => {
    setIsSubmitting(true)
    
    try {
      // Clean up data
      const cleanData = {
        ...data,
        campaignId: data.campaignId === "__no_campaign__" ? undefined : data.campaignId as Id<"campaigns">,
        locationId: data.locationId === "__no_location__" ? undefined : data.locationId as Id<"locations">,
        timelineEventId: data.timelineEventId === "__no_timeline_event__" ? undefined : data.timelineEventId as Id<"timelineEvents">,
        rewards: data.rewards?.xp || data.rewards?.gold || data.rewards?.itemIds?.length 
          ? data.rewards 
          : undefined,
        involvedCharacterIds: data.involvedCharacterIds?.length ? data.involvedCharacterIds as Id<"characters">[] : undefined,
        playerNotes: data.playerNotes?.filter(Boolean).length ? data.playerNotes : undefined,
        prerequisiteQuestIds: data.prerequisiteQuestIds?.length ? data.prerequisiteQuestIds as Id<"quests">[] : undefined,
      }

      if (isCreating) {
        await createQuest(cleanData)
        toast.success("Quest created successfully!")
      } else if (isEditing && quest) {
        await updateQuest({ 
          id: quest._id, 
          ...cleanData 
        })
        toast.success("Quest updated successfully!")
      }
      
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save quest:", error)
      toast.error(`Failed to ${isCreating ? "create" : "update"} quest. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getModalTitle = () => {
    switch (mode) {
      case "create": return "Create Quest"
      case "edit": return "Edit Quest"
      case "read": return "Quest Details"
      default: return "Quest"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        }>
          <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {getModalTitle()}
              </DialogTitle>
              <DialogDescription>
                {mode === "read" && "View quest details and progress"}
                {mode === "create" && "Create a new quest for your campaign"}
                {mode === "edit" && "Modify quest details and settings"}
              </DialogDescription>
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Rewards
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
                          <FormLabel>Quest Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={isReadOnly}
                              placeholder="Enter quest name..." 
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              disabled={isReadOnly}
                              placeholder="Describe the quest objective and background..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="campaignId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campaign</FormLabel>
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
                                <SelectItem value="__no_campaign__">No Campaign</SelectItem>
                                {campaigns && campaigns.length > 0 && campaigns.map((campaign) => (
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
                      
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {QUEST_STATUS_OPTIONS.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    <div className="flex items-center gap-2">
                                      <status.icon className="h-4 w-4" />
                                      {status.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="questType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quest Type</FormLabel>
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
                                {QUEST_TYPE_OPTIONS && QUEST_TYPE_OPTIONS.map((type) => (
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
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DIFFICULTY_OPTIONS && DIFFICULTY_OPTIONS.map((difficulty) => (
                                  <SelectItem key={difficulty.value} value={difficulty.value}>
                                    {difficulty.label}
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
                        name="estimatedSessions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Est. Sessions</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="1"
                                max="20"
                                disabled={isReadOnly}
                                placeholder="Sessions"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="locationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Location</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={isReadOnly}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="__no_location__">No Location</SelectItem>
                                {locations && locations.length > 0 && locations.map((location) => (
                                  <SelectItem key={location._id} value={location._id}>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      {location.name}
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
                        name="requiredLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Level</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="1"
                                max="20"
                                disabled={isReadOnly}
                                placeholder="Level"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="isRepeatable"
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
                            <FormLabel>Repeatable Quest</FormLabel>
                            <FormDescription>
                              This quest can be completed multiple times by different characters
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="space-y-6 m-0">
                  <QuestTaskManager 
                    questId={quest?._id} 
                    mode={mode} 
                    readOnly={isReadOnly} 
                  />
                </TabsContent>

                {/* Relationships Tab */}
                <TabsContent value="relationships" className="space-y-6 m-0">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="timelineEventId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Linked Timeline Event</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isReadOnly}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeline event" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__no_timeline_event__">No Timeline Event</SelectItem>
                              {timelineEvents?.map((event) => (
                                <SelectItem key={event._id} value={event._id}>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {event.title}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Link this quest to a specific timeline event for narrative flow
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="involvedCharacterIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Involved NPCs</FormLabel>
                          <FormDescription>
                            Select NPCs that play important roles in this quest
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
                    
                    <FormField
                      control={form.control}
                      name="prerequisiteQuestIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prerequisite Quests</FormLabel>
                          <FormDescription>
                            Quests that must be completed before this quest can be started
                          </FormDescription>
                          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                            {questsForPrereqs?.filter(q => q._id !== quest?._id).map((prereqQuest) => (
                              <div key={prereqQuest._id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(prereqQuest._id) || false}
                                  onCheckedChange={(checked) => {
                                    if (isReadOnly) return
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, prereqQuest._id])
                                    } else {
                                      field.onChange(current.filter(id => id !== prereqQuest._id))
                                    }
                                  }}
                                  disabled={isReadOnly}
                                />
                                <Label className="text-sm font-normal">
                                  {prereqQuest.name}
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

                {/* Rewards Tab */}
                <TabsContent value="rewards" className="space-y-6 m-0">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="completionXP"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Completion XP</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                disabled={isReadOnly}
                                placeholder="XP awarded for quest completion"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="rewards.gold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gold Reward</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number"
                                min="0"
                                disabled={isReadOnly}
                                placeholder="Gold pieces awarded"
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="rewards.xp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bonus XP Reward</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="0"
                              disabled={isReadOnly}
                              placeholder="Additional XP beyond base completion XP"
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Extra XP for exceptional performance or bonus objectives
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="rewards.itemIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Rewards</FormLabel>
                          <FormDescription>
                            Items that will be awarded upon quest completion
                          </FormDescription>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                            {items?.map((item) => (
                              <div key={item._id} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(item._id) || false}
                                  onCheckedChange={(checked) => {
                                    if (isReadOnly) return
                                    const current = field.value || []
                                    if (checked) {
                                      field.onChange([...current, item._id])
                                    } else {
                                      field.onChange(current.filter(id => id !== item._id))
                                    }
                                  }}
                                  disabled={isReadOnly}
                                />
                                <Label className="text-sm font-normal">
                                  {item.name} ({item.rarity})
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

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-6 m-0">
                  <div className="space-y-6">
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
                              rows={6}
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
                    
                    <div>
                      <Label>Player-Visible Notes</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Add notes and clues that players can see about this quest
                      </p>
                      
                      {!isReadOnly && (
                        <div className="space-y-2">
                          {(form.watch("playerNotes") || []).map((note, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={note}
                                onChange={(e) => {
                                  const notes = form.getValues("playerNotes") || []
                                  notes[index] = e.target.value
                                  form.setValue("playerNotes", notes)
                                }}
                                placeholder="Player note or clue..."
                                className="flex-1"
                                disabled={isReadOnly}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const notes = form.getValues("playerNotes") || []
                                  notes.splice(index, 1)
                                  form.setValue("playerNotes", notes)
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
                              const notes = form.getValues("playerNotes") || []
                              notes.push("")
                              form.setValue("playerNotes", notes)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Player Note
                          </Button>
                        </div>
                      )}
                      
                      {isReadOnly && (
                        <div className="space-y-2">
                          {(quest?.playerNotes || []).map((note, index) => (
                            <div key={index} className="p-3 bg-muted rounded text-sm">
                              {note}
                            </div>
                          ))}
                          {(!quest?.playerNotes || quest.playerNotes.length === 0) && (
                            <p className="text-sm text-muted-foreground italic">No player notes available</p>
                          )}
                        </div>
                      )}
                    </div>
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
                {mode === "create" ? "Create Quest" : "Save Changes"}
              </Button>
            </>
          )}
          </DialogFooter>
        </React.Suspense>
      </DialogContent>
    </Dialog>
  )
}