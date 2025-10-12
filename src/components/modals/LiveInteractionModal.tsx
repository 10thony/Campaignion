import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Clock, 
  Users, 
  Sword, 
  Shield, 
  Heart, 
  MessageCircle, 
  Settings,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Map
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLiveInteraction } from '../../hooks/useLiveInteraction';
import { Id } from '../../../convex/_generated/dataModel';
import { LiveMapView } from '../maps/LiveMapView';
import { MapActionSelector } from '../maps/MapActionSelector';
import { MapModal } from '../maps/MapModal';

// Import types from live server schemas
interface Position {
  x: number;
  y: number;
}

interface StatusEffect {
  id: string;
  name: string;
  duration: number;
  effects: Record<string, any>;
}

interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  properties: Record<string, any>;
}

interface InventoryState {
  items: InventoryItem[];
  equippedItems: Record<string, string>;
  capacity: number;
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

interface ParticipantState {
  entityId: string;
  entityType: 'playerCharacter' | 'npc' | 'monster';
  userId?: string;
  currentHP: number;
  maxHP: number;
  position: Position;
  conditions: StatusEffect[];
  inventory: InventoryState;
  availableActions: Action[];
  turnStatus: 'waiting' | 'active' | 'completed' | 'skipped';
}

interface InitiativeEntry {
  entityId: string;
  entityType: 'playerCharacter' | 'npc' | 'monster';
  initiative: number;
  userId?: string;
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

interface ChatMessage {
  id: string;
  userId: string;
  entityId?: string;
  content: string;
  type: 'party' | 'dm' | 'private' | 'system';
  recipients?: string[];
  timestamp: number;
}

interface GameState {
  interactionId: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  initiativeOrder: InitiativeEntry[];
  currentTurnIndex: number;
  roundNumber: number;
  participants: Record<string, ParticipantState>;
  mapState: {
    width: number;
    height: number;
    entities: Record<string, { entityId: string; position: Position; facing?: number }>;
    obstacles: Position[];
    terrain: Array<{ position: Position; type: string; properties: Record<string, any> }>;
  };
  turnHistory: Array<{
    entityId: string;
    turnNumber: number;
    roundNumber: number;
    actions: TurnAction[];
    startTime: Date;
    endTime?: Date;
    status: 'completed' | 'skipped' | 'timeout';
  }>;
  chatLog: ChatMessage[];
  timestamp: Date;
}

interface LiveInteractionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interactionId: Id<"interactions">;
  currentUserId: string;
  isDM: boolean;
}

export function LiveInteractionModal({
  open,
  onOpenChange,
  interactionId,
  currentUserId,
  isDM,
}: LiveInteractionModalProps) {
  // Local state for UI interactions
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatChannel, setChatChannel] = useState<'party' | 'dm' | 'private'>('party');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [diceNotation, setDiceNotation] = useState('1d20');
  const [diceModifier, setDiceModifier] = useState(0);
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  
  // Map modal state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<Id<"maps"> | null>(null);

  // Use the live interaction hook
  const {
    gameState,
    connectionStatus,
    isLoading,
    error,
    currentParticipant,
    currentTurnParticipant,
    isMyTurn,
    turnTimeRemaining,
    joinRoom,
    leaveRoom,
    takeTurn,
    skipTurn,
    sendChatMessage,
    pauseInteraction,
    resumeInteraction,
    rollbackTurn,
    updateInitiative,
  } = useLiveInteraction({
    interactionId,
    onError: (err) => {
      console.error('Live interaction error:', err);
      setValidationErrors([err.message]);
    },
    onConnectionChange: (status) => {
      console.log('Connection status changed:', status);
    },
  });

  // Auto-join room when modal opens
  React.useEffect(() => {
    if (open && connectionStatus === 'connecting') {
      joinRoom();
    }
  }, [open, connectionStatus, joinRoom]);

  // Action handlers
  const handleActionSelect = useCallback((action: Action) => {
    setSelectedAction(action);
    setSelectedTarget(null);
    setValidationErrors([]);
  }, []);

  const handleSubmitAction = useCallback(async () => {
    if (!selectedAction || !currentParticipant) return;

    setValidationErrors([]);

    try {
      const action: TurnAction = {
        type: selectedAction.type,
        entityId: currentParticipant.entityId,
        target: selectedTarget || undefined,
        actionId: selectedAction.id,
      };

      // Client-side validation
      if (selectedAction.type === 'attack' && !selectedTarget) {
        setValidationErrors(['Please select a target for your attack']);
        return;
      }

      await takeTurn(action);
      
      // Clear selection on success
      setSelectedAction(null);
      setSelectedTarget(null);

    } catch (error) {
      setValidationErrors(['Failed to submit action. Please try again.']);
    }
  }, [selectedAction, currentParticipant, selectedTarget, takeTurn]);

