import { InteractionRoom } from './InteractionRoom';
import { Participant, GameState } from '../types';
import { logger } from '../utils/logger';
import { generateId } from '../utils';
import { EventEmitter } from 'events';

export interface RoomManagerConfig {
  inactivityTimeoutMs?: number;
  cleanupIntervalMs?: number;
  maxRooms?: number;
}

export class RoomManager extends EventEmitter {
  private rooms: Map<string, InteractionRoom>;
  private cleanupInterval?: NodeJS.Timeout;
  private readonly config: Required<RoomManagerConfig>;
  private readonly managerLogger;

  constructor(config: RoomManagerConfig = {}) {
    super();
    
    this.rooms = new Map();
    this.config = {
      inactivityTimeoutMs: config.inactivityTimeoutMs || 30 * 60 * 1000, // 30 minutes
      cleanupIntervalMs: config.cleanupIntervalMs || 5 * 60 * 1000, // 5 minutes
      maxRooms: config.maxRooms || 100
    };
    
    this.managerLogger = logger.child({ component: 'RoomManager' });
    
    this.startCleanupInterval();
    this.managerLogger.info('RoomManager initialized', this.config);
  }

  /**
   * Create a new interaction room
   */
  public async createRoom(interactionId: string, initialGameState: GameState): Promise<InteractionRoom> {
    // Check if room already exists for this interaction
    const existingRoom = this.findRoomByInteractionId(interactionId);
    if (existingRoom) {
      this.managerLogger.warn('Attempted to create room for existing interaction', { 
        interactionId,
        existingRoomId: existingRoom.id 
      });
      throw new Error(`Room already exists for interaction ${interactionId}`);
    }

    // Check room limit
    if (this.rooms.size >= this.config.maxRooms) {
      this.managerLogger.error('Maximum room limit reached', { 
        currentRooms: this.rooms.size,
        maxRooms: this.config.maxRooms 
      });
      throw new Error('Maximum room limit reached');
    }

    // Create new room
    const room = new InteractionRoom(
      interactionId, 
      initialGameState, 
      this.config.inactivityTimeoutMs
    );

    // Set up room event listeners
    this.setupRoomEventListeners(room);

    // Add to rooms map
    this.rooms.set(room.id, room);

    this.managerLogger.info('Room created', {
      roomId: room.id,
      interactionId,
      totalRooms: this.rooms.size
    });

    // Emit room created event
    this.emit('roomCreated', room);

    return room;
  }

  /**
   * Get a room by ID
   */
  public getRoom(roomId: string): InteractionRoom | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * Get a room by interaction ID
   */
  public getRoomByInteractionId(interactionId: string): InteractionRoom | null {
    return this.findRoomByInteractionId(interactionId);
  }

  /**
   * Get all rooms
   */
  public getAllRooms(): InteractionRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get active rooms
   */
  public getActiveRooms(): InteractionRoom[] {
    return this.getAllRooms().filter(room => room.status === 'active');
  }

  /**
   * Join a room
   */
  public async joinRoom(interactionId: string, participant: Participant): Promise<InteractionRoom> {
    const room = this.findRoomByInteractionId(interactionId);
    if (!room) {
      this.managerLogger.error('Attempted to join non-existent room', { 
        interactionId,
        userId: participant.userId 
      });
      throw new Error(`Room not found for interaction ${interactionId}`);
    }

    if (room.status === 'completed') {
      this.managerLogger.error('Attempted to join completed room', { 
        interactionId,
        userId: participant.userId,
        roomStatus: room.status 
      });
      throw new Error('Cannot join completed interaction');
    }

    // Check if participant is already in room
    const existingParticipant = room.getParticipant(participant.userId);
    if (existingParticipant) {
      // Update connection info for reconnection
      room.updateParticipantConnection(
        participant.userId, 
        true, 
        participant.connectionId
      );
      
      this.managerLogger.info('Participant reconnected to room', {
        roomId: room.id,
        interactionId,
        userId: participant.userId
      });
    } else {
      // Add new participant
      room.addParticipant(participant);
      
      this.managerLogger.info('Participant joined room', {
        roomId: room.id,
        interactionId,
        userId: participant.userId,
        entityId: participant.entityId
      });
    }

    // Emit join event
    this.emit('participantJoined', { room, participant });

    return room;
  }

  /**
   * Leave a room
   */
  public async leaveRoom(interactionId: string, userId: string): Promise<boolean> {
    const room = this.findRoomByInteractionId(interactionId);
    if (!room) {
      this.managerLogger.warn('Attempted to leave non-existent room', { 
        interactionId,
        userId 
      });
      return false;
    }

    const participant = room.getParticipant(userId);
    if (!participant) {
      this.managerLogger.warn('Attempted to leave room as non-participant', { 
        interactionId,
        userId,
        roomId: room.id 
      });
      return false;
    }

    // Update connection status instead of removing completely
    // This allows for reconnection while preserving game state
    room.updateParticipantConnection(userId, false);

    this.managerLogger.info('Participant left room', {
      roomId: room.id,
      interactionId,
      userId,
      entityId: participant.entityId
    });

    // Emit leave event
    this.emit('participantLeft', { room, userId, participant });

    return true;
  }

  /**
   * Pause a room
   */
  public async pauseRoom(interactionId: string, reason: string = 'Manual pause'): Promise<boolean> {
    const room = this.findRoomByInteractionId(interactionId);
    if (!room) {
      this.managerLogger.error('Attempted to pause non-existent room', { interactionId });
      return false;
    }

    room.pause(reason);
    
    this.managerLogger.info('Room paused', {
      roomId: room.id,
      interactionId,
      reason
    });

    // Emit pause event
    this.emit('roomPaused', { room, reason });

    return true;
  }

  /**
   * Resume a room
   */
  public async resumeRoom(interactionId: string): Promise<boolean> {
    const room = this.findRoomByInteractionId(interactionId);
    if (!room) {
      this.managerLogger.error('Attempted to resume non-existent room', { interactionId });
      return false;
    }

    room.resume();
    
    this.managerLogger.info('Room resumed', {
      roomId: room.id,
      interactionId
    });

    // Emit resume event
    this.emit('roomResumed', { room });

    return true;
  }

  /**
   * Complete a room
   */
  public async completeRoom(interactionId: string, reason: string = 'Interaction completed'): Promise<boolean> {
    const room = this.findRoomByInteractionId(interactionId);
    if (!room) {
      this.managerLogger.error('Attempted to complete non-existent room', { interactionId });
      return false;
    }

    room.complete(reason);
    
    this.managerLogger.info('Room completed', {
      roomId: room.id,
      interactionId,
      reason
    });

    // Emit completion event
    this.emit('roomCompleted', { room, reason });

    return true;
  }

  /**
   * Remove a room from management
   */
  public async removeRoom(roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      this.managerLogger.warn('Attempted to remove non-existent room', { roomId });
      return false;
    }

    // Clean up room resources
    room.cleanup();

    // Remove from map
    this.rooms.delete(roomId);

    this.managerLogger.info('Room removed', {
      roomId,
      interactionId: room.interactionId,
      totalRooms: this.rooms.size
    });

    // Emit removal event
    this.emit('roomRemoved', { roomId, interactionId: room.interactionId });

    return true;
  }

  /**
   * Clean up inactive rooms
   */
  public async cleanupInactiveRooms(): Promise<number> {
    const inactiveRooms: InteractionRoom[] = [];
    
    for (const room of this.rooms.values()) {
      if (room.isInactive() && room.status !== 'paused') {
        inactiveRooms.push(room);
      }
    }

    this.managerLogger.info('Starting cleanup of inactive rooms', { 
      inactiveRoomCount: inactiveRooms.length,
      totalRooms: this.rooms.size 
    });

    let cleanedCount = 0;
    for (const room of inactiveRooms) {
      try {
        // Emit cleanup event before removal
        this.emit('roomCleanup', { room, reason: 'inactivity' });
        
        await this.removeRoom(room.id);
        cleanedCount++;
      } catch (error) {
        this.managerLogger.error('Error cleaning up room', {
          roomId: room.id,
          interactionId: room.interactionId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    if (cleanedCount > 0) {
      this.managerLogger.info('Inactive room cleanup completed', { 
        cleanedCount,
        remainingRooms: this.rooms.size 
      });
    }

    return cleanedCount;
  }

  /**
   * Get manager statistics
   */
  public getStats() {
    const rooms = this.getAllRooms();
    const activeRooms = rooms.filter(r => r.status === 'active');
    const pausedRooms = rooms.filter(r => r.status === 'paused');
    const completedRooms = rooms.filter(r => r.status === 'completed');
    
    const totalParticipants = rooms.reduce((sum, room) => sum + room.participants.size, 0);
    const connectedParticipants = rooms.reduce((sum, room) => 
      sum + room.getAllParticipants().filter(p => p.isConnected).length, 0
    );

    return {
      totalRooms: this.rooms.size,
      activeRooms: activeRooms.length,
      pausedRooms: pausedRooms.length,
      completedRooms: completedRooms.length,
      totalParticipants,
      connectedParticipants,
      config: this.config
    };
  }

  /**
   * Shutdown the room manager
   */
  public shutdown(): void {
    this.managerLogger.info('Shutting down RoomManager');
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // Clean up all rooms
    for (const room of this.rooms.values()) {
      room.cleanup();
    }
    
    this.rooms.clear();
    this.removeAllListeners();
    
    this.managerLogger.info('RoomManager shutdown completed');
  }

  /**
   * Find room by interaction ID
   */
  private findRoomByInteractionId(interactionId: string): InteractionRoom | null {
    for (const room of this.rooms.values()) {
      if (room.interactionId === interactionId) {
        return room;
      }
    }
    return null;
  }

  /**
   * Set up event listeners for a room
   */
  private setupRoomEventListeners(room: InteractionRoom): void {
    // Handle inactivity timeout
    room.on('inactivityTimeout', () => {
      this.managerLogger.info('Room inactivity timeout', {
        roomId: room.id,
        interactionId: room.interactionId
      });
      
      // Emit cleanup event
      this.emit('roomCleanup', { room, reason: 'inactivity' });
    });

    // Handle persistence requirements
    room.on('persistenceRequired', (trigger: string) => {
      this.managerLogger.debug('Room persistence required', {
        roomId: room.id,
        interactionId: room.interactionId,
        trigger
      });
      
      // Emit persistence event for external handling
      this.emit('persistenceRequired', { room, trigger });
    });

    // Forward room events
    room.on('participantJoined', (event) => {
      this.emit('roomEvent', { room, event });
    });

    room.on('participantLeft', (event) => {
      this.emit('roomEvent', { room, event });
    });

    room.on('turnCompleted', (event) => {
      this.emit('roomEvent', { room, event });
    });

    room.on('interactionPaused', (event) => {
      this.emit('roomEvent', { room, event });
    });

    room.on('interactionResumed', (event) => {
      this.emit('roomEvent', { room, event });
    });

    room.on('stateChanged', (gameState) => {
      this.emit('roomStateChanged', { room, gameState });
    });
  }

  /**
   * Start the cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupInactiveRooms();
      } catch (error) {
        this.managerLogger.error('Error during scheduled cleanup', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.cleanupIntervalMs);
  }
}