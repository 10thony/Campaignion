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
  MapPin, 
  Users, 
  Network, 
  StickyNote, 
  Image as ImageIcon,
  Building,
  Castle,
  Trees,
  Mountain,
  Church,
  Skull,
  Tent,
  Home,
  Eye,
  EyeOff,
  Plus,
  X,
  ExternalLink,
  Shield,
  Crown,
  History
} from "lucide-react"

import { api } from "../../../convex/_generated/api"
import { Id } from "../../../convex/_generated/dataModel"
import { locationSchema, LocationFormData } from "../../lib/validation/schemas"
import { useAuthenticationGuard, useModalAccess } from "../../hooks/useAuthenticationGuard"
import { LocationConnectionManager } from "../locations/LocationConnectionManager"

// Location Types with appropriate D&D icons
const LOCATION_TYPE_OPTIONS = [
  { value: "Town", label: "Town", icon: Home, description: "Small settlements and communities" },
  { value: "City", label: "City", icon: Building, description: "Large urban centers" },
  { value: "Village", label: "Village", icon: Home, description: "Rural communities and hamlets" },
  { value: "Dungeon", label: "Dungeon", icon: Skull, description: "Underground complexes and ruins" },
  { value: "Castle", label: "Castle", icon: Castle, description: "Fortified structures and keeps" },
  { value: "Forest", label: "Forest", icon: Trees, description: "Wooded areas and natural groves" },
  { value: "Mountain", label: "Mountain", icon: Mountain, description: "Peaks, ranges, and highland areas" },
  { value: "Temple", label: "Temple", icon: Church, description: "Religious sites and sacred places" },
  { value: "Ruins", label: "Ruins", icon: Skull, description: "Abandoned and ancient structures" },
  { value: "Camp", label: "Camp", icon: Tent, description: "Temporary settlements and outposts" },
  { value: "Other", label: "Other", icon: MapPin, description: "Custom location types" },
] as const

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

interface LocationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "read" | "create" | "edit"
  location?: Location
  onSuccess?: () => void
  defaultTab?: string
}

