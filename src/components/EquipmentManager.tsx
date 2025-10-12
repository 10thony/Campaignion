import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

import { Shield, Sword, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '../lib/convex'

interface EquipmentManagerProps {
  characterId: string
  disabled?: boolean
}

// Phase 2: Use database queries instead of constants file
// const { SLOTS } = DND5E_CONSTANTS.EQUIPMENT

function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function EquipmentManager({ characterId, disabled = false }: EquipmentManagerProps) {
  const [showEquipDialog, setShowEquipDialog] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>('')

  // Queries
  const character = useQuery(api.characters.getCharacterById, { characterId })
  const equippedItems = useQuery(api.equipment.getEquippedItems, { characterId })
  const totalStats = useQuery(api.equipment.getCharacterTotalStats, { characterId })
  const availableItems = useQuery(api.items.getMyItems) || []
  
  // Phase 2: Database query for equipment slots
  const equipmentSlots = useQuery(api.gameConstants.getEquipmentSlots) || []

  // Fallback to hardcoded equipment slots if database is empty
  const fallbackEquipmentSlots = [
    { key: 'headgear', label: 'Head', icon: '🪖', allowedItemTypes: ['Armor'] },
    { key: 'armwear', label: 'Arms', icon: '🦾', allowedItemTypes: ['Armor'] },
    { key: 'chestwear', label: 'Chest', icon: '👕', allowedItemTypes: ['Armor'] },
    { key: 'legwear', label: 'Legs', icon: '👖', allowedItemTypes: ['Armor'] },
    { key: 'footwear', label: 'Feet', icon: '👟', allowedItemTypes: ['Armor'] },
    { key: 'mainHand', label: 'Main Hand', icon: '⚔️', allowedItemTypes: ['Weapon', 'Shield'] },
    { key: 'offHand', label: 'Off Hand', icon: '🛡️', allowedItemTypes: ['Weapon', 'Shield'] },
    { key: 'accessories', label: 'Accessories', icon: '💍', allowedItemTypes: ['Ring', 'Wondrous Item'] }
  ]

  // Use database equipment slots if available, otherwise fall back to hardcoded ones
  const effectiveEquipmentSlots = equipmentSlots.length > 0 ? equipmentSlots : fallbackEquipmentSlots

  // Mutations
  const equipItem = useMutation(api.equipment.equipItem)
  const unequipItem = useMutation(api.equipment.unequipItem)
  const recalculateEquipmentBonuses = useMutation(api.equipment.recalculateEquipmentBonuses)

  // Phase 2: Add loading state for equipment slots
  if (!equipmentSlots && equipmentSlots !== undefined) {
    return <div>Loading equipment slots...</div>
  }

  // Safety check: ensure we have valid equipment slots
  if (!effectiveEquipmentSlots || effectiveEquipmentSlots.length === 0) {
    console.warn('EquipmentManager: No equipment slots available, using fallback')
    return <div>Loading equipment slots...</div>
  }

  const handleEquipItem = async (itemId: string, slot: string) => {
    try {
      await equipItem({
        characterId,
        itemId,
        slot: slot as any,
      })
      setShowEquipDialog(false)
    } catch (error) {
      console.error('Failed to equip item:', error)
    }
  }

  const handleUnequipItem = async (slot: string, itemId?: string) => {
    try {
      await unequipItem({
        characterId,
        slot: slot as any,
        itemId,
      })
    } catch (error) {
      console.error('Failed to unequip item:', error)
    }
  }

  const handleRecalculate = async () => {
    try {
      await recalculateEquipmentBonuses({ characterId })
    } catch (error) {
      console.error('Failed to recalculate bonuses:', error)
    }
  }

  const getSlotItems = (slot: string) => {
    if (!equippedItems) return null
    
    if (slot === 'accessories') {
      return equippedItems.accessories || []
    }
    
    return equippedItems[slot as keyof typeof equippedItems] || null
  }

  const getAvailableItemsForSlot = (slot: string) => {
    // Phase 2: Use database data for slot type mapping
    const slotConfig = effectiveEquipmentSlots.find(s => s.key === slot)
    if (!slotConfig) return []
    
    return availableItems.filter(item => 
      slotConfig.allowedItemTypes.includes(item.type)
    )
  }

  const renderStatChange = (base: number, bonus: number, label: string) => {
    const total = base + bonus
    const modifier = calculateAbilityModifier(total)
    const baseModifier = calculateAbilityModifier(base)
    
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm">{base}</span>
          {bonus !== 0 && (
            <>
              <span className="text-xs text-muted-foreground">
                {bonus > 0 ? '+' : ''}{bonus}
              </span>
              {bonus > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </>
          )}
          <span className="font-medium">{total}</span>
          <span className="text-xs text-muted-foreground">
            ({baseModifier !== modifier ? (
              <>
                <span className={modifier > baseModifier ? 'text-green-600' : 'text-red-600'}>
                  {modifier >= 0 ? '+' : ''}{modifier}
                </span>
              </>
            ) : (
              <span>{modifier >= 0 ? '+' : ''}{modifier}</span>
            )})
          </span>
        </div>
      </div>
    )
  }

  if (!character || !totalStats) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Equipment Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Equipment
          </CardTitle>
          <CardDescription>
            Manage equipped items and view stat bonuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {effectiveEquipmentSlots.map(({ key, label, icon, allowedItemTypes }) => {
              const slotItems = getSlotItems(key)
              const isEmpty = key === 'accessories' 
                ? !slotItems || slotItems.length === 0
                : !slotItems

              return (
                <Card key={key} className="relative">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span>{icon}</span>
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <Dialog open={showEquipDialog && selectedSlot === key} onOpenChange={(open) => {
                        setShowEquipDialog(open)
                        if (open) setSelectedSlot(key)
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={disabled}
                            onClick={() => setSelectedSlot(key)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Equip Item - {label}</DialogTitle>
                            <DialogDescription>
                              Choose an item to equip in the {label.toLowerCase()} slot
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {getAvailableItemsForSlot(key).map((item) => (
                              <Card key={item._id} className="cursor-pointer hover:bg-accent">
                                <CardContent className="p-3" onClick={() => handleEquipItem(item._id, key)}>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-medium">{item.name}</h4>
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                      <div className="flex gap-2 mt-1">
                                        <Badge variant="secondary">{item.type}</Badge>
                                        <Badge variant="outline">{item.rarity}</Badge>
                                      </div>
                                    </div>
                                    {(item.armorClass || item.abilityModifiers) && (
                                      <div className="text-sm text-right">
                                        {item.armorClass && (
                                          <div>AC: +{item.armorClass}</div>
                                        )}
                                        {item.abilityModifiers && Object.entries(item.abilityModifiers).some(([_, value]) => value) && (
                                          <div className="text-xs text-muted-foreground">
                                            Has stat bonuses
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {isEmpty ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No item equipped
                      </div>
                    ) : key === 'accessories' ? (
                      <div className="space-y-2">
                        {(slotItems as any[]).map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm font-medium">{item?.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUnequipItem(key, item?._id)}
                              disabled={disabled}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{(slotItems as any)?.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnequipItem(key)}
                          disabled={disabled}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Character Stats
          </CardTitle>
          <CardDescription>
            Base stats with equipment bonuses applied
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Armor Class */}
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span className="font-medium">Armor Class</span>
              <div className="flex items-center gap-2">
                <span>{totalStats.baseStats.armorClass}</span>
                {totalStats.equipmentBonuses.armorClass !== 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {totalStats.equipmentBonuses.armorClass > 0 ? '+' : ''}
                      {totalStats.equipmentBonuses.armorClass}
                    </span>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </>
                )}
                <span className="font-bold text-lg">{totalStats.totalStats.armorClass}</span>
              </div>
            </div>

            <hr className="my-4" />

            {/* Ability Scores */}
            <div className="space-y-2">
              <h4 className="font-medium">Ability Scores</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(totalStats.baseStats.abilityScores).map(([ability, baseValue]) => (
                  <div key={ability}>
                    {renderStatChange(
                      baseValue as number,
                      totalStats.equipmentBonuses.abilityScores[ability as keyof typeof totalStats.equipmentBonuses.abilityScores],
                      ability.charAt(0).toUpperCase() + ability.slice(1)
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr className="my-4" />

            {/* Actions */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Equipment bonuses are automatically calculated
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRecalculate}
                disabled={disabled}
              >
                Recalculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}