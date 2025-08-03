import { InteractionRoom as IInteractionRoom, Participant, GameState, GameEvent, TurnAction } from '../types';
import { logger } from '../utils/logger';
import { generateId, getCurrentTimestamp } from '../utils';
import { EventEmitter } from 'events';

export class InteractionRoom extends EventEmitter implements IInteractionRoom {
  public readonly id: string;
  public readonly interactionId: string;
  public participants: Map<string, Participant>;
  public gameState: GameState;
  public lastActivity: Date;
  public status: 'active' | 'paused' | 'completed';
  
  private inactivityTimer?: NodeJS.Timeout;
  private readonly inactivityTimeoutMs: number;
  private readonly roomLogger;

  constructor(
    interactionId: string, 
    initialGameState: GameState,
    inactivityTimeoutMs: number = 30 * 60 * 1000 // 30 minutes default
  ) {
    super();
    
    this.id = generateId();
    this.interactionId = interactionId;
    this.participants = new Map();
    this.gameState = initialGameState;
    this.lastActivity = new Date();
    this.status = 'active';
    this.inactivityTimeoutMs = inactivityTimeoutMs;
    
    this.roomLogger = logger.child({ 
      roomId: this.id, 
      interactionId: this.interactionId 
    });
    
    this.startInactivityTimer();
    this.roomLogger.info('InteractionRoom created', {
      inactivityTimeoutMs: this.inactivityTimeoutMs
    });
  }

  /**
   * Add a participant to the room
   */
  public addParticipant(participant: Participant): void {
    this.participants.set(participant.userId, participant);
    this.updateActivity();
    
    this.roomLogger.info('Participant added to room', {
      userId: participant.userId,
      entityId: participant.entityId,
      entityType: participant.entityType,
      participantCount: this.participants.size
    });

    // Emit participant joined event
    this.emit('participantJoined', {
      type: 'PARTICIPANT_JOINED',
      userId: participant.userId,
      entityId: participant.entityId
    } as GameEvent);
  }

  /**
   * Remove a participant from the room
   */
  public removeParticipant(userId: string): boolean {
    const participant = this.participants.get(userId);
    if (!participant) {
      this.roomLogger.warn('Attempted to remove non-existent participant', { userId });
      return false;
    }

    this.participants.delete(userId);
    this.updateActivity();
    
    this.roomLogger.info('Participant removed from room', {
      userId,
      entityId: participant.entityId,
      participantCount: this.participants.size
    });

    // Emit participant left event
    this.emit('participantLeft', {
      type: 'PARTICIPANT_LEFT',
      userId
    } as GameEvent);

    // Check if room should be cleaned up
    if (this.participants.size === 0) {
      this.roomLogger.info('Room is now empty, starting cleanup timer');
      this.startInactivityTimer();
    }

    return true;
  }

  /**
   * Get a participant by user ID
   */
  public getParticipant(userId: string): Participant | undefined {
    return this.participants.get(userId);
  }

  /**
   * Get all participants
   */
  public getAllParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Update participant connection status
   */
  public updateParticipantConnection(userId: string, isConnected: boolean, connectionId?: string): boolean {
    const participant = this.participants.get(userId);
    if (!participant) {
      this.roomLogger.warn('Attempted to update connection for non-existent participant', { userId });
      return false;
    }

    participant.isConnected = isConnected;
    participant.lastActivity = new Date();
    
    if (connectionId) {
      participant.connectionId = connectionId;
    }

    this.updateActivity();
    
    this.roomLogger.info('Participant connection updated', {
      userId,
      isConnected,
      connectionId: connectionId || participant.connectionId
    });

    return true;
  }

  /**
   * Update the game state
   */
  public updateGameState(newState: Partial<GameState>): void {
    this.gameState = {
      ...this.gameState,
      ...newState,
      timestamp: new Date()
    };
    
    this.updateActivity();
    
    this.roomLogger.debug('Game state updated', {
      status: this.gameState.status,
      currentTurnIndex: this.gameState.currentTurnIndex,
      roundNumber: this.gameState.roundNumber
    });

    // Emit state change event
    this.emit('stateChanged', this.gameState);
  }

