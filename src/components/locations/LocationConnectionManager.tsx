import React, { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { 
  Network, 
  MapPin, 
  Plus,
  X,
  RouterIcon,
  Clock,
  Star,
  AlertTriangle,
  Home,
  Building,
  Castle,
  Trees,
  Mountain,
  Church,
  Skull,
  Tent,
  Zap,
  Ship,
  Car,
  Footprints,
  ExternalLink
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

interface Location {
  _id: Id<"locations">
  name: string
  type: "Town" | "City" | "Village" | "Dungeon" | "Castle" | "Forest" | "Mountain" | "Temple" | "Ruins" | "Camp" | "Other"
  linkedLocations?: Id<"locations">[]
  campaignId?: Id<"campaigns">
}

interface LocationConnectionManagerProps {
  location: Location
  allLocations: Location[]
  isReadOnly: boolean
  onConnectionsUpdated?: () => void
}

interface TravelRoute {
  id: string
  method: 'walking' | 'horseback' | 'ship' | 'teleportation' | 'other'
  duration: string
  difficulty: 'easy' | 'moderate' | 'hard' | 'dangerous'
  notes?: string
}

interface ConnectionData {
  locationId: Id<"locations">
  routes: TravelRoute[]
  isBidirectional: boolean
}

// Location type configuration
const LOCATION_TYPE_CONFIG = {
  "Town": { icon: Home, color: "text-blue-600" },
  "City": { icon: Building, color: "text-purple-600" },
  "Village": { icon: Home, color: "text-green-600" },
  "Dungeon": { icon: Skull, color: "text-red-600" },
  "Castle": { icon: Castle, color: "text-gray-600" },
  "Forest": { icon: Trees, color: "text-emerald-600" },
  "Mountain": { icon: Mountain, color: "text-stone-600" },
  "Temple": { icon: Church, color: "text-yellow-600" },
  "Ruins": { icon: Skull, color: "text-orange-600" },
  "Camp": { icon: Tent, color: "text-amber-600" },
  "Other": { icon: MapPin, color: "text-gray-600" }
} as const

const TRAVEL_METHODS = [
  { value: 'walking', label: 'Walking', icon: Footprints, description: 'On foot travel' },
  { value: 'horseback', label: 'Horseback', icon: Car, description: 'Mounted travel' },
  { value: 'ship', label: 'Ship/Boat', icon: Ship, description: 'Water travel' },
  { value: 'teleportation', label: 'Teleportation', icon: Zap, description: 'Magical transport' },
  { value: 'other', label: 'Other', icon: RouterIcon, description: 'Custom travel method' },
] as const

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: 'text-green-600', description: 'Safe, well-traveled routes' },
  { value: 'moderate', label: 'Moderate', color: 'text-yellow-600', description: 'Some hazards possible' },
  { value: 'hard', label: 'Hard', color: 'text-orange-600', description: 'Dangerous terrain or enemies' },
  { value: 'dangerous', label: 'Dangerous', color: 'text-red-600', description: 'High risk of death' },
] as const

