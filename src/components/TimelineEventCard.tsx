import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Sword,
  UserPlus,
  Eye,
  Zap,
  Crown,
  BookOpen,
  Target,
  Clock,
  Play,
  CheckCircle,
  Edit,
  ExternalLink
} from 'lucide-react'
import { Id } from '../../convex/_generated/dataModel'

// Timeline Event Types with D&D appropriate icons
const EVENT_TYPE_ICONS = {
  "Battle": Sword,
  "Alliance": UserPlus,
  "Discovery": Eye,
  "Disaster": Zap,
  "Political": Crown,
  "Cultural": BookOpen,
  "Custom": Target,
} as const

const STATUS_CONFIG = {
  "idle": { label: "Planned", icon: Clock, variant: "outline" as const, bgColor: "bg-gray-100" },
  "in_progress": { label: "Happening", icon: Play, variant: "secondary" as const, bgColor: "bg-blue-100" },
  "completed": { label: "Historical", icon: CheckCircle, variant: "default" as const, bgColor: "bg-green-100" },
} as const

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
  isPublic?: boolean
  createdAt?: number
}

interface TimelineEventCardProps {
  timelineEvent: TimelineEvent
  onView?: (eventId: string) => void
  onEdit?: (eventId: string) => void
  canEdit?: boolean
  showCampaignBadge?: boolean
}

export function TimelineEventCard({ 
  timelineEvent, 
  onView, 
  onEdit, 
  canEdit = false,
  showCampaignBadge = false
}: TimelineEventCardProps) {
  const TypeIcon = EVENT_TYPE_ICONS[timelineEvent.type] || Target
  const statusConfig = STATUS_CONFIG[timelineEvent.status]
  const StatusIcon = statusConfig.icon

  const formatEventDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const { date, time } = formatEventDate(timelineEvent.date)

  const relatedEntitiesCount = 
    (timelineEvent.relatedLocationIds?.length || 0) +
    (timelineEvent.relatedNpcIds?.length || 0) +
    (timelineEvent.relatedFactionIds?.length || 0) +
    (timelineEvent.relatedQuestIds?.length || 0)

  return (
    <Card className={`hover:shadow-md transition-all cursor-pointer ${statusConfig.bgColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-1">
              <TypeIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight line-clamp-2">
                {timelineEvent.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={statusConfig.variant}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {timelineEvent.type}
                </Badge>
                {!timelineEvent.isPublic && (
                  <Badge variant="secondary" className="text-xs">
                    DM Only
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Event Date */}
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{date}</span>
          <span className="text-xs opacity-70">{time}</span>
        </div>

        {/* Description */}
        {timelineEvent.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {timelineEvent.description}
          </p>
        )}

        {/* Event Metadata */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
          {timelineEvent.primaryQuestId && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Primary Quest
            </span>
          )}
          {relatedEntitiesCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {relatedEntitiesCount} related
            </span>
          )}
          {timelineEvent.relatedLocationIds && timelineEvent.relatedLocationIds.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {timelineEvent.relatedLocationIds.length} location{timelineEvent.relatedLocationIds.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(timelineEvent._id)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {canEdit && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(timelineEvent._id)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}