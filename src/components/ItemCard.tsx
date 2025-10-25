import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Scale, Coins, Zap, Shield, Sword, Star } from 'lucide-react'

interface Item {
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

interface ItemCardProps {
  item: Item
  quantity?: number
  onView?: (itemId: string) => void
  onEdit?: (itemId: string) => void
  onQuantityChange?: (itemId: string, quantity: number) => void
  canEdit?: boolean
  showQuantityControls?: boolean
}

export function ItemCard({ 
  item, 
  quantity = 1,
  onView, 
  onEdit, 
  onQuantityChange,
  canEdit = false,
  showQuantityControls = false
}: ItemCardProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common": return "bg-gray-500"
      case "Uncommon": return "bg-green-500"
      case "Rare": return "bg-blue-500"
      case "Very Rare": return "bg-purple-500"
      case "Legendary": return "bg-orange-500"
      case "Artifact": return "bg-red-500"
      case "Unique": return "bg-pink-500"
      default: return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Weapon": return Sword
      case "Armor": return Shield
      case "Potion":
      case "Scroll":
      case "Wondrous Item":
      case "Ring":
      case "Rod":
      case "Staff":
      case "Wand":
        return Star
      default: return Zap
    }
  }

  const TypeIcon = getTypeIcon(item.type)
  const totalWeight = (item.weight || 0) * quantity

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView?.(item._id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1 mb-1">{item.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                <TypeIcon className="h-3 w-3 mr-1" />
                {item.type}
              </Badge>
              <Badge 
                className={`text-white text-xs ${getRarityColor(item.rarity)}`}
              >
                {item.rarity}
              </Badge>
              {item.attunement && (
                <Badge variant="secondary" className="text-xs">
                  Attunement
                </Badge>
              )}
            </div>
          </div>
          
          {showQuantityControls && (
            <div className="flex items-center gap-2 ml-2">
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0"
                onClick={() => onQuantityChange?.(item._id, Math.max(0, quantity - 1))}
              >
                -
              </Button>
              <span className="text-sm font-medium w-8 text-center">{quantity}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-6 p-0"
                onClick={() => onQuantityChange?.(item._id, quantity + 1)}
              >
                +
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {item.description}
        </p>

        {/* Effects */}
        {item.effects && (
          <div className="bg-muted/50 p-2 rounded border text-xs">
            <span className="font-medium text-muted-foreground">Effects: </span>
            <span className="text-foreground">{item.effects}</span>
          </div>
        )}

        {/* Item Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {/* Weight */}
          {totalWeight > 0 && (
            <div className="flex items-center gap-1">
                             <Scale className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{totalWeight}</span>
              <span className="text-muted-foreground">lbs</span>
            </div>
          )}

          {/* Cost */}
          {item.cost && (
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{item.cost}</span>
              <span className="text-muted-foreground">gp</span>
            </div>
          )}

          {/* Armor Class */}
          {item.armorClass && (
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="font-medium">AC {item.armorClass}</span>
              {item.typeOfArmor && (
                <span className="text-muted-foreground">({item.typeOfArmor})</span>
              )}
            </div>
          )}

          {/* Damage Rolls */}
          {item.damageRolls && item.damageRolls.length > 0 && (
            <div className="flex items-center gap-1">
              <Sword className="h-4 w-4 text-red-500" />
              <span className="font-medium">
                {item.damageRolls[0].dice.count}d{item.damageRolls[0].dice.type.slice(1)}
                {item.damageRolls[0].modifier > 0 && `+${item.damageRolls[0].modifier}`}
              </span>
              <span className="text-muted-foreground capitalize text-xs">
                {item.damageRolls[0].damageType.toLowerCase()}
              </span>
            </div>
          )}
        </div>

        {/* Ability Modifiers */}
        {item.abilityModifiers && Object.values(item.abilityModifiers).some(mod => mod !== undefined && mod !== 0) && (
          <div className="bg-muted/50 p-2 rounded border">
            <div className="text-xs font-medium text-muted-foreground mb-1">Ability Modifiers:</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(item.abilityModifiers).map(([ability, modifier]) => {
                if (!modifier || modifier === 0) return null
                return (
                  <Badge key={ability} variant="secondary" className="text-xs">
                    {ability.slice(0, 3).toUpperCase()} {modifier > 0 ? '+' : ''}{modifier}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onView?.(item._id)
            }}
          >
            View Details
          </Button>
          {canEdit && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(item._id)
              }}
            >
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 