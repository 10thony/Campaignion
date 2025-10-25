import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sword, 
  Zap, 
  Shield, 
  BookOpen, 
  Sparkles,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface Action {
  _id: string
  name: string
  description: string
  actionCost: "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special"
  type: string
  requiresConcentration: boolean
  sourceBook: string
  category: "general" | "class_specific" | "race_specific" | "feat_specific"
  attackBonusAbilityScore?: string
  isProficient?: boolean
  damageRolls?: Array<{
    dice: { count: number; type: string }
    modifier: number
    damageType: string
  }>
  spellLevel?: number
  castingTime?: string
  range?: string
  components?: {
    verbal: boolean
    somatic: boolean
    material?: string
  }
  duration?: string
  savingThrow?: {
    ability: string
    onSave: string
  }
  spellEffectDescription?: string
  requiredClass?: string
  targetClass?: string
  requiredLevel?: number
  requiredSubclass?: string
  usesPer?: "Short Rest" | "Long Rest" | "Day" | "Special"
  maxUses?: number | string
  isBaseAction?: boolean
  tags?: string[]
  prerequisites?: string[]
  createdAt?: number
}

interface ActionCardProps {
  action: Action
  onView: (action: Action) => void
  onEdit: (action: Action) => void
  onDelete?: (action: Action) => void
  showActions?: boolean
}

export function ActionCard({ 
  action, 
  onView, 
  onEdit, 
  onDelete, 
  showActions = true 
}: ActionCardProps) {
  const getActionCostIcon = (cost: Action["actionCost"]) => {
    switch (cost) {
      case 'Action': return <Sword className="h-4 w-4" />
      case 'Bonus Action': return <Zap className="h-4 w-4" />
      case 'Reaction': return <Shield className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getActionCostColor = (cost: Action["actionCost"]) => {
    switch (cost) {
      case 'Action': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      case 'Bonus Action': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'Reaction': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'No Action': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
      case 'Special': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
    }
  }

  const formatDamageRolls = (damageRolls?: Action["damageRolls"]) => {
    if (!damageRolls || damageRolls.length === 0) return null
    
    return damageRolls.map((roll, index) => (
      <span key={index} className="text-sm text-muted-foreground">
        {roll.dice.count}d{roll.dice.type.replace('D', '')}
        {roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier < 0 ? `${roll.modifier}` : ''}
        {' '}{roll.damageType.toLowerCase()}
        {index < damageRolls.length - 1 ? ', ' : ''}
      </span>
    ))
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{action.name}</h3>
              <Badge className={getActionCostColor(action.actionCost)}>
                <div className="flex items-center gap-1">
                  {getActionCostIcon(action.actionCost)}
                  {action.actionCost}
                </div>
              </Badge>
              <Badge variant="outline">
                {action.type.replace(/_/g, ' ')}
              </Badge>
              {action.requiresConcentration && (
                <Badge variant="secondary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Concentration
                </Badge>
              )}
            </div>
            
            <p className="text-muted-foreground mb-3 line-clamp-2">
              {action.description}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <span>Source: {action.sourceBook}</span>
              <span>Category: {action.category.replace(/_/g, ' ')}</span>
              {action.targetClass && (
                <span>Class: {action.targetClass}</span>
              )}
              {action.spellLevel !== undefined && (
                <span>Level: {action.spellLevel === 0 ? 'Cantrip' : action.spellLevel}</span>
              )}
              {action.range && <span>Range: {action.range}</span>}
            </div>

            {/* Damage Rolls */}
            {action.damageRolls && action.damageRolls.length > 0 && (
              <div className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">Damage: </span>
                {formatDamageRolls(action.damageRolls)}
              </div>
            )}

            {/* Spell Components */}
            {action.components && (action.components.verbal || action.components.somatic || action.components.material) && (
              <div className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">Components: </span>
                {action.components.verbal && <span>V</span>}
                {action.components.somatic && <span>{action.components.verbal ? ', ' : ''}S</span>}
                {action.components.material && <span>{(action.components.verbal || action.components.somatic) ? ', ' : ''}M</span>}
              </div>
            )}

            {/* Usage Information */}
            {action.usesPer && action.maxUses && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Uses: </span>
                {action.maxUses} per {action.usesPer.toLowerCase()}
              </div>
            )}
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(action)}
                title="View action details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(action)}
                title="Edit action"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(action)}
                  title="Delete action"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
