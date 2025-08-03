import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { createTRPCClient } from '../lib/trpc';

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
  interactionId: string;
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
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const trpcClientRef = useRef<ReturnType<typeof createTRPCClient> | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Computed values
  const currentParticipant = gameState?.participants 
    ? Object.values(gameState.participants).find(p => p.userId === user?.id)
    : null;

  const currentTurnParticipant = gameState?.initiativeOrder[gameState.currentTurnIndex] || null;
  const isMyTurn = currentTurnParticipant?.userId === user?.id;

  // Initialize tRPC client with auth
  const initializeTRPCClient = useCallback(async () => {
    if (!getToken) return null;
    
    const client = createTRPCClient(async () => {
      const token = await getToken();
      return token ? `Bearer ${token}` : '';
    });
    
    trpcClientRef.current = client;
    return client;
  }, [getToken]);

  // Connection management with real tRPC
  const connect = useCallback(async () => {
    if (!user?.id || connectionStatus === 'connected') return;

    try {
      setConnectionStatus('connecting');
      setError(null);
      onConnectionChange?.('connecting');

      // Initialize tRPC client if not already done
      if (!trpcClientRef.current) {
        await initializeTRPCClient();
      }

      if (!trpcClientRef.current) {
        throw new Error('Failed to initialize tRPC client');
      }

      // Get initial room state
      const roomStateResult = await trpcClientRef.current.interaction.getRoomState.query({
        interactionId,
      });

      if (roomStateResult.success) {
        setGameState(roomStateResult.gameState);
        setConnectionStatus('connected');
        onConnectionChange?.('connected');

        // Set up real-time subscription
        subscriptionRef.current = trpcClientRef.current.interaction.roomUpdates.subscribe(
          { interactionId },
          {
            onData: (event: GameEvent) => {
              handleGameEvent(event);
            },
            onError: (error: any) => {
              console.error('Subscription error:', error);
              handleConnectionError(new Error(error.message || 'Subscription error'));
            },
            onComplete: () => {
              console.log('Subscription completed');
            },
          }
        );
      } else {
        throw new Error('Failed to get room state');
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Connection failed');
      setError(error);
      setConnectionStatus('error');
      onError?.(error);
      onConnectionChange?.('error');
      
      // Attempt reconnection after delay
      scheduleReconnect();
    }
  }, [user?.id, interactionId, connectionStatus, onError, onConnectionChange, initializeTRPCClient]);

  // Handle game events from subscription
  const handleGameEvent = useCallback((event: GameEvent) => {
    console.log('Received game event:', event);
    
    switch (event.type) {
      case 'STATE_DELTA':
        // Apply state delta to current game state
        setGameState(prevState => {
          if (!prevState) return null;
          return applyStateDelta(prevState, event.changes);
        });
        break;
        
      case 'TURN_COMPLETED':
        // Update turn state
        setGameState(prevState => {
          if (!prevState) return null;
          return {
            ...prevState,
            currentTurnIndex: (prevState.currentTurnIndex + 1) % prevState.initiativeOrder.length,
            turnHistory: [...prevState.turnHistory, {
              entityId: event.entityId,
              turnNumber: prevState.turnHistory.length + 1,
              roundNumber: prevState.roundNumber,
              actions: event.actions,
              startTime: new Date(),
              endTime: new Date(),
              status: 'completed',
            }],
          };
        });
        setTurnTimeRemaining(90);
        break;
        
      case 'TURN_SKIPPED':
        // Advance turn
        setGameState(prevState => {
          if (!prevState) return null;
          return {
            ...prevState,
            currentTurnIndex: (prevState.currentTurnIndex + 1) % prevState.initiativeOrder.length,
          };
        });
        setTurnTimeRemaining(90);
        break;
        
      case 'CHAT_MESSAGE':
        // Add chat message
        setGameState(prevState => {
          if (!prevState) return null;
          return {
            ...prevState,
            chatLog: [...prevState.chatLog, event.message],
          };
        });
        break;
        
      case 'INTERACTION_PAUSED':
        setGameState(prevState => {
          if (!prevState) return null;
          return { ...prevState, status: 'paused' };
        });
        break;
        
      case 'INTERACTION_RESUMED':
        setGameState(prevState => {
          if (!prevState) return null;
          return { ...prevState, status: 'active' };
        });
        break;
        
      case 'PARTICIPANT_JOINED':
      case 'PARTICIPANT_LEFT':
        // These would trigger a full state refresh in a real implementation
        break;
        
      case 'ERROR':
        const error = new Error(event.error.message);
        setError(error);
        onError?.(error);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }
  }, [onError]);

  // Apply state delta to game state
  const applyStateDelta = useCallback((gameState: GameState, delta: any): GameState => {
    // This is a simplified implementation
    // In a real implementation, this would properly merge the delta
    return {
      ...gameState,
      ...delta.changes,
      timestamp: new Date(),
    };
  }, []);

  // Handle connection errors with automatic reconnection
  const handleConnectionError = useCallback((error: Error) => {
    console.error('Connection error:', error);
    setError(error);
    setConnectionStatus('error');
    onError?.(error);
    onConnectionChange?.('error');
    
    scheduleReconnect();
  }, [onError, onConnectionChange]);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect...');
      connect();
    }, 3000); // Reconnect after 3 seconds
  }, [connect]);

  const disconnect = useCallback(() => {
    // Unsubscribe from real-time updates
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Clear turn timer
    if (turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    
    // Reset client reference
    trpcClientRef.current = null;
    
    setConnectionStatus('disconnected');
    onConnectionChange?.('disconnected');
  }, [onConnectionChange]);

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

  // Actions with real tRPC calls
  const joinRoom = useCallback(async () => {
    if (!user?.id || !trpcClientRef.current) {
      await connect();
      return;
    }

    setIsLoading(true);
    try {
      // Determine entity ID - in a real implementation, this would come from character selection
      const entityId = `char_${user.id}`;
      
      const result = await trpcClientRef.current.interaction.joinRoom.mutate({
        interactionId,
        entityId,
        entityType: 'playerCharacter',
      });

      if (result.success) {
        setGameState(result.gameState);
        setConnectionStatus('connected');
        onConnectionChange?.('connected');
        
        // Set up subscription if not already active
        if (!subscriptionRef.current) {
          subscriptionRef.current = trpcClientRef.current.interaction.roomUpdates.subscribe(
            { interactionId },
            {
              onData: handleGameEvent,
              onError: (error: any) => handleConnectionError(new Error(error.message)),
            }
          );
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to join room');
      setError(error);
      onError?.(error);
      handleConnectionError(error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, interactionId, connect, onError, onConnectionChange, handleGameEvent, handleConnectionError]);

  const leaveRoom = useCallback(async () => {
    if (!trpcClientRef.current) return;

    setIsLoading(true);
    try {
      await trpcClientRef.current.interaction.leaveRoom.mutate({ interactionId });
      disconnect();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to leave room');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, disconnect, onError]);

  const takeTurn = useCallback(async (action: TurnAction) => {
    if (!currentParticipant || !isMyTurn || !trpcClientRef.current) return;

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

      const result = await trpcClientRef.current.interaction.takeTurn.mutate(action);
      
      if (result.success) {
        // Reconcile with server state
        reconcileOptimisticUpdate(updateId, result.gameState);
        setTurnTimeRemaining(90);
      } else {
        // Revert optimistic update on failure
        reconcileOptimisticUpdate(updateId);
        throw new Error(result.result.errors.join(', ') || 'Turn action failed');
      }
      
    } catch (err) {
      // Revert optimistic update on error
      reconcileOptimisticUpdate(updateId);
      const error = err instanceof Error ? err : new Error('Failed to take turn');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentParticipant, isMyTurn, onError, applyOptimisticUpdate, reconcileOptimisticUpdate]);

  const skipTurn = useCallback(async () => {
    if (!isMyTurn || !trpcClientRef.current) return;

    const updateId = `skip_${Date.now()}`;
    setIsLoading(true);
    
    try {
      // Optimistic update - immediately advance turn
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        currentTurnIndex: (state.currentTurnIndex + 1) % state.initiativeOrder.length,
      }));

      const result = await trpcClientRef.current.interaction.skipTurn.mutate({
        interactionId,
        reason: 'Manual skip',
      });
      
      if (result.success) {
        // Reconcile with server state
        reconcileOptimisticUpdate(updateId, result.gameState);
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
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [isMyTurn, interactionId, onError, applyOptimisticUpdate, reconcileOptimisticUpdate]);

  const sendChatMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!trpcClientRef.current) return;

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

      const result = await trpcClientRef.current.interaction.sendChatMessage.mutate({
        interactionId,
        content: message.content,
        type: message.type,
        recipients: message.recipients,
        entityId: message.entityId,
      });
      
      if (result.success) {
        // Replace optimistic message with server message
        reconcileOptimisticUpdate(updateId);
        setGameState(prevState => {
          if (!prevState) return null;
          return {
            ...prevState,
            chatLog: [
              ...prevState.chatLog.filter(msg => msg.id !== optimisticMessage.id),
              result.message,
            ],
          };
        });
      } else {
        // Revert optimistic update on failure
        reconcileOptimisticUpdate(updateId);
        throw new Error('Failed to send message');
      }
      
    } catch (err) {
      // Revert optimistic update on error
      reconcileOptimisticUpdate(updateId);
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, onError, applyOptimisticUpdate, reconcileOptimisticUpdate]);

  const pauseInteraction = useCallback(async () => {
    if (!trpcClientRef.current) return;

    const updateId = `pause_${Date.now()}`;
    setIsLoading(true);
    
    try {
      // Optimistic update - immediately pause
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        status: 'paused',
      }));

      const result = await trpcClientRef.current.interaction.pauseInteraction.mutate({
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
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, onError, applyOptimisticUpdate, reconcileOptimisticUpdate]);

  const resumeInteraction = useCallback(async () => {
    if (!trpcClientRef.current) return;

    const updateId = `resume_${Date.now()}`;
    setIsLoading(true);
    
    try {
      // Optimistic update - immediately resume
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        status: 'active',
      }));

      const result = await trpcClientRef.current.interaction.resumeInteraction.mutate({
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
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, onError, applyOptimisticUpdate, reconcileOptimisticUpdate]);

  const rollbackTurn = useCallback(async (targetTurn: number, targetRound: number) => {
    if (!trpcClientRef.current) return;

    setIsLoading(true);
    try {
      const result = await trpcClientRef.current.interaction.backtrackTurn.mutate({
        interactionId,
        turnNumber: targetTurn,
        reason: `Rollback to turn ${targetTurn}, round ${targetRound}`,
      });
      
      if (!result.success) {
        throw new Error('Failed to rollback turn');
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to rollback turn');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, onError]);

  const updateInitiative = useCallback(async (order: InitiativeEntry[]) => {
    if (!trpcClientRef.current) return;

    const updateId = `initiative_${Date.now()}`;
    setIsLoading(true);
    
    try {
      // Optimistic update - immediately update initiative order
      applyOptimisticUpdate(updateId, (state) => ({
        ...state,
        initiativeOrder: order,
        currentTurnIndex: 0, // Reset to first turn
      }));

      // Note: This endpoint doesn't exist in the current router
      // In a full implementation, this would be added
      console.log('Initiative update would be sent to server:', order);
      
      // For now, just keep the optimistic update
      reconcileOptimisticUpdate(updateId);
      
    } catch (err) {
      // Revert optimistic update on error
      reconcileOptimisticUpdate(updateId);
      const error = err instanceof Error ? err : new Error('Failed to update initiative');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onError, applyOptimisticUpdate, reconcileOptimisticUpdate]);

  // Initialize connection
  useEffect(() => {
    if (user?.id && interactionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, interactionId, connect, disconnect]);

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