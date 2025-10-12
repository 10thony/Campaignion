import { useState } from 'react'
import { useQueryWithAuth, useMutationWithAuth } from '@/hooks/useConvexWithAuth'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'

import { Plus, Trash2, Sword, Zap, Shield } from 'lucide-react'
import { api } from '../../convex/_generated/api'

interface Action {
  _id: string
  name: string
  description: string
  actionCost: 'Action' | 'Bonus Action' | 'Reaction' | 'No Action' | 'Special'
  type: string
  requiresConcentration: boolean
  sourceBook: string
  damageRolls?: Array<{
    dice: { count: number; type: string }
    modifier: number
    damageType: string
  }>
  spellLevel?: number
  castingTime?: string
  range?: string
}

interface InlineAction {
  name: string
  description: string
}

interface ActionManagerProps {
  mode: 'character' | 'monster'
  selectedActionIds?: string[]
  inlineActions?: InlineAction[]
  onActionIdsChange?: (actionIds: string[]) => void
  onInlineActionsChange?: (actions: InlineAction[]) => void
  disabled?: boolean
}

// Phase 2: Use database queries instead of constants file
// const { COSTS } = DND5E_CONSTANTS.ACTIONS

export function ActionManager({
  mode,
  selectedActionIds = [],
  inlineActions = [],
  onActionIdsChange,
  onInlineActionsChange,
  disabled = false
}: ActionManagerProps) {
  const [newAction, setNewAction] = useState({
    name: '',
    description: '',
    actionCost: 'Action' as const,
    type: 'OTHER' as const,
    requiresConcentration: false,
    sourceBook: 'Homebrew'
  })
  const [newInlineAction, setNewInlineAction] = useState({ name: '', description: '' })

  // Query all available actions
  const actions = useQueryWithAuth(api.actions.getAllActions) || []
  const createAction = useMutationWithAuth(api.actions.createAction)
  
  // Phase 2: Database query for action costs
  const actionCosts = useQueryWithAuth(api.gameConstants.getActionCosts) || []

  // Fallback to hardcoded action costs if database is empty
  const fallbackActionCosts = [
    { value: 'Action', icon: 'Sword', color: 'bg-red-100 text-red-800', description: 'Standard action' },
    { value: 'Bonus Action', icon: 'Zap', color: 'bg-yellow-100 text-yellow-800', description: 'Bonus action' },
    { value: 'Reaction', icon: 'Shield', color: 'bg-blue-100 text-blue-800', description: 'Reaction' },
    { value: 'No Action', icon: null, color: 'bg-gray-100 text-gray-800', description: 'No action required' },
    { value: 'Special', icon: null, color: 'bg-purple-100 text-purple-800', description: 'Special action' }
  ]

  // Use database action costs if available, otherwise fall back to hardcoded ones
  const effectiveActionCosts = actionCosts.length > 0 ? actionCosts : fallbackActionCosts

  // Phase 2: Add loading state for action costs
  if (!actionCosts && actionCosts !== undefined) {
    return <div>Loading action costs...</div>
  }

  // Safety check: ensure we have valid action costs
  if (!effectiveActionCosts || effectiveActionCosts.length === 0) {
    console.warn('ActionManager: No action costs available, using fallback')
    return <div>Loading action costs...</div>
  }

  // Safety check: ensure actions is an array
  if (!Array.isArray(actions)) {
    console.warn('ActionManager: Actions is not an array:', actions)
    return <div>Loading actions...</div>
  }

  const handleSelectAction = (actionId: string, selected: boolean) => {
    if (!onActionIdsChange) return
    
    const newIds = selected
      ? [...selectedActionIds, actionId]
      : selectedActionIds.filter(id => id !== actionId)
    
    onActionIdsChange(newIds)
  }

  const handleCreateHomebrew = async () => {
    if (!newAction.name || !newAction.description) return
    
    try {
      await createAction(newAction)
      setNewAction({
        name: '',
        description: '',
        actionCost: 'Action',
        type: 'OTHER',
        requiresConcentration: false,
        sourceBook: 'Homebrew'
      })

    } catch (error) {
      console.error('Failed to create action:', error)
    }
  }

  const handleAddInlineAction = () => {
    if (!newInlineAction.name || !newInlineAction.description || !onInlineActionsChange) return
    
    onInlineActionsChange([...inlineActions, newInlineAction])
    setNewInlineAction({ name: '', description: '' })
  }

  const handleRemoveInlineAction = (index: number) => {
    if (!onInlineActionsChange) return
    onInlineActionsChange(inlineActions.filter((_, i) => i !== index))
  }

  const getActionCostConfig = (cost: string) => {
    return effectiveActionCosts.find(ac => ac.value === cost)
  }

  const getActionIcon = (actionCost: string) => {
    const config = getActionCostConfig(actionCost)
    if (!config?.icon) return null
    
    switch (config.icon) {
      case 'Sword': return <Sword className="h-4 w-4" />
      case 'Zap': return <Zap className="h-4 w-4" />
      case 'Shield': return <Shield className="h-4 w-4" />
      default: return null
    }
  }

  const getActionCostColor = (actionCost: string) => {
    const config = getActionCostConfig(actionCost)
    return config?.color || 'bg-gray-100 text-gray-800'
  }

  if (mode === 'character') {
    return (
      <div className="space-y-4">
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Actions</TabsTrigger>
            <TabsTrigger value="homebrew">Create Homebrew</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {actions.map((action: Action) => (
                <Card key={action._id} className={`cursor-pointer transition-colors ${
                  selectedActionIds.includes(action._id) ? 'ring-2 ring-primary' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox
                            checked={selectedActionIds.includes(action._id)}
                            onCheckedChange={(checked) => 
                              handleSelectAction(action._id, checked as boolean)
                            }
                            disabled={disabled}
                          />
                          <h4 className="font-medium">{action.name}</h4>
                          <Badge 
                            variant="secondary" 
                            className={getActionCostColor(action.actionCost)}
                          >
                            {getActionIcon(action.actionCost)}
                            <span className="ml-1">{action.actionCost}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {action.description}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Type: {action.type}</span>
                          <span>•</span>
                          <span>Source: {action.sourceBook}</span>
                          {action.requiresConcentration && (
                            <>
                              <span>•</span>
                              <span>Concentration</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="homebrew" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Homebrew Action</CardTitle>
                <CardDescription>
                  Create a custom action for this character
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="action-name">Action Name</Label>
                    <Input
                      id="action-name"
                      value={newAction.name}
                      onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                      placeholder="Enter action name..."
                      disabled={disabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Action Cost</Label>
                    <div className="flex flex-wrap gap-2">
                      {effectiveActionCosts.map(({ value, icon, color, description }) => (
                        <Badge
                          key={value}
                          variant="secondary"
                          className={`cursor-pointer ${color}`}
                          onClick={() => setNewAction(prev => ({ ...prev, actionCost: value as any }))}
                        >
                          {getActionIcon(value)}
                          <span className="ml-1">{value}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="action-description">Description</Label>
                  <Textarea
                    id="action-description"
                    value={newAction.description}
                    onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                    placeholder="Describe what this action does..."
                    disabled={disabled}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="concentration"
                    checked={newAction.requiresConcentration}
                    onCheckedChange={(checked) => 
                      setNewAction({ ...newAction, requiresConcentration: checked as boolean })
                    }
                    disabled={disabled}
                  />
                  <Label htmlFor="concentration">Requires Concentration</Label>
                </div>

                <Button 
                  onClick={handleCreateHomebrew}
                  disabled={disabled || !newAction.name || !newAction.description}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Homebrew Action
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Monster mode - inline actions
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Monster Actions</h4>
        <Button
          onClick={() => setNewInlineAction({ name: '', description: '' })}
          size="sm"
          variant="outline"
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Action
        </Button>
      </div>

      <div className="space-y-3">
        {inlineActions.map((action, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{action.name}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <Button
                  onClick={() => handleRemoveInlineAction(index)}
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add new action form */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="inline-action-name">Action Name</Label>
              <Input
                id="inline-action-name"
                value={newInlineAction.name}
                onChange={(e) => setNewInlineAction({ ...newInlineAction, name: e.target.value })}
                placeholder="Enter action name..."
                disabled={disabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inline-action-description">Description</Label>
              <Textarea
                id="inline-action-description"
                value={newInlineAction.description}
                onChange={(e) => setNewInlineAction({ ...newInlineAction, description: e.target.value })}
                placeholder="Describe what this action does..."
                disabled={disabled}
              />
            </div>

            <Button 
              onClick={handleAddInlineAction}
              disabled={disabled || !newInlineAction.name || !newInlineAction.description}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Action
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}