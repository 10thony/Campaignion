import { useState } from 'react'
import { useQuery } from 'convex/react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { TimelineEventList } from '@/components/TimelineEventList'
import { SampleDataPanel } from '@/components/SampleDataPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Calendar, 
  Plus, 
  BookOpen,
  Filter,
  History,
  Clock,
  Users
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

export function TimelineEventsPage() {
  const campaigns = useQuery(api.campaigns.getMyCampaigns)
  const allTimelineEvents = useQuery(api.timeline.getTimelineEvents, {})
  const myTimelineEvents = useQuery(api.timeline.getMyTimelineEvents)
  
  const [selectedCampaign, setSelectedCampaign] = useState<string>("")
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'campaign'>('my')

  const handleTabChange = (tab: 'my' | 'all' | 'campaign') => {
    setActiveTab(tab)
    if (tab !== 'campaign') {
      setSelectedCampaign("")
    }
  }

  const getDisplayTitle = () => {
    switch (activeTab) {
      case 'my':
        return 'My Timeline Events'
      case 'all':
        return 'All Timeline Events'
      case 'campaign':
        if (selectedCampaign) {
          const campaign = campaigns?.find(c => c._id === selectedCampaign)
          return `${campaign?.name || 'Campaign'} Timeline`
        }
        return 'Campaign Timeline'
      default:
        return 'Timeline Events'
    }
  }

  const getDisplayDescription = () => {
    switch (activeTab) {
      case 'my':
        return 'Timeline events you have created across all campaigns'
      case 'all':
        return 'All timeline events across all campaigns you have access to'
      case 'campaign':
        return 'Timeline events for the selected campaign'
      default:
        return 'Historical events and campaign timeline'
    }
  }

  const getCampaignId = (): Id<"campaigns"> | undefined => {
    return activeTab === 'campaign' && selectedCampaign 
      ? selectedCampaign as Id<"campaigns">
      : undefined
  }

  const getEventCount = () => {
    switch (activeTab) {
      case 'my':
        return myTimelineEvents?.length || 0
      case 'all':
        return allTimelineEvents?.length || 0
      case 'campaign':
        if (selectedCampaign) {
          return allTimelineEvents?.filter(e => e.campaignId === selectedCampaign).length || 0
        }
        return 0
      default:
        return 0
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Campaign Timeline
          </h1>
          <p className="text-muted-foreground">
            Track historical events and campaign milestones
          </p>
        </div>
      </div>

      <SignedOut>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sign in to view timeline events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to view and manage timeline events for your campaigns.
            </p>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        {/* Sample Data Panel */}
        <SampleDataPanel 
          entityType="timeline" 
          onDataLoaded={() => {
            // Data will automatically refresh via Convex queries
          }} 
        />

        {/* Tab Navigation and Campaign Selection */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'my' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('my')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              My Events
              {myTimelineEvents && (
                <Badge variant="secondary" className="ml-1">
                  {myTimelineEvents.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'campaign' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('campaign')}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Campaign
            </Button>
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('all')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              All Events
              {allTimelineEvents && (
                <Badge variant="secondary" className="ml-1">
                  {allTimelineEvents.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Campaign Selection */}
          {activeTab === 'campaign' && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign._id} value={campaign._id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {campaign.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCampaign && (
                <Badge variant="outline">
                  {getEventCount()} events
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Timeline Events List */}
        {activeTab === 'campaign' && !selectedCampaign ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Select a Campaign</p>
              <p className="text-muted-foreground text-center">
                Choose a campaign from the dropdown above to view its timeline events.
              </p>
            </CardContent>
          </Card>
        ) : (
          <TimelineEventList
            campaignId={getCampaignId()}
            title={getDisplayTitle()}
            description={getDisplayDescription()}
            showCreateButton={true}
            showFilters={true}
            canEdit={true}
          />
        )}
      </SignedIn>
    </div>
  )
}