import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ConnectionHandler, ConnectionHandlerConfig } from '../services/ConnectionHandler';
import { RoomManager } from '../services/RoomManager';
import { EventBroadcaster } from '../services/EventBroadcaster';
import { InteractionRoom } from '../services/InteractionRoom';
import { GameState, Participant } from '../types';

// Mock dependencies
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

describe('ConnectionHandler', () => {
  let connectionHandler: ConnectionHandler;
  let mockRoomManager: RoomManager;
  let mockEventBroadcaster: EventBroadcaster;
  let mockRoom: InteractionRoom;
  let testConfig: ConnectionHandlerConfig;

  const createMockGameState = (): GameState => ({
    interactionId: 'test-interaction',
    status: 'active',
    initiativeOrder: [],
    currentTurnIndex: 0,
    roundNumber: 1,
    participants: new Map(),
    mapState: {
      width: 20,
      height: 20,
      entities: new Map(),
      obstacles: [],
      terrain: [],
    },
    turnHistory: [],
    chatLog: [],
    timestamp: new Date(),
  });

  const createMockParticipant = (userId: string, entityType: 'playerCharacter' | 'npc' = 'playerCharacter'): Participant => ({
    userId,
    entityId: `entity-${userId}`,
    entityType,
    connectionId: `conn-${userId}`,
    isConnected: true,
    lastActivity: new Date(),
  });

  beforeEach(() => {
    // Create mock room
    mockRoom = {
      id: 'room-1',
      interactionId: 'test-interaction',
      participants: new Map(),
      gameState: createMockGameState(),
      status: 'active',
      getParticipant: vi.fn(),
      updateParticipantConnection: vi.fn(),
    } as any;

    // Create mock room manager
    mockRoomManager = {
      getAllRooms: vi.fn(() => [mockRoom]),
      getRoomByInteractionId: vi.fn(() => mockRoom),
      pauseRoom: vi.fn(),
      resumeRoom: vi.fn(),
      leaveRoom: vi.fn(),
      on: vi.fn(),
      emit: vi.fn(),
    } as any;

    // Create mock event broadcaster
    mockEventBroadcaster = {
      broadcast: vi.fn(),
      broadcastToUser: vi.fn(),
    } as any;

    testConfig = {
      heartbeatIntervalMs: 100,
      connectionTimeoutMs: 300,
      maxReconnectAttempts: 2,
      dmDisconnectGraceMs: 500,
      stateRecoveryTimeoutMs: 1000,
    };

    connectionHandler = new ConnectionHandler(mockRoomManager, mockEventBroadcaster, testConfig);
  });

  afterEach(() => {
    connectionHandler.cleanup();
    vi.clearAllMocks();
  });

  describe('Connection Registration', () => {
    it('should register a new connection', () => {
      const userId = 'user-1';
      const connectionId = 'conn-1';
      const interactionId = 'test-interaction';

      connectionHandler.registerConnection(userId, connectionId, interactionId);

      const status = connectionHandler.getConnectionStatus(userId);
      expect(status).toBeDefined();
      expect(status?.userId).toBe(userId);
      expect(status?.connectionId).toBe(connectionId);
      expect(status?.isConnected).toBe(true);
      expect(status?.reconnectAttempts).toBe(0);
    });

    it('should update existing connection on re-registration', () => {
      const userId = 'user-1';
      const oldConnectionId = 'conn-1';
      const newConnectionId = 'conn-2';
      const interactionId = 'test-interaction';

      // Register initial connection
      connectionHandler.registerConnection(userId, oldConnectionId, interactionId);
      
      // Re-register with new connection ID
      connectionHandler.registerConnection(userId, newConnectionId, interactionId);

      const status = connectionHandler.getConnectionStatus(userId);
      expect(status?.connectionId).toBe(newConnectionId);
      expect(status?.isConnected).toBe(true);
      expect(status?.reconnectAttempts).toBe(0);
    });

    it('should check if user is connected', () => {
      const userId = 'user-1';
      
      expect(connectionHandler.isUserConnected(userId)).toBe(false);
      
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      expect(connectionHandler.isUserConnected(userId)).toBe(true);
    });
  });

  describe('Heartbeat Management', () => {
    it('should update heartbeat for connected user', () => {
      const userId = 'user-1';
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');

      const initialStatus = connectionHandler.getConnectionStatus(userId);
      const initialLastSeen = initialStatus?.lastSeen;

      // Wait a bit and update heartbeat
      setTimeout(() => {
        connectionHandler.updateHeartbeat(userId);
        
        const updatedStatus = connectionHandler.getConnectionStatus(userId);
        expect(updatedStatus?.lastSeen.getTime()).toBeGreaterThan(initialLastSeen!.getTime());
      }, 10);
    });

    it('should detect connection timeout', () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      
      // Mock room methods
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      
      // Manually trigger disconnect to simulate timeout behavior
      connectionHandler.handleDisconnect(userId, 'Connection timeout');

      // Should have called disconnect handling
      expect(mockRoom.updateParticipantConnection).toHaveBeenCalledWith(userId, false);
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalled();
      
      // Verify connection status
      const status = connectionHandler.getConnectionStatus(userId);
      expect(status?.isConnected).toBe(false);
      expect(status?.disconnectReason).toBe('Connection timeout');
    });
  });

  describe('Player Disconnect Handling', () => {
    it('should handle player disconnect', () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      connectionHandler.handleDisconnect(userId, 'Network error');

      const status = connectionHandler.getConnectionStatus(userId);
      expect(status?.isConnected).toBe(false);
      expect(status?.disconnectReason).toBe('Network error');
      
      // Should update room and broadcast event
      expect(mockRoom.updateParticipantConnection).toHaveBeenCalledWith(userId, false);
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        'test-interaction',
        expect.objectContaining({
          type: 'PLAYER_DISCONNECTED',
          userId,
          reason: 'Network error',
        })
      );
    });

    it('should handle player reconnection', async () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      
      // Initial connection and disconnect
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      connectionHandler.handleDisconnect(userId, 'Network error');
      
      // Reconnect
      await connectionHandler.handleReconnection(userId, 'test-interaction', 'conn-2');

      const status = connectionHandler.getConnectionStatus(userId);
      expect(status?.isConnected).toBe(true);
      expect(status?.connectionId).toBe('conn-2');
      expect(status?.reconnectAttempts).toBe(0);
      
      // Should update room and broadcast reconnection
      expect(mockRoom.updateParticipantConnection).toHaveBeenCalledWith(userId, true, 'conn-2');
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        'test-interaction',
        expect.objectContaining({
          type: 'PLAYER_RECONNECTED',
          userId,
          connectionId: 'conn-2',
        })
      );
    });

    it('should remove connection after max reconnect attempts', async () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      (mockRoomManager.leaveRoom as Mock).mockResolvedValue(true);
      
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      connectionHandler.handleDisconnect(userId, 'Network error');

      // Wait for max reconnect attempts to be exceeded
      await new Promise(resolve => setTimeout(resolve, 800));

      // Should have removed user from room
      expect(mockRoomManager.leaveRoom).toHaveBeenCalledWith('test-interaction', userId);
      expect(connectionHandler.getConnectionStatus(userId)).toBeUndefined();
    });
  });

  describe('DM Disconnect Handling', () => {
    it('should handle DM disconnect with grace period', async () => {
      const dmUserId = 'dm-1';
      const dmParticipant = createMockParticipant(dmUserId, 'npc'); // DM controls NPCs
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(dmParticipant);
      
      connectionHandler.registerConnection(dmUserId, 'conn-dm', 'test-interaction');
      connectionHandler.handleDisconnect(dmUserId, 'DM connection lost');

      // Should broadcast DM disconnect
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        'test-interaction',
        expect.objectContaining({
          type: 'DM_DISCONNECTED',
          userId: dmUserId,
          reason: 'DM connection lost',
        })
      );

      // Wait for grace period to expire
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should have paused the interaction
      expect(mockRoomManager.pauseRoom).toHaveBeenCalledWith(
        'test-interaction',
        'DM disconnected'
      );
    });

    it('should handle DM reconnection and resume interaction', async () => {
      const dmUserId = 'dm-1';
      const dmParticipant = createMockParticipant(dmUserId, 'npc');
      
      // Setup mocks - room is paused
      mockRoom.status = 'paused';
      (mockRoom.getParticipant as Mock).mockReturnValue(dmParticipant);
      (mockRoomManager.resumeRoom as Mock).mockResolvedValue(true);
      
      connectionHandler.registerConnection(dmUserId, 'conn-dm', 'test-interaction');
      connectionHandler.handleDisconnect(dmUserId, 'DM connection lost');
      
      // Reconnect DM
      await connectionHandler.handleReconnection(dmUserId, 'test-interaction', 'conn-dm-2');

      // Should have resumed the interaction
      expect(mockRoomManager.resumeRoom).toHaveBeenCalledWith('test-interaction');
      
      // Should broadcast DM reconnection
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        'test-interaction',
        expect.objectContaining({
          type: 'DM_RECONNECTED',
          userId: dmUserId,
          connectionId: 'conn-dm-2',
        })
      );
    });
  });

  describe('State Synchronization', () => {
    it('should emit state sync requirement on reconnection', async () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      
      let syncEventEmitted = false;
      connectionHandler.on('connectionEvent', (event) => {
        if (event.type === 'STATE_SYNC_REQUIRED' && event.userId === userId) {
          syncEventEmitted = true;
        }
      });

      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      await connectionHandler.handleReconnection(userId, 'test-interaction', 'conn-2');

      expect(syncEventEmitted).toBe(true);
    });

    it('should send current game state to reconnected user', async () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      await connectionHandler.handleReconnection(userId, 'test-interaction', 'conn-2');

      // Should have sent state delta to user
      expect(mockEventBroadcaster.broadcastToUser).toHaveBeenCalledWith(
        'test-interaction',
        userId,
        expect.objectContaining({
          type: 'STATE_DELTA',
          changes: expect.objectContaining({
            fullSync: true,
            gameState: mockRoom.gameState,
          }),
        })
      );
    });
  });

  describe('Error Recovery', () => {
    it('should handle state corruption', async () => {
      const interactionId = 'test-interaction';
      const errorDetails = { corruption: 'invalid state' };
      
      // Setup mocks
      (mockRoomManager.pauseRoom as Mock).mockResolvedValue(true);
      (mockRoomManager.resumeRoom as Mock).mockResolvedValue(true);
      
      let errorRecoveryEmitted = false;
      connectionHandler.on('connectionEvent', (event) => {
        if (event.type === 'ERROR_RECOVERY_INITIATED') {
          errorRecoveryEmitted = true;
        }
      });

      await connectionHandler.handleStateCorruption(interactionId, errorDetails);

      expect(errorRecoveryEmitted).toBe(true);
      expect(mockRoomManager.pauseRoom).toHaveBeenCalledWith(
        interactionId,
        'State corruption recovery'
      );
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        interactionId,
        expect.objectContaining({
          type: 'ERROR',
          error: expect.objectContaining({
            code: 'STATE_CORRUPTION',
            message: 'Game state corruption detected. Recovery in progress.',
          }),
        })
      );
    });

    it('should handle concurrent action conflicts', () => {
      const interactionId = 'test-interaction';
      const conflictingActions = [
        { type: 'move', entityId: 'entity-1' },
        { type: 'attack', entityId: 'entity-1' },
      ];

      connectionHandler.handleConcurrentActionConflict(interactionId, conflictingActions, 'first_wins');

      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        interactionId,
        expect.objectContaining({
          type: 'ERROR',
          error: expect.objectContaining({
            code: 'CONCURRENT_ACTION_CONFLICT',
            message: 'Concurrent actions detected. Resolution: first_wins',
          }),
        })
      );
    });
  });

  describe('Connection Management', () => {
    it('should remove connection', () => {
      const userId = 'user-1';
      
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      expect(connectionHandler.getConnectionStatus(userId)).toBeDefined();
      
      connectionHandler.removeConnection(userId);
      expect(connectionHandler.getConnectionStatus(userId)).toBeUndefined();
    });

    it('should get all connection statuses', () => {
      connectionHandler.registerConnection('user-1', 'conn-1', 'test-interaction');
      connectionHandler.registerConnection('user-2', 'conn-2', 'test-interaction');

      const statuses = connectionHandler.getAllConnectionStatuses();
      expect(statuses).toHaveLength(2);
      expect(statuses.map(s => s.userId)).toContain('user-1');
      expect(statuses.map(s => s.userId)).toContain('user-2');
    });

    it('should cleanup all resources', () => {
      connectionHandler.registerConnection('user-1', 'conn-1', 'test-interaction');
      connectionHandler.registerConnection('user-2', 'conn-2', 'test-interaction');

      expect(connectionHandler.getAllConnectionStatuses()).toHaveLength(2);

      connectionHandler.cleanup();

      expect(connectionHandler.getAllConnectionStatuses()).toHaveLength(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit connection events', () => {
      const events: any[] = [];
      connectionHandler.on('connectionEvent', (event) => {
        events.push(event);
      });

      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);

      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      connectionHandler.handleDisconnect(userId, 'Test disconnect');

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'PLAYER_DISCONNECTED',
        userId,
        interactionId: 'test-interaction',
        reason: 'Test disconnect',
      });
    });
  });
});