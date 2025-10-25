import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { LocationCard } from '@/components/LocationCard'
import { LocationModal } from '@/components/modals/LocationModal'
import { SampleDataPanel } from '@/components/SampleDataPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  MapPin, 
  Building, 
  Home, 
  Castle,
  Trees,
  Mountain,
  Church,
  Skull,
  Tent,
  Globe,
  Filter
} from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { useAuthenticatedUser } from '@/hooks/useAuthenticationGuard'

type LocationType = "Town" | "City" | "Village" | "Dungeon" | "Castle" | "Forest" | "Mountain" | "Temple" | "Ruins" | "Camp" | "Other"

export function LocationsPage() {
  const locations = useQuery(api.locations.getLocations)
  const myLocations = useQuery(api.locations.getMyLocations)
  const globalLocations = useQuery(api.locations.getGlobalLocations)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<LocationType | ''>('')
  const [activeTab, setActiveTab] = useState<'my' | 'global' | 'all'>('my')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "read">("create")
  const [selectedLocation, setSelectedLocation] = useState<any>(null)

  // Get authenticated user for permission checking
  const { databaseUser } = useAuthenticatedUser()

  const filterLocations = (locationList: any[]) => {
    return locationList?.filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (location.government && location.government.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesType = !selectedType || location.type === selectedType
      return matchesSearch && matchesType
    })
  }

  const filteredMyLocations = filterLocations(myLocations || [])
  const filteredGlobalLocations = filterLocations(globalLocations || [])
  const filteredAllLocations = filterLocations(locations || [])

  const handleViewLocation = (locationId: string) => {
    const allLocationsList = [...(myLocations || []), ...(globalLocations || []), ...(locations || [])]
    const location = allLocationsList.find(l => l._id === locationId)
    if (location) {
      setSelectedLocation(location)
      setModalMode("read")
      setModalOpen(true)
    }
  }

  const handleEditLocation = (locationId: string) => {
    const location = myLocations?.find(l => l._id === locationId)
    if (location) {
      setSelectedLocation(location)
      setModalMode("edit")
      setModalOpen(true)
    }
  }

  const handleCreateLocation = () => {
    setSelectedLocation(null)
    setModalMode("create")
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Modal will close itself, this is called after successful creation/edit
    // The queries will automatically refetch due to Convex reactivity
  }

  const locationTypeOptions: Array<{ value: LocationType | '', label: string, icon: any }> = [
    { value: '', label: 'All Types', icon: Filter },
    { value: 'City', label: 'Cities', icon: Building },
    { value: 'Town', label: 'Towns', icon: Home },
    { value: 'Village', label: 'Villages', icon: Home },
    { value: 'Castle', label: 'Castles', icon: Castle },
    { value: 'Dungeon', label: 'Dungeons', icon: Skull },
    { value: 'Forest', label: 'Forests', icon: Trees },
    { value: 'Mountain', label: 'Mountains', icon: Mountain },
    { value: 'Temple', label: 'Temples', icon: Church },
    { value: 'Ruins', label: 'Ruins', icon: Skull },
    { value: 'Camp', label: 'Camps', icon: Tent },
    { value: 'Other', label: 'Other', icon: MapPin },
  ]

  const getLocationStats = (locationList: any[]) => {
    if (!locationList) return { 
      total: 0, 
      settlements: 0, 
      wilderness: 0, 
      structures: 0,
      connected: 0,
      withSecrets: 0
    }
    
    const settlements = ['City', 'Town', 'Village']
    const wilderness = ['Forest', 'Mountain']
    const structures = ['Castle', 'Dungeon', 'Temple', 'Ruins', 'Camp']
    
    return {
      total: locationList.length,
      settlements: locationList.filter(l => settlements.includes(l.type)).length,
      wilderness: locationList.filter(l => wilderness.includes(l.type)).length,
      structures: locationList.filter(l => structures.includes(l.type)).length,
      connected: locationList.filter(l => (l.linkedLocations?.length || 0) > 0).length,
      withSecrets: locationList.filter(l => l.secrets || l.dmNotes).length,
    }
  }

  const renderLocationGrid = (locationList: any[], canEdit = false, showSecrets = false) => {
    if (!locationList) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )
    }

    if (locationList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedType 
                ? 'No locations match your search criteria.' 
                : 'No locations found.'}
            </p>
            {!searchTerm && !selectedType && activeTab === 'my' && (
              <Button onClick={handleCreateLocation}>
                <Plus className="h-4 w-4 mr-2" />
                Create Location
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locationList.map((location) => (
          <LocationCard
            key={location._id}
            location={location}
            characterCount={location.notableCharacterIds?.length || 0}
            connectionCount={location.linkedLocations?.length || 0}
            interactionCount={location.interactionsAtLocation?.length || 0}
            onView={handleViewLocation}
            onEdit={handleEditLocation}
            canEdit={canEdit}
            showSecrets={showSecrets}
          />
        ))}
      </div>
    )
  }

  const getCurrentLocations = () => {
    switch (activeTab) {
      case 'my':
        return filteredMyLocations
      case 'global':
        return filteredGlobalLocations
      case 'all':
        return filteredAllLocations
      default:
        return filteredMyLocations
    }
  }

  const getStatsSource = () => {
    switch (activeTab) {
      case 'my':
        return myLocations || []
      case 'global':
        return globalLocations || []
      case 'all':
        return locations || []
      default:
        return myLocations || []
    }
  }

  const currentLocations = getCurrentLocations()
  const stats = getLocationStats(getStatsSource())
  const isDM = databaseUser?.role === 'admin' // For showing secrets

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Realm Atlas</h1>
          <p className="text-muted-foreground">
            Explore and manage locations across your D&D campaigns
          </p>
        </div>
        
        <SignedIn>
          <Button onClick={handleCreateLocation}>
            <Plus className="h-4 w-4 mr-2" />
            Create Location
          </Button>
        </SignedIn>
      </div>

      <SignedOut>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to manage locations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to create and manage locations for your campaigns.
            </p>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        {/* Sample Data Panel */}
        <SampleDataPanel 
          entityType="locations" 
          onDataLoaded={() => {
            // Data will automatically refresh via Convex queries
          }} 
        />

        {/* Tab Navigation and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'my' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('my')}
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              My Locations
              {myLocations && (
                <Badge variant="secondary" className="ml-1">
                  {myLocations.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'global' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('global')}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Global
              {globalLocations && (
                <Badge variant="secondary" className="ml-1">
                  {globalLocations.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="gap-2"
            >
              <Building className="h-4 w-4" />
              All Locations
              {locations && (
                <Badge variant="secondary" className="ml-1">
                  {locations.length}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex flex-1 gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-1 flex-wrap">
              {locationTypeOptions.slice(0, 5).map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    variant={selectedType === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(option.value)}
                    className="gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Location Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Locations</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.settlements}</div>
              <div className="text-sm text-muted-foreground">Settlements</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.wilderness}</div>
              <div className="text-sm text-muted-foreground">Wilderness</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.structures}</div>
              <div className="text-sm text-muted-foreground">Structures</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.connected}</div>
              <div className="text-sm text-muted-foreground">Connected</div>
            </CardContent>
          </Card>

          {isDM && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.withSecrets}</div>
                <div className="text-sm text-muted-foreground">With Secrets</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Location Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {activeTab === 'my' ? 'My Locations' : 
             activeTab === 'global' ? 'Global Locations' : 'All Locations'}
          </h2>
          {renderLocationGrid(
            currentLocations, 
            activeTab === 'my', 
            isDM && (activeTab === 'my' || activeTab === 'all')
          )}
        </div>
      </SignedIn>

      <LocationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        location={selectedLocation}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}