import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Heart, Shield, Zap, User, Copy } from 'lucide-react'
import { formatModifier } from '@/lib/utils'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'

interface Character {
  _id: string
  name: string
  race: string
  class: string
  level: number
  hitPoints: number
  armorClass: number
  speed?: string
  characterType: "player" | "npc"
  abilityModifiers?: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  experiencePoints?: number
  proficiencyBonus?: number
}

interface CharacterCardProps {
  character: Character
  onView?: (characterId: string) => void
  onEdit?: (characterId: string) => void
  onClone?: () => void
  canEdit?: boolean
  canClone?: boolean
}

export function CharacterCard({ 
  character, 
  onView, 
  onEdit, 
  onClone,
  canEdit = false,
  canClone = false
}: CharacterCardProps) {
  const cloneCharacter = useMutation(api.characters.cloneCharacter)
  
  const handleClone = async () => {
    try {
      await cloneCharacter({ characterId: character._id })
      toast.success(`${character.name} cloned successfully!`)
      onClone?.()
    } catch (error) {
      console.error('Failed to clone character:', error)
      toast.error('Failed to clone character')
    }
  }
  const isPC = character.characterType === "player"
  const speed = character.speed || "30 ft."

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg line-clamp-1">{character.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Level {character.level} {character.race} {character.class}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={isPC ? "level" : "secondary"} className="shrink-0">
              {isPC ? "PC" : "NPC"}
            </Badge>
            {character.experiencePoints !== undefined && (
              <span className="text-xs text-muted-foreground">
                {character.experiencePoints} XP
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Core Stats */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="font-medium">{character.hitPoints}</span>
            <span className="text-muted-foreground">HP</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{character.armorClass}</span>
            <span className="text-muted-foreground">AC</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{speed}</span>
          </div>
        </div>

        {/* Proficiency Bonus */}
        {character.proficiencyBonus && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-purple-500" />
            <span className="text-muted-foreground">Proficiency:</span>
            <span className="font-medium">
              {formatModifier(character.proficiencyBonus)}
            </span>
          </div>
        )}

        {/* Ability Modifiers */}
        {character.abilityModifiers && (
          <div className="grid grid-cols-6 gap-1 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">STR</div>
              <div className="font-medium">
                {formatModifier(character.abilityModifiers.strength)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">DEX</div>
              <div className="font-medium">
                {formatModifier(character.abilityModifiers.dexterity)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">CON</div>
              <div className="font-medium">
                {formatModifier(character.abilityModifiers.constitution)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">INT</div>
              <div className="font-medium">
                {formatModifier(character.abilityModifiers.intelligence)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">WIS</div>
              <div className="font-medium">
                {formatModifier(character.abilityModifiers.wisdom)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">CHA</div>
              <div className="font-medium">
                {formatModifier(character.abilityModifiers.charisma)}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(character._id)}
          >
            View Sheet
          </Button>
          {canEdit && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(character._id)}
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