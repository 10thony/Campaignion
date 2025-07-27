import { useState } from 'react'
import { ItemCard } from './ItemCard'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Scale, Package, Plus } from 'lucide-react'

interface InventoryItem {
  item: {
    _id: string
    name: string
    type: string
    rarity: "Common" | "Uncommon" | "Rare" | "Very Rare" | "Legendary" | "Artifact" | "Unique"
    description: string
    effects?: string
    weight?: number
    cost?: number
    attunement?: boolean
    typeOfArmor?: "Light" | "Medium" | "Heavy" | "Shield"
    armorClass?: number
    abilityModifiers?: {
      strength?: number
      dexterity?: number
      constitution?: number
      intelligence?: number
      wisdom?: number
      charisma?: number
    }
    damageRolls?: Array<{
      dice: { count: number; type: string }
      modifier: number
      damageType: string
    }>
  }
  quantity: number
}

interface InventoryPanelProps {
  items: InventoryItem[]
  capacity: number
  onQuantityChange?: (itemId: string, quantity: number) => void
  onRemoveItem?: (itemId: string) => void
  onAddItem?: () => void
  canEdit?: boolean
  title?: string
}

export function InventoryPanel({
  items,
  capacity,
  onQuantityChange,
  onRemoveItem,
  onAddItem,
  canEdit = false,
  title = "Inventory"
}: InventoryPanelProps) {
  const [filter, setFilter] = useState<string>('')

  // Calculate inventory stats
  const totalWeight = items.reduce((sum, invItem) => 
    sum + (invItem.item.weight || 0) * invItem.quantity, 0
  )
  
  const totalValue = items.reduce((sum, invItem) => 
    sum + (invItem.item.cost || 0) * invItem.quantity, 0
  )

  const totalItems = items.reduce((sum, invItem) => sum + invItem.quantity, 0)

  const weightPercentage = Math.min((totalWeight / capacity) * 100, 100)
  const isOverWeight = totalWeight > capacity

  const filteredItems = items.filter(invItem =>
    invItem.item.name.toLowerCase().includes(filter.toLowerCase()) ||
    invItem.item.type.toLowerCase().includes(filter.toLowerCase())
  )

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem?.(itemId)
    } else {
      onQuantityChange?.(itemId, newQuantity)
    }
  }

  const getItemsByType = () => {
    const grouped: Record<string, InventoryItem[]> = {}
    filteredItems.forEach(invItem => {
      const type = invItem.item.type
      if (!grouped[type]) grouped[type] = []
      grouped[type].push(invItem)
    })
    return grouped
  }

  const groupedItems = getItemsByType()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </CardTitle>
          {canEdit && (
            <Button size="sm" onClick={onAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>
        
        {/* Inventory Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-sm text-muted-foreground">Items</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{totalValue}</div>
            <div className="text-sm text-muted-foreground">GP Value</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${isOverWeight ? 'text-red-600' : 'text-gray-600'}`}>
              {totalWeight.toFixed(1)} / {capacity}
            </div>
            <div className="text-sm text-muted-foreground">Weight (lbs)</div>
          </div>
        </div>

        {/* Weight Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            <span className="text-sm font-medium">Carrying Capacity</span>
            {isOverWeight && (
              <Badge variant="destructive" className="text-xs">
                Overloaded
              </Badge>
            )}
          </div>
          <Progress 
            value={weightPercentage} 
            className={`h-2 ${isOverWeight ? 'bg-red-100' : ''}`}
          />
          <div className="text-xs text-muted-foreground text-right">
            {weightPercentage.toFixed(1)}% capacity used
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Inventory is empty</p>
            {canEdit && (
              <Button variant="outline" className="mt-2" onClick={onAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([type, typeItems]) => (
              <div key={type}>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  {type}
                  <Badge variant="secondary" className="text-xs">
                    {typeItems.reduce((sum, invItem) => sum + invItem.quantity, 0)} items
                  </Badge>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {typeItems.map((invItem) => (
                    <ItemCard
                      key={invItem.item._id}
                      item={invItem.item}
                      quantity={invItem.quantity}
                      onQuantityChange={handleQuantityChange}
                      canEdit={canEdit}
                      showQuantityControls={canEdit}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overweight Warning */}
        {isOverWeight && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <Scale className="h-4 w-4" />
              <span className="font-medium">Carrying Capacity Exceeded</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              You are carrying {(totalWeight - capacity).toFixed(1)} lbs over your limit. 
              This may result in movement penalties or other restrictions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 