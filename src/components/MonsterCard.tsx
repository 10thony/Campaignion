import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Heart, Shield, Zap, Copy } from 'lucide-react'
import { formatModifier } from '@/lib/utils'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'

interface Monster {
  _id: string
  name: string
  size: string
  type: string
  challengeRating: string
  challengeRatingValue?: number
  hitPoints: number
  armorClass: number
  speed: {
    walk?: string
    fly?: string
    swim?: string
  }
  abilityModifiers?: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  traits?: Array<{ name: string; description: string }>
  reactions?: Array<{ name: string; description: string }>
  legendaryActions?: Array<{ name: string; description: string }>
  lairActions?: Array<{ name: string; description: string }>
}

interface MonsterCardProps {
  monster: Monster
  onView?: (monsterId: string) => void
  onEdit?: (monsterId: string) => void
  onClone?: () => void
  canEdit?: boolean
  canClone?: boolean
}

export function MonsterCard({ 
  monster, 
  onView, 
  onEdit, 
  onClone,
  canEdit = false,
  canClone = false
}: MonsterCardProps) {
  const cloneMonster = useMutation(api.monsters.cloneMonster)
  
  const handleClone = async () => {
    try {
      await cloneMonster({ monsterId: monster._id })
      toast.success(`${monster.name} cloned successfully!`)
      onClone?.()
    } catch (error) {
      console.error('Failed to clone monster:', error)
      toast.error('Failed to clone monster')
    }
  }
  const primarySpeed = monster.speed.walk || 
    monster.speed.fly || 
    monster.speed.swim || 
    '30 ft.'

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg line-clamp-1">{monster.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {monster.size} {monster.type}
            </p>
          </div>
          <Badge variant="cr" className="shrink-0">
            CR {monster.challengeRating}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Core Stats */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="font-medium">{monster.hitPoints}</span>
            <span className="text-muted-foreground">HP</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{monster.armorClass}</span>
            <span className="text-muted-foreground">AC</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{primarySpeed}</span>
          </div>
        </div>

        {/* Ability Modifiers */}
        {monster.abilityModifiers && (
          <div className="grid grid-cols-6 gap-1 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">STR</div>
              <div className="font-medium">
                {formatModifier(monster.abilityModifiers.strength)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">DEX</div>
              <div className="font-medium">
                {formatModifier(monster.abilityModifiers.dexterity)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">CON</div>
              <div className="font-medium">
                {formatModifier(monster.abilityModifiers.constitution)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">INT</div>
              <div className="font-medium">
                {formatModifier(monster.abilityModifiers.intelligence)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">WIS</div>
              <div className="font-medium">
                {formatModifier(monster.abilityModifiers.wisdom)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">CHA</div>
              <div className="font-medium">
                {formatModifier(monster.abilityModifiers.charisma)}
              </div>
            </div>
          </div>
        )}

        {/* Special Actions */}
        {(monster.traits || monster.reactions || monster.legendaryActions || monster.lairActions) && (
          <div className="flex gap-2 flex-wrap">
            {monster.traits && monster.traits.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {monster.traits.length} Traits
              </Badge>
            )}
            {monster.reactions && monster.reactions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {monster.reactions.length} Reactions
              </Badge>
            )}
            {monster.legendaryActions && monster.legendaryActions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {monster.legendaryActions.length} Legendary
              </Badge>
            )}
            {monster.lairActions && monster.lairActions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {monster.lairActions.length} Lair
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(monster._id)}
          >
            View
          </Button>
          {canEdit && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(monster._id)}
            >
              Edit
            </Button>
          )}
          {canClone && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClone}
              className="px-3"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 