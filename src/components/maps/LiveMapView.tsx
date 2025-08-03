import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MapPreview } from './MapPreview';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Target, 
  Move, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Crosshair,
  Eye,
  Navigation,
  Zap,
  Shield,
  Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapMovementValidator, MapUtils } from '@/lib/mapMovementValidator';

// Import types from live server schemas
interface Position {
  x: number;
  y: number;
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
  availableActions: Array<{
    id: string;
    name: string;
    type: 'move' | 'attack' | 'useItem' | 'cast' | 'interact';
    available: boolean;
    requirements: Array<{
      type: string;
      value: any;
      met: boolean;
    }>;
  }>;
  turnStatus: 'waiting' | 'active' | 'completed' | 'skipped';
}

interface InitiativeEntry {
  entityId: string;
  entityType: 'playerCharacter' | 'npc' | 'monster';
  initiative: number;
  userId?: string;
}

interface MapState {
  width: number;
  height: number;
  entities: Record<string, { entityId: string; position: Position; facing?: number }>;
  obstacles: Position[];
  terrain: Array<{ position: Position; type: string; properties: Record<string, any> }>;
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

interface LiveMapViewProps {
  mapState: MapState;
  participants: Record<string, ParticipantState>;
  initiativeOrder: InitiativeEntry[];
  currentTurnIndex: number;
  currentUserId: string;
  isMyTurn: boolean;
  selectedAction?: {
    id: string;
    name: string;
    type: 'move' | 'attack' | 'useItem' | 'cast' | 'interact';
    available: boolean;
  } | null;
  onCellClick?: (x: number, y: number) => void;
  onSubmitAction?: (action: TurnAction) => void;
  onTargetSelect?: (targetId: string) => void;
  selectedTarget?: string | null;
  className?: string;
  cellSize?: number;
  showMovementRange?: boolean;
  showAttackRange?: boolean;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  mapState,
  participants,
  initiativeOrder,
  currentTurnIndex,
  currentUserId,
  isMyTurn,
  selectedAction,
  onCellClick,
  onSubmitAction,
  onTargetSelect,
  selectedTarget,
  className = "",
  cellSize = 30,
  showMovementRange = true,
  showAttackRange = true,
}) => {
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());

  // Get current turn participant
  const currentTurnParticipant = useMemo(() => {
    if (currentTurnIndex >= 0 && currentTurnIndex < initiativeOrder.length) {
      const currentEntry = initiativeOrder[currentTurnIndex];
      return participants[currentEntry.entityId];
    }
    return null;
  }, [initiativeOrder, currentTurnIndex, participants]);

  // Get current user's participant
  const currentUserParticipant = useMemo(() => {
    return Object.values(participants).find(p => p.userId === currentUserId);
  }, [participants, currentUserId]);

  // Convert live map state to MapPreview format
  const mapPreviewData = useMemo(() => {
    const cells = [];
    
    // Generate base grid
    for (let y = 0; y < mapState.height; y++) {
      for (let x = 0; x < mapState.width; x++) {
        const position = { x, y };
        
        // Check if this position has an obstacle
        const isObstacle = mapState.obstacles.some(obs => obs.x === x && obs.y === y);
        
        // Check if this position has terrain
        const terrain = mapState.terrain.find(t => t.position.x === x && t.position.y === y);
        
        // Check if this position has an entity
        const entity = Object.values(mapState.entities).find(e => e.position.x === x && e.position.y === y);
        const participant = entity ? participants[entity.entityId] : null;
        
        // Determine cell state and occupant
        let state: 'inbounds' | 'outbounds' | 'occupied' = 'inbounds';
        let occupant = undefined;
        let customColor = undefined;
        
        if (isObstacle) {
          state = 'outbounds';
          customColor = '#4a5568'; // Dark gray for obstacles
        } else if (participant) {
          state = 'occupied';
          // Generate color based on entity type and status
          occupant = {
            id: participant.entityId,
            type: participant.entityType,
            color: getEntityColor(participant, currentTurnIndex, initiativeOrder),
            speed: 30, // Default speed
            name: participant.entityId,
          };
        } else if (terrain) {
          // Apply terrain coloring
          customColor = getTerrainColor(terrain.type);
        }
        
        cells.push({
          x,
          y,
          state,
          terrain: terrain?.type as any,
          terrainModifier: getTerrainModifier(terrain?.type),
          occupant,
          customColor,
        });
      }
    }
    
    return {
      width: mapState.width,
      height: mapState.height,
      cells,
    };
  }, [mapState, participants, currentTurnIndex, initiativeOrder]);

  // Handle cell click for movement and targeting with enhanced validation
  const handleCellClick = useCallback((x: number, y: number) => {
    const position = { x, y };
    setValidationErrors([]);
    
    if (!isMyTurn || !selectedAction || !currentUserParticipant) {
      if (onCellClick) {
        onCellClick(x, y);
      }
      return;
    }

    // Handle different action types with validation
    if (selectedAction.type === 'move') {
      const movementRange = getMovementRange(currentUserParticipant);
      const validation = MapMovementValidator.validateMovement(
        currentUserParticipant.position,
        position,
        mapState,
        currentUserParticipant,
        movementRange
      );
      
      if (validation.isValid) {
        setSelectedPosition(position);
        if (onSubmitAction) {
          const action: TurnAction = {
            type: 'move',
            entityId: currentUserParticipant.entityId,
            position,
            actionId: selectedAction.id,
          };
          onSubmitAction(action);
        }
      } else {
        setValidationErrors([validation.reason || 'Invalid movement']);
      }
    } else if (selectedAction.type === 'attack') {
      const attackRange = getAttackRange(currentUserParticipant, selectedAction);
      const validation = MapMovementValidator.validateAttack(
        currentUserParticipant.position,
        position,
        mapState,
        currentUserParticipant,
        attackRange
      );
      
      if (validation.isValid) {
        const targetEntity = Object.values(mapState.entities).find(e => 
          e.position.x === x && e.position.y === y
        );
        
        if (targetEntity && onTargetSelect) {
          onTargetSelect(targetEntity.entityId);
        }
      } else {
        setValidationErrors([validation.reason || 'Invalid attack target']);
      }
    } else if (selectedAction.type === 'cast' || selectedAction.type === 'useItem') {
      // For spells and items, allow targeting positions or entities
      setSelectedPosition(position);
      
      const targetEntity = Object.values(mapState.entities).find(e => 
        e.position.x === x && e.position.y === y
      );
      
      if (targetEntity && onTargetSelect) {
        onTargetSelect(targetEntity.entityId);
      }
    } else if (selectedAction.type === 'interact') {
      setSelectedPosition(position);
    }
    
    if (onCellClick) {
      onCellClick(x, y);
    }
  }, [isMyTurn, selectedAction, currentUserParticipant, onSubmitAction, onTargetSelect, onCellClick, mapState]);

  // Get valid movement positions using the validator
  const getValidMovementPositions = useCallback(() => {
    if (!isMyTurn || !currentUserParticipant || selectedAction?.type !== 'move') {
      return new Set<string>();
    }
    
    const movementRange = getMovementRange(currentUserParticipant);
    return MapMovementValidator.getValidMovementPositions(
      currentUserParticipant,
      mapState,
      movementRange
    );
  }, [isMyTurn, currentUserParticipant, selectedAction, mapState]);

  // Get valid attack targets using the validator
  const getValidAttackTargets = useCallback(() => {
    if (!isMyTurn || !currentUserParticipant || selectedAction?.type !== 'attack') {
      return new Set<string>();
    }
    
    const attackRange = getAttackRange(currentUserParticipant, selectedAction);
    return MapMovementValidator.getValidAttackTargets(
      currentUserParticipant,
      mapState,
      attackRange
    );
  }, [isMyTurn, currentUserParticipant, selectedAction, mapState]);

  const validMovementPositions = getValidMovementPositions();
  const validAttackTargets = getValidAttackTargets();

  // Update timestamp when map state changes for real-time updates
  useEffect(() => {
    setLastUpdateTimestamp(Date.now());
  }, [mapState, participants, currentTurnIndex]);

  // Enhanced cell click handler with validation highlighting
  const enhancedHandleCellClick = useCallback((x: number, y: number) => {
    handleCellClick(x, y);
  }, [handleCellClick]);

  // Handle cell hover for preview information
  const handleCellHover = useCallback((x: number, y: number) => {
    setHoveredCell({ x, y });
  }, []);

  const handleCellLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  // Enhanced map preview with overlays and real-time indicators
  const enhancedMapPreview = useMemo(() => {
    const enhancedCells = mapPreviewData.cells.map(cell => {
      const posKey = `${cell.x},${cell.y}`;
      let enhancedCell = { ...cell };
      
      // Add movement range highlighting
      if (showMovementRange && selectedAction?.type === 'move' && validMovementPositions.has(posKey)) {
        enhancedCell.customColor = enhancedCell.customColor || '#22c55e40'; // Semi-transparent green
      }
      
      // Add attack range highlighting
      if (showAttackRange && selectedAction?.type === 'attack' && validAttackTargets.has(posKey)) {
        enhancedCell.customColor = enhancedCell.customColor || '#ef444440'; // Semi-transparent red
      }
      
      // Add spell/item targeting highlighting
      if ((selectedAction?.type === 'cast' || selectedAction?.type === 'useItem') && isMyTurn) {
        const distance = Math.abs(cell.x - (currentUserParticipant?.position.x || 0)) + 
                        Math.abs(cell.y - (currentUserParticipant?.position.y || 0));
        if (distance <= 10) { // Spell/item range
          enhancedCell.customColor = enhancedCell.customColor || '#8b5cf640'; // Semi-transparent purple
        }
      }
      
      // Highlight selected target
      if (selectedTarget) {
        const targetEntity = Object.values(mapState.entities).find(e => e.entityId === selectedTarget);
        if (targetEntity && targetEntity.position.x === cell.x && targetEntity.position.y === cell.y) {
          enhancedCell.customColor = '#f59e0b'; // Orange for selected target
        }
      }
      
      // Highlight selected position
      if (selectedPosition && selectedPosition.x === cell.x && selectedPosition.y === cell.y) {
        enhancedCell.customColor = '#06b6d4'; // Cyan for selected position
      }
      
      // Highlight hovered cell
      if (hoveredCell && hoveredCell.x === cell.x && hoveredCell.y === cell.y) {
        enhancedCell.customColor = enhancedCell.customColor ? 
          `${enhancedCell.customColor}80` : '#6b728080'; // Add transparency to existing color or light gray
      }
      
      // Highlight current turn participant with pulsing effect
      if (currentTurnParticipant) {
        const currentEntity = Object.values(mapState.entities).find(e => e.entityId === currentTurnParticipant.entityId);
        if (currentEntity && currentEntity.position.x === cell.x && currentEntity.position.y === cell.y) {
          // Use a bright border color for current turn
          enhancedCell.customColor = enhancedCell.occupant?.color || '#3b82f6';
        }
      }
      
      // Add status indicators to occupant names
      if (enhancedCell.occupant) {
        const participant = participants[enhancedCell.occupant.id];
        if (participant) {
          const statusIndicator = getEntityStatusIndicator(participant);
          if (statusIndicator) {
            enhancedCell.occupant.name = `${enhancedCell.occupant.name} ${statusIndicator}`;
          }
        }
      }
      
      return enhancedCell;
    });
    
    return {
      ...mapPreviewData,
      cells: enhancedCells,
    };
  }, [mapPreviewData, selectedAction, validMovementPositions, validAttackTargets, selectedTarget, selectedPosition, hoveredCell, currentTurnParticipant, currentUserParticipant, mapState, participants, isMyTurn, showMovementRange, showAttackRange]);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Battle Map
          </span>
          <div className="flex items-center gap-2">
            {currentTurnParticipant && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {currentTurnParticipant.entityId}'s Turn
              </Badge>
            )}
            {isMyTurn && (
              <Badge variant="default" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Your Turn
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Action Invalid:</span>
            </div>
            <ul className="mt-2 text-sm text-destructive space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Status */}
        {selectedAction && isMyTurn && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-primary">
              {selectedAction.type === 'move' && <Move className="w-4 h-4" />}
              {selectedAction.type === 'attack' && <Crosshair className="w-4 h-4" />}
              {selectedAction.type === 'cast' && <Zap className="w-4 h-4" />}
              {selectedAction.type === 'useItem' && <Shield className="w-4 h-4" />}
              {selectedAction.type === 'interact' && <Hand className="w-4 h-4" />}
              <span className="font-medium">
                {selectedAction.type === 'move' && 'Select destination to move'}
                {selectedAction.type === 'attack' && 'Select target to attack'}
                {selectedAction.type === 'useItem' && 'Select target for item use'}
                {selectedAction.type === 'cast' && 'Select target for spell'}
                {selectedAction.type === 'interact' && 'Select object to interact with'}
              </span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground space-y-1">
              {selectedAction.type === 'move' && (
                <>
                  <div>Green highlighted cells show valid movement positions</div>
                  <div>Movement range: {getMovementRange(currentUserParticipant || {} as ParticipantState)} cells</div>
                </>
              )}
              {selectedAction.type === 'attack' && (
                <>
                  <div>Red highlighted cells show valid attack targets</div>
                  <div>Attack range: {getAttackRange(currentUserParticipant || {} as ParticipantState, selectedAction)} cells</div>
                </>
              )}
              {(selectedAction.type === 'cast' || selectedAction.type === 'useItem') && (
                <div>Purple highlighted cells show targeting range</div>
              )}
            </div>
          </div>
        )}

        {/* Map Display */}
        <div className="relative">
          <MapPreview
            map={enhancedMapPreview}
            cellSize={cellSize}
            interactive={true}
            onCellClick={enhancedHandleCellClick}
            onCellHover={handleCellHover}
            onCellLeave={handleCellLeave}
            showTerrainInfo={true}
            className="border-2 border-muted rounded-lg"
          />
          
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/40 border border-green-500 rounded"></div>
              <span>Valid Movement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/40 border border-red-500 rounded"></div>
              <span>Attack Range</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500/40 border border-purple-500 rounded"></div>
              <span>Spell/Item Range</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 border border-orange-600 rounded"></div>
              <span>Selected Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-500 border border-cyan-600 rounded"></div>
              <span>Selected Position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 border border-gray-700 rounded"></div>
              <span>Obstacles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
              <span>Current Turn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">💀🩸🤢😵‍💫😵</span>
              <span>Status Effects</span>
            </div>
          </div>

          {/* Hover Information */}
          {hoveredCell && (
            <div className="mt-4 p-3 bg-muted/50 border border-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4" />
                <span className="font-medium">Cell ({hoveredCell.x}, {hoveredCell.y})</span>
              </div>
              {(() => {
                const entity = Object.values(mapState.entities).find(e => 
                  e.position.x === hoveredCell.x && e.position.y === hoveredCell.y
                );
                const participant = entity ? participants[entity.entityId] : null;
                const terrain = mapState.terrain.find(t => 
                  t.position.x === hoveredCell.x && t.position.y === hoveredCell.y
                );
                const isObstacle = mapState.obstacles.some(obs => 
                  obs.x === hoveredCell.x && obs.y === hoveredCell.y
                );

                return (
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    {participant && (
                      <div>
                        <span className="font-medium">{participant.entityId}</span>
                        <span> ({participant.entityType})</span>
                        <div>HP: {participant.currentHP}/{participant.maxHP}</div>
                        {participant.conditions.length > 0 && (
                          <div>Conditions: {participant.conditions.map(c => c.name).join(', ')}</div>
                        )}
                      </div>
                    )}
                    {terrain && (
                      <div>Terrain: {terrain.type} (modifier: {getTerrainModifier(terrain.type)})</div>
                    )}
                    {isObstacle && <div>Blocked by obstacle</div>}
                    {!participant && !terrain && !isObstacle && <div>Empty cell</div>}
                    
                    {currentUserParticipant && selectedAction && (
                      <div className="pt-1 border-t border-muted">
                        {selectedAction.type === 'move' && (
                          <div>
                            Distance: {Math.abs(hoveredCell.x - currentUserParticipant.position.x) + 
                                     Math.abs(hoveredCell.y - currentUserParticipant.position.y)} cells
                          </div>
                        )}
                        {selectedAction.type === 'attack' && participant && (
                          <div>
                            Range: {Math.abs(hoveredCell.x - currentUserParticipant.position.x) + 
                                   Math.abs(hoveredCell.y - currentUserParticipant.position.y)} cells
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Entity Status Summary */}
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm">Entities on Map</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {Object.values(participants).map(participant => {
              const entity = Object.values(mapState.entities).find(e => e.entityId === participant.entityId);
              const isCurrentTurn = currentTurnParticipant?.entityId === participant.entityId;
              const isCurrentUser = participant.userId === currentUserId;
              
              return (
                <div
                  key={participant.entityId}
                  className={cn(
                    "flex items-center justify-between p-2 rounded border text-xs",
                    isCurrentTurn && "bg-primary/10 border-primary",
                    isCurrentUser && "ring-1 ring-blue-500/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded border"
                      style={{ backgroundColor: getEntityColor(participant, currentTurnIndex, initiativeOrder) }}
                    />
                    <span className="font-medium">
                      {participant.entityId}
                      {isCurrentUser && " (You)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entity && (
                      <span className="text-muted-foreground">
                        ({entity.position.x}, {entity.position.y})
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {participant.currentHP}/{participant.maxHP} HP
                    </span>
                    {isCurrentTurn && <Clock className="w-3 h-3 text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions
function getEntityColor(participant: ParticipantState, currentTurnIndex: number, initiativeOrder: InitiativeEntry[]): string {
  const isCurrentTurn = initiativeOrder[currentTurnIndex]?.entityId === participant.entityId;
  
  if (isCurrentTurn) {
    return '#3b82f6'; // Blue for current turn
  }
  
  switch (participant.entityType) {
    case 'playerCharacter':
      return '#22c55e'; // Green for player characters
    case 'npc':
      return '#f59e0b'; // Orange for NPCs
    case 'monster':
      return '#ef4444'; // Red for monsters
    default:
      return '#6b7280'; // Gray default
  }
}

function getTerrainColor(terrainType?: string): string {
  switch (terrainType) {
    case 'soft':
      return '#fef3c7'; // Light yellow
    case 'rough':
      return '#fed7aa'; // Light orange
    case 'intense':
      return '#fecaca'; // Light red
    case 'brutal':
      return '#f3e8ff'; // Light purple
    case 'deadly':
      return '#e5e7eb'; // Light gray
    default:
      return '#f9fafb'; // Very light gray
  }
}

function getTerrainModifier(terrainType?: string): number {
  switch (terrainType) {
    case 'soft':
      return -1;
    case 'rough':
      return -3;
    case 'intense':
      return -5;
    case 'brutal':
      return -7;
    case 'deadly':
      return -9;
    default:
      return 0;
  }
}

// Helper functions for dynamic range calculation
function getMovementRange(participant: ParticipantState): number {
  // Base movement range
  let range = 6;
  
  // Check for movement-affecting conditions
  participant.conditions.forEach(condition => {
    if (condition.name.toLowerCase().includes('haste')) {
      range += 3; // Haste increases movement
    } else if (condition.name.toLowerCase().includes('slow')) {
      range = Math.max(1, range - 3); // Slow decreases movement
    }
  });
  
  // Check for equipment that affects movement
  const boots = participant.inventory.equippedItems.feet;
  if (boots) {
    // Could check for boots of speed, etc.
    // This would require item data lookup
  }
  
  return range;
}

function getAttackRange(participant: ParticipantState, action?: { id: string; name: string; type: string }): number {
  // Base attack range
  let range = 5;
  
  // Check equipped weapon for range
  const weapon = participant.inventory.equippedItems.mainHand;
  if (weapon) {
    // Different weapons have different ranges
    // This would require weapon data lookup
    // For now, assume melee = 1, ranged = 10
    range = weapon.includes('bow') || weapon.includes('crossbow') ? 10 : 1;
  }
  
  // Check for reach weapons or abilities
  if (action?.name.toLowerCase().includes('reach')) {
    range += 1;
  }
  
  return range;
}

function getEntityStatusIndicator(participant: ParticipantState): string {
  if (participant.currentHP <= 0) return '💀';
  if (participant.currentHP <= participant.maxHP * 0.25) return '🩸';
  if (participant.conditions.some(c => c.name.toLowerCase().includes('poison'))) return '🤢';
  if (participant.conditions.some(c => c.name.toLowerCase().includes('charm'))) return '😵‍💫';
  if (participant.conditions.some(c => c.name.toLowerCase().includes('stun'))) return '😵';
  return '';
}