export function LocationModal({
  open,
  onOpenChange,
  mode,
  location,
  onSuccess,
  defaultTab = "basic",
}: LocationModalProps) {
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
    "location",
    location
  )
  
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState("")
  
  // Convex queries and mutations
  const createLocation = useMutation(api.locations.createLocation)
  const updateLocation = useMutation(api.locations.updateLocation)
  const campaigns = useQuery(api.campaigns.getMyCampaigns)
  const allLocations = useQuery(
    api.locations.getLocations,
    location?.campaignId ? { campaignId: location.campaignId } : "skip"
  )
  const characters = useQuery(
    api.characters.getCharacters,
    location?.campaignId ? { campaignId: location.campaignId } : "skip"
  )
  const interactions = useQuery(
    api.interactions.getInteractions,
    location?.campaignId ? { campaignId: location.campaignId } : "skip"
  )
  
  // State-specific behavior
  const isReadOnly = mode === "read"
  const isCreating = mode === "create"
  const isEditing = mode === "edit"
  
  // Form setup with enhanced validation
  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || "",
      description: location?.description || "",
      type: location?.type || "Other",
      campaignId: location?.campaignId || undefined,
      notableCharacterIds: location?.notableCharacterIds || [],
      linkedLocations: location?.linkedLocations || [],
      population: location?.population || undefined,
      government: location?.government || "",
      defenses: location?.defenses || "",
      imageUrls: location?.imageUrls || [],
      mapId: location?.mapId || undefined,
      publicInformation: location?.publicInformation || "",
      secrets: location?.secrets || "",
      dmNotes: location?.dmNotes || "",
      interactionsAtLocation: location?.interactionsAtLocation || [],
    },
  })

  React.useEffect(() => {
    if (location && (mode === "edit" || mode === "read")) {
      form.reset({
        name: location.name,
        description: location.description,
        type: location.type,
        campaignId: location.campaignId || undefined,
        notableCharacterIds: location.notableCharacterIds || [],
        linkedLocations: location.linkedLocations || [],
        population: location.population || undefined,
        government: location.government || "",
        defenses: location.defenses || "",
        imageUrls: location.imageUrls || [],
        mapId: location.mapId || undefined,
        publicInformation: location.publicInformation || "",
        secrets: location.secrets || "",
        dmNotes: location.dmNotes || "",
        interactionsAtLocation: location.interactionsAtLocation || [],
      })
    } else if (mode === "create") {
      form.reset({
        name: "",
        description: "",
        type: "Other",
        campaignId: undefined,
        notableCharacterIds: [],
        linkedLocations: [],
        population: undefined,
        government: "",
        defenses: "",
        imageUrls: [],
        mapId: undefined,
        publicInformation: "",
        secrets: "",
        dmNotes: "",
        interactionsAtLocation: [],
      })
    }
  }, [location, mode, form])

  const onSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true)
    try {
      if (mode === "create") {
        await createLocation(data)
        toast.success("Location created successfully!")
      } else if (mode === "edit" && location) {
        await updateLocation({ id: location._id, ...data })
        toast.success("Location updated successfully!")
      }
      
      onSuccess?.()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Failed to save location:", error)
      toast.error("Failed to save location. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getModalTitle = () => {
    switch (mode) {
      case "create":
        return "Create Location"
      case "edit":
        return "Edit Location"
      case "read":
        return "Location Details"
      default:
        return "Location"
    }
  }

  const getModalDescription = () => {
    switch (mode) {
      case "read":
        return "View location details and connections"
      case "create":
        return "Create a new location for your campaign"
      case "edit":
        return "Modify location details and connections"
      default:
        return ""
    }
  }

  const getLocationTypeIcon = (type: string) => {
    const locationType = LOCATION_TYPE_OPTIONS.find(t => t.value === type)
    return locationType ? locationType.icon : MapPin
  }

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      const currentUrls = form.getValues("imageUrls") || []
      form.setValue("imageUrls", [...currentUrls, newImageUrl.trim()])
      setNewImageUrl("")
    }
  }

  const removeImageUrl = (index: number) => {
    const currentUrls = form.getValues("imageUrls") || []
    form.setValue("imageUrls", currentUrls.filter((_, i) => i !== index))
  }

  const formatPopulation = (pop: number) => {
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`
    if (pop >= 1000) return `${(pop / 1000).toFixed(1)}K`
    return pop.toString()
  }

  const LocationIcon = location ? getLocationTypeIcon(location.type) : MapPin
  const availableConnections = allLocations?.filter(l => l._id !== location?._id) || []
  const notableCharacters = characters?.filter(c => 
    location?.notableCharacterIds?.includes(c._id)
  ) || []
  const locationInteractions = interactions?.filter(i => 
    location?.interactionsAtLocation?.includes(i._id)
  ) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LocationIcon className="h-5 w-5" />
            {getModalTitle()}
            {location && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {LOCATION_TYPE_OPTIONS.find(opt => opt.value === location.type)?.label || location.type}
                </Badge>
                {location.population && (
                  <Badge variant="secondary">
                    Pop: {formatPopulation(location.population)}
                  </Badge>
                )}
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic" className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="characters" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Characters
                </TabsTrigger>
                <TabsTrigger value="connections" className="flex items-center gap-1">
                  <Network className="h-3 w-3" />
                  Connections
                </TabsTrigger>
                <TabsTrigger value="interactions" className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  History
                </TabsTrigger>
                <TabsTrigger value="secrets" className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Secrets
                </TabsTrigger>
              </TabsList>
              
              <div className="overflow-y-auto flex-1 mt-4 space-y-4">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Location Information</CardTitle>
                      <CardDescription>
                        Core details about this location
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Name *</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isReadOnly} placeholder="Enter location name..." />
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
                                placeholder="Describe the location's appearance and atmosphere..."
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
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {LOCATION_TYPE_OPTIONS.map((option) => (
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
                          name="campaignId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select campaign (optional)" />
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
                              <FormDescription>
                                Leave empty for global locations
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="population"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Population</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  min="0"
                                  disabled={isReadOnly}
                                  placeholder="Number of inhabitants"
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="government"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Government</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={isReadOnly}
                                  placeholder="e.g., Mayor, Lord, Council"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="defenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Defenses</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={isReadOnly}
                                  placeholder="e.g., City walls, Guards"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Image Management */}
                      <div className="space-y-3">
                        <Label>Location Images</Label>
                        <div className="space-y-2">
                          {form.watch("imageUrls")?.map((url, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 text-sm truncate">{url}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              {!isReadOnly && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeImageUrl(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {!isReadOnly && (
                            <div className="flex gap-2">
                              <Input
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="Enter image URL..."
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                              />
                              <Button type="button" onClick={addImageUrl} size="sm">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Characters Tab */}
                <TabsContent value="characters" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notable Characters</CardTitle>
                      <CardDescription>
                        NPCs and important figures associated with this location
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {notableCharacters.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No Notable Characters</p>
                          <p className="text-sm">Add characters to see them listed here</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {notableCharacters.map((character) => (
                            <div key={character._id} className="p-3 border rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{character.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {character.race} {character.class}
                                  </p>
                                  {character.characterType === "npc" && (
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                      NPC
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-center text-muted-foreground py-4">
                        <p className="text-sm">Character assignment management coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Connections Tab */}
                <TabsContent value="connections" className="space-y-4">
                  <LocationConnectionManager
                    location={location || form.getValues()}
                    allLocations={availableConnections}
                    isReadOnly={isReadOnly}
                    onConnectionsUpdated={() => {
                      // Refetch location data to update the UI
                      // The queries will automatically refetch due to Convex reactivity
                    }}
                  />
                </TabsContent>

                {/* Interactions Tab */}
                <TabsContent value="interactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Interaction History</CardTitle>
                      <CardDescription>
                        Past events and interactions that occurred at this location
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {locationInteractions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No Interaction History</p>
                          <p className="text-sm">Interactions that happen here will be recorded automatically</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {locationInteractions.map((interaction) => (
                            <div key={interaction._id} className="p-3 border rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{interaction.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(interaction.createdAt || 0).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="outline">{interaction.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Secrets Tab */}
                <TabsContent value="secrets" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Location Information</CardTitle>
                      <CardDescription>
                        Public information and hidden secrets
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="publicInformation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Public Information
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                disabled={isReadOnly}
                                placeholder="Information commonly known about this location..."
                                rows={3}
                              />
                            </FormControl>
                            <FormDescription>
                              This information is generally known and may be shared with players
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {(isCampaignMaster(location?.campaignId || "") || isAdmin) && (
                        <>
                          <FormField
                            control={form.control}
                            name="secrets"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <EyeOff className="h-4 w-4" />
                                  Location Secrets
                                </FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    disabled={isReadOnly}
                                    placeholder="Hidden features, secret passages, buried treasures..."
                                    rows={3}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Secret information that requires investigation or exploration to discover
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
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
                                    placeholder="Private notes for the DM about this location..."
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
                        </>
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
                {mode === "create" ? "Create Location" : "Save Changes"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}