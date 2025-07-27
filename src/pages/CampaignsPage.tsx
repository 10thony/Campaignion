import { useState } from 'react'
import { useQuery } from 'convex/react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { CampaignCard } from '@/components/CampaignCard'
import { CampaignModal } from '@/components/modals/CampaignModal'
import { SampleDataPanel } from '@/components/SampleDataPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { api } from '../../convex/_generated/api'

export function CampaignsPage() {
  const campaigns = useQuery(api.campaigns.getCampaigns)
  const myCampaigns = useQuery(api.campaigns.getMyCampaigns)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)

  const handleViewCampaign = (campaignId: string) => {
    const campaign = [...(myCampaigns || []), ...(campaigns || [])].find(c => c._id === campaignId)
    if (campaign) {
      setSelectedCampaign(campaign)
      setModalMode("view")
      setModalOpen(true)
    }
  }

  const handleEditCampaign = (campaignId: string) => {
    const campaign = myCampaigns?.find(c => c._id === campaignId)
    if (campaign) {
      setSelectedCampaign(campaign)
      setModalMode("edit")
      setModalOpen(true)
    }
  }

  const handleCreateCampaign = () => {
    setSelectedCampaign(null)
    setModalMode("create")
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Modal will close itself, this is called after successful creation/edit
    // The queries will automatically refetch due to Convex reactivity
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your D&D campaigns and join others
          </p>
        </div>
        
        <SignedIn>
          <Button onClick={handleCreateCampaign}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </SignedIn>
      </div>

      <SignedOut>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to view campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to view and manage your D&D campaigns.
            </p>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        {/* Sample Data Panel */}
        <SampleDataPanel 
          entityType="campaigns" 
          onDataLoaded={() => {
            // Refresh the page data
            window.location.reload()
          }} 
        />

        {/* My Campaigns Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">My Campaigns</h2>
          {myCampaigns === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : myCampaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  You haven't created any campaigns yet.
                </p>
                <Button onClick={handleCreateCampaign}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign._id}
                  campaign={campaign}
                  dmName="You" // Since these are user's campaigns
                  onView={handleViewCampaign}
                  onEdit={handleEditCampaign}
                  canEdit={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Public Campaigns Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Public Campaigns</h2>
          {campaigns === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  No public campaigns available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns
                .filter(campaign => campaign.isPublic)
                .map((campaign) => (
                  <CampaignCard
                    key={campaign._id}
                    campaign={campaign}
                    dmName="DM" // TODO: Fetch actual DM name
                    onView={handleViewCampaign}
                    canEdit={false}
                  />
                ))}
            </div>
          )}
        </div>
      </SignedIn>

      <CampaignModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        campaign={selectedCampaign}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
} 