  const handleSkipTurn = useCallback(async () => {
    try {
      await skipTurn();
      setSelectedAction(null);
      setSelectedTarget(null);
    } catch (error) {
      setValidationErrors(['Failed to skip turn. Please try again.']);
    }
  }, [skipTurn]);

  const handleSendChatMessage = useCallback(async () => {
    if (!chatMessage.trim()) return;

    try {
      await sendChatMessage({
        userId: currentUserId,
        content: chatMessage,
        type: chatChannel,
      });
      
      setChatMessage('');
    } catch (error) {
      setValidationErrors(['Failed to send message. Please try again.']);
    }
  }, [chatMessage, chatChannel, currentUserId, sendChatMessage]);

  const rollDice = useCallback((sides: number, count: number = 1, modifier: number = 0): { rolls: number[], total: number, formula: string } => {
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
    const formula = `${count}d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ''}`;
    return { rolls, total, formula };
  }, []);

  const handleDiceRoll = useCallback(async () => {
    try {
      // Parse dice notation (e.g., "2d6", "1d20+5", "3d8-2")
      const diceRegex = /^(\d+)d(\d+)([+-]\d+)?$/i;
      const match = diceNotation.match(diceRegex);
      
      if (!match) {
        setValidationErrors(['Invalid dice notation. Use format like "1d20", "2d6+3", etc.']);
        return;
      }

      const count = parseInt(match[1]);
      const sides = parseInt(match[2]);
      const modifier = match[3] ? parseInt(match[3]) : diceModifier;

      const rollResult = rollDice(sides, count, modifier);
      
      const rollMessage = `🎲 **Dice Roll:** ${rollResult.formula} = [${rollResult.rolls.join(', ')}]${modifier !== 0 ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''} = **${rollResult.total}**`;

      await sendChatMessage({
        userId: currentUserId,
        content: rollMessage,
        type: chatChannel,
      });
      
      setShowDiceRoller(false);
      setDiceNotation('1d20');
      setDiceModifier(0);
    } catch (error) {
      setValidationErrors(['Failed to roll dice. Please try again.']);
    }
  }, [diceNotation, diceModifier, chatChannel, currentUserId, sendChatMessage, rollDice]);

  // Render helpers
  const renderConnectionStatus = () => (
    <div className="flex items-center gap-2 mb-4">
      <div className={cn(
        "w-2 h-2 rounded-full",
        connectionStatus === 'connected' ? 'bg-green-500' : 
        connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
      )} />
      <span className="text-sm text-muted-foreground">
        {connectionStatus === 'connected' ? 'Connected' :
         connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
      </span>
    </div>
  );

  const renderInitiativeOrder = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-4 h-4" aria-hidden="true" />
          Initiative Order - Round {gameState?.roundNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="space-y-2" 
          role="list" 
          aria-label={`Initiative order for round ${gameState?.roundNumber}`}
        >
          {gameState?.initiativeOrder.map((entry, index) => {
            const participant = gameState.participants[entry.entityId];
            const isCurrentTurn = index === gameState.currentTurnIndex;
            const isCurrentUser = entry.userId === currentUserId;
            
            return (
              <div
                key={entry.entityId}
                role="listitem"
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  isCurrentTurn && "bg-primary/10 border-primary",
                  isCurrentUser && "ring-2 ring-blue-500/20"
                )}
                aria-current={isCurrentTurn ? "true" : undefined}
                aria-label={`${entry.entityId}${isCurrentUser ? ' (you)' : ''}, initiative ${entry.initiative}${isCurrentTurn ? ', current turn' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {isCurrentTurn && (
                    <Play 
                      className="w-4 h-4 text-primary" 
                      aria-hidden="true"
                      title="Current turn"
                    />
                  )}
                  <div>
                    <div className="font-medium">
                      {entry.entityId} {isCurrentUser && "(You)"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Initiative: {entry.initiative}
                    </div>
                  </div>
                </div>
                
                {participant && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm">
                        {participant.currentHP}/{participant.maxHP}
                      </span>
                    </div>
                    
                    {participant.conditions.length > 0 && (
                      <div className="flex gap-1">
                        {participant.conditions.map(condition => (
                          <Badge key={condition.id} variant="secondary" className="text-xs">
                            {condition.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <Badge variant={
                      participant.turnStatus === 'active' ? 'default' :
                      participant.turnStatus === 'completed' ? 'secondary' :
                      participant.turnStatus === 'skipped' ? 'destructive' : 'outline'
                    }>
                      {participant.turnStatus}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
        aria-describedby="live-interaction-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Live Interaction</span>
            {renderConnectionStatus()}
          </DialogTitle>
          <div id="live-interaction-description" className="sr-only">
            Real-time D&D interaction interface with turn-based gameplay, chat, and map view
          </div>
        </DialogHeader>

        {connectionStatus === 'connecting' && (
          <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" aria-hidden="true" />
              <p>Connecting to live session...</p>
            </div>
          </div>
        )}

        {connectionStatus === 'connected' && gameState && (
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="game" className="h-full flex flex-col">
              <TabsList 
                className="grid w-full grid-cols-4" 
                role="tablist" 
                aria-label="Live interaction sections"
              >
                <TabsTrigger value="game" role="tab" aria-controls="game-panel">Game</TabsTrigger>
                <TabsTrigger value="inventory" role="tab" aria-controls="inventory-panel">Inventory</TabsTrigger>
                <TabsTrigger value="chat" role="tab" aria-controls="chat-panel">Chat</TabsTrigger>
                {isDM && <TabsTrigger value="dm" role="tab" aria-controls="dm-panel">DM Controls</TabsTrigger>}
              </TabsList>

              <TabsContent 
                value="game" 
                className="flex-1 overflow-hidden" 
                role="tabpanel" 
                id="game-panel"
                aria-labelledby="game-tab"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  <div className="lg:col-span-2 space-y-4">
                    {renderInitiativeOrder()}
                    
                    {/* Turn Interface */}
                    {isMyTurn && currentParticipant && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" aria-hidden="true" />
                              Your Turn
                            </span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(turnTimeRemaining / 90) * 100} 
                                className="w-24"
                                aria-label={`Turn timer: ${Math.floor(turnTimeRemaining / 60)} minutes ${turnTimeRemaining % 60} seconds remaining`}
                              />
                              <span 
                                className="text-sm font-mono"
                                aria-live="polite"
                                aria-label={`${Math.floor(turnTimeRemaining / 60)} minutes ${turnTimeRemaining % 60} seconds remaining`}
                              >
                                {Math.floor(turnTimeRemaining / 60)}:{(turnTimeRemaining % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {validationErrors.length > 0 && (
                            <div 
                              className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                              role="alert"
                              aria-live="assertive"
                            >
                              <div className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                                <span className="font-medium">Validation Errors:</span>
                              </div>
                              <ul className="mt-2 text-sm text-destructive" role="list">
                                {validationErrors.map((error, index) => (
                                  <li key={index} role="listitem">• {error}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Available Actions</h4>
                              <div 
                                className="grid grid-cols-2 md:grid-cols-3 gap-2"
                                role="group"
                                aria-label="Available actions for your turn"
                              >
                                {currentParticipant.availableActions.map(action => (
                                  <Button
                                    key={action.id}
                                    variant={selectedAction?.id === action.id ? 'default' : 'outline'}
                                    disabled={!action.available}
                                    onClick={() => handleActionSelect(action)}
                                    className="flex items-center gap-2"
                                    aria-pressed={selectedAction?.id === action.id}
                                    aria-describedby={`action-${action.id}-desc`}
                                  >
                                    {action.type === 'attack' && <Sword className="w-4 h-4" aria-hidden="true" />}
                                    {action.type === 'move' && <SkipForward className="w-4 h-4" aria-hidden="true" />}
                                    {action.type === 'useItem' && <Shield className="w-4 h-4" aria-hidden="true" />}
                                    {action.name}
                                    <span id={`action-${action.id}-desc`} className="sr-only">
                                      {action.type} action{!action.available ? ', currently unavailable' : ''}
                                    </span>
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {selectedAction && selectedAction.type === 'attack' && (
                              <div>
                                <h4 className="font-medium mb-2">Select Target</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.values(gameState.participants)
                                    .filter(p => p.entityId !== currentParticipant.entityId && p.currentHP > 0)
                                    .map(participant => (
                                      <Button
                                        key={participant.entityId}
                                        variant={selectedTarget === participant.entityId ? 'default' : 'outline'}
                                        onClick={() => setSelectedTarget(participant.entityId)}
                                      >
                                        {participant.entityId} ({participant.currentHP}/{participant.maxHP} HP)
                                      </Button>
                                    ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                onClick={handleSubmitAction}
                                disabled={!selectedAction || isLoading}
                                className="flex items-center gap-2"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Submit Action
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={handleSkipTurn}
                                className="flex items-center gap-2"
                              >
                                <SkipForward className="w-4 h-4" />
                                Skip Turn
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {!isMyTurn && (
                      <Card>
                        <CardContent className="py-6">
                          <div className="text-center text-muted-foreground">
                            <Clock className="w-8 h-8 mx-auto mb-2" />
                            <p>Waiting for {currentTurnParticipant?.entityId}'s turn...</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Map View */}
                  <div>
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Battle Map</span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Round {gameState?.roundNumber}</span>
                            {gameState?.status === 'active' && (
                              <Badge variant="default" className="animate-pulse">Live</Badge>
                            )}
                            {isDM && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // For now, we'll use a placeholder map ID
                                  // In a real implementation, this would come from the interaction data
                                  setSelectedMapId('placeholder-map-id' as Id<"maps">);
                                  setIsMapModalOpen(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Map className="h-4 w-4" />
                                Open Tactical View
                              </Button>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {gameState?.mapState ? (
                          <div className="space-y-3">
                            <div className="aspect-square bg-muted rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center relative overflow-hidden">
                              {/* Simple grid-based map visualization */}
                              <div 
                                className="grid gap-0 w-full h-full"
                                style={{
                                  gridTemplateColumns: `repeat(${Math.min(gameState.mapState.width, 10)}, 1fr)`,
                                  gridTemplateRows: `repeat(${Math.min(gameState.mapState.height, 10)}, 1fr)`
                                }}
                              >
                                {Array.from({ length: Math.min(gameState.mapState.width * gameState.mapState.height, 100) }).map((_, index) => {
                                  const x = index % Math.min(gameState.mapState.width, 10);
                                  const y = Math.floor(index / Math.min(gameState.mapState.width, 10));
                                  const entity = Object.values(gameState.mapState.entities).find(e => e.position.x === x && e.position.y === y);
                                  const isObstacle = gameState.mapState.obstacles.some(obs => obs.x === x && obs.y === y);
                                  
                                  return (
                                    <div
                                      key={index}
                                      className={cn(
                                        "border border-muted-foreground/10 flex items-center justify-center text-xs font-bold relative",
                                        isObstacle && "bg-stone-600",
                                        entity && "bg-blue-500 text-white"
                                      )}
                                      title={entity ? `${entity.entityId} at (${x}, ${y})` : `(${x}, ${y})`}
                                    >
                                      {entity && entity.entityId.charAt(0).toUpperCase()}
                                      {isObstacle && "█"}
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* Legend */}
                              <div className="absolute bottom-2 left-2 bg-background/90 rounded p-2 text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                  <span>Entities</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 bg-stone-600 rounded"></div>
                                  <span>Obstacles</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Entity positions */}
                            <div className="text-sm">
                              <h5 className="font-medium mb-2">Entity Positions</h5>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {Object.values(gameState.mapState.entities).map(entity => (
                                  <div key={entity.entityId} className="flex justify-between items-center">
                                    <span className="truncate">{entity.entityId}</span>
                                    <span className="text-muted-foreground">({entity.position.x}, {entity.position.y})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <p className="text-muted-foreground">No map data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="flex-1 overflow-auto">
                {currentParticipant && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Items</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {currentParticipant.inventory.items.map(item => (
                              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <div className="font-medium">{item.itemId}</div>
                                  <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                                </div>
                                <Button size="sm" variant="outline">
                                  Use
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Equipped Items</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(currentParticipant.inventory.equippedItems).map(([slot, itemId]) => (
                              <div key={slot} className="p-3 border rounded-lg">
                                <div className="text-sm text-muted-foreground capitalize">{slot}</div>
                                <div className="font-medium">{itemId}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent 
                value="chat" 
                className="flex-1 overflow-hidden"
                role="tabpanel"
                id="chat-panel"
                aria-labelledby="chat-tab"
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div 
                      className="flex-1 overflow-auto mb-4 space-y-2"
                      role="log"
                      aria-live="polite"
                      aria-label="Chat messages"
                    >
                      {gameState.chatLog.map(message => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-2 rounded-lg",
                            message.type === 'system' && "bg-muted text-muted-foreground text-center",
                            message.userId === currentUserId && "bg-primary/10 ml-8",
                            message.userId !== currentUserId && message.type !== 'system' && "bg-muted mr-8"
                          )}
                          role={message.type === 'system' ? 'status' : 'article'}
                          aria-label={
                            message.type === 'system' 
                              ? `System message: ${message.content}`
                              : `Message from ${message.userId} at ${new Date(message.timestamp).toLocaleTimeString()}: ${message.content}`
                          }
                        >
                          {message.type !== 'system' && (
                            <div className="text-xs text-muted-foreground mb-1">
                              {message.userId} • {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          )}
                          <div>{message.content}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div 
                        className="flex gap-2"
                        role="radiogroup"
                        aria-label="Chat channel selection"
                      >
                        <Button
                          size="sm"
                          variant={chatChannel === 'party' ? 'default' : 'outline'}
                          onClick={() => setChatChannel('party')}
                          role="radio"
                          aria-checked={chatChannel === 'party'}
                          aria-describedby="party-channel-desc"
                        >
                          Party
                          <span id="party-channel-desc" className="sr-only">
                            Send message to all party members
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          variant={chatChannel === 'dm' ? 'default' : 'outline'}
                          onClick={() => setChatChannel('dm')}
                          role="radio"
                          aria-checked={chatChannel === 'dm'}
                          aria-describedby="dm-channel-desc"
                        >
                          DM
                          <span id="dm-channel-desc" className="sr-only">
                            Send private message to Dungeon Master
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          variant={chatChannel === 'private' ? 'default' : 'outline'}
                          onClick={() => setChatChannel('private')}
                          role="radio"
                          aria-checked={chatChannel === 'private'}
                          aria-describedby="private-channel-desc"
                        >
                          Private
                          <span id="private-channel-desc" className="sr-only">
                            Send private message to selected player
                          </span>
                        </Button>
                      </div>

                      {showDiceRoller && (
                        <div className="p-3 border rounded-lg bg-muted/50">
                          <h4 className="font-medium mb-2">🎲 Roll Dice</h4>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label htmlFor="dice-notation" className="block text-sm font-medium mb-1">
                                  Dice Notation
                                </label>
                                <input
                                  id="dice-notation"
                                  type="text"
                                  value={diceNotation}
                                  onChange={(e) => setDiceNotation(e.target.value)}
                                  placeholder="1d20, 2d6+3, etc."
                                  className="w-full px-3 py-2 border rounded-md"
                                />
                              </div>
                              <div className="w-24">
                                <label htmlFor="dice-modifier" className="block text-sm font-medium mb-1">
                                  Modifier
                                </label>
                                <input
                                  id="dice-modifier"
                                  type="number"
                                  value={diceModifier}
                                  onChange={(e) => setDiceModifier(parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border rounded-md"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleDiceRoll}
                                className="flex items-center gap-2"
                              >
                                🎲 Roll
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowDiceRoller(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '3d6'].map(preset => (
                                <Button
                                  key={preset}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDiceNotation(preset)}
                                  className="text-xs"
                                >
                                  {preset}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <label htmlFor="chat-input" className="sr-only">
                          Chat message
                        </label>
                        <input
                          id="chat-input"
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendChatMessage();
                            }
                          }}
                          placeholder={`Message ${chatChannel}...`}
                          className="flex-1 px-3 py-2 border rounded-md"
                          aria-describedby="chat-input-help"
                        />
                        <span id="chat-input-help" className="sr-only">
                          Press Enter to send message, Shift+Enter for new line
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDiceRoller(!showDiceRoller)}
                          className="flex items-center gap-1"
                          title="Roll dice"
                        >
                          🎲
                        </Button>
                        <Button 
                          onClick={handleSendChatMessage}
                          disabled={!chatMessage.trim()}
                          aria-describedby="send-button-desc"
                        >
                          Send
                          <span id="send-button-desc" className="sr-only">
                            Send message to {chatChannel} channel
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {isDM && (
                <TabsContent value="dm" className="flex-1 overflow-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        DM Controls
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Session Controls</h4>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              onClick={() => gameState?.status === 'active' ? pauseInteraction() : resumeInteraction()}
                              disabled={isLoading}
                            >
                              {gameState?.status === 'active' ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause Session
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Resume Session
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => rollbackTurn(1, gameState?.roundNumber || 1)}
                              disabled={isLoading}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Rollback Turn
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Initiative Management</h4>
                          <div className="space-y-2">
                            {gameState.initiativeOrder.map((entry, index) => (
                              <div key={entry.entityId} className="flex items-center justify-between p-2 border rounded">
                                <span>{entry.entityId} (Init: {entry.initiative})</span>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline">Skip</Button>
                                  <Button size="sm" variant="outline">Edit</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </DialogContent>

      {/* Map Modal for Tactical View */}
      {selectedMapId && (
        <MapModal
          isOpen={isMapModalOpen}
          onClose={() => {
            setIsMapModalOpen(false);
            setSelectedMapId(null);
          }}
          mapId={selectedMapId}
          mode="interactive"
          campaignId={undefined} // This would come from the interaction context
          interactionId={interactionId}
        />
      )}
    </Dialog>
  );
}