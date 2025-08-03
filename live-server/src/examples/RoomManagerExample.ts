/**
 * Room Manager System Usage Example
 * 
 * This example demonstrates how to use the Room Manager System
 * for managing live D&D interactions with state persistence.
 */

import { RoomManager } from '../services/RoomManager';
import { StatePersistence } from '../services/StatePersistence';
import { GameState, Participant, TurnAction } from '../types';
import { logger } from '../utils/logger';

// Example configuration
const ROOM_MANAGER_CONFIG = {
  inactivityTimeoutMs: 30 * 60 * 1000, // 30 minutes
  cleanupIntervalMs: 5 * 60 * 1000,    // 5 minutes
  maxRooms: 50
};

const PERSISTENCE_CONFIG = {
  convexUrl: process.env['CONVEX_URL'] || 'https://your-convex-url.convex.cloud',
  retryAttempts: 3,
  retryDelayMs: 1000
};

export class LiveInteractionService {
  private roomManager: RoomManager;
  private persistence: StatePersistence;

  constructor() {
    this.roomManager = new RoomManager(ROOM_MANAGER_CONFIG);
    this.persistence = new StatePersistence(PERSISTENCE_CONFIG);
    
    this.setupEventHandlers();
    logger.info('LiveInteractionService initialized');
  }

  /**
   * Start a live interaction session
   */
  async startLiveInteraction(interactionId: string, initialGameState: GameState): Promise<string> {
    try {
      // Create room
      const room = await this.roomManager.createRoom(interactionId, initialGameState);
      
      // Update interaction status in database
      await this.persistence.updateInteractionStatus(
        interactionId,
        'live',
        {
          liveRoomId: room.id,
          connectedParticipants: [],
          lastActivity: Date.now()
        }
      );

      logger.info('Live interaction started', {
        interactionId,
        roomId: room.id
      });

      return room.id;
    } catch (error) {
      logger.error('Failed to start live interaction', {
        interactionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Join a live interaction
   */
  async joinInteraction(interactionId: string, participant: Participant): Promise<void> {
    try {
      const room = await this.roomManager.joinRoom(interactionId, participant);
      
      // Log the join event
      await this.persistence.saveEventLog(
        interactionId,
        'PARTICIPANT_JOINED',
        {
          userId: participant.userId,
          entityId: participant.entityId,
          entityType: participant.entityType,
          connectionId: participant.connectionId
        },
        participant.userId,
        participant.entityId
      );

      // Update connected participants list
      const connectedParticipants = room.getAllParticipants()
        .filter(p => p.isConnected)
        .map(p => p.userId);

      await this.persistence.updateInteractionStatus(
        interactionId,
        'live',
        {
          liveRoomId: room.id,
          connectedParticipants,
          lastActivity: Date.now()
        }
      );

      logger.info('Participant joined interaction', {
        interactionId,
        userId: participant.userId,
        entityId: participant.entityId
      });
    } catch (error) {
      logger.error('Failed to join interaction', {
        interactionId,
        userId: participant.userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Leave a live interaction
   */
  async leaveInteraction(interactionId: string, userId: string): Promise<void> {
    try {
      const success = await this.roomManager.leaveRoom(interactionId, userId);
      
      if (success) {
        // Log the leave event
        await this.persistence.saveEventLog(
          interactionId,
          'PARTICIPANT_LEFT',
          { userId },
          userId
        );

        logger.info('Participant left interaction', {
          interactionId,
          userId
        });
      }
    } catch (error) {
      logger.error('Failed to leave interaction', {
        interactionId,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Process a turn action
   */
  async processTurnAction(interactionId: string, action: TurnAction): Promise<boolean> {
    try {
      const room = this.roomManager.getRoomByInteractionId(interactionId);
      if (!room) {
        throw new Error(`Room not found for interaction ${interactionId}`);
      }

      const success = room.processTurnAction(action);
      
      if (success) {
        // Save turn record
        const turnRecord: any = {
          entityId: action.entityId,
          entityType: room.gameState.participants.get(action.entityId)?.entityType || 'playerCharacter',
          turnNumber: room.gameState.currentTurnIndex,
          roundNumber: room.gameState.roundNumber,
          actions: [action],
          startTime: Date.now(),
          endTime: Date.now(),
          status: 'completed',
        };
        
        const userId = room.gameState.participants.get(action.entityId)?.userId;
        if (userId) {
          turnRecord.userId = userId;
        }
        
        await this.persistence.saveTurnRecord(interactionId, turnRecord);

        // Log the action
        await this.persistence.saveEventLog(
          interactionId,
          'TURN_ACTION',
          action,
          room.gameState.participants.get(action.entityId)?.userId,
          action.entityId
        );

        logger.info('Turn action processed', {
          interactionId,
          entityId: action.entityId,
          actionType: action.type
        });
      }

      return success;
    } catch (error) {
      logger.error('Failed to process turn action', {
        interactionId,
        action,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Pause a live interaction
   */
  async pauseInteraction(interactionId: string, reason: string = 'Manual pause'): Promise<void> {
    try {
      const success = await this.roomManager.pauseRoom(interactionId, reason);
      
      if (success) {
        await this.persistence.updateInteractionStatus(interactionId, 'paused');
        
        logger.info('Interaction paused', {
          interactionId,
          reason
        });
      }
    } catch (error) {
      logger.error('Failed to pause interaction', {
        interactionId,
        reason,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Resume a live interaction
   */
  async resumeInteraction(interactionId: string): Promise<void> {
    try {
      const success = await this.roomManager.resumeRoom(interactionId);
      
      if (success) {
        await this.persistence.updateInteractionStatus(interactionId, 'live');
        
        logger.info('Interaction resumed', { interactionId });
      }
    } catch (error) {
      logger.error('Failed to resume interaction', {
        interactionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Complete a live interaction
   */
  async completeInteraction(interactionId: string, reason: string = 'Session completed'): Promise<void> {
    try {
      const success = await this.roomManager.completeRoom(interactionId, reason);
      
      if (success) {
        await this.persistence.updateInteractionStatus(interactionId, 'completed');
        
        logger.info('Interaction completed', {
          interactionId,
          reason
        });
      }
    } catch (error) {
      logger.error('Failed to complete interaction', {
        interactionId,
        reason,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get interaction statistics
   */
  getStats() {
    return this.roomManager.getStats();
  }

  /**
   * Get room by interaction ID
   */
  getRoom(interactionId: string) {
    return this.roomManager.getRoomByInteractionId(interactionId);
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    this.roomManager.shutdown();
    logger.info('LiveInteractionService shutdown completed');
  }

  /**
   * Set up event handlers for room manager events
   */
  private setupEventHandlers(): void {
    // Handle persistence requirements
    this.roomManager.on('persistenceRequired', async ({ room, trigger }) => {
      try {
        if (this.persistence.shouldPersist(trigger)) {
          await this.persistence.saveSnapshot(room, trigger);
          logger.debug('State snapshot saved', {
            interactionId: room.interactionId,
            trigger
          });
        }
      } catch (error) {
        logger.error('Failed to save state snapshot', {
          interactionId: room.interactionId,
          trigger,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Handle room cleanup
    this.roomManager.on('roomCleanup', async ({ room, reason }) => {
      try {
        // Final state save before cleanup
        await this.persistence.saveSnapshot(room, 'cleanup');
        
        // Update interaction status
        await this.persistence.updateInteractionStatus(
          room.interactionId,
          'idle'
        );

        logger.info('Room cleaned up', {
          interactionId: room.interactionId,
          reason
        });
      } catch (error) {
        logger.error('Error during room cleanup', {
          interactionId: room.interactionId,
          reason,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Handle room events for logging
    this.roomManager.on('roomEvent', async ({ room, event }) => {
      try {
        await this.persistence.saveEventLog(
          room.interactionId,
          event.type,
          event,
          'userId' in event ? event.userId : undefined,
          'entityId' in event ? event.entityId : undefined
        );
      } catch (error) {
        logger.error('Failed to log room event', {
          interactionId: room.interactionId,
          eventType: event.type,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Handle participant events
    this.roomManager.on('participantJoined', ({ room, participant }) => {
      logger.info('Participant joined room', {
        interactionId: room.interactionId,
        userId: participant.userId,
        entityId: participant.entityId
      });
    });

    this.roomManager.on('participantLeft', ({ room, userId }) => {
      logger.info('Participant left room', {
        interactionId: room.interactionId,
        userId
      });
    });
  }
}

// Example usage
export async function exampleUsage() {
  const service = new LiveInteractionService();

  try {
    // Create initial game state
    const gameState: GameState = {
      interactionId: 'example-interaction-1',
      status: 'active',
      initiativeOrder: [
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 15, userId: 'user1' },
        { entityId: 'goblin1', entityType: 'monster', initiative: 12 }
      ],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map(),
      mapState: {
        width: 20,
        height: 20,
        entities: new Map(),
        obstacles: [],
        terrain: []
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date()
    };

    // Start live interaction
    const roomId = await service.startLiveInteraction('example-interaction-1', gameState);
    console.log('Live interaction started with room ID:', roomId);

    // Join participants
    await service.joinInteraction('example-interaction-1', {
      userId: 'user1',
      entityId: 'player1',
      entityType: 'playerCharacter',
      connectionId: 'conn1',
      isConnected: true,
      lastActivity: new Date()
    });

    // Process turn action
    await service.processTurnAction('example-interaction-1', {
      type: 'move',
      entityId: 'player1',
      position: { x: 5, y: 5 }
    });

    // Get stats
    const stats = service.getStats();
    console.log('Service stats:', stats);

    // Complete interaction
    await service.completeInteraction('example-interaction-1', 'Example completed');

  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    service.shutdown();
  }
}

// Uncomment to run the example
// exampleUsage().catch(console.error);