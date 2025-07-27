import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Users, Eye, EyeOff } from 'lucide-react'

interface Campaign {
  _id: string
  name: string
  description?: string
  dmId: string
  players?: string[]
  isPublic: boolean
  createdAt: number
}

interface CampaignCardProps {
  campaign: Campaign
  dmName?: string
  onView?: (campaignId: string) => void
  onEdit?: (campaignId: string) => void
  canEdit?: boolean
}

export function CampaignCard({ 
  campaign, 
  dmName, 
  onView, 
  onEdit, 
  canEdit = false 
}: CampaignCardProps) {
  const playerCount = campaign.players?.length || 0

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1">{campaign.name}</CardTitle>
          <div className="flex items-center gap-1">
            {campaign.isPublic ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge variant="outline">
              {campaign.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">DM:</span>
            <span className="font-medium">{dmName || 'Unknown'}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{playerCount} players</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(campaign._id)}
          >
            View
          </Button>
          {canEdit && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(campaign._id)}
            >
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 