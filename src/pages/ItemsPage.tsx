import { useState } from 'react'
import { useQuery } from 'convex/react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { ItemCard } from '@/components/ItemCard'
import { ItemModal } from '@/components/modals/ItemModal'
import { SampleDataPanel } from '@/components/SampleDataPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Package, Sword, Shield, Star } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { useAuthenticatedUser } from '@/hooks/useAuthenticationGuard'

type ItemType = "Weapon" | "Armor" | "Potion" | "Scroll" | "Wondrous Item" | "Ring" | 
               "Rod" | "Staff" | "Wand" | "Ammunition" | "Adventuring Gear" | "Tool" | 
               "Mount" | "Vehicle" | "Treasure" | "Other"

type ItemRarity = "Common" | "Uncommon" | "Rare" | "Very Rare" | "Legendary" | "Artifact" | "Unique"

export function ItemsPage() {
  const { databaseUser, isLoading, isSignedIn } = useAuthenticatedUser()
  const items = useQuery(api.items.getItems, isSignedIn ? {} : "skip")
  const myItems = useQuery(api.items.getMyItems, isSignedIn ? {} : "skip")
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<ItemType | ''>('')
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | ''>('')
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show authentication required message if not authenticated
  if (!isSignedIn) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to access the item management system.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filterItems = (itemList: any[]) => {
    return itemList?.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.effects && item.effects.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesType = !selectedType || item.type === selectedType
      const matchesRarity = !selectedRarity || item.rarity === selectedRarity
      return matchesSearch && matchesType && matchesRarity
    })
  }

  const filteredMyItems = filterItems(myItems || [])
  const filteredAllItems = filterItems(items || [])

  const handleViewItem = (itemId: string) => {
    const item = [...(myItems || []), ...(items || [])].find(i => i._id === itemId)
    if (item) {
      setSelectedItem(item)
      // Determine modal mode based on whether current user is the creator
      const isCreator = databaseUser && item.userId === databaseUser._id
      setModalMode(isCreator ? "edit" : "view")
      setModalOpen(true)
    }
  }

  const handleEditItem = (itemId: string) => {
    const item = myItems?.find(i => i._id === itemId)
    if (item) {
      setSelectedItem(item)
      setModalMode("edit")
      setModalOpen(true)
    }
  }

  const handleCreateItem = () => {
    setSelectedItem(null)
    setModalMode("create")
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Modal will close itself, this is called after successful creation/edit
    // The queries will automatically refetch due to Convex reactivity
  }

  const itemTypes: Array<{ value: ItemType | '', label: string, icon: any }> = [
    { value: '', label: 'All Types', icon: Package },
    { value: 'Weapon', label: 'Weapons', icon: Sword },
    { value: 'Armor', label: 'Armor', icon: Shield },
    { value: 'Potion', label: 'Potions', icon: Star },
    { value: 'Scroll', label: 'Scrolls', icon: Star },
    { value: 'Wondrous Item', label: 'Wondrous', icon: Star },
    { value: 'Adventuring Gear', label: 'Gear', icon: Package },
  ]

  const rarityTypes: Array<{ value: ItemRarity | '', label: string, color: string }> = [
    { value: '', label: 'All Rarities', color: 'bg-gray-500' },
    { value: 'Common', label: 'Common', color: 'bg-gray-500' },
    { value: 'Uncommon', label: 'Uncommon', color: 'bg-green-500' },
    { value: 'Rare', label: 'Rare', color: 'bg-blue-500' },
    { value: 'Very Rare', label: 'Very Rare', color: 'bg-purple-500' },
    { value: 'Legendary', label: 'Legendary', color: 'bg-orange-500' },
  ]

  const getItemStats = (itemList: any[]) => {
    if (!itemList) return { total: 0, weapons: 0, armor: 0, magical: 0, totalWeight: 0, totalValue: 0 }
    
    return {
      total: itemList.length,
      weapons: itemList.filter(i => i.type === 'Weapon').length,
      armor: itemList.filter(i => i.type === 'Armor').length,
      magical: itemList.filter(i => ['Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'].includes(i.rarity)).length,
      totalWeight: itemList.reduce((sum, i) => sum + (i.weight || 0), 0),
      totalValue: itemList.reduce((sum, i) => sum + (i.cost || 0), 0),
    }
  }

  const renderItemGrid = (itemList: any[], canEdit = false) => {
    if (!itemList) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )
    }

    if (itemList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedType || selectedRarity
                ? 'No items match your search criteria.' 
                : 'No items found.'}
            </p>
            {!searchTerm && !selectedType && !selectedRarity && activeTab === 'my' && (
              <Button onClick={handleCreateItem}>
                <Plus className="h-4 w-4 mr-2" />
                Create Item
              </Button>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {itemList.map((item) => {
          // Determine if current user can edit this specific item
          const canEditThisItem = databaseUser && item.userId === databaseUser._id
          return (
            <ItemCard
              key={item._id}
              item={item}
              onView={handleViewItem}
              onEdit={handleEditItem}
              canEdit={canEditThisItem}
            />
          )
        })}
      </div>
    )
  }

  const currentItems = activeTab === 'my' ? filteredMyItems : filteredAllItems
  const stats = getItemStats(activeTab === 'my' ? (myItems || []) : (items || []))

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Item Compendium</h1>
          <p className="text-muted-foreground">
            Manage magical items, equipment, and treasure for your campaigns
          </p>
        </div>
        
        <SignedIn>
          <Button onClick={handleCreateItem}>
            <Plus className="h-4 w-4 mr-2" />
            Create Item
          </Button>
        </SignedIn>
      </div>

      <SignedOut>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to manage items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to create and manage items for your D&D campaigns.
            </p>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        {/* Sample Data Panel */}
        <SampleDataPanel 
          entityType="items" 
          onDataLoaded={() => {
            // Data will automatically refresh via Convex queries
          }} 
        />

        {/* Tab Navigation */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'my' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('my')}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              My Items
              {myItems && (
                <Badge variant="secondary" className="ml-1">
                  {myItems.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              All Items
              {items && (
                <Badge variant="secondary" className="ml-1">
                  {items.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items by name, description, or effects..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Type Filter */}
          <div className="flex gap-1 flex-wrap">
            {itemTypes.map((type) => {
              const Icon = type.icon
              return (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className="gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {type.label}
                </Button>
              )
            })}
          </div>

          {/* Rarity Filter */}
          <div className="flex gap-1 flex-wrap">
            {rarityTypes.map((rarity) => (
              <Button
                key={rarity.value}
                variant={selectedRarity === rarity.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRarity(rarity.value)}
                className="gap-1"
              >
                <div className={`w-2 h-2 rounded-full ${rarity.color}`} />
                {rarity.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Item Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.weapons}</div>
              <div className="text-sm text-muted-foreground">Weapons</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.armor}</div>
              <div className="text-sm text-muted-foreground">Armor</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.magical}</div>
              <div className="text-sm text-muted-foreground">Magical</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.totalWeight}</div>
              <div className="text-sm text-muted-foreground">Total lbs</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.totalValue}</div>
              <div className="text-sm text-muted-foreground">Total GP</div>
            </CardContent>
          </Card>
        </div>

        {/* Items Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {activeTab === 'my' ? 'My Items' : 'All Items'}
          </h2>
          {renderItemGrid(currentItems, activeTab === 'my')}
        </div>
      </SignedIn>

      <ItemModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        item={selectedItem}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
} 