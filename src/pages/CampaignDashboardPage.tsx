import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
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
  BarChart3,
  Clock,
  Target,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Network,
  History,
  Zap
} from 'lucide-react'

import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { useAuthenticatedUser } from '@/hooks/useAuthenticationGuard'

// Import modals for entity management
import { QuestModal } from '@/components/modals/QuestModal'
import { TimelineEventModal } from '@/components/modals/TimelineEventModal'
import { FactionModal } from '@/components/modals/FactionModal'
import { LocationModal } from '@/components/modals/LocationModal'
import { CharacterModal } from '@/components/modals/CharacterModal'
import { CampaignModal } from '@/components/modals/CampaignModal'

interface CampaignDashboardPageProps {
  campaignId?: string
}

export function CampaignDashboardPage({ campaignId: propCampaignId }: CampaignDashboardPageProps) {
  const params = useParams({ from: '/campaigns/$campaignId/dashboard' }) as { campaignId: string }
  const navigate = useNavigate()
  
  const campaignId = propCampaignId || params.campaignId
  const { user, databaseUser, isLoading } = useAuthenticatedUser()
  
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardMode, setDashboardMode] = useState<'dm' | 'player'>('dm')
  
  // Modal states
  const [questModalOpen, setQuestModalOpen] = useState(false)
  const [questModalMode, setQuestModalMode] = useState<'create' | 'edit' | 'read'>('create')
  const [selectedQuest, setSelectedQuest] = useState<any>(null)
  
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)
  const [factionModalOpen, setFactionModalOpen] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [characterModalOpen, setCharacterModalOpen] = useState(false)
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)

  // Data queries
  const campaign = useQuery(api.campaigns.getCampaignById, campaignId ? { campaignId: campaignId as Id<"campaigns"> } : "skip")
  const campaignQuests = useQuery(api.quests.getQuestsByCampaign, campaignId ? { campaignId: campaignId as Id<"campaigns"> } : "skip")
  const campaignTimelineEvents = useQuery(api.timeline.getTimelineEventsByCampaign, campaignId ? { campaignId: campaignId as Id<"campaigns"> } : "skip")
  const campaignFactions = useQuery(api.factions.getFactionsByCampaign, campaignId ? { campaignId: campaignId as Id<"campaigns"> } : "skip")
  const campaignLocations = useQuery(api.locations.getLocations, campaignId ? { campaignId: campaignId as Id<"campaigns"> } : "skip")
  const campaignCharacters = useQuery(api.characters.getCharacters, campaignId ? { campaignId: campaignId as Id<"campaigns"> } : "skip")
  const campaignInteractions = useQuery(api.interactions.getInteractions, campaignId ? { campaignId: campaignId as Id<"campaigns"> } : "skip")

  // Permission checking
  const isDM = campaign && databaseUser && (campaign.dmId === databaseUser.clerkId || databaseUser.role === 'admin')
  const isPlayer = campaign && databaseUser && campaign.participantUserIds?.includes(databaseUser._id)
  const hasAccess = isDM || isPlayer

  // Auto-set dashboard mode based on permissions
  React.useEffect(() => {
    if (isDM) {
      setDashboardMode('dm')
    } else if (isPlayer) {
      setDashboardMode('player')
    }
  }, [isDM, isPlayer])

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

  // Quest progress calculation
  const questProgress = campaignStats.totalQuests > 0 ? (campaignStats.completedQuests / campaignStats.totalQuests) * 100 : 0

  // Event handlers
  const handleViewQuest = (questId: string) => {
    const quest = campaignQuests?.find(q => q._id === questId)
    if (quest) {
      setSelectedQuest(quest)
      setQuestModalMode('read')
      setQuestModalOpen(true)
    }
  }

  const handleEditQuest = (questId: string) => {
    const quest = campaignQuests?.find(q => q._id === questId)
    if (quest) {
      setSelectedQuest(quest)
      setQuestModalMode('edit')
      setQuestModalOpen(true)
    }
  }

  const handleCreateQuest = () => {
    setSelectedQuest(null)
    setQuestModalMode('create')
    setQuestModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The requested campaign could not be found or you don't have permission to access it.
            </p>
            <Button onClick={() => navigate({ to: '/campaigns' })}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this campaign dashboard.
            </p>
            <Button onClick={() => navigate({ to: '/campaigns' })}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <SignedOut>
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to access campaign dashboards.
            </p>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate({ to: '/campaigns' })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Campaigns
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-2">
                {dashboardMode === 'dm' ? <Crown className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                <h1 className="text-3xl font-bold">{campaign.name}</h1>
                <Badge variant={campaign.isPublic ? "default" : "secondary"}>
                  {campaign.isPublic ? "Public" : "Private"}
                </Badge>
                <Badge variant="outline">
                  {dashboardMode === 'dm' ? "DM View" : "Player View"}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {dashboardMode === 'dm' 
                  ? "Comprehensive campaign management and oversight"
                  : "View campaign information and your progress"
                }
              </p>
              {campaign.description && (
                <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mode Toggle (only show if user has both permissions) */}
            {isDM && isPlayer && (
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <Button
                  variant={dashboardMode === 'dm' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDashboardMode('dm')}
                >
                  <Crown className="h-4 w-4 mr-1" />
                  DM
                </Button>
                <Button
                  variant={dashboardMode === 'player' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDashboardMode('player')}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Player
                </Button>
              </div>
            )}
            
            {dashboardMode === 'dm' && (
              <Button onClick={() => setCampaignModalOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Campaign Settings
              </Button>
            )}
          </div>
        </div>

        {/* Campaign Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaign Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(questProgress)}%</div>
              <p className="text-xs text-muted-foreground">
                {campaignStats.completedQuests} of {campaignStats.totalQuests} quests completed
              </p>
              <Progress value={questProgress} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Quests</CardTitle>
              <ScrollText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.activeQuests}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">World Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignStats.totalLocations}</div>
              <p className="text-xs text-muted-foreground">
                Mapped locations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Party Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerCharacters.length}</div>
              <p className="text-xs text-muted-foreground">
                Active characters
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={`grid w-full ${dashboardMode === 'dm' ? 'grid-cols-6' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center gap-1">
              <ScrollText className="h-3 w-3" />
              Quests
            </TabsTrigger>
            <TabsTrigger value="world" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              World
            </TabsTrigger>
            <TabsTrigger value="party" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {dashboardMode === 'dm' ? 'Players' : 'Party'}
            </TabsTrigger>
            {dashboardMode === 'dm' && (
              <>
                <TabsTrigger value="resources" className="flex items-center gap-1">
                  <Swords className="h-3 w-3" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Analytics
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates in your campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaignQuests?.slice(0, 3).map((quest) => (
                      <div key={quest._id} className="flex items-center gap-3 p-2 rounded border">
                        <Target className="h-4 w-4 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{quest.name}</p>
                          <p className="text-xs text-muted-foreground">Quest updated</p>
                        </div>
                        <Badge variant="outline">{quest.status}</Badge>
                      </div>
                    ))}
                    {(!campaignQuests || campaignQuests.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent activity
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {dashboardMode === 'dm' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Rapidly create campaign content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button onClick={handleCreateQuest} className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quest
                    </Button>
                    <Button onClick={() => setTimelineModalOpen(true)} variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Timeline Event
                    </Button>
                    <Button onClick={() => setLocationModalOpen(true)} variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Location
                    </Button>
                    <Button onClick={() => setFactionModalOpen(true)} variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Faction
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Player Progress (Player Mode) */}
              {dashboardMode === 'player' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Progress</CardTitle>
                    <CardDescription>Character advancement and achievements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {playerCharacters.map((character) => (
                        <div key={character._id} className="p-3 border rounded">
                          <h4 className="font-medium">{character.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Level {character.level} {character.race} {character.class}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Badge variant="outline">AC {character.armorClass}</Badge>
                            <Badge variant="outline">HP {character.hitPoints}</Badge>
                          </div>
                        </div>
                      ))}
                      {playerCharacters.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No characters assigned
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Quests Tab */}
          <TabsContent value="quests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Campaign Quests</span>
                  {dashboardMode === 'dm' && (
                    <Button size="sm" onClick={handleCreateQuest}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Quest
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {dashboardMode === 'dm' ? "Manage all campaign quests" : "Your assigned quests and progress"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(!campaignQuests || campaignQuests.length === 0) ? (
                  <div className="text-center text-muted-foreground py-8">
                    <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No Quests Yet</p>
                    <p className="text-sm">
                      {dashboardMode === 'dm' ? "Create your first quest to get started" : "Quests will appear here when assigned"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaignQuests.map((quest) => (
                      <div key={quest._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium line-clamp-1">{quest.name}</h4>
                          <Badge variant="outline">{quest.status}</Badge>
                        </div>
                        {quest.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {quest.description}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewQuest(quest._id)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {dashboardMode === 'dm' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleEditQuest(quest._id)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
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
                    {dashboardMode === 'dm' && (
                      <Button size="sm" onClick={() => setLocationModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>World locations and settlements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{campaignStats.totalLocations}</span>
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Mapped locations in the campaign world
                  </p>
                  {dashboardMode === 'dm' && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate({ to: '/locations' })}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manage Locations
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Factions</span>
                    {dashboardMode === 'dm' && (
                      <Button size="sm" onClick={() => setFactionModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>Political organizations and groups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{campaignStats.totalFactions}</span>
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Active factions and organizations
                  </p>
                  {dashboardMode === 'dm' && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate({ to: '/factions' })}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manage Factions
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Party/Players Tab */}
          <TabsContent value="party" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{dashboardMode === 'dm' ? 'Player Management' : 'Party Members'}</CardTitle>
                <CardDescription>
                  {dashboardMode === 'dm' 
                    ? 'Manage player access and character assignments'
                    : 'Other player characters in this campaign'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {playerCharacters.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No Party Members</p>
                    <p className="text-sm">Player characters will appear here when they join</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playerCharacters.map((character) => (
                      <div key={character._id} className="p-4 border rounded-lg">
                        <h4 className="font-medium">{character.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Level {character.level} {character.race} {character.class}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline">AC {character.armorClass}</Badge>
                          <Badge variant="outline">HP {character.hitPoints}</Badge>
                        </div>
                        {dashboardMode === 'dm' && (
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View Sheet
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DM Resources Tab */}
          {dashboardMode === 'dm' && (
            <TabsContent value="resources" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>NPCs</CardTitle>
                    <CardDescription>Non-player characters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{npcs.length}</span>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => setCharacterModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create NPC
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline Events</CardTitle>
                    <CardDescription>Campaign history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{campaignStats.totalTimelineEvents}</span>
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => setTimelineModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Interactions</CardTitle>
                    <CardDescription>Combat encounters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{campaignStats.totalInteractions}</span>
                      <Swords className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => navigate({ to: '/interactions' })}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* DM Analytics Tab */}
          {dashboardMode === 'dm' && (
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Health</CardTitle>
                    <CardDescription>Overall campaign progress and engagement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Quest Completion</span>
                        <span>{Math.round(questProgress)}%</span>
                      </div>
                      <Progress value={questProgress} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>World Development</span>
                        <span>{campaignStats.totalLocations > 5 ? '85%' : '45%'}</span>
                      </div>
                      <Progress value={campaignStats.totalLocations > 5 ? 85 : 45} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Story Richness</span>
                        <span>{campaignStats.totalTimelineEvents > 3 ? '75%' : '30%'}</span>
                      </div>
                      <Progress value={campaignStats.totalTimelineEvents > 3 ? 75 : 30} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Summary</CardTitle>
                    <CardDescription>Overview of campaign content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Active Quests</span>
                        <Badge variant="default">{campaignStats.activeQuests}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Completed Quests</span>
                        <Badge variant="secondary">{campaignStats.completedQuests}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">World Locations</span>
                        <Badge variant="outline">{campaignStats.totalLocations}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Active Factions</span>
                        <Badge variant="outline">{campaignStats.totalFactions}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">NPCs Created</span>
                        <Badge variant="outline">{npcs.length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </SignedIn>

      {/* Entity Creation Modals */}
      <QuestModal
        open={questModalOpen}
        onOpenChange={setQuestModalOpen}
        mode={questModalMode}
        quest={selectedQuest}
        onSuccess={() => {
          setQuestModalOpen(false)
          setSelectedQuest(null)
        }}
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
      
      <CharacterModal
        open={characterModalOpen}
        onOpenChange={setCharacterModalOpen}
        mode="create"
        characterType="npc"
        onSuccess={() => setCharacterModalOpen(false)}
      />

      <CampaignModal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        mode="edit"
        campaign={campaign}
        dashboardMode={dashboardMode}
        onSuccess={() => setCampaignModalOpen(false)}
      />
    </div>
  )
}