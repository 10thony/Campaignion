import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Package, Shield, Plus, Settings } from 'lucide-react'
import { InventoryPanel } from './InventoryPanel'
import { EquipmentManager } from './EquipmentManager'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'

interface InventoryItem {
  itemId: string
  quantity: number
}

interface EquipmentData {
  headgear?: string
  armwear?: string
  chestwear?: string
  legwear?: string
  footwear?: string
  mainHand?: string
  offHand?: string
  accessories: string[]
}

interface EquipmentBonuses {
  armorClass: number
  abilityScores: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
}

interface InventoryCreationManagerProps {
  inventory: {
    capacity: number
    items: InventoryItem[]
  }
  equipment: EquipmentData
  equipmentBonuses: EquipmentBonuses
  abilityScores: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  onInventoryChange: (inventory: { capacity: number; items: InventoryItem[] }) => void
  onEquipmentChange: (equipment: EquipmentData) => void
  onBonusesChange: (bonuses: EquipmentBonuses) => void
  canEdit?: boolean
  isReadOnly?: boolean
}

export function InventoryCreationManager({
  inventory,
  equipment,
  equipmentBonuses,
  abilityScores,
  onInventoryChange,
  onEquipmentChange,
  onBonusesChange,
  canEdit = true,
  isReadOnly = false,
}: InventoryCreationManagerProps) {
  const [localInventory, setLocalInventory] = useState(inventory)
  const [localEquipment, setLocalEquipment] = useState(equipment)
  const [localBonuses, setLocalBonuses] = useState(equipmentBonuses)
  const [showItemSelector, setShowItemSelector] = useState(false)

  // Get available items for the character
  const availableItems = useQuery(api.items.getMyItems) || []

  // Update local state when props change
  useEffect(() => {
    setLocalInventory(inventory)
  }, [inventory])

  useEffect(() => {
    setLocalEquipment(equipment)
  }, [equipment])

  useEffect(() => {
    setLocalBonuses(equipmentBonuses)
  }, [equipmentBonuses])

  // Handle inventory changes
  const handleInventoryChange = (newInventory: { capacity: number; items: InventoryItem[] }) => {
    setLocalInventory(newInventory)
    onInventoryChange(newInventory)
  }

  // Handle equipment changes
  const handleEquipmentChange = (newEquipment: EquipmentData) => {
    setLocalEquipment(newEquipment)
    onEquipmentChange(newEquipment)
  }

  // Handle bonus changes
  const handleBonusesChange = (newBonuses: EquipmentBonuses) => {
    setLocalBonuses(newBonuses)
    onBonusesChange(newBonuses)
  }

  // Convert inventory items to the format expected by InventoryPanel
  const inventoryPanelItems = localInventory.items
    .map(invItem => {
      const item = availableItems.find((i: Doc<"items">) => i._id === invItem.itemId)
      if (!item) return null

      return {
        item: {
          _id: item._id,
          name: item.name,
          type: item.type,
          rarity: item.rarity,
          description: item.description,
          effects: item.effects,
          weight: item.weight,
          cost: item.cost,
          attunement: item.attunement,
          typeOfArmor: item.typeOfArmor,
          armorClass: item.armorClass,
          abilityModifiers: item.abilityModifiers,
          damageRolls: item.damageRolls,
        },
        quantity: invItem.quantity,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  // Handle quantity changes
  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newItems = [...localInventory.items]
    const existingIndex = newItems.findIndex(item => item.itemId === itemId)
    
    if (existingIndex >= 0) {
      if (quantity <= 0) {
        newItems.splice(existingIndex, 1)
      } else {
        newItems[existingIndex].quantity = quantity
      }
    } else if (quantity > 0) {
      newItems.push({ itemId, quantity })
    }

    const newInventory = { ...localInventory, items: newItems }
    handleInventoryChange(newInventory)
  }

  // Handle item removal
  const handleRemoveItem = (itemId: string) => {
    const newItems = localInventory.items.filter(item => item.itemId !== itemId)
    const newInventory = { ...localInventory, items: newItems }
    handleInventoryChange(newInventory)
  }

  // Handle adding new item
  const handleAddItem = () => {
    setShowItemSelector(true)
  }

  // Handle capacity change
  const handleCapacityChange = (newCapacity: number) => {
    const newInventory = { ...localInventory, capacity: newCapacity }
    handleInventoryChange(newInventory)
  }

  // Calculate total weight and value
  const totalWeight = inventoryPanelItems.reduce((sum, invItem) => 
    sum + (invItem.item.weight || 0) * invItem.quantity, 0
  )
  
  const totalValue = inventoryPanelItems.reduce((sum, invItem) => 
    sum + (invItem.item.cost || 0) * invItem.quantity, 0
  )

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Equipment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Capacity Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Inventory Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Carrying Capacity (lbs)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    value={localInventory.capacity}
                    onChange={(e) => handleCapacityChange(parseInt(e.target.value) || 0)}
                    disabled={isReadOnly}
                    placeholder="Enter capacity..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Base carrying capacity is typically 15 × Strength modifier
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Weight:</span>
                    <Badge variant={totalWeight > localInventory.capacity ? "destructive" : "secondary"}>
                      {totalWeight.toFixed(1)} / {localInventory.capacity} lbs
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Value:</span>
                    <Badge variant="outline">
                      {totalValue} GP
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Panel */}
          <InventoryPanel
            items={inventoryPanelItems}
            capacity={localInventory.capacity}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveItem}
            onAddItem={handleAddItem}
            canEdit={canEdit && !isReadOnly}
            title="Character Inventory"
          />
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          {/* Equipment Manager */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Equipment Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(localEquipment).map(([slot, itemId]) => {
                    if (slot === 'accessories') return null // Handle accessories separately
                    
                    const item = availableItems.find((i: Doc<"items">) => i._id === itemId)
                    const slotLabel = slot.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    
                    return (
                      <div key={slot} className="border rounded-lg p-3">
                        <div className="text-sm font-medium mb-2">{slotLabel}</div>
                        {item ? (
                          <div className="space-y-2">
                            <div className="text-sm font-semibold">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.type}</div>
                            {canEdit && !isReadOnly && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newEquipment = { ...localEquipment, [slot]: undefined }
                                  handleEquipmentChange(newEquipment)
                                }}
                              >
                                Unequip
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {canEdit && !isReadOnly ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowItemSelector(true)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Equip
                              </Button>
                            ) : (
                              "Empty"
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Accessories */}
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium mb-3">Accessories</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {localEquipment.accessories?.map((itemId, index) => {
                      const item = availableItems.find((i: Doc<"items">) => i._id === itemId)
                      return item ? (
                        <div key={itemId} className="border rounded p-2">
                          <div className="text-sm font-semibold">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.type}</div>
                          {canEdit && !isReadOnly && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newAccessories = localEquipment.accessories?.filter((_, i) => i !== index) || []
                                handleEquipmentChange({ ...localEquipment, accessories: newAccessories })
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ) : null
                    })}
                    {canEdit && !isReadOnly && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowItemSelector(true)}
                        className="h-20 border-dashed"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Accessory
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipment Bonuses */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Bonuses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="acBonus">Armor Class Bonus</Label>
                  <Input
                    id="acBonus"
                    type="number"
                    min="-10"
                    max="20"
                    value={localBonuses.armorClass}
                    onChange={(e) => {
                      const newBonuses = {
                        ...localBonuses,
                        armorClass: parseInt(e.target.value) || 0
                      }
                      handleBonusesChange(newBonuses)
                    }}
                    disabled={isReadOnly}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Ability Score Bonuses</Label>
                  {Object.entries(localBonuses.abilityScores).map(([ability, bonus]) => (
                    <div key={ability} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{ability}</span>
                      <Input
                        type="number"
                        min="-10"
                        max="10"
                        value={bonus}
                        onChange={(e) => {
                          const newBonuses = {
                            ...localBonuses,
                            abilityScores: {
                              ...localBonuses.abilityScores,
                              [ability]: parseInt(e.target.value) || 0
                            }
                          }
                          handleBonusesChange(newBonuses)
                        }}
                        disabled={isReadOnly}
                        className="w-20"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Item Selection Modal - This would be implemented as a separate component */}
      {showItemSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Item</h3>
              <Button variant="outline" onClick={() => setShowItemSelector(false)}>
                Close
              </Button>
            </div>
            <div className="space-y-2">
              {availableItems.map((item: Doc<"items">) => (
                <div key={item._id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.type} • {item.rarity}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Add to inventory
                      const newItems = [...localInventory.items]
                      const existingIndex = newItems.findIndex(i => i.itemId === item._id)
                      
                      if (existingIndex >= 0) {
                        newItems[existingIndex].quantity += 1
                      } else {
                        newItems.push({ itemId: item._id, quantity: 1 })
                      }
                      
                      handleInventoryChange({ ...localInventory, items: newItems })
                      setShowItemSelector(false)
                    }}
                  >
                    Add to Inventory
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