  /**
   * Process a turn action
   */
  public processTurnAction(action: TurnAction): boolean {
    try {
      // Basic validation - entity exists and it's their turn
      const currentTurnEntity = this.gameState.initiativeOrder[this.gameState.currentTurnIndex];
      if (!currentTurnEntity || currentTurnEntity.entityId !== action.entityId) {
        this.roomLogger.warn('Invalid turn action - not current turn', {
          actionEntityId: action.entityId,
          currentTurnEntityId: currentTurnEntity?.entityId,
          currentTurnIndex: this.gameState.currentTurnIndex
        });
        return false;
      }

      // Add action to turn history
      const turnRecord = {
        entityId: action.entityId,
        turnNumber: this.gameState.currentTurnIndex,
        roundNumber: this.gameState.roundNumber,
        actions: [action],
        startTime: new Date(),
        endTime: new Date(),
        status: 'completed' as const
      };

      this.gameState.turnHistory.push(turnRecord);
      this.updateActivity();

      this.roomLogger.info('Turn action processed', {
        entityId: action.entityId,
        actionType: action.type,
        turnNumber: this.gameState.currentTurnIndex,
        roundNumber: this.gameState.roundNumber
      });

      // Emit turn completed event
      this.emit('turnCompleted', {
        type: 'TURN_COMPLETED',
        entityId: action.entityId,
        actions: [action]
      } as GameEvent);

      return true;
    } catch (error) {
      this.roomLogger.error('Error processing turn action', {
        error: error instanceof Error ? error.message : String(error),
        action
      });
      return false;
    }
  }

  /**
   * Pause the room
   */
  public pause(reason: string = 'Manual pause'): void {
    if (this.status === 'paused') {
      this.roomLogger.warn('Attempted to pause already paused room');
      return;
    }

    this.status = 'paused';
    this.updateGameState({ status: 'paused' });
    this.clearInactivityTimer();
    
    this.roomLogger.info('Room paused', { reason });

    // Emit pause event
    this.emit('interactionPaused', {
      type: 'INTERACTION_PAUSED',
      reason
    } as GameEvent);

    // Emit persistence trigger
    this.emit('persistenceRequired', 'pause');
  }

  /**
   * Resume the room
   */
  public resume(): void {
    if (this.status !== 'paused') {
      this.roomLogger.warn('Attempted to resume non-paused room', { status: this.status });
      return;
    }

    this.status = 'active';
    this.updateGameState({ status: 'active' });
    this.startInactivityTimer();
    
    this.roomLogger.info('Room resumed');

    // Emit resume event
    this.emit('interactionResumed', {
      type: 'INTERACTION_RESUMED'
    } as GameEvent);
  }

  /**
   * Complete the room
   */
  public complete(reason: string = 'Interaction completed'): void {
    this.status = 'completed';
    this.updateGameState({ status: 'completed' });
    this.clearInactivityTimer();
    
    this.roomLogger.info('Room completed', { reason });

    // Emit persistence trigger for final state
    this.emit('persistenceRequired', 'complete');
    
    // Emit completion event
    this.emit('interactionCompleted', reason);
  }

  /**
   * Check if the room is inactive and should be cleaned up
   */
  public isInactive(): boolean {
    const now = Date.now();
    const lastActivityTime = this.lastActivity.getTime();
    return (now - lastActivityTime) > this.inactivityTimeoutMs;
  }

  /**
   * Get room statistics
   */
  public getStats() {
    return {
      id: this.id,
      interactionId: this.interactionId,
      status: this.status,
      participantCount: this.participants.size,
      connectedParticipants: this.getAllParticipants().filter(p => p.isConnected).length,
      lastActivity: this.lastActivity,
      currentTurn: this.gameState.initiativeOrder[this.gameState.currentTurnIndex]?.entityId,
      roundNumber: this.gameState.roundNumber,
      turnHistoryLength: this.gameState.turnHistory.length,
      chatMessageCount: this.gameState.chatLog.length
    };
  }

  /**
   * Clean up room resources
   */
  public cleanup(): void {
    this.clearInactivityTimer();
    this.removeAllListeners();
    this.participants.clear();
    
    this.roomLogger.info('Room cleanup completed');
  }

  /**
   * Update the last activity timestamp and reset inactivity timer
   */
  private updateActivity(): void {
    this.lastActivity = new Date();
    
    // Only restart timer if room is active
    if (this.status === 'active') {
      this.startInactivityTimer();
    }
  }

  /**
   * Start or restart the inactivity timer
   */
  private startInactivityTimer(): void {
    this.clearInactivityTimer();
    
    this.inactivityTimer = setTimeout(() => {
      this.roomLogger.info('Room inactivity timeout reached');
      
      // Emit inactivity event for cleanup
      this.emit('inactivityTimeout');
      
      // Trigger persistence before cleanup
      this.emit('persistenceRequired', 'inactivity');
    }, this.inactivityTimeoutMs);
  }

  /**
   * Clear the inactivity timer
   */
  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = undefined;
    }
  }
}