export function LocationConnectionManager({
  location,
  allLocations,
  isReadOnly,
  onConnectionsUpdated
}: LocationConnectionManagerProps) {
  const [showAddConnection, setShowAddConnection] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [newRoute, setNewRoute] = useState<Partial<TravelRoute>>({
    method: 'walking',
    duration: '',
    difficulty: 'moderate',
    notes: ''
  })
  const [isBidirectional, setIsBidirectional] = useState(true)

  // Convex mutations
  const addConnection = useMutation(api.locations.addLocationConnection)
  const removeConnection = useMutation(api.locations.removeLocationConnection)

  // Get available locations for connections (exclude current location and already connected)
  const availableLocations = allLocations?.filter(loc => 
    loc._id !== location._id && 
    !location.linkedLocations?.includes(loc._id) &&
    (!location.campaignId || loc.campaignId === location.campaignId) // Only show locations from same campaign or global
  ) || []

  const connectedLocations = allLocations?.filter(loc => 
    location.linkedLocations?.includes(loc._id)
  ) || []

  const handleAddConnection = async () => {
    if (!selectedLocationId) {
      toast.error("Please select a location to connect")
      return
    }

    try {
      await addConnection({
        locationId: location._id,
        connectedLocationId: selectedLocationId as Id<"locations">,
        bidirectional: isBidirectional
      })
      
      toast.success("Connection added successfully!")
      setShowAddConnection(false)
      setSelectedLocationId("")
      setNewRoute({
        method: 'walking',
        duration: '',
        difficulty: 'moderate',
        notes: ''
      })
      onConnectionsUpdated?.()
    } catch (error) {
      console.error("Failed to add connection:", error)
      toast.error("Failed to add connection. Please try again.")
    }
  }

  const handleRemoveConnection = async (connectedLocationId: Id<"locations">) => {
    try {
      await removeConnection({
        locationId: location._id,
        connectedLocationId,
        bidirectional: true // Remove both directions by default
      })
      
      toast.success("Connection removed successfully!")
      onConnectionsUpdated?.()
    } catch (error) {
      console.error("Failed to remove connection:", error)
      toast.error("Failed to remove connection. Please try again.")
    }
  }

  const getLocationIcon = (type: string) => {
    return LOCATION_TYPE_CONFIG[type as keyof typeof LOCATION_TYPE_CONFIG]?.icon || MapPin
  }

  const getDifficultyInfo = (difficulty: string) => {
    return DIFFICULTY_LEVELS.find(d => d.value === difficulty)
  }

  const getTravelMethodInfo = (method: string) => {
    return TRAVEL_METHODS.find(m => m.value === method)
  }

  return (
    <div className="space-y-4">
      {/* Connection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Location Connections
            <Badge variant="secondary">
              {connectedLocations.length} Connected
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage connections between locations for travel planning and exploration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isReadOnly && (
            <Dialog open={showAddConnection} onOpenChange={setShowAddConnection}>
              <DialogTrigger asChild>
                <Button size="sm" className="mb-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Location Connection</DialogTitle>
                  <DialogDescription>
                    Connect this location to another for travel planning
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Connect to Location</label>
                    <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLocations.map((loc) => {
                          const Icon = getLocationIcon(loc.type)
                          return (
                            <SelectItem key={loc._id} value={loc._id}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{loc.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {loc.type}
                                </Badge>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bidirectional"
                      checked={isBidirectional}
                      onChange={(e) => setIsBidirectional(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="bidirectional" className="text-sm">
                      Bidirectional connection (both ways)
                    </label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddConnection(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddConnection} disabled={!selectedLocationId}>
                    Add Connection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Connected Locations List */}
          {connectedLocations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No Connections</p>
              <p className="text-sm">
                {isReadOnly 
                  ? "This location has no connections to other places"
                  : "Link this location to other places for easier navigation"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedLocations.map((connectedLocation) => {
                const Icon = getLocationIcon(connectedLocation.type)
                const typeConfig = LOCATION_TYPE_CONFIG[connectedLocation.type]
                
                return (
                  <div 
                    key={connectedLocation._id} 
                    className="flex items-center gap-3 p-4 bg-muted rounded-lg border"
                  >
                    <Icon className={`h-6 w-6 ${typeConfig.color}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{connectedLocation.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {connectedLocation.type}
                        </Badge>
                        {connectedLocation.campaignId ? (
                          <Badge variant="secondary" className="text-xs">
                            Campaign
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            Global
                          </Badge>
                        )}
                      </div>
                      
                      {/* Travel Information Placeholder */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Footprints className="h-3 w-3" />
                          <span>Walking</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>~2 hours</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>Moderate</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: Open location details */}}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {!isReadOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveConnection(connectedLocation._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Travel Planning Information */}
      {connectedLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RouterIcon className="h-5 w-5" />
              Travel Planning
            </CardTitle>
            <CardDescription>
              Quick reference for travel between connected locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Travel Methods Legend */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <RouterIcon className="h-4 w-4" />
                    Travel Methods
                  </h4>
                  <div className="space-y-2">
                    {TRAVEL_METHODS.slice(0, 4).map((method) => {
                      const Icon = method.icon
                      return (
                        <div key={method.value} className="flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{method.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Difficulty Legend */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Difficulty Levels
                  </h4>
                  <div className="space-y-2">
                    {DIFFICULTY_LEVELS.map((difficulty) => (
                      <div key={difficulty.value} className="flex items-center gap-2 text-sm">
                        <Star className={`h-4 w-4 ${difficulty.color}`} />
                        <span>{difficulty.label}</span>
                        <span className="text-muted-foreground text-xs">
                          - {difficulty.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <p>
                  <strong>Note:</strong> Advanced travel route management with custom travel times, 
                  costs, and encounter tables will be available in a future update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}