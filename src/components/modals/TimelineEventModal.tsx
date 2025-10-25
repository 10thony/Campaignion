import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { format } from "date-fns"

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
import { 
  Loader2, 
  Calendar, 
  Users, 
  MapPin, 
  StickyNote, 
  Network, 
  Clock,
  Sword,
  UserPlus,
  Eye,
  Zap,
  Crown,
  BookOpen,
  Target
} from "lucide-react"

import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { timelineEventSchema, TimelineEventFormData } from "../../lib/validation/schemas"
import { useAuthenticationGuard, useModalAccess } from "../../hooks/useAuthenticationGuard"

// Timeline Event Types with D&D appropriate icons and colors
const EVENT_TYPE_OPTIONS = [
  { value: "Battle", label: "Battle", icon: Sword, description: "Combat encounters and wars" },
  { value: "Alliance", label: "Alliance", icon: UserPlus, description: "Diplomatic agreements and partnerships" },
  { value: "Discovery", label: "Discovery", icon: Eye, description: "Important revelations or findings" },
  { value: "Disaster", label: "Disaster", icon: Zap, description: "Natural or magical catastrophes" },
  { value: "Political", label: "Political", icon: Crown, description: "Government and power changes" },
  { value: "Cultural", label: "Cultural", icon: BookOpen, description: "Religious, artistic, or social events" },
  { value: "Custom", label: "Custom", icon: Target, description: "Custom campaign-specific events" },
] as const

const EVENT_STATUS_OPTIONS = [
  { value: "idle", label: "Planned", description: "Event is planned but hasn't occurred" },
  { value: "in_progress", label: "Happening", description: "Event is currently taking place" },
  { value: "completed", label: "Historical", description: "Event has concluded" },
] as const

const IMPACT_OPTIONS = [
  { value: "Positive", label: "Positive", variant: "default" as const },
  { value: "Negative", label: "Negative", variant: "destructive" as const },
  { value: "Neutral", label: "Neutral", variant: "secondary" as const },
] as const

interface TimelineEvent {
  _id: Id<"timelineEvents">
  title: string
  description: string
  date: number
  campaignId: Id<"campaigns">
  type: "Battle" | "Alliance" | "Discovery" | "Disaster" | "Political" | "Cultural" | "Custom"
  status: "idle" | "in_progress" | "completed"
  relatedLocationIds?: Id<"locations">[]
  relatedNpcIds?: Id<"characters">[]
  relatedFactionIds?: Id<"factions">[]
  relatedQuestIds?: Id<"quests">[]
  primaryQuestId?: Id<"quests">
  eventConsequences?: string[]
  participantOutcomes?: Array<{
    characterId: string
    outcome: string
    impact: "Positive" | "Negative" | "Neutral"
  }>
  isPublic?: boolean
  dmNotes?: string
  playerVisibleNotes?: string
}

interface TimelineEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "read" | "create" | "edit"
  timelineEvent?: TimelineEvent
  onSuccess?: () => void
  defaultTab?: string
}

export function TimelineEventModal({
  open,
  onOpenChange,
  mode,
  timelineEvent,
  onSuccess,
  defaultTab = "basic",
}: TimelineEventModalProps) {
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
    "timelineEvent",
    timelineEvent
  )
  
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Convex queries and mutations
  const createTimelineEvent = useMutation(api.timeline.createTimelineEvent)
  const updateTimelineEvent = useMutation(api.timeline.updateTimelineEvent)
  const campaigns = useQuery(api.campaigns.getMyCampaigns)
  const locations = useQuery(
    api.locations.getLocations,
    timelineEvent?.campaignId ? { campaignId: timelineEvent.campaignId } : "skip"
  )
  const characters = useQuery(
    api.characters.getCharacters,
    timelineEvent?.campaignId ? { campaignId: timelineEvent.campaignId } : "skip"
  )
  const factions = useQuery(
    api.factions.getFactions,
    timelineEvent?.campaignId ? { campaignId: timelineEvent.campaignId } : "skip"
  )
  const quests = useQuery(
    api.quests.getQuests,
    timelineEvent?.campaignId ? { campaignId: timelineEvent.campaignId } : "skip"
  )
  
  // State-specific behavior
  const isReadOnly = mode === "read"
  const isCreating = mode === "create"
  const isEditing = mode === "edit"
  
  // Form setup with enhanced validation
  const form = useForm<TimelineEventFormData>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: {
      title: timelineEvent?.title || "",
      description: timelineEvent?.description || "",
      date: timelineEvent?.date || Date.now(),
      campaignId: timelineEvent?.campaignId || "",
      type: timelineEvent?.type || "Custom",
      status: timelineEvent?.status || "idle",
      relatedLocationIds: timelineEvent?.relatedLocationIds || [],
      relatedNpcIds: timelineEvent?.relatedNpcIds || [],
      relatedFactionIds: timelineEvent?.relatedFactionIds || [],
      relatedQuestIds: timelineEvent?.relatedQuestIds || [],
      primaryQuestId: timelineEvent?.primaryQuestId || undefined,
      eventConsequences: timelineEvent?.eventConsequences || [],
      participantOutcomes: timelineEvent?.participantOutcomes || [],
      isPublic: timelineEvent?.isPublic ?? true,
      dmNotes: timelineEvent?.dmNotes || "",
      playerVisibleNotes: timelineEvent?.playerVisibleNotes || "",
    },
  })

  React.useEffect(() => {
    if (timelineEvent && (mode === "edit" || mode === "read")) {
      form.reset({
        title: timelineEvent.title,
        description: timelineEvent.description,
        date: timelineEvent.date,
        campaignId: timelineEvent.campaignId,
        type: timelineEvent.type,
        status: timelineEvent.status,
        relatedLocationIds: timelineEvent.relatedLocationIds || [],
        relatedNpcIds: timelineEvent.relatedNpcIds || [],
        relatedFactionIds: timelineEvent.relatedFactionIds || [],
        relatedQuestIds: timelineEvent.relatedQuestIds || [],
        primaryQuestId: timelineEvent.primaryQuestId || undefined,
        eventConsequences: timelineEvent.eventConsequences || [],
        participantOutcomes: timelineEvent.participantOutcomes || [],
        isPublic: timelineEvent.isPublic ?? true,
        dmNotes: timelineEvent.dmNotes || "",
        playerVisibleNotes: timelineEvent.playerVisibleNotes || "",
      })
    } else if (mode === "create") {
      form.reset({
        title: "",
        description: "",
        date: Date.now(),
        campaignId: "",
        type: "Custom",
        status: "idle",
        relatedLocationIds: [],
        relatedNpcIds: [],
        relatedFactionIds: [],
        relatedQuestIds: [],
        primaryQuestId: undefined,
        eventConsequences: [],
        participantOutcomes: [],
        isPublic: true,
        dmNotes: "",
        playerVisibleNotes: "",
      })
    }
  }, [timelineEvent, mode, form])

  const onSubmit = async (data: TimelineEventFormData) => {
    setIsSubmitting(true)
    try {
      if (mode === "create") {
        await createTimelineEvent(data)
        toast.success("Timeline event created successfully!")
      } else if (mode === "edit" && timelineEvent) {
        await updateTimelineEvent({ id: timelineEvent._id, ...data })
        toast.success("Timeline event updated successfully!")
      }
      
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Failed to save timeline event:", error)
      toast.error("Failed to save timeline event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getModalTitle = () => {
    switch (mode) {
      case "create":
        return "Create Timeline Event"
      case "edit":
        return "Edit Timeline Event"
      case "read":
        return "Timeline Event Details"
      default:
        return "Timeline Event"
    }
  }

  const getModalDescription = () => {
    switch (mode) {
      case "read":
        return "View timeline event details and relationships"
      case "create":
        return "Create a new timeline event for your campaign"
      case "edit":
        return "Modify timeline event details and relationships"
      default:
        return ""
    }
  }

  const getEventTypeIcon = (type: string) => {
    const eventType = EVENT_TYPE_OPTIONS.find(t => t.value === type)
    return eventType ? eventType.icon : Target
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default" // Green
      case "in_progress":
        return "secondary" // Blue
      default:
        return "outline" // Gray
    }
  }

  const formatEventDate = (timestamp: number) => {
    return format(new Date(timestamp), "PPP")
  }

  const EventIcon = timelineEvent ? getEventTypeIcon(timelineEvent.type) : Calendar

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EventIcon className="h-5 w-5" />
            {getModalTitle()}
            {timelineEvent && (
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(timelineEvent.status)}>
                  {EVENT_STATUS_OPTIONS.find(opt => opt.value === timelineEvent.status)?.label || timelineEvent.status}
                </Badge>
                <Badge variant="outline">
                  {EVENT_TYPE_OPTIONS.find(opt => opt.value === timelineEvent.type)?.label || timelineEvent.type}
                </Badge>
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription()}
            {timelineEvent && (
              <div className="mt-2 text-sm">
                <Clock className="h-4 w-4 inline mr-1" />
                {formatEventDate(timelineEvent.date)}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="relationships" className="flex items-center gap-1">
                  <Network className="h-3 w-3" />
                  Relationships
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-1">
                  <StickyNote className="h-3 w-3" />
                  Notes
                </TabsTrigger>
              </TabsList>
              
              <div className="overflow-y-auto flex-1 mt-4 space-y-4">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Information</CardTitle>
                      <CardDescription>
                        Core details about this timeline event
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Title *</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isReadOnly} placeholder="Enter event title..." />
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
                                placeholder="Describe what happened during this event..."
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
                              <FormLabel>Campaign *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
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
                        
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="datetime-local"
                                  {...field}
                                  disabled={isReadOnly}
                                  value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                                  onChange={(e) => field.onChange(new Date(e.target.value).getTime())}
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
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {EVENT_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {EVENT_STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={isReadOnly}
                                  className="h-4 w-4"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Public Event</FormLabel>
                                <FormDescription>
                                  Should this event be visible to players?
                                </FormDescription>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Relationships Tab */}
                <TabsContent value="relationships" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Entity Relationships</CardTitle>
                      <CardDescription>
                        Link this event to other campaign entities
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="primaryQuestId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Quest</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select primary quest" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {quests?.map((quest) => (
                                  <SelectItem key={quest._id} value={quest._id}>
                                    {quest.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The main quest this event relates to
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Related Entities</h4>
                        <p className="text-sm text-muted-foreground">
                          Multi-select coming soon - for now, use the primary quest relationship above
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Details</CardTitle>
                      <CardDescription>
                        Consequences and participant outcomes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center text-muted-foreground py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Event Consequences</p>
                        <p className="text-sm">Advanced consequence and outcome tracking coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Notes</CardTitle>
                      <CardDescription>
                        DM notes and player-visible information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="playerVisibleNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Player-Visible Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                disabled={isReadOnly}
                                placeholder="Information visible to players about this event..."
                                rows={3}
                              />
                            </FormControl>
                            <FormDescription>
                              This information will be visible to all players in the campaign
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {(isCampaignMaster(timelineEvent?.campaignId || "") || isAdmin) && (
                        <FormField
                          control={form.control}
                          name="dmNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>DM Notes (Private)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  disabled={isReadOnly}
                                  placeholder="Private notes for the DM about this event..."
                                  rows={4}
                                />
                              </FormControl>
                              <FormDescription>
                                These notes are only visible to the DM and admins
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </form>
        </Form>
        
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
              <Button 
                type="submit" 
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Event" : "Save Changes"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}