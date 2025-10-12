import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

// Types from live server schemas
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

interface GameEvent {
  type: 'PARTICIPANT_JOINED' | 'PARTICIPANT_LEFT' | 'TURN_STARTED' | 'TURN_COMPLETED' | 'TURN_SKIPPED' | 'TURN_BACKTRACKED' | 'STATE_DELTA' | 'CHAT_MESSAGE' | 'INITIATIVE_UPDATED' | 'INTERACTION_PAUSED' | 'INTERACTION_RESUMED' | 'PLAYER_DISCONNECTED' | 'PLAYER_RECONNECTED' | 'DM_DISCONNECTED' | 'DM_RECONNECTED' | 'ERROR';
  [key: string]: any;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseLiveInteractionOptions {
  interactionId: Id<"interactions">;
  onError?: (error: Error) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

interface UseLiveInteractionReturn {
  // State
  gameState: GameState | null;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: Error | null;
  
  // Computed values
  currentParticipant: ParticipantState | null;
  currentTurnParticipant: InitiativeEntry | null;
  isMyTurn: boolean;
  turnTimeRemaining: number;
  
  // Actions
  joinRoom: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  takeTurn: (action: TurnAction) => Promise<void>;
  skipTurn: () => Promise<void>;
  sendChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  
  // DM Actions (only available if user is DM)
  pauseInteraction: () => Promise<void>;
  resumeInteraction: () => Promise<void>;
  rollbackTurn: (targetTurn: number, targetRound: number) => Promise<void>;
  updateInitiative: (order: InitiativeEntry[]) => Promise<void>;
}

export function useLiveInteraction({
  interactionId,
  onError,
  onConnectionChange,
}: UseLiveInteractionOptions): UseLiveInteractionReturn {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(90);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, any>>(new Map());
  
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Convex queries and mutations for real-time updates
  const completeRoomState = useQuery(api.liveSystemAPI.getCompleteRoomState, { interactionId });
  const joinRoomMutation = useMutation(api.liveSystemAPI.quickJoinRoom);
  const leaveRoomMutation = useMutation(api.liveSystemAPI.leaveLiveRoom);
  const takeTurnMutation = useMutation(api.liveSystemAPI.submitTurnAction);
  const skipTurnMutation = useMutation(api.liveSystemAPI.skipTurn);
  const sendChatMutation = useMutation(api.liveSystemAPI.sendChatMessage);
  const pauseInteractionMutation = useMutation(api.liveSystemAPI.pauseLiveRoom);
  const resumeInteractionMutation = useMutation(api.liveSystemAPI.resumeLiveRoom);
  const rollInitiativeMutation = useMutation(api.liveSystemAPI.rollInitiative);

  // Update game state from Convex real-time data
  useEffect(() => {
    if (completeRoomState?.room) {
      const newGameState: GameState = {
        interactionId: interactionId,
        status: completeRoomState.room.status,
        initiativeOrder: completeRoomState.room.gameState.initiativeOrder,
        currentTurnIndex: completeRoomState.room.gameState.currentTurnIndex,
        roundNumber: completeRoomState.room.gameState.roundNumber,
        participants: completeRoomState.room.participants.reduce((acc: Record<string, ParticipantState>, p) => {
          acc[p.entityId] = {
            entityId: p.entityId,
            entityType: p.entityType,
            userId: p.userId,
            currentHP: p.currentHP || 100,
            maxHP: p.maxHP || 100,
            position: p.position || { x: 0, y: 0 },
            conditions: p.conditions || [],
            inventory: p.inventory || { items: [], equippedItems: {}, capacity: 20 },
            availableActions: p.availableActions || [],
            turnStatus: p.turnStatus
          };
          return acc;
        }, {}),
        mapState: completeRoomState.map || {
          width: 20,
          height: 20,
          entities: {},
          obstacles: [],
          terrain: []
        },
        turnHistory: completeRoomState.room.gameState.turnHistory || [],
        chatLog: completeRoomState.chat?.messages?.map(msg => ({
          id: msg.messageId,
          userId: msg.userId,
          entityId: msg.entityId,
          content: msg.content,
          type: msg.channel as 'party' | 'dm' | 'private' | 'system',
          recipients: msg.recipients,
          timestamp: msg.timestamp
        })) || [],
        timestamp: new Date(completeRoomState.timestamp)
      };
      
      setGameState(newGameState);
      setConnectionStatus('connected');
      onConnectionChange?.('connected');
      setError(null);
    } else if (completeRoomState === null) {
      setConnectionStatus('disconnected');
      onConnectionChange?.('disconnected');
    }
  }, [completeRoomState, interactionId, onConnectionChange]);

  // Computed values
  const currentParticipant = gameState?.participants 
    ? Object.values(gameState.participants).find(p => p.userId === user?.id)
    : null;

  const currentTurnParticipant = gameState?.initiativeOrder[gameState.currentTurnIndex] || null;
  const isMyTurn = currentTurnParticipant?.userId === user?.id;

  // Connection status is now managed automatically by Convex real-time queries
  useEffect(() => {
    // Set loading state based on query status
    if (completeRoomState === undefined) {
      setConnectionStatus('connecting');
      onConnectionChange?.('connecting');
    }
  }, [completeRoomState, onConnectionChange]);

  // Error handling for Convex operations
  const handleError = useCallback((error: Error) => {
    console.error('Live interaction error:', error);
    setError(error);
    onError?.(error);
  }, [onError]);

  // Turn timer management
  useEffect(() => {
    if (!isMyTurn || gameState?.status !== 'active') {
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
        turnTimerRef.current = null;
      }
      return;
    }

    setTurnTimeRemaining(90);
    
    const startTimer = () => {
      turnTimerRef.current = setInterval(() => {
        setTurnTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-skip turn
            skipTurn();
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    };

    startTimer();

    return () => {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
        turnTimerRef.current = null;
      }
    };
  }, [isMyTurn, gameState?.status]);

  // Optimistic update helper
  const applyOptimisticUpdate = useCallback((updateId: string, updater: (state: GameState) => GameState) => {
    setOptimisticUpdates(prev => new Map(prev.set(updateId, updater)));
    setGameState(prevState => {
      if (!prevState) return null;
      return updater(prevState);
    });
  }, []);

  // Remove optimistic update and reconcile with server state
  const reconcileOptimisticUpdate = useCallback((updateId: string, serverState?: GameState) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(updateId);
      return newMap;
    });
    
    if (serverState) {
      setGameState(serverState);
    }
  }, []);

  // Actions with Convex mutations
  const joinRoom = useCallback(async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      // Determine entity ID - in a real implementation, this would come from character selection
      const entityId = `char_${user.id}`;
      
      const result = await joinRoomMutation({
        interactionId,
        entityId,
        entityType: 'playerCharacter',
      });

      if (result.success) {
        setConnectionStatus('connected');
        onConnectionChange?.('connected');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to join room');
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, interactionId, joinRoomMutation, onConnectionChange, handleError]);

  const leaveRoom = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await leaveRoomMutation({ 
        interactionId,
        entityId: `char_${user.id}`
      });
      setConnectionStatus('disconnected');
      onConnectionChange?.('disconnected');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to leave room');
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, leaveRoomMutation, user?.id, onConnectionChange, handleError]);

  const takeTurn = useCallback(async (action: TurnAction) => {
    if (!currentParticipant || !isMyTurn) return;

    const updateId = `turn_${Date.now()}`;
    setIsLoading(true);
    
    try {
      // Optimistic update - immediately advance turn
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        currentTurnIndex: (state.currentTurnIndex + 1) % state.initiativeOrder.length,
        turnHistory: [...state.turnHistory, {
          entityId: action.entityId,
          turnNumber: state.turnHistory.length + 1,
          roundNumber: state.roundNumber,
          actions: [action],
          startTime: new Date(),
          endTime: new Date(),
          status: 'completed',
        }],
      }));

      const result = await takeTurnMutation({
        interactionId,
        actionType: action.type,
        actionData: {
          target: action.target,
          position: action.position,
          itemId: action.itemId,
          spellId: action.spellId,
          actionId: action.actionId,
          parameters: action.parameters
        }
      });
      
      if (result.success) {
        // Reconcile with server state
        reconcileOptimisticUpdate(updateId);
        setTurnTimeRemaining(90);
      } else {
        // Revert optimistic update on failure
        reconcileOptimisticUpdate(updateId);
        throw new Error('Turn action failed');
      }
      
    } catch (err) {
      // Revert optimistic update on error
      reconcileOptimisticUpdate(updateId);
      const error = err instanceof Error ? err : new Error('Failed to take turn');
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentParticipant, isMyTurn, interactionId, takeTurnMutation, applyOptimisticUpdate, reconcileOptimisticUpdate, handleError]);

  const skipTurn = useCallback(async () => {
    if (!isMyTurn) return;

    const updateId = `skip_${Date.now()}`;
    setIsLoading(true);
    
    try {
      // Optimistic update - immediately advance turn
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        currentTurnIndex: (state.currentTurnIndex + 1) % state.initiativeOrder.length,
      }));

      const result = await skipTurnMutation({
        interactionId,
        reason: 'Manual skip',
      });
      
      if (result.success) {
        // Reconcile with server state
        reconcileOptimisticUpdate(updateId);
        setTurnTimeRemaining(90);
      } else {
        // Revert optimistic update on failure
        reconcileOptimisticUpdate(updateId);
        throw new Error('Failed to skip turn');
      }
      
    } catch (err) {
      // Revert optimistic update on error
      reconcileOptimisticUpdate(updateId);
      const error = err instanceof Error ? err : new Error('Failed to skip turn');
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [isMyTurn, interactionId, skipTurnMutation, applyOptimisticUpdate, reconcileOptimisticUpdate, handleError]);

  const sendChatMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!user?.id) return;

    const updateId = `chat_${Date.now()}`;
    setIsLoading(true);
    
    try {
      const optimisticMessage: ChatMessage = {
        ...message,
        id: `temp-${Date.now()}`,
        timestamp: Date.now(),
      };

      // Optimistic update - immediately add message to chat
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        chatLog: [...state.chatLog, optimisticMessage],
      }));

      const result = await sendChatMutation({
        interactionId,
        content: message.content,
        channel: message.type,
        recipients: message.recipients,
        entityId: message.entityId,
      });
      
      if (result.success) {
        // Replace optimistic message with server message - Convex handles this automatically
        reconcileOptimisticUpdate(updateId);
      } else {
        // Revert optimistic update on failure
        reconcileOptimisticUpdate(updateId);
        throw new Error('Failed to send message');
      }
      
    } catch (err) {
      // Revert optimistic update on error
      reconcileOptimisticUpdate(updateId);
      const error = err instanceof Error ? err : new Error('Failed to send message');
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, user?.id, sendChatMutation, applyOptimisticUpdate, reconcileOptimisticUpdate, handleError]);

  const pauseInteraction = useCallback(async () => {
    const updateId = `pause_${Date.now()}`;
    setIsLoading(true);
    
    try {
      // Optimistic update - immediately pause
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        status: 'paused',
      }));

      const result = await pauseInteractionMutation({
        interactionId,
        reason: 'Manual pause',
      });
      
      if (result.success) {
        reconcileOptimisticUpdate(updateId);
      } else {
        // Revert optimistic update on failure
        reconcileOptimisticUpdate(updateId);
        throw new Error('Failed to pause interaction');
      }
      
    } catch (err) {
      // Revert optimistic update on error
      reconcileOptimisticUpdate(updateId);
      const error = err instanceof Error ? err : new Error('Failed to pause interaction');
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, pauseInteractionMutation, applyOptimisticUpdate, reconcileOptimisticUpdate, handleError]);

  const resumeInteraction = useCallback(async () => {
    const updateId = `resume_${Date.now()}`;
    setIsLoading(true);
    
    try {
      // Optimistic update - immediately resume
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        status: 'active',
      }));

      const result = await resumeInteractionMutation({
        interactionId,
      });
      
      if (result.success) {
        reconcileOptimisticUpdate(updateId);
      } else {
        // Revert optimistic update on failure
        reconcileOptimisticUpdate(updateId);
        throw new Error('Failed to resume interaction');
      }
      
    } catch (err) {
      // Revert optimistic update on error
      reconcileOptimisticUpdate(updateId);
      const error = err instanceof Error ? err : new Error('Failed to resume interaction');
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, resumeInteractionMutation, applyOptimisticUpdate, reconcileOptimisticUpdate, handleError]);

  const rollbackTurn = useCallback(async (targetTurn: number, targetRound: number) => {
    setIsLoading(true);
    try {
      // For now, rollback is not implemented in the Convex system
      // This would need to be added to the live system API
      console.log('Rollback requested but not yet implemented in Convex system:', { targetTurn, targetRound });
      throw new Error('Rollback feature not yet implemented');
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to rollback turn');
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const updateInitiative = useCallback(async (order: InitiativeEntry[]) => {
    const updateId = `initiative_${Date.now()}`;
    setIsLoading(true);
    
    try {
      // Optimistic update - immediately update initiative order
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        initiativeOrder: order,
        currentTurnIndex: 0, // Reset to first turn
      }));

      // Use the Convex roll initiative function to update the order
      const result = await rollInitiativeMutation({
        interactionId,
        initiativeData: order.map(entry => ({
          entityId: entry.entityId,
          initiative: entry.initiative
        }))
      });
      
      if (result.success) {
        reconcileOptimisticUpdate(updateId);
      } else {
        reconcileOptimisticUpdate(updateId);
        throw new Error('Failed to update initiative');
      }
      
    } catch (err) {
      // Revert optimistic update on error
      reconcileOptimisticUpdate(updateId);
      const error = err instanceof Error ? err : new Error('Failed to update initiative');
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, rollInitiativeMutation, applyOptimisticUpdate, reconcileOptimisticUpdate, handleError]);

  // Cleanup turn timer on unmount
  useEffect(() => {
    return () => {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
        turnTimerRef.current = null;
      }
    };
  }, []);

  return {
    // State
    gameState,
    connectionStatus,
    isLoading,
    error,
    
    // Computed values
    currentParticipant,
    currentTurnParticipant,
    isMyTurn,
    turnTimeRemaining,
    
    // Actions
    joinRoom,
    leaveRoom,
    takeTurn,
    skipTurn,
    sendChatMessage,
    
    // DM Actions
    pauseInteraction,
    resumeInteraction,
    rollbackTurn,
    updateInitiative,
  };
}