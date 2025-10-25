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
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"
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
import { Progress } from "../ui/progress"
import { 
  Loader2, 
  Crown, 
  Users, 
  Star, 
  Calendar, 
  MapPin, 
  Shield,
  Settings,
  TrendingUp,
  Award,
  ScrollText,
  Swords,
  Plus,
  Eye,
  Edit,
  UserPlus,
  UserMinus,
  ExternalLink
} from "lucide-react"

import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { campaignSchema, CampaignFormData } from "../../lib/validation/schemas"
import { useAuthenticationGuard, useModalAccess } from "../../hooks/useAuthenticationGuard"

// Import the new modals for quick access
import { QuestModal } from "./QuestModal"
import { TimelineEventModal } from "./TimelineEventModal"
import { FactionModal } from "./FactionModal"
import { LocationModal } from "./LocationModal"

interface EnhancedCampaign {
  _id: Id<"campaigns">
  name: string
  description?: string
  worldSetting?: string
  startDate?: number
  isPublic: boolean
  dmId: string
  players?: string[]
  participantPlayerCharacterIds?: Id<"characters">[]
  participantUserIds?: Id<"users">[]
  locationIds?: Id<"locations">[]
  questIds?: Id<"quests">[]
  npcIds?: Id<"characters">[]
  factionIds?: Id<"factions">[]
  monsterIds?: Id<"monsters">[]
  timelineEventIds?: Id<"timelineEvents">[]
  createdAt?: number
}

interface CampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "read" | "create" | "edit"
  campaign?: EnhancedCampaign
  onSuccess?: () => void
  defaultTab?: string
  dashboardMode?: "dm" | "player" // New: Determines which dashboard view to show
}

export function CampaignModal({
  open,
  onOpenChange,
  mode,
  campaign,
  onSuccess,
  defaultTab = "overview",
  dashboardMode = "dm",
}: CampaignModalProps) {
  // Add error state
  const [error, setError] = useState<string | null>(null)
  
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
  
  // If not authenticated, show error
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-red-600">You must be signed in to access this feature.</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  // Authorization check with campaign-specific permissions
  let modalAccess
  try {
    modalAccess = useModalAccess(mode, "campaign", campaign)
  } catch (accessError) {
    setError(`Access error: ${accessError instanceof Error ? accessError.message : 'Unknown error'}`)
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Error</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  const { canAccess, isCampaignMaster, isPlayer, isAdmin } = modalAccess
  
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Quick entity creation modals
  const [questModalOpen, setQuestModalOpen] = useState(false)
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)
  const [factionModalOpen, setFactionModalOpen] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  
  // Convex queries and mutations
  const createCampaign = useMutation(api.campaigns.createCampaign)
  const updateCampaign = useMutation(api.campaigns.updateCampaign)
  
  // Campaign-specific data queries
  const campaignQuests = useQuery(
    api.quests.getQuests,
    campaign?._id ? { campaignId: campaign._id } : "skip"
  )
  const campaignTimelineEvents = useQuery(
    api.timeline.getTimelineEvents,
    campaign?._id ? { campaignId: campaign._id } : "skip"
  )
  const campaignFactions = useQuery(
    api.factions.getFactions,
    campaign?._id ? { campaignId: campaign._id } : "skip"
  )
  const campaignLocations = useQuery(
    api.locations.getLocations,
    campaign?._id ? { campaignId: campaign._id } : "skip"
  )
  const campaignCharacters = useQuery(
    api.characters.getCharacters,
    campaign?._id ? { campaignId: campaign._id } : "skip"
  )
  const campaignInteractions = useQuery(
    api.interactions.getInteractions,
    campaign?._id ? { campaignId: campaign._id } : "skip"
  )
  
  // State-specific behavior
  const isReadOnly = mode === "read"
  const isCreating = mode === "create"
  const isEditing = mode === "edit"
  const isDMMode = dashboardMode === "dm" && (campaign?._id ? isCampaignMaster(campaign._id) : isAdmin)
  const isPlayerMode = dashboardMode === "player" && (campaign?._id ? isPlayer(campaign._id) : false)
  
  // Form setup
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name || "",
      description: campaign?.description || "",
      worldSetting: campaign?.worldSetting || "",
      isPublic: campaign?.isPublic || false,
    },
  })

  React.useEffect(() => {
    if (campaign && (mode === "edit" || mode === "read")) {
      form.reset({
        name: campaign.name,
        description: campaign.description || "",
        worldSetting: campaign.worldSetting || "",
        isPublic: campaign.isPublic,
      })
    } else if (mode === "create") {
      form.reset({
        name: "",
        description: "",
        worldSetting: "",
        isPublic: false,
      })
    }
  }, [campaign, mode, form])

  const onSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true)
    try {
      if (mode === "create") {
        await createCampaign(data)
        toast.success("Campaign created successfully!")
      } else if (mode === "edit" && campaign) {
        await updateCampaign({ campaignId: campaign._id, ...data })
        toast.success("Campaign updated successfully!")
      }
      
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Failed to save campaign:", error)
      toast.error("Failed to save campaign. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getModalTitle = () => {
    if (mode === "read") {
      return isDMMode ? "Campaign Dashboard (DM)" : "Campaign Dashboard (Player)"
    }
    switch (mode) {
      case "create":
        return "Create Campaign"
      case "edit":
        return "Edit Campaign"
      default:
        return "Campaign"
    }
  }

  const getModalDescription = () => {
    if (mode === "read") {
      return isDMMode 
        ? "Comprehensive campaign management and oversight"
        : "View campaign information and your progress"
    }
    switch (mode) {
      case "create":
        return "Create a new D&D campaign"
      case "edit":
        return "Modify campaign settings and details"
      default:
        return ""
    }
  }

  // Calculate campaign statistics
  const campaignStats = {
    totalQuests: campaignQuests?.length || 0,
    activeQuests: campaignQuests?.filter(q => q.status === "in_progress" || q.status === "InProgress").length || 0,
    completedQuests: campaignQuests?.filter(q => q.status === "completed").length || 0,
    totalTimelineEvents: campaignTimelineEvents?.length || 0,
    totalFactions: campaignFactions?.length || 0,
    totalLocations: campaignLocations?.length || 0,
    totalCharacters: campaignCharacters?.length || 0,
    totalInteractions: campaignInteractions?.length || 0,
  }

  const playerCharacters = campaignCharacters?.filter(c => c.characterType === "player") || []
  const npcs = campaignCharacters?.filter(c => c.characterType === "npc") || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDMMode ? <Crown className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {getModalTitle()}
            {campaign && (
              <div className="flex items-center gap-2">
                <Badge variant={campaign.isPublic ? "default" : "secondary"}>
                  {campaign.isPublic ? "Public" : "Private"}
                </Badge>
                {isDMMode && <Badge variant="outline">DM View</Badge>}
                {isPlayerMode && <Badge variant="outline">Player View</Badge>}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
              <TabsList className={`grid w-full ${isDMMode ? 'grid-cols-7' : 'grid-cols-5'}`}>
                <TabsTrigger value="overview" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Overview
                </TabsTrigger>
                {isDMMode && (
                  <TabsTrigger value="players" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Players
                  </TabsTrigger>
                )}
                {isPlayerMode && (
                  <TabsTrigger value="party" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Party
                  </TabsTrigger>
                )}
                <TabsTrigger value="quests" className="flex items-center gap-1">
                  <ScrollText className="h-3 w-3" />
                  Quests
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="world" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  World
                </TabsTrigger>
                {isDMMode && (
                  <TabsTrigger value="resources" className="flex items-center gap-1">
                    <Swords className="h-3 w-3" />
                    Resources
                  </TabsTrigger>
                )}
                {isDMMode && (
                  <TabsTrigger value="settings" className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    Settings
                  </TabsTrigger>
                )}
              </TabsList>
              
              <div className="overflow-y-auto flex-1 mt-4 space-y-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  {mode === "read" ? (
                    // Dashboard View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Quests</CardTitle>
                          <ScrollText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaignStats.totalQuests}</div>
                          <p className="text-xs text-muted-foreground">
                            {campaignStats.activeQuests} active, {campaignStats.completedQuests} completed
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Timeline Events</CardTitle>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaignStats.totalTimelineEvents}</div>
                          <p className="text-xs text-muted-foreground">
                            Historical and planned events
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Factions</CardTitle>
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaignStats.totalFactions}</div>
                          <p className="text-xs text-muted-foreground">
                            Political organizations
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Locations</CardTitle>
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaignStats.totalLocations}</div>
                          <p className="text-xs text-muted-foreground">
                            Mapped world locations
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    // Form View for Create/Edit
                    <Card>
                      <CardHeader>
                        <CardTitle>Campaign Information</CardTitle>
                        <CardDescription>
                          Basic details about your campaign
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign Name *</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={isReadOnly} placeholder="Enter campaign name..." />
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
                                  placeholder="Describe your campaign setting and story..."
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="worldSetting"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>World Setting</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={isReadOnly}
                                  placeholder="e.g., Forgotten Realms, Homebrew World..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Public Campaign</FormLabel>
                                <FormDescription>
                                  Allow other users to discover and request to join this campaign
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isReadOnly}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* DM Players Tab */}
                {isDMMode && (
                  <TabsContent value="players" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Player Management</CardTitle>
                        <CardDescription>
                          Manage player access and character assignments
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center text-muted-foreground py-8">
                          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Player Management</p>
                          <p className="text-sm">Advanced player invitation and management coming soon</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Player Party Tab */}
                {isPlayerMode && (
                  <TabsContent value="party" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Party Members</CardTitle>
                        <CardDescription>
                          Other player characters in this campaign
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {playerCharacters.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No Party Members</p>
                            <p className="text-sm">Player characters will appear here when they join</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {playerCharacters.map((character) => (
                              <div key={character._id} className="p-4 border rounded-lg">
                                <h4 className="font-medium">{character.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Level {character.level} {character.race} {character.class}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant="outline">
                                    AC {character.armorClass}
                                  </Badge>
                                  <Badge variant="outline">
                                    HP {character.hitPoints}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* Quests Tab */}
                <TabsContent value="quests" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Campaign Quests</span>
                        {isDMMode && (
                          <Button size="sm" onClick={() => setQuestModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Quest
                          </Button>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isDMMode ? "Manage all campaign quests" : "Your assigned quests and progress"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {campaignQuests?.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No Quests Yet</p>
                          <p className="text-sm">
                            {isDMMode ? "Create your first quest to get started" : "Quests will appear here when assigned"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {campaignQuests?.slice(0, 5).map((quest) => (
                            <div key={quest._id} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <h4 className="font-medium">{quest.name}</h4>
                                <p className="text-sm text-muted-foreground">{quest.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{quest.status}</Badge>
                                {isDMMode && (
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {campaignQuests && campaignQuests.length > 5 && (
                            <p className="text-sm text-muted-foreground text-center">
                              And {campaignQuests.length - 5} more quests...
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Campaign Timeline</span>
                        {isDMMode && (
                          <Button size="sm" onClick={() => setTimelineModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Event
                          </Button>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isDMMode ? "Manage campaign timeline events" : "Important campaign events and history"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {campaignTimelineEvents?.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No Timeline Events</p>
                          <p className="text-sm">
                            {isDMMode ? "Create timeline events to track campaign history" : "Campaign events will appear here"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {campaignTimelineEvents?.slice(0, 5).map((event) => (
                            <div key={event._id} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <h4 className="font-medium">{event.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{event.type}</Badge>
                                {isDMMode && (
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* World Tab */}
                <TabsContent value="world" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Locations</span>
                          {isDMMode && (
                            <Button size="sm" onClick={() => setLocationModalOpen(true)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {campaignStats.totalLocations} locations mapped
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Factions</span>
                          {isDMMode && (
                            <Button size="sm" onClick={() => setFactionModalOpen(true)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {campaignStats.totalFactions} active factions
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* DM Resources Tab */}
                {isDMMode && (
                  <TabsContent value="resources" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>NPCs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{npcs.length}</p>
                          <p className="text-sm text-muted-foreground">Non-player characters</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Monsters</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{campaignStats.totalCharacters}</p>
                          <p className="text-sm text-muted-foreground">Bestiary entries</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Interactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{campaignStats.totalInteractions}</p>
                          <p className="text-sm text-muted-foreground">Combat encounters</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                )}

                {/* DM Settings Tab */}
                {isDMMode && (
                  <TabsContent value="settings" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Campaign Settings</CardTitle>
                        <CardDescription>
                          Configure campaign permissions and advanced options
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Campaign form fields for editing */}
                        <FormField
                          control={form.control}
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Public Campaign</FormLabel>
                                <FormDescription>
                                  Allow other users to discover and request to join this campaign
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isReadOnly}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
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
                {mode === "create" ? "Create Campaign" : "Save Changes"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      
      {/* Quick Entity Creation Modals */}
      <QuestModal
        open={questModalOpen}
        onOpenChange={setQuestModalOpen}
        mode="create"
        onSuccess={() => setQuestModalOpen(false)}
      />
      
      <TimelineEventModal
        open={timelineModalOpen}
        onOpenChange={setTimelineModalOpen}
        mode="create"
        onSuccess={() => setTimelineModalOpen(false)}
      />
      
      <FactionModal
        open={factionModalOpen}
        onOpenChange={setFactionModalOpen}
        mode="create"
        onSuccess={() => setFactionModalOpen(false)}
      />
      
      <LocationModal
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        mode="create"
        onSuccess={() => setLocationModalOpen(false)}
      />
    </Dialog>
  )
}