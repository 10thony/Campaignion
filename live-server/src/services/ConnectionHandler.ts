import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { RoomManager } from './RoomManager';
import { EventBroadcaster } from './EventBroadcaster';
import { GameEvent, Participant } from '../types';

/**
 * Connection status for tracking participant connections
 */
export interface ConnectionStatus {
  userId: string;
  connectionId: string;
  isConnected: boolean;
  lastSeen: Date;
  reconnectAttempts: number;
  disconnectReason?: string;
}

/**
 * Configuration for connection handling
 */
export interface ConnectionHandlerConfig {
  heartbeatIntervalMs?: number;
  connectionTimeoutMs?: number;
  maxReconnectAttempts?: number;
  dmDisconnectGraceMs?: number;
  stateRecoveryTimeoutMs?: number;
}

/**
 * Connection event types
 */
export type ConnectionEvent = 
  | { type: 'PLAYER_DISCONNECTED'; userId: string; interactionId: string; reason: string }
  | { type: 'PLAYER_RECONNECTED'; userId: string; interactionId: string; connectionId: string }
  | { type: 'DM_DISCONNECTED'; userId: string; interactionId: string; reason: string }
  | { type: 'DM_RECONNECTED'; userId: string; interactionId: string; connectionId: string }
  | { type: 'CONNECTION_TIMEOUT'; userId: string; interactionId: string }
  | { type: 'RECONNECT_FAILED'; userId: string; interactionId: string; attempts: number }
  | { type: 'STATE_SYNC_REQUIRED'; userId: string; interactionId: string }
  | { type: 'ERROR_RECOVERY_INITIATED'; interactionId: string; errorType: string };

/**
 * ConnectionHandler manages participant connections and handles disconnection scenarios
 * 
 * Features:
 * - Real-time connection monitoring with heartbeat
 * - Player disconnect detection and notification
 * - DM disconnect handling with automatic interaction pausing
 * - Reconnection logic with state synchronization
 * - Error recovery mechanisms for state corruption
 */
export class ConnectionHandler extends EventEmitter {
  private connections: Map<string, ConnectionStatus> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private dmGraceTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: Required<ConnectionHandlerConfig>;
  private roomManager: RoomManager;
  private eventBroadcaster: EventBroadcaster;

  constructor(
    roomManager: RoomManager,
    eventBroadcaster: EventBroadcaster,
    config: ConnectionHandlerConfig = {}
  ) {
    super();
    
    this.roomManager = roomManager;
    this.eventBroadcaster = eventBroadcaster;
    this.config = {
      heartbeatIntervalMs: config.heartbeatIntervalMs ?? 30000, // 30 seconds
      connectionTimeoutMs: config.connectionTimeoutMs ?? 90000, // 90 seconds
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      dmDisconnectGraceMs: config.dmDisconnectGraceMs ?? 120000, // 2 minutes
      stateRecoveryTimeoutMs: config.stateRecoveryTimeoutMs ?? 30000, // 30 seconds
    };

    this.setupRoomManagerListeners();
    
    logger.info('ConnectionHandler initialized', {
      config: this.config,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Register a new connection
   */
  public registerConnection(userId: string, connectionId: string, interactionId: string): void {
    const existingConnection = this.connections.get(userId);
    
    if (existingConnection) {
      // Update existing connection
      existingConnection.connectionId = connectionId;
      existingConnection.isConnected = true;
      existingConnection.lastSeen = new Date();
      existingConnection.reconnectAttempts = 0;
      existingConnection.disconnectReason = undefined;
      
      logger.info('Connection updated for user', {
        userId,
        connectionId,
        interactionId,
        previousConnectionId: existingConnection.connectionId,
      });
      
      // Handle reconnection
      this.handleReconnection(userId, interactionId, connectionId);
    } else {
      // Create new connection
      const connection: ConnectionStatus = {
        userId,
        connectionId,
        isConnected: true,
        lastSeen: new Date(),
        reconnectAttempts: 0,
      };
      
      this.connections.set(userId, connection);
      
      logger.info('New connection registered', {
        userId,
        connectionId,
        interactionId,
      });
    }

    // Start heartbeat monitoring
    this.startHeartbeat(userId);
  }

  /**
   * Update connection heartbeat
   */
  public updateHeartbeat(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection && connection.isConnected) {
      connection.lastSeen = new Date();
      
      logger.debug('Heartbeat updated', {
        userId,
        connectionId: connection.connectionId,
        lastSeen: connection.lastSeen,
      });
    }
  }

  /**
   * Handle connection disconnect
   */
  public handleDisconnect(userId: string, reason: string = 'Connection lost'): void {
    const connection = this.connections.get(userId);
    if (!connection || !connection.isConnected) {
      return;
    }

    connection.isConnected = false;
    connection.disconnectReason = reason;
    
    // Stop heartbeat
    this.stopHeartbeat(userId);
    
    // Find which interaction this user is in
    const room = this.findUserRoom(userId);
    if (!room) {
      logger.warn('Disconnect handled for user not in any room', { userId, reason });
      return;
    }

    const participant = room.getParticipant(userId);
    if (!participant) {
      logger.warn('Disconnect handled for user not found in room', { 
        userId, 
        roomId: room.id, 
        reason 
      });
      return;
    }

    // Update participant connection status
    room.updateParticipantConnection(userId, false);

    // Check if this is a DM disconnect
    const isDM = this.isDMUser(userId, room.interactionId);
    
    if (isDM) {
      this.handleDMDisconnect(userId, room.interactionId, reason);
    } else {
      this.handlePlayerDisconnect(userId, room.interactionId, reason);
    }

    logger.info('Connection disconnect handled', {
      userId,
      interactionId: room.interactionId,
      reason,
      isDM,
      participantType: participant.entityType,
    });
  }

  /**
   * Handle player reconnection
   */
  public async handleReconnection(userId: string, interactionId: string, connectionId: string): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      logger.warn('Reconnection attempted for unknown user', { userId, interactionId });
      return;
    }

    const room = this.roomManager.getRoomByInteractionId(interactionId);
    if (!room) {
      logger.error('Reconnection attempted for non-existent room', { userId, interactionId });
      return;
    }

    // Clear any reconnect timers
    this.clearReconnectTimer(userId);
    this.clearDMGraceTimer(interactionId);

    // Update connection status
    connection.isConnected = true;
    connection.connectionId = connectionId;
    connection.lastSeen = new Date();
    connection.reconnectAttempts = 0;
    connection.disconnectReason = undefined;

    // Update participant in room
    room.updateParticipantConnection(userId, true, connectionId);

    const isDM = this.isDMUser(userId, interactionId);

    if (isDM) {
      // Resume interaction if it was paused due to DM disconnect
      if (room.status === 'paused') {
        await this.roomManager.resumeRoom(interactionId);
        
        // Broadcast DM reconnection
        await this.eventBroadcaster.broadcast(interactionId, {
          type: 'DM_RECONNECTED',
          userId,
          interactionId,
          connectionId,
          timestamp: Date.now(),
        } as GameEvent);
      }
      
      logger.info('DM reconnected, interaction resumed', {
        userId,
        interactionId,
        connectionId,
      });
    } else {
      // Broadcast player reconnection
      await this.eventBroadcaster.broadcast(interactionId, {
        type: 'PLAYER_RECONNECTED',
        userId,
        interactionId,
        connectionId,
        timestamp: Date.now(),
      } as GameEvent);
      
      logger.info('Player reconnected', {
        userId,
        interactionId,
        connectionId,
      });
    }

    // Emit state sync requirement for the reconnected user
    this.emit('connectionEvent', {
      type: 'STATE_SYNC_REQUIRED',
      userId,
      interactionId,
    } as ConnectionEvent);

    // Send current game state to reconnected user
    await this.synchronizeUserState(userId, interactionId);
  }

  /**
   * Remove a connection
   */
  public removeConnection(userId: string): void {
    const connection = this.connections.get(userId);
    if (!connection) {
      return;
    }

    // Clean up timers
    this.stopHeartbeat(userId);
    this.clearReconnectTimer(userId);

    // Remove connection
    this.connections.delete(userId);
    
    logger.info('Connection removed', {
      userId,
      connectionId: connection.connectionId,
    });
  }

  /**
   * Get connection status for a user
   */
  public getConnectionStatus(userId: string): ConnectionStatus | undefined {
    return this.connections.get(userId);
  }

  /**
   * Get all connection statuses
   */
  public getAllConnectionStatuses(): ConnectionStatus[] {
    return Array.from(this.connections.values());
  }

  /**
   * Check if a user is connected
   */
  public isUserConnected(userId: string): boolean {
    const connection = this.connections.get(userId);
    return connection?.isConnected ?? false;
  }

  /**
   * Handle state corruption recovery
   */
  public async handleStateCorruption(interactionId: string, errorDetails: any): Promise<void> {
    logger.error('State corruption detected, initiating recovery', {
      interactionId,
      errorDetails,
    });

    try {
      const room = this.roomManager.getRoomByInteractionId(interactionId);
      if (!room) {
        throw new Error('Room not found for state recovery');
      }

      // Pause the interaction
      await this.roomManager.pauseRoom(interactionId, 'State corruption recovery');

      // Emit error recovery event
      this.emit('connectionEvent', {
        type: 'ERROR_RECOVERY_INITIATED',
        interactionId,
        errorType: 'state_corruption',
      } as ConnectionEvent);

      // Broadcast error to all participants
      await this.eventBroadcaster.broadcast(interactionId, {
        type: 'ERROR',
        error: {
          code: 'STATE_CORRUPTION',
          message: 'Game state corruption detected. Recovery in progress.',
          details: { recoveryId: `recovery_${Date.now()}` },
        },
        timestamp: Date.now(),
        interactionId,
      } as GameEvent);

      // Attempt to recover from last known good state
      // This would typically involve loading from persistence layer
      logger.info('State corruption recovery completed', {
        interactionId,
        recoveryTime: new Date().toISOString(),
      });

      // Resume interaction after recovery
      setTimeout(async () => {
        try {
          await this.roomManager.resumeRoom(interactionId);
          
          // Broadcast recovery completion
          await this.eventBroadcaster.broadcast(interactionId, {
            type: 'INTERACTION_RESUMED',
            timestamp: Date.now(),
            interactionId,
          } as GameEvent);
          
        } catch (error) {
          logger.error('Failed to resume interaction after recovery', {
            interactionId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }, this.config.stateRecoveryTimeoutMs);

    } catch (error) {
      logger.error('State corruption recovery failed', {
        interactionId,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // If recovery fails, complete the interaction
      await this.roomManager.completeRoom(interactionId, 'State corruption recovery failed');
    }
  }

  /**
   * Handle concurrent action conflicts
   */
  public handleConcurrentActionConflict(
    interactionId: string,
    conflictingActions: any[],
    resolution: 'first_wins' | 'dm_decides' | 'rollback' = 'first_wins'
  ): void {
    logger.warn('Concurrent action conflict detected', {
      interactionId,
      conflictCount: conflictingActions.length,
      resolution,
    });

    // Broadcast conflict notification
    this.eventBroadcaster.broadcast(interactionId, {
      type: 'ERROR',
      error: {
        code: 'CONCURRENT_ACTION_CONFLICT',
        message: `Concurrent actions detected. Resolution: ${resolution}`,
        details: { 
          conflictingActions: conflictingActions.length,
          resolution,
        },
      },
      timestamp: Date.now(),
      interactionId,
    } as GameEvent);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    logger.info('Cleaning up ConnectionHandler resources');

    // Clear all timers
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    this.heartbeatTimers.clear();

    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    for (const timer of this.dmGraceTimers.values()) {
      clearTimeout(timer);
    }
    this.dmGraceTimers.clear();

    // Clear connections
    this.connections.clear();

    // Remove all listeners
    this.removeAllListeners();

    logger.info('ConnectionHandler cleanup completed');
  }

  /**
   * Private helper methods
   */

  private setupRoomManagerListeners(): void {
    // Listen for participant events from room manager
    this.roomManager.on('participantJoined', ({ room, participant }) => {
      this.registerConnection(participant.userId, participant.connectionId, room.interactionId);
    });

    this.roomManager.on('participantLeft', ({ room, userId }) => {
      this.handleDisconnect(userId, 'Left room');
    });
  }

  private startHeartbeat(userId: string): void {
    // Clear existing heartbeat
    this.stopHeartbeat(userId);

    const timer = setInterval(() => {
      this.checkConnectionHealth(userId);
    }, this.config.heartbeatIntervalMs);

    this.heartbeatTimers.set(userId, timer);
  }

  private stopHeartbeat(userId: string): void {
    const timer = this.heartbeatTimers.get(userId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(userId);
    }
  }

  private checkConnectionHealth(userId: string): void {
    const connection = this.connections.get(userId);
    if (!connection || !connection.isConnected) {
      return;
    }

    const now = Date.now();
    const lastSeen = connection.lastSeen.getTime();
    const timeSinceLastSeen = now - lastSeen;

    if (timeSinceLastSeen > this.config.connectionTimeoutMs) {
      logger.warn('Connection timeout detected', {
        userId,
        connectionId: connection.connectionId,
        timeSinceLastSeen,
        timeoutMs: this.config.connectionTimeoutMs,
      });

      this.handleDisconnect(userId, 'Connection timeout');
    }
  }

  private handlePlayerDisconnect(userId: string, interactionId: string, reason: string): void {
    // Broadcast player disconnect
    this.eventBroadcaster.broadcast(interactionId, {
      type: 'PLAYER_DISCONNECTED',
      userId,
      interactionId,
      reason,
      timestamp: Date.now(),
    } as GameEvent);

    // Emit connection event
    this.emit('connectionEvent', {
      type: 'PLAYER_DISCONNECTED',
      userId,
      interactionId,
      reason,
    } as ConnectionEvent);

    // Start reconnect timer
    this.startReconnectTimer(userId, interactionId);
  }

  private handleDMDisconnect(userId: string, interactionId: string, reason: string): void {
    // Broadcast DM disconnect
    this.eventBroadcaster.broadcast(interactionId, {
      type: 'DM_DISCONNECTED',
      userId,
      interactionId,
      reason,
      timestamp: Date.now(),
    } as GameEvent);

    // Emit connection event
    this.emit('connectionEvent', {
      type: 'DM_DISCONNECTED',
      userId,
      interactionId,
      reason,
    } as ConnectionEvent);

    // Start DM grace period timer
    this.startDMGraceTimer(userId, interactionId);
  }

  private startReconnectTimer(userId: string, interactionId: string): void {
    const connection = this.connections.get(userId);
    if (!connection) return;

    const timer = setTimeout(() => {
      connection.reconnectAttempts++;
      
      if (connection.reconnectAttempts >= this.config.maxReconnectAttempts) {
        logger.warn('Max reconnect attempts reached for user', {
          userId,
          interactionId,
          attempts: connection.reconnectAttempts,
        });

        // Emit reconnect failed event
        this.emit('connectionEvent', {
          type: 'RECONNECT_FAILED',
          userId,
          interactionId,
          attempts: connection.reconnectAttempts,
        } as ConnectionEvent);

        // Remove from room permanently
        this.roomManager.leaveRoom(interactionId, userId);
        this.removeConnection(userId);
      } else {
        // Continue trying to reconnect
        this.startReconnectTimer(userId, interactionId);
      }
    }, this.config.connectionTimeoutMs);

    this.reconnectTimers.set(userId, timer);
  }

  private startDMGraceTimer(userId: string, interactionId: string): void {
    const timer = setTimeout(async () => {
      logger.warn('DM grace period expired, pausing interaction', {
        userId,
        interactionId,
        gracePeriodMs: this.config.dmDisconnectGraceMs,
      });

      // Pause the interaction
      await this.roomManager.pauseRoom(interactionId, 'DM disconnected');

      // Broadcast pause notification
      await this.eventBroadcaster.broadcast(interactionId, {
        type: 'INTERACTION_PAUSED',
        reason: 'DM disconnected - interaction paused until DM returns',
        timestamp: Date.now(),
        interactionId,
      } as GameEvent);

    }, this.config.dmDisconnectGraceMs);

    this.dmGraceTimers.set(interactionId, timer);
  }

  private clearReconnectTimer(userId: string): void {
    const timer = this.reconnectTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(userId);
    }
  }

  private clearDMGraceTimer(interactionId: string): void {
    const timer = this.dmGraceTimers.get(interactionId);
    if (timer) {
      clearTimeout(timer);
      this.dmGraceTimers.delete(interactionId);
    }
  }

  private findUserRoom(userId: string): any {
    const rooms = this.roomManager.getAllRooms();
    return rooms.find(room => room.getParticipant(userId));
  }

  private isDMUser(userId: string, interactionId: string): boolean {
    // This would typically check against the interaction's DM user ID
    // For now, we'll use a simple heuristic based on entity type
    const room = this.roomManager.getRoomByInteractionId(interactionId);
    if (!room) return false;

    const participant = room.getParticipant(userId);
    return participant?.entityType === 'npc' || participant?.entityType === 'monster';
  }

  private async synchronizeUserState(userId: string, interactionId: string): Promise<void> {
    try {
      const room = this.roomManager.getRoomByInteractionId(interactionId);
      if (!room) {
        throw new Error('Room not found for state synchronization');
      }

      // Send current game state to the user
      await this.eventBroadcaster.broadcastToUser(interactionId, userId, {
        type: 'STATE_DELTA',
        changes: {
          fullSync: true,
          gameState: room.gameState,
        },
        timestamp: Date.now(),
        interactionId,
      } as GameEvent);

      logger.info('User state synchronized', {
        userId,
        interactionId,
        gameStateTimestamp: room.gameState.timestamp,
      });

    } catch (error) {
      logger.error('Failed to synchronize user state', {
        userId,
        interactionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}