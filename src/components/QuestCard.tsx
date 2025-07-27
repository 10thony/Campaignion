import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { CheckCircle, Clock, Play, X, MapPin, Trophy } from 'lucide-react'

interface Quest {
  _id: string
  name: string
  description?: string
  status: "idle" | "in_progress" | "completed" | "NotStarted" | "InProgress" | "Failed"
  taskIds?: string[]
  completionXP?: number
  rewards?: {
    xp?: number
    gold?: number
    itemIds?: string[]
  }
  createdAt?: number
}

interface QuestCardProps {
  quest: Quest
  taskCount?: number
  completedTaskCount?: number
  onView?: (questId: string) => void
  onEdit?: (questId: string) => void
  onUpdateStatus?: (questId: string, status: Quest['status']) => void
  canEdit?: boolean
}

export function QuestCard({ 
  quest, 
  taskCount = 0,
  completedTaskCount = 0,
  onView, 
  onEdit, 
  onUpdateStatus,
  canEdit = false 
}: QuestCardProps) {
  // Normalize status for display
  const normalizedStatus = quest.status === "NotStarted" ? "idle" :
                          quest.status === "InProgress" ? "in_progress" :
                          quest.status === "Failed" ? "failed" :
                          quest.status

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "idle":
        return { 
          label: "Not Started", 
          color: "secondary", 
          icon: Clock,
          bgColor: "bg-gray-100"
        }
      case "in_progress":
        return { 
          label: "In Progress", 
          color: "status", 
          icon: Play,
          bgColor: "bg-blue-100"
        }
      case "completed":
        return { 
          label: "Completed", 
          color: "status", 
          icon: CheckCircle,
          bgColor: "bg-green-100"
        }
      case "failed":
        return { 
          label: "Failed", 
          color: "destructive", 
          icon: X,
          bgColor: "bg-red-100"
        }
      default:
        return { 
          label: "Unknown", 
          color: "secondary", 
          icon: Clock,
          bgColor: "bg-gray-100"
        }
    }
  }

  const statusInfo = getStatusInfo(normalizedStatus)
  const StatusIcon = statusInfo.icon
  const progress = taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0

  const totalRewardXP = (quest.completionXP || 0) + (quest.rewards?.xp || 0)

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1 mb-1">{quest.name}</CardTitle>
            {quest.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {quest.description}
              </p>
            )}
          </div>
          <Badge variant={statusInfo.color as any} className="shrink-0 ml-2">
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Task Progress */}
        {taskCount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tasks Progress</span>
              <span className="font-medium">{completedTaskCount}/{taskCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {totalRewardXP > 0 && (
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{totalRewardXP}</span>
                <span className="text-muted-foreground">XP</span>
              </div>
            )}
            {quest.rewards?.gold && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-600 font-bold">$</span>
                <span className="font-medium">{quest.rewards.gold}</span>
                <span className="text-muted-foreground">GP</span>
              </div>
            )}
          </div>
          
          {quest.rewards?.itemIds && quest.rewards.itemIds.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {quest.rewards.itemIds.length} Items
            </Badge>
          )}
        </div>

        {/* Status Actions */}
        {canEdit && normalizedStatus !== "completed" && (
          <div className="flex flex-wrap gap-1">
            {normalizedStatus === "idle" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => onUpdateStatus?.(quest._id, "in_progress")}
              >
                Start Quest
              </Button>
            )}
            {normalizedStatus === "in_progress" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onUpdateStatus?.(quest._id, "completed")}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onUpdateStatus?.(quest._id, "Failed")}
                >
                  Fail
                </Button>
              </>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(quest._id)}
          >
            View Details
          </Button>
          {canEdit && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(quest._id)}
            >
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 