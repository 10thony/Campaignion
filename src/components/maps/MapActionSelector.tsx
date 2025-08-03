import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Move, 
  Sword, 
  Shield, 
  Zap, 
  Hand, 
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Navigation,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapMovementValidator, MapUtils } from '@/lib/mapMovementValidator';

// Import types
interface Position {
  x: number;
  y: number;
}

interface Action {
  id: string;
  name: string;
  type: 'move' | 'attack' | 'useItem' | 'cast' | 'interact';
  available: boolean;
  requirements: Array<{
    type: string;
    value: any;
    met: boolean;
  }>;
}

interface TurnAction {
  type: 'move' | 'attack' | 'useItem' | 'cast' | 'interact' | 'end';
  entityId: string;
  target?: string;
  position?: Position;
  itemId?: string;
  spellId?: string;
  actionId?: string;
  parameters?: Record<string, any>;
}

interface ParticipantState {
  entityId: string;
  entityType: 'playerCharacter' | 'npc' | 'monster';
  userId?: string;
  currentHP: number;
  maxHP: number;
  position: Position;
  conditions: Array<{
    id: string;
    name: string;
    duration: number;
    effects: Record<string, any>;
  }>;
  inventory: {
    items: Array<{
      id: string;
      itemId: string;
      quantity: number;
      properties: Record<string, any>;
    }>;
    equippedItems: Record<string, string>;
    capacity: number;
  };
  availableActions: Action[];
  turnStatus: 'waiting' | 'active' | 'completed' | 'skipped';
}

interface MapActionSelectorProps {
  participant: ParticipantState;
  selectedAction: Action | null;
  selectedTarget: string | null;
  selectedPosition: Position | null;
  onActionSelect: (action: Action) => void;
  onTargetSelect: (targetId: string) => void;
  onPositionSelect: (position: Position) => void;
  onSubmitAction: (action: TurnAction) => void;
  onClearSelection: () => void;
  availableTargets: Array<{
    entityId: string;
    entityType: 'playerCharacter' | 'npc' | 'monster';
    currentHP: number;
    maxHP: number;
    position: Position;
  }>;
  availableItems: Array<{
    id: string;
    itemId: string;
    name: string;
    quantity: number;
    usable: boolean;
  }>;
  validationErrors: string[];
  isSubmitting: boolean;
  mapState?: {
    width: number;
    height: number;
    entities: Record<string, { entityId: string; position: Position; facing?: number }>;
    obstacles: Position[];
    terrain: Array<{ position: Position; type: string; properties: Record<string, any> }>;
  };
  className?: string;
}

export const MapActionSelector: React.FC<MapActionSelectorProps> = ({
  participant,
  selectedAction,
  selectedTarget,
  selectedPosition,
  onActionSelect,
  onTargetSelect,
  onPositionSelect,
  onSubmitAction,
  onClearSelection,
  availableTargets,
  availableItems,
  validationErrors,
  isSubmitting,
  mapState,
  className = "",
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Group actions by type for better organization
  const actionsByType = useMemo(() => {
    const groups: Record<string, Action[]> = {
      move: [],
      attack: [],
      useItem: [],
      cast: [],
      interact: [],
    };

    participant.availableActions.forEach(action => {
      if (groups[action.type]) {
        groups[action.type].push(action);
      }
    });

    return groups;
  }, [participant.availableActions]);

  // Check if current selection is valid for submission with enhanced validation
  const canSubmitAction = useMemo(() => {
    if (!selectedAction || isSubmitting) return false;

    switch (selectedAction.type) {
      case 'move':
        if (!selectedPosition || !mapState) return false;
        const moveValidation = MapMovementValidator.validateMovement(
          participant.position,
          selectedPosition,
          mapState,
          participant
        );
        return moveValidation.isValid;
      case 'attack':
        if (!selectedTarget || !mapState) return false;
        const target = availableTargets.find(t => t.entityId === selectedTarget);
        if (!target) return false;
        const attackValidation = MapMovementValidator.validateAttack(
          participant.position,
          target.position,
          mapState,
          participant
        );
        return attackValidation.isValid;
      case 'useItem':
        return selectedItemId !== null && (selectedTarget !== null || selectedPosition !== null);
      case 'cast':
        return selectedTarget !== null || selectedPosition !== null;
      case 'interact':
        return selectedPosition !== null;
      default:
        return false;
    }
  }, [selectedAction, selectedPosition, selectedTarget, selectedItemId, isSubmitting, mapState, participant, availableTargets]);

  // Handle action submission
  const handleSubmitAction = useCallback(() => {
    if (!selectedAction || !canSubmitAction) return;

    const baseAction: TurnAction = {
      type: selectedAction.type,
      entityId: participant.entityId,
      actionId: selectedAction.id,
    };

    // Add type-specific parameters
    switch (selectedAction.type) {
      case 'move':
        if (selectedPosition) {
          baseAction.position = selectedPosition;
        }
        break;
      case 'attack':
        if (selectedTarget) {
          baseAction.target = selectedTarget;
        }
        break;
      case 'useItem':
        if (selectedItemId) {
          baseAction.itemId = selectedItemId;
          if (selectedTarget) baseAction.target = selectedTarget;
          if (selectedPosition) baseAction.position = selectedPosition;
        }
        break;
      case 'cast':
        if (selectedTarget) baseAction.target = selectedTarget;
        if (selectedPosition) baseAction.position = selectedPosition;
        break;
      case 'interact':
        if (selectedPosition) baseAction.position = selectedPosition;
        break;
    }

    onSubmitAction(baseAction);
  }, [selectedAction, canSubmitAction, participant.entityId, selectedPosition, selectedTarget, selectedItemId, onSubmitAction]);

  // Handle action selection
  const handleActionSelect = useCallback((action: Action) => {
    onActionSelect(action);
    setSelectedItemId(null); // Reset item selection when changing actions
  }, [onActionSelect]);

  // Get action icon
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'move':
        return <Move className="w-4 h-4" />;
      case 'attack':
        return <Sword className="w-4 h-4" />;
      case 'useItem':
        return <Shield className="w-4 h-4" />;
      case 'cast':
        return <Zap className="w-4 h-4" />;
      case 'interact':
        return <Hand className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  // Get action type display name
  const getActionTypeDisplayName = (type: string) => {
    switch (type) {
      case 'move':
        return 'Movement';
      case 'attack':
        return 'Attacks';
      case 'useItem':
        return 'Use Item';
      case 'cast':
        return 'Spells';
      case 'interact':
        return 'Interactions';
      default:
        return type;
    }
  };

  // Helper functions for range calculation
  const getMovementRange = (participant: ParticipantState): number => {
    let range = 6; // Base movement range
    
    participant.conditions.forEach(condition => {
      if (condition.name.toLowerCase().includes('haste')) {
        range += 3;
      } else if (condition.name.toLowerCase().includes('slow')) {
        range = Math.max(1, range - 3);
      }
    });
    
    return range;
  };

  const getAttackRange = (participant: ParticipantState): number => {
    let range = 5; // Base attack range
    
    const weapon = participant.inventory.equippedItems.mainHand;
    if (weapon) {
      range = weapon.includes('bow') || weapon.includes('crossbow') ? 10 : 1;
    }
    
    return range;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Action Selection
          </span>
          {selectedAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Validation Errors:</span>
            </div>
            <ul className="text-sm text-destructive space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Selection */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Available Actions</h4>
          
          {Object.entries(actionsByType).map(([type, actions]) => {
            if (actions.length === 0) return null;
            
            return (
              <div key={type} className="space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {getActionTypeDisplayName(type)}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {actions.map(action => (
                    <Button
                      key={action.id}
                      variant={selectedAction?.id === action.id ? 'default' : 'outline'}
                      disabled={!action.available}
                      onClick={() => handleActionSelect(action)}
                      className="flex items-center gap-2 justify-start h-auto p-3"
                    >
                      {getActionIcon(action.type)}
                      <div className="text-left">
                        <div className="font-medium">{action.name}</div>
                        {!action.available && action.requirements.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Missing: {action.requirements.filter(r => !r.met).map(r => r.type).join(', ')}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action-Specific Selection */}
        {selectedAction && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="font-medium text-sm flex items-center gap-2">
              {getActionIcon(selectedAction.type)}
              {selectedAction.name} - Configuration
            </h4>

            {/* Movement Selection */}
            {selectedAction.type === 'move' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click on the map to select your destination.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Navigation className="w-3 h-3" />
                  <span>Movement range: {getMovementRange(participant)} cells</span>
                </div>
                {selectedPosition && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        Destination: ({selectedPosition.x}, {selectedPosition.y})
                      </span>
                    </div>
                    {mapState && (
                      <div className="text-xs text-muted-foreground">
                        Distance: {Math.abs(selectedPosition.x - participant.position.x) + 
                                 Math.abs(selectedPosition.y - participant.position.y)} cells
                        {(() => {
                          const validation = MapMovementValidator.validateMovement(
                            participant.position,
                            selectedPosition,
                            mapState,
                            participant
                          );
                          return validation.cost ? ` (Cost: ${validation.cost})` : '';
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Attack Target Selection */}
            {selectedAction.type === 'attack' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select a target to attack:
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sword className="w-3 h-3" />
                  <span>Attack range: {getAttackRange(participant)} cells</span>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {availableTargets.map(target => {
                    const distance = Math.abs(target.position.x - participant.position.x) + 
                                   Math.abs(target.position.y - participant.position.y);
                    const inRange = distance <= getAttackRange(participant);
                    const hasLineOfSight = mapState ? 
                      MapMovementValidator.validateAttack(participant.position, target.position, mapState, participant).hasLineOfSight : 
                      true;
                    
                    return (
                      <Button
                        key={target.entityId}
                        variant={selectedTarget === target.entityId ? 'default' : 'outline'}
                        disabled={!inRange || !hasLineOfSight}
                        onClick={() => onTargetSelect(target.entityId)}
                        className="flex items-center justify-between p-3 h-auto"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded border"
                            style={{ 
                              backgroundColor: target.entityType === 'playerCharacter' ? '#22c55e' : 
                                             target.entityType === 'npc' ? '#f59e0b' : '#ef4444'
                            }}
                          />
                          <span>{target.entityId}</span>
                          {!hasLineOfSight && <Eye className="w-3 h-3 text-red-500" title="No line of sight" />}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>{target.currentHP}/{target.maxHP} HP</div>
                          <div className={cn("text-xs", inRange ? "text-green-600" : "text-red-600")}>
                            {distance} cells
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Item Selection */}
            {selectedAction.type === 'useItem' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select an item to use:
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {availableItems.map(item => (
                    <Button
                      key={item.id}
                      variant={selectedItemId === item.id ? 'default' : 'outline'}
                      disabled={!item.usable}
                      onClick={() => setSelectedItemId(item.id)}
                      className="flex items-center justify-between p-3 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      <Badge variant="secondary">
                        {item.quantity}
                      </Badge>
                    </Button>
                  ))}
                </div>
                
                {selectedItemId && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Select target or position for item use:
                    </p>
                    {availableTargets.length > 0 && (
                      <div className="grid grid-cols-1 gap-1">
                        {availableTargets.map(target => (
                          <Button
                            key={target.entityId}
                            variant={selectedTarget === target.entityId ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onTargetSelect(target.entityId)}
                          >
                            {target.entityId}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Spell Casting */}
            {selectedAction.type === 'cast' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select target or area for spell:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {availableTargets.map(target => (
                    <Button
                      key={target.entityId}
                      variant={selectedTarget === target.entityId ? 'default' : 'outline'}
                      onClick={() => onTargetSelect(target.entityId)}
                      size="sm"
                    >
                      {target.entityId}
                    </Button>
                  ))}
                </div>
                {selectedPosition && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      Target Area: ({selectedPosition.x}, {selectedPosition.y})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Interaction */}
            {selectedAction.type === 'interact' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click on the map to select what to interact with.
                </p>
                {selectedPosition && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      Interaction Point: ({selectedPosition.x}, {selectedPosition.y})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit Action */}
        {selectedAction && (
          <div className="pt-3 border-t">
            <Button
              onClick={handleSubmitAction}
              disabled={!canSubmitAction}
              className="w-full flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit {selectedAction.name}
                </>
              )}
            </Button>
            
            {!canSubmitAction && !isSubmitting && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {selectedAction.type === 'move' && 'Select a destination on the map'}
                {selectedAction.type === 'attack' && 'Select a target to attack'}
                {selectedAction.type === 'useItem' && 'Select an item and target'}
                {selectedAction.type === 'cast' && 'Select a target or area'}
                {selectedAction.type === 'interact' && 'Select an interaction point'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};