import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RoomManager } from '../services/RoomManager';
import { GameState, Participant } from '../types';

// Mock logger to avoid console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    })
  }
}));

describe('RoomManager', () => {
  let roomManager: RoomManager;
  let mockGameState: GameState;
  let mockParticipant: Participant;

  beforeEach(() => {
    roomManager = new RoomManager({
      inactivityTimeoutMs: 5000, // 5 seconds for tests
      cleanupIntervalMs: 1000, // 1 second for tests
      maxRooms: 5
    });

    mockGameState = {
      interactionId: 'test-interaction-1',
      status: 'active',
      initiativeOrder: [
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 15, userId: 'user1' }
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

    mockParticipant = {
      userId: 'user1',
      entityId: 'player1',
      entityType: 'playerCharacter',
      connectionId: 'conn1',
      isConnected: true,
      lastActivity: new Date()
    };
  });

  afterEach(() => {
    roomManager.shutdown();
  });

  describe('room creation', () => {
    it('should create a new room successfully', async () => {
      const eventSpy = vi.fn();
      roomManager.on('roomCreated', eventSpy);

      const room = await roomManager.createRoom('test-interaction-1', mockGameState);

      expect(room).toBeDefined();
      expect(room.interactionId).toBe('test-interaction-1');
      expect(room.status).toBe('active');
      expect(eventSpy).toHaveBeenCalledWith(room);
    });

    it('should throw error when creating duplicate room', async () => {
      await roomManager.createRoom('test-interaction-1', mockGameState);

      await expect(
        roomManager.createRoom('test-interaction-1', mockGameState)
      ).rejects.toThrow('Room already exists for interaction test-interaction-1');
    });

    it('should throw error when max rooms limit reached', async () => {
      // Create maximum number of rooms
      for (let i = 0; i < 5; i++) {
        await roomManager.createRoom(`interaction-${i}`, {
          ...mockGameState,
          interactionId: `interaction-${i}`
        });
      }

      await expect(
        roomManager.createRoom('extra-interaction', mockGameState)
      ).rejects.toThrow('Maximum room limit reached');
    });
  });

  describe('room retrieval', () => {
    it('should get room by ID', async () => {
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      
      const retrievedRoom = roomManager.getRoom(room.id);
      
      expect(retrievedRoom).toBe(room);
    });

    it('should return null for non-existent room ID', () => {
      const room = roomManager.getRoom('non-existent');
      expect(room).toBeNull();
    });

    it('should get room by interaction ID', async () => {
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      
      const retrievedRoom = roomManager.getRoomByInteractionId('test-interaction-1');
      
      expect(retrievedRoom).toBe(room);
    });

    it('should return null for non-existent interaction ID', () => {
      const room = roomManager.getRoomByInteractionId('non-existent');
      expect(room).toBeNull();
    });

    it('should get all rooms', async () => {
      const room1 = await roomManager.createRoom('interaction-1', {
        ...mockGameState,
        interactionId: 'interaction-1'
      });
      const room2 = await roomManager.createRoom('interaction-2', {
        ...mockGameState,
        interactionId: 'interaction-2'
      });

      const allRooms = roomManager.getAllRooms();
      
      expect(allRooms).toHaveLength(2);
      expect(allRooms).toContain(room1);
      expect(allRooms).toContain(room2);
    });

    it('should get only active rooms', async () => {
      const room1 = await roomManager.createRoom('interaction-1', {
        ...mockGameState,
        interactionId: 'interaction-1'
      });
      const room2 = await roomManager.createRoom('interaction-2', {
        ...mockGameState,
        interactionId: 'interaction-2'
      });

      room2.pause();

      const activeRooms = roomManager.getActiveRooms();
      
      expect(activeRooms).toHaveLength(1);
      expect(activeRooms).toContain(room1);
      expect(activeRooms).not.toContain(room2);
    });
  });

  describe('participant management', () => {
    it('should join room successfully', async () => {
      const eventSpy = vi.fn();
      await roomManager.createRoom('test-interaction-1', mockGameState);
      roomManager.on('participantJoined', eventSpy);

      const room = await roomManager.joinRoom('test-interaction-1', mockParticipant);

      expect(room.getParticipant('user1')).toEqual(mockParticipant);
      expect(eventSpy).toHaveBeenCalledWith({ room, participant: mockParticipant });
    });

    it('should handle participant reconnection', async () => {
      await roomManager.createRoom('test-interaction-1', mockGameState);
      const room = await roomManager.joinRoom('test-interaction-1', mockParticipant);
      
      // Simulate disconnect
      room.updateParticipantConnection('user1', false);

      // Reconnect with new connection ID
      const reconnectParticipant = {
        ...mockParticipant,
        connectionId: 'new-conn'
      };

      const rejoined = await roomManager.joinRoom('test-interaction-1', reconnectParticipant);

      expect(rejoined).toBe(room);
      const participant = room.getParticipant('user1');
      expect(participant?.isConnected).toBe(true);
      expect(participant?.connectionId).toBe('new-conn');
    });

    it('should throw error when joining non-existent room', async () => {
      await expect(
        roomManager.joinRoom('non-existent', mockParticipant)
      ).rejects.toThrow('Room not found for interaction non-existent');
    });

    it('should throw error when joining completed room', async () => {
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      room.complete();

      await expect(
        roomManager.joinRoom('test-interaction-1', mockParticipant)
      ).rejects.toThrow('Cannot join completed interaction');
    });

    it('should leave room successfully', async () => {
      const eventSpy = vi.fn();
      await roomManager.createRoom('test-interaction-1', mockGameState);
      const room = await roomManager.joinRoom('test-interaction-1', mockParticipant);
      roomManager.on('participantLeft', eventSpy);

      const result = await roomManager.leaveRoom('test-interaction-1', 'user1');

      expect(result).toBe(true);
      const participant = room.getParticipant('user1');
      expect(participant?.isConnected).toBe(false);
      expect(eventSpy).toHaveBeenCalledWith({ 
        room, 
        userId: 'user1', 
        participant: mockParticipant 
      });
    });

    it('should return false when leaving non-existent room', async () => {
      const result = await roomManager.leaveRoom('non-existent', 'user1');
      expect(result).toBe(false);
    });

    it('should return false when leaving as non-participant', async () => {
      await roomManager.createRoom('test-interaction-1', mockGameState);

      const result = await roomManager.leaveRoom('test-interaction-1', 'non-participant');
      expect(result).toBe(false);
    });
  });

  describe('room lifecycle management', () => {
    it('should pause room successfully', async () => {
      const eventSpy = vi.fn();
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      roomManager.on('roomPaused', eventSpy);

      const result = await roomManager.pauseRoom('test-interaction-1', 'Test pause');

      expect(result).toBe(true);
      expect(room.status).toBe('paused');
      expect(eventSpy).toHaveBeenCalledWith({ room, reason: 'Test pause' });
    });

    it('should return false when pausing non-existent room', async () => {
      const result = await roomManager.pauseRoom('non-existent');
      expect(result).toBe(false);
    });

    it('should resume room successfully', async () => {
      const eventSpy = vi.fn();
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      room.pause();
      roomManager.on('roomResumed', eventSpy);

      const result = await roomManager.resumeRoom('test-interaction-1');

      expect(result).toBe(true);
      expect(room.status).toBe('active');
      expect(eventSpy).toHaveBeenCalledWith({ room });
    });

    it('should return false when resuming non-existent room', async () => {
      const result = await roomManager.resumeRoom('non-existent');
      expect(result).toBe(false);
    });

    it('should complete room successfully', async () => {
      const eventSpy = vi.fn();
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      roomManager.on('roomCompleted', eventSpy);

      const result = await roomManager.completeRoom('test-interaction-1', 'Test completion');

      expect(result).toBe(true);
      expect(room.status).toBe('completed');
      expect(eventSpy).toHaveBeenCalledWith({ room, reason: 'Test completion' });
    });

    it('should return false when completing non-existent room', async () => {
      const result = await roomManager.completeRoom('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('room removal', () => {
    it('should remove room successfully', async () => {
      const eventSpy = vi.fn();
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      roomManager.on('roomRemoved', eventSpy);

      const result = await roomManager.removeRoom(room.id);

      expect(result).toBe(true);
      expect(roomManager.getRoom(room.id)).toBeNull();
      expect(eventSpy).toHaveBeenCalledWith({ 
        roomId: room.id, 
        interactionId: 'test-interaction-1' 
      });
    });

    it('should return false when removing non-existent room', async () => {
      const result = await roomManager.removeRoom('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('cleanup operations', () => {
    it('should clean up inactive rooms', async () => {
      const eventSpy = vi.fn();
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      roomManager.on('roomCleanup', eventSpy);

      // Manually set the room's last activity to make it inactive
      room.lastActivity = new Date(Date.now() - 10000); // 10 seconds ago

      const cleanedCount = await roomManager.cleanupInactiveRooms();

      expect(cleanedCount).toBe(1);
      expect(roomManager.getRoom(room.id)).toBeNull();
      expect(eventSpy).toHaveBeenCalledWith({ room, reason: 'inactivity' });
    }, 10000); // 10 second timeout

    it('should not clean up paused rooms', async () => {
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      room.pause();

      // Manually set the room's last activity to make it appear inactive
      room.lastActivity = new Date(Date.now() - 10000); // 10 seconds ago

      const cleanedCount = await roomManager.cleanupInactiveRooms();

      expect(cleanedCount).toBe(0);
      expect(roomManager.getRoom(room.id)).toBe(room);
    }, 10000); // 10 second timeout

    it('should not clean up active rooms with recent activity', async () => {
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      await roomManager.joinRoom('test-interaction-1', mockParticipant);

      const cleanedCount = await roomManager.cleanupInactiveRooms();

      expect(cleanedCount).toBe(0);
      expect(roomManager.getRoom(room.id)).toBe(room);
    });
  });

  describe('statistics', () => {
    it('should return correct manager statistics', async () => {
      const room1 = await roomManager.createRoom('interaction-1', {
        ...mockGameState,
        interactionId: 'interaction-1'
      });
      const room2 = await roomManager.createRoom('interaction-2', {
        ...mockGameState,
        interactionId: 'interaction-2'
      });

      await roomManager.joinRoom('interaction-1', mockParticipant);
      await roomManager.joinRoom('interaction-2', {
        ...mockParticipant,
        userId: 'user2',
        entityId: 'player2'
      });

      room2.pause();

      const stats = roomManager.getStats();

      expect(stats.totalRooms).toBe(2);
      expect(stats.activeRooms).toBe(1);
      expect(stats.pausedRooms).toBe(1);
      expect(stats.completedRooms).toBe(0);
      expect(stats.totalParticipants).toBe(2);
      expect(stats.connectedParticipants).toBe(2);
    });
  });

  describe('event forwarding', () => {
    it('should forward room events', async () => {
      const eventSpy = vi.fn();
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      roomManager.on('roomEvent', eventSpy);

      room.addParticipant(mockParticipant);

      expect(eventSpy).toHaveBeenCalledWith({
        room,
        event: {
          type: 'PARTICIPANT_JOINED',
          userId: 'user1',
          entityId: 'player1'
        }
      });
    });

    it('should forward state change events', async () => {
      const eventSpy = vi.fn();
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      roomManager.on('roomStateChanged', eventSpy);

      room.updateGameState({ roundNumber: 2 });

      expect(eventSpy).toHaveBeenCalledWith({
        room,
        gameState: room.gameState
      });
    });

    it('should forward persistence events', async () => {
      const eventSpy = vi.fn();
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      roomManager.on('persistenceRequired', eventSpy);

      room.pause();

      expect(eventSpy).toHaveBeenCalledWith({
        room,
        trigger: 'pause'
      });
    });
  });

  describe('shutdown', () => {
    it('should shutdown cleanly', async () => {
      const room = await roomManager.createRoom('test-interaction-1', mockGameState);
      
      roomManager.shutdown();

      expect(roomManager.getAllRooms()).toHaveLength(0);
      expect(roomManager.listenerCount('roomCreated')).toBe(0);
    });
  });
});