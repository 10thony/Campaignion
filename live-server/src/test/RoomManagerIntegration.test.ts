import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RoomManager } from '../services/RoomManager';
import { StatePersistence } from '../services/StatePersistence';
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

describe('Room Manager Integration', () => {
  let roomManager: RoomManager;
  let persistence: StatePersistence;
  let mockGameState: GameState;
  let mockParticipant: Participant;

  beforeEach(() => {
    roomManager = new RoomManager({
      inactivityTimeoutMs: 10000, // 10 seconds
      cleanupIntervalMs: 2000, // 2 seconds
      maxRooms: 10
    });

    persistence = new StatePersistence({
      convexUrl: 'https://test-convex-url.convex.cloud',
      retryAttempts: 2,
      retryDelayMs: 100
    });

    mockGameState = {
      interactionId: 'integration-test-1',
      status: 'active',
      initiativeOrder: [
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 15, userId: 'user1' },
        { entityId: 'monster1', entityType: 'monster', initiative: 10 }
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

  describe('complete room lifecycle with persistence', () => {
    it('should handle full room lifecycle with state persistence', async () => {
      // Track persistence events
      const persistenceEvents: Array<{ trigger: string; interactionId: string }> = [];
      
      roomManager.on('persistenceRequired', ({ room, trigger }) => {
        persistenceEvents.push({ trigger, interactionId: room.interactionId });
        // Simulate saving to persistence
        persistence.saveSnapshot(room, trigger);
      });

      // 1. Create room
      const room = await roomManager.createRoom('integration-test-1', mockGameState);
      expect(room.status).toBe('active');

      // 2. Join participants
      await roomManager.joinRoom('integration-test-1', mockParticipant);
      await roomManager.joinRoom('integration-test-1', {
        userId: 'user2',
        entityId: 'monster1',
        entityType: 'monster',
        connectionId: 'conn2',
        isConnected: true,
        lastActivity: new Date()
      });

      expect(room.participants.size).toBe(2);

      // 3. Process some game actions
      const turnAction = {
        type: 'move' as const,
        entityId: 'player1',
        position: { x: 5, y: 5 }
      };

      room.processTurnAction(turnAction);
      expect(room.gameState.turnHistory).toHaveLength(1);

      // 4. Pause room (should trigger persistence)
      await roomManager.pauseRoom('integration-test-1', 'DM disconnected');
      expect(room.status).toBe('paused');
      expect(persistenceEvents).toContainEqual({ 
        trigger: 'pause', 
        interactionId: 'integration-test-1' 
      });

      // 5. Resume room
      await roomManager.resumeRoom('integration-test-1');
      expect(room.status).toBe('active');

      // 6. Complete room (should trigger persistence)
      await roomManager.completeRoom('integration-test-1', 'Session ended');
      expect(room.status).toBe('completed');
      expect(persistenceEvents).toContainEqual({ 
        trigger: 'complete', 
        interactionId: 'integration-test-1' 
      });

      // Verify final state
      expect(persistenceEvents.length).toBeGreaterThanOrEqual(2); // At least pause and complete
    });

    it('should handle participant disconnect and reconnect with persistence', async () => {
      const persistenceEvents: string[] = [];
      
      roomManager.on('persistenceRequired', ({ trigger }) => {
        persistenceEvents.push(trigger);
      });

      // Create room and join participant
      const room = await roomManager.createRoom('integration-test-1', mockGameState);
      await roomManager.joinRoom('integration-test-1', mockParticipant);

      // Simulate participant disconnect
      room.updateParticipantConnection('user1', false);
      const participant = room.getParticipant('user1');
      expect(participant?.isConnected).toBe(false);

      // Simulate reconnection
      await roomManager.joinRoom('integration-test-1', {
        ...mockParticipant,
        connectionId: 'new-conn-id'
      });

      const reconnectedParticipant = room.getParticipant('user1');
      expect(reconnectedParticipant?.isConnected).toBe(true);
      expect(reconnectedParticipant?.connectionId).toBe('new-conn-id');
    });

    it('should handle room cleanup with persistence', async () => {
      const cleanupEvents: string[] = [];
      
      roomManager.on('roomCleanup', ({ reason }) => {
        cleanupEvents.push(reason);
      });

      roomManager.on('persistenceRequired', ({ room, trigger }) => {
        // Simulate persistence save
        persistence.saveSnapshot(room, trigger);
      });

      // Create room
      const room = await roomManager.createRoom('integration-test-1', mockGameState);
      
      // Make room inactive by setting old last activity
      room.lastActivity = new Date(Date.now() - 15000); // 15 seconds ago

      // Trigger cleanup
      const cleanedCount = await roomManager.cleanupInactiveRooms();

      expect(cleanedCount).toBe(1);
      expect(cleanupEvents).toContain('inactivity');
      expect(roomManager.getRoom(room.id)).toBeNull();
    });
  });

  describe('error handling and recovery', () => {
    it('should handle room creation errors gracefully', async () => {
      // Create room first
      await roomManager.createRoom('integration-test-1', mockGameState);

      // Try to create duplicate
      await expect(
        roomManager.createRoom('integration-test-1', mockGameState)
      ).rejects.toThrow('Room already exists');

      // Original room should still exist
      const room = roomManager.getRoomByInteractionId('integration-test-1');
      expect(room).not.toBeNull();
    });

    it('should handle persistence failures gracefully', async () => {
      // Create a persistence instance that will fail
      const failingPersistence = new StatePersistence({
        convexUrl: 'https://invalid-url.convex.cloud',
        retryAttempts: 1,
        retryDelayMs: 10
      });

      const room = await roomManager.createRoom('integration-test-1', mockGameState);

      // Persistence failure should not crash the room
      try {
        await failingPersistence.saveSnapshot(room, 'test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Room should still be functional
      expect(room.status).toBe('active');
      expect(roomManager.getRoom(room.id)).toBe(room);
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple participants joining simultaneously', async () => {
      const room = await roomManager.createRoom('integration-test-1', mockGameState);

      const participants = Array.from({ length: 5 }, (_, i) => ({
        userId: `user${i + 1}`,
        entityId: `player${i + 1}`,
        entityType: 'playerCharacter' as const,
        connectionId: `conn${i + 1}`,
        isConnected: true,
        lastActivity: new Date()
      }));

      // Join all participants simultaneously
      const joinPromises = participants.map(p => 
        roomManager.joinRoom('integration-test-1', p)
      );

      const results = await Promise.all(joinPromises);

      // All should succeed and return the same room
      results.forEach(result => {
        expect(result).toBe(room);
      });

      expect(room.participants.size).toBe(5);
    });

    it('should handle concurrent room operations', async () => {
      const room = await roomManager.createRoom('integration-test-1', mockGameState);
      await roomManager.joinRoom('integration-test-1', mockParticipant);

      // Perform multiple operations concurrently
      const operations = [
        roomManager.pauseRoom('integration-test-1', 'Test pause'),
        roomManager.leaveRoom('integration-test-1', 'user1'),
        persistence.saveSnapshot(room, 'concurrent-test')
      ];

      // All operations should complete without error
      await expect(Promise.all(operations)).resolves.not.toThrow();

      // Room should be in paused state
      expect(room.status).toBe('paused');
    });
  });

  describe('performance and scalability', () => {
    it('should handle multiple rooms efficiently', async () => {
      const roomCount = 10;
      const rooms: Array<{ id: string; interactionId: string }> = [];

      // Create multiple rooms
      for (let i = 0; i < roomCount; i++) {
        const interactionId = `interaction-${i}`;
        const room = await roomManager.createRoom(interactionId, {
          ...mockGameState,
          interactionId
        });
        rooms.push({ id: room.id, interactionId });
      }

      expect(roomManager.getAllRooms()).toHaveLength(roomCount);

      // Add participants to each room
      for (let i = 0; i < roomCount; i++) {
        await roomManager.joinRoom(`interaction-${i}`, {
          ...mockParticipant,
          userId: `user-${i}`,
          entityId: `player-${i}`,
          connectionId: `conn-${i}`
        });
      }

      // Verify all rooms have participants
      const stats = roomManager.getStats();
      expect(stats.totalRooms).toBe(roomCount);
      expect(stats.totalParticipants).toBe(roomCount);
      expect(stats.connectedParticipants).toBe(roomCount);
    });

    it('should clean up resources properly on shutdown', async () => {
      // Create multiple rooms with participants
      for (let i = 0; i < 3; i++) {
        const room = await roomManager.createRoom(`interaction-${i}`, {
          ...mockGameState,
          interactionId: `interaction-${i}`
        });
        
        await roomManager.joinRoom(`interaction-${i}`, {
          ...mockParticipant,
          userId: `user-${i}`,
          entityId: `player-${i}`,
          connectionId: `conn-${i}`
        });
      }

      expect(roomManager.getAllRooms()).toHaveLength(3);

      // Shutdown should clean up everything
      roomManager.shutdown();

      expect(roomManager.getAllRooms()).toHaveLength(0);
      expect(roomManager.getStats().totalRooms).toBe(0);
    });
  });
});