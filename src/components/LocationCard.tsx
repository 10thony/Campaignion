import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  MapPin, 
  Users, 
  Network,
  Home,
  Building,
  Castle,
  Trees,
  Mountain,
  Church,
  Skull,
  Tent,
  Crown,
  Shield,
  Eye,
  EyeOff,
  Image as ImageIcon,
  History
} from 'lucide-react'
import { Id } from '../../convex/_generated/dataModel'

interface Location {
  _id: Id<"locations">
  name: string
  description: string
  type: "Town" | "City" | "Village" | "Dungeon" | "Castle" | "Forest" | "Mountain" | "Temple" | "Ruins" | "Camp" | "Other"
  campaignId?: Id<"campaigns">
  notableCharacterIds?: Id<"characters">[]
  linkedLocations?: Id<"locations">[]
  population?: number
  government?: string
  defenses?: string
  imageUrls?: string[]
  mapId?: Id<"maps">
  publicInformation?: string
  secrets?: string
  dmNotes?: string
  interactionsAtLocation?: Id<"interactions">[]
}

interface LocationCardProps {
  location: Location
  characterCount?: number
  connectionCount?: number
  interactionCount?: number
  onView?: (locationId: string) => void
  onEdit?: (locationId: string) => void
  canEdit?: boolean
  showSecrets?: boolean
}

// Location type configuration with D&D appropriate icons and styling
const LOCATION_TYPE_CONFIG = {
  "Town": { icon: Home, color: "bg-blue-100 text-blue-700", label: "Town" },
  "City": { icon: Building, color: "bg-purple-100 text-purple-700", label: "City" },
  "Village": { icon: Home, color: "bg-green-100 text-green-700", label: "Village" },
  "Dungeon": { icon: Skull, color: "bg-red-100 text-red-700", label: "Dungeon" },
  "Castle": { icon: Castle, color: "bg-gray-100 text-gray-700", label: "Castle" },
  "Forest": { icon: Trees, color: "bg-emerald-100 text-emerald-700", label: "Forest" },
  "Mountain": { icon: Mountain, color: "bg-stone-100 text-stone-700", label: "Mountain" },
  "Temple": { icon: Church, color: "bg-yellow-100 text-yellow-700", label: "Temple" },
  "Ruins": { icon: Skull, color: "bg-orange-100 text-orange-700", label: "Ruins" },
  "Camp": { icon: Tent, color: "bg-amber-100 text-amber-700", label: "Camp" },
  "Other": { icon: MapPin, color: "bg-gray-100 text-gray-700", label: "Other" }
} as const

export function LocationCard({ 
  location, 
  characterCount = 0,
  connectionCount = 0,
  interactionCount = 0,
  onView, 
  onEdit, 
  canEdit = false,
  showSecrets = false
}: LocationCardProps) {
  
  const typeConfig = LOCATION_TYPE_CONFIG[location.type]
  const TypeIcon = typeConfig.icon
  
  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`
    if (pop >= 1000) return `${(pop / 1000).toFixed(1)}K`
    return pop.toString()
  }

  const hasSecrets = Boolean(location.secrets || location.dmNotes)
  const hasConnections = (location.linkedLocations?.length || 0) > 0
  const hasCharacters = (location.notableCharacterIds?.length || 0) > 0
  const hasInteractions = (location.interactionsAtLocation?.length || 0) > 0
  const hasImages = (location.imageUrls?.length || 0) > 0

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TypeIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg line-clamp-1">{location.name}</CardTitle>
            </div>
            {location.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {location.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            <Badge variant="outline" className={`shrink-0 ${typeConfig.color}`}>
              {typeConfig.label}
            </Badge>
            {location.population && (
              <Badge variant="secondary" className="text-xs">
                Pop: {formatPopulation(location.population)}
              </Badge>
            )}
            {location.campaignId && (
              <Badge variant="default" className="text-xs">
                Campaign
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Government and Defenses */}
        {(location.government || location.defenses) && (
          <div className="flex flex-wrap gap-2 text-xs">
            {location.government && (
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3 text-amber-500" />
                <span className="font-medium">{location.government}</span>
              </div>
            )}
            {location.defenses && (
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-500" />
                <span className="font-medium">{location.defenses}</span>
              </div>
            )}
          </div>
        )}

        {/* Location Statistics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Characters:</span>
            <span className="font-medium">{characterCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Connections:</span>
            <span className="font-medium">{connectionCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Interactions:</span>
            <span className="font-medium">{interactionCount}</span>
          </div>
          {hasImages && (
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Images:</span>
              <span className="font-medium">{location.imageUrls?.length}</span>
            </div>
          )}
        </div>

        {/* Features Indicators */}
        <div className="flex flex-wrap gap-1">
          {hasConnections && (
            <Badge variant="outline" className="text-xs">
              <Network className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {hasCharacters && (
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              NPCs
            </Badge>
          )}
          {hasInteractions && (
            <Badge variant="outline" className="text-xs">
              <History className="h-3 w-3 mr-1" />
              Events
            </Badge>
          )}
          {location.mapId && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              Mapped
            </Badge>
          )}
          {showSecrets && hasSecrets && (
            <Badge variant="secondary" className="text-xs">
              <EyeOff className="h-3 w-3 mr-1" />
              Secrets
            </Badge>
          )}
          {location.publicInformation && (
            <Badge variant="outline" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Public Info
            </Badge>
          )}
        </div>

        {/* Public Information Preview (if available) */}
        {location.publicInformation && (
          <div className="bg-muted/50 p-2 rounded text-xs">
            <p className="text-muted-foreground line-clamp-2">
              {location.publicInformation}
            </p>
          </div>
        )}

        {/* DM Secrets Preview (only if showSecrets is true) */}
        {showSecrets && hasSecrets && (
          <div className="bg-red-50 p-2 rounded text-xs border border-red-200">
            <div className="flex items-center gap-1 mb-1">
              <EyeOff className="h-3 w-3 text-red-600" />
              <span className="font-medium text-red-800">DM Only</span>
            </div>
            <p className="text-red-700 line-clamp-2">
              {location.secrets || location.dmNotes || "Secret information available"}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(location._id)}
          >
            View Details
          </Button>
          {canEdit && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(location._id)}
            >
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}