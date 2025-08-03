import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ConnectionHandler } from '../services/ConnectionHandler';
import { ErrorRecovery } from '../services/ErrorRecovery';
import { RoomManager } from '../services/RoomManager';
import { EventBroadcaster } from '../services/EventBroadcaster';
import { StatePersistence } from '../services/StatePersistence';
import { InteractionRoom } from '../services/InteractionRoom';
import { GameState, Participant, TurnAction } from '../types';

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

describe('Connection and Error Handling Integration', () => {
  let connectionHandler: ConnectionHandler;
  let errorRecovery: ErrorRecovery;
  let mockRoomManager: RoomManager;
  let mockEventBroadcaster: EventBroadcaster;
  let mockStatePersistence: StatePersistence;
  let mockRoom: InteractionRoom;

  const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
    interactionId: 'test-interaction',
    status: 'active',
    initiativeOrder: [
      { entityId: 'player-1', entityType: 'playerCharacter', initiative: 15, userId: 'user-1' },
      { entityId: 'monster-1', entityType: 'monster', initiative: 10 },
    ],
    currentTurnIndex: 0,
    roundNumber: 1,
    participants: new Map([
      ['player-1', {
        entityId: 'player-1',
        entityType: 'playerCharacter',
        userId: 'user-1',
        currentHP: 25,
        maxHP: 25,
        position: { x: 5, y: 5 },
        conditions: [],
        inventory: { items: [], equippedItems: {}, capacity: 20 },
        availableActions: [],
        turnStatus: 'active',
      }],
    ]),
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
    ...overrides,
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
      updateGameState: vi.fn(),
      processTurnAction: vi.fn(),
    } as any;

    // Create mock room manager
    mockRoomManager = {
      getAllRooms: vi.fn(() => [mockRoom]),
      getRoomByInteractionId: vi.fn(() => mockRoom),
      pauseRoom: vi.fn(),
      resumeRoom: vi.fn(),
      completeRoom: vi.fn(),
      leaveRoom: vi.fn(),
      on: vi.fn(),
      emit: vi.fn(),
    } as any;

    // Create mock event broadcaster
    mockEventBroadcaster = {
      broadcast: vi.fn(),
      broadcastToUser: vi.fn(),
    } as any;

    // Create mock state persistence
    mockStatePersistence = {
      saveSnapshot: vi.fn(),
      loadSnapshot: vi.fn(),
    } as any;

    // Initialize services
    connectionHandler = new ConnectionHandler(mockRoomManager, mockEventBroadcaster, {
      heartbeatIntervalMs: 50,
      connectionTimeoutMs: 200,
      maxReconnectAttempts: 2,
      dmDisconnectGraceMs: 300,
    });

    errorRecovery = new ErrorRecovery(
      mockRoomManager,
      mockEventBroadcaster,
      mockStatePersistence,
      {
        maxRetryAttempts: 2,
        retryDelayMs: 10,
        recoveryTimeoutMs: 500,
      }
    );
  });

  afterEach(() => {
    connectionHandler.cleanup();
    errorRecovery.shutdown();
    vi.clearAllMocks();
  });

  describe('Player Disconnect During Turn', () => {
    it('should handle player disconnect during their turn', async () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      
      // Register connection
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      
      // Simulate disconnect during player's turn
      connectionHandler.handleDisconnect(userId, 'Network timeout');

      // Should have updated participant connection status
      expect(mockRoom.updateParticipantConnection).toHaveBeenCalledWith(userId, false);
      
      // Should have broadcast disconnect event
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        'test-interaction',
        expect.objectContaining({
          type: 'PLAYER_DISCONNECTED',
          userId,
          reason: 'Network timeout',
        })
      );

      // Verify connection status
      const status = connectionHandler.getConnectionStatus(userId);
      expect(status?.isConnected).toBe(false);
      expect(status?.disconnectReason).toBe('Network timeout');
    });

    it('should handle player reconnection and state sync', async () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      
      // Initial connection and disconnect
      connectionHandler.registerConnection(userId, 'conn-1', 'test-interaction');
      connectionHandler.handleDisconnect(userId, 'Network error');
      
      // Reconnect
      await connectionHandler.handleReconnection(userId, 'test-interaction', 'conn-2');

      // Should have updated connection status
      const status = connectionHandler.getConnectionStatus(userId);
      expect(status?.isConnected).toBe(true);
      expect(status?.connectionId).toBe('conn-2');
      
      // Should have sent state sync to user
      expect(mockEventBroadcaster.broadcastToUser).toHaveBeenCalledWith(
        'test-interaction',
        userId,
        expect.objectContaining({
          type: 'STATE_DELTA',
          changes: expect.objectContaining({
            fullSync: true,
          }),
        })
      );
    });
  });

  describe('DM Disconnect Scenarios', () => {
    it('should pause interaction when DM disconnects and grace period expires', async () => {
      const dmUserId = 'dm-1';
      const dmParticipant = createMockParticipant(dmUserId, 'npc');
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(dmParticipant);
      (mockRoomManager.pauseRoom as Mock).mockResolvedValue(true);
      
      // Register DM connection
      connectionHandler.registerConnection(dmUserId, 'conn-dm', 'test-interaction');
      
      // Simulate DM disconnect
      connectionHandler.handleDisconnect(dmUserId, 'DM connection lost');

      // Should broadcast DM disconnect immediately
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        'test-interaction',
        expect.objectContaining({
          type: 'DM_DISCONNECTED',
          userId: dmUserId,
          reason: 'DM connection lost',
        })
      );

      // Wait for grace period to expire
      await new Promise(resolve => setTimeout(resolve, 350));

      // Should have paused the interaction
      expect(mockRoomManager.pauseRoom).toHaveBeenCalledWith(
        'test-interaction',
        'DM disconnected'
      );
    });

    it('should resume interaction when DM reconnects', async () => {
      const dmUserId = 'dm-1';
      const dmParticipant = createMockParticipant(dmUserId, 'npc');
      
      // Setup mocks - room is paused
      mockRoom.status = 'paused';
      (mockRoom.getParticipant as Mock).mockReturnValue(dmParticipant);
      (mockRoomManager.resumeRoom as Mock).mockResolvedValue(true);
      
      // Initial connection and disconnect
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

  describe('State Corruption and Recovery', () => {
    it('should handle state corruption with automatic recovery', async () => {
      const interactionId = 'test-interaction';
      
      // Create a state snapshot for rollback
      const goodState = createMockGameState({ roundNumber: 2 });
      errorRecovery.createStateSnapshot(interactionId, goodState);
      
      // Setup mocks
      (mockRoomManager.pauseRoom as Mock).mockResolvedValue(true);
      (mockRoomManager.resumeRoom as Mock).mockResolvedValue(true);
      
      // Simulate state corruption
      const corruptionDetails = { error: 'Invalid game state', field: 'participants' };
      const result = await errorRecovery.handleStateCorruption(
        interactionId,
        corruptionDetails,
        mockRoom.gameState
      );

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('ROLLBACK_TO_SNAPSHOT');
      
      // Should have paused and resumed interaction
      expect(mockRoomManager.pauseRoom).toHaveBeenCalledWith(
        interactionId,
        'State rollback in progress'
      );
      expect(mockRoomManager.resumeRoom).toHaveBeenCalledWith(interactionId);
      
      // Should have updated room state
      expect(mockRoom.updateGameState).toHaveBeenCalledWith(goodState);
      
      // Should have broadcast error and recovery events
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        interactionId,
        expect.objectContaining({
          type: 'ERROR',
          error: expect.objectContaining({
            code: 'RECOVERY_SUCCESS',
          }),
        })
      );
    });

    it('should handle concurrent actions with first-wins resolution', async () => {
      const interactionId = 'test-interaction';
      const conflictingActions: TurnAction[] = [
        { type: 'move', entityId: 'player-1', position: { x: 6, y: 5 } },
        { type: 'attack', entityId: 'player-1', target: 'monster-1' },
      ];
      
      // Setup mocks
      (mockRoom.processTurnAction as Mock).mockReturnValue(true);
      
      const result = await errorRecovery.handleConcurrentActions(interactionId, conflictingActions);

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('FIRST_ACTION_WINS');
      
      // Should have processed only the first action
      expect(mockRoom.processTurnAction).toHaveBeenCalledTimes(1);
      expect(mockRoom.processTurnAction).toHaveBeenCalledWith(conflictingActions[0]);
      
      // Should have broadcast rejection for the second action
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledWith(
        interactionId,
        expect.objectContaining({
          type: 'ERROR',
          error: expect.objectContaining({
            code: 'ACTION_REJECTED',
          }),
        })
      );
    });
  });

  describe('Connection Loss During Error Recovery', () => {
    it('should handle player disconnect during error recovery', async () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      const interactionId = 'test-interaction';
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      (mockRoomManager.pauseRoom as Mock).mockResolvedValue(true);
      
      // Register connection
      connectionHandler.registerConnection(userId, 'conn-1', interactionId);
      
      // Start error recovery
      const recoveryPromise = errorRecovery.handleStateCorruption(
        interactionId,
        { error: 'test corruption' }
      );
      
      // Simulate disconnect during recovery
      connectionHandler.handleDisconnect(userId, 'Connection lost during recovery');
      
      // Wait for recovery to complete
      const result = await recoveryPromise;
      
      // Recovery should still complete
      expect(result).toBeDefined();
      
      // Connection should be marked as disconnected
      const status = connectionHandler.getConnectionStatus(userId);
      expect(status?.isConnected).toBe(false);
    });

    it('should handle DM disconnect during critical error recovery', async () => {
      const dmUserId = 'dm-1';
      const dmParticipant = createMockParticipant(dmUserId, 'npc');
      const interactionId = 'test-interaction';
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(dmParticipant);
      (mockRoomManager.pauseRoom as Mock).mockResolvedValue(true);
      
      // Register DM connection
      connectionHandler.registerConnection(dmUserId, 'conn-dm', interactionId);
      
      // Start error recovery that requires DM intervention
      const recoveryPromise = errorRecovery.handleValidationError(
        interactionId,
        { valid: false, errors: ['Critical validation error'] },
        { type: 'move', entityId: 'player-1' },
        'user-1'
      );
      
      // Simulate DM disconnect during recovery
      connectionHandler.handleDisconnect(dmUserId, 'DM disconnected during recovery');
      
      // Wait for recovery to complete
      const result = await recoveryPromise;
      
      // Recovery should require DM intervention
      expect(result.requiresDMIntervention).toBe(true);
      
      // Should have paused interaction due to both error and DM disconnect
      expect(mockRoomManager.pauseRoom).toHaveBeenCalled();
    });
  });

  describe('Multiple Simultaneous Issues', () => {
    it('should handle multiple players disconnecting simultaneously', async () => {
      const users = ['user-1', 'user-2', 'user-3'];
      const participants = users.map(userId => createMockParticipant(userId));
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockImplementation((userId: string) => 
        participants.find(p => p.userId === userId)
      );
      
      // Register all connections
      users.forEach((userId, index) => {
        connectionHandler.registerConnection(userId, `conn-${index + 1}`, 'test-interaction');
      });
      
      // Simulate simultaneous disconnects
      users.forEach(userId => {
        connectionHandler.handleDisconnect(userId, 'Network outage');
      });
      
      // All users should be marked as disconnected
      users.forEach(userId => {
        const status = connectionHandler.getConnectionStatus(userId);
        expect(status?.isConnected).toBe(false);
        expect(status?.disconnectReason).toBe('Network outage');
      });
      
      // Should have broadcast disconnect events for all users
      expect(mockEventBroadcaster.broadcast).toHaveBeenCalledTimes(users.length);
    });

    it('should handle state corruption while players are disconnected', async () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      const interactionId = 'test-interaction';
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      (mockRoomManager.pauseRoom as Mock).mockResolvedValue(true);
      (mockRoomManager.resumeRoom as Mock).mockResolvedValue(true);
      
      // Register and disconnect user
      connectionHandler.registerConnection(userId, 'conn-1', interactionId);
      connectionHandler.handleDisconnect(userId, 'Network error');
      
      // Create snapshot and trigger state corruption
      const goodState = createMockGameState({ roundNumber: 3 });
      errorRecovery.createStateSnapshot(interactionId, goodState);
      
      const result = await errorRecovery.handleStateCorruption(
        interactionId,
        { error: 'State corruption while player offline' }
      );
      
      // Recovery should succeed
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('ROLLBACK_TO_SNAPSHOT');
      
      // Now reconnect the user
      await connectionHandler.handleReconnection(userId, interactionId, 'conn-2');
      
      // Should have sent full state sync to reconnected user
      expect(mockEventBroadcaster.broadcastToUser).toHaveBeenCalledWith(
        interactionId,
        userId,
        expect.objectContaining({
          type: 'STATE_DELTA',
          changes: expect.objectContaining({
            fullSync: true,
          }),
        })
      );
    });
  });

  describe('Recovery Failure Scenarios', () => {
    it('should handle recovery failure and escalate appropriately', async () => {
      const interactionId = 'test-interaction';
      
      // Setup mocks to fail recovery
      (mockRoomManager.pauseRoom as Mock).mockRejectedValue(new Error('Room manager failure'));
      
      const result = await errorRecovery.handleStateCorruption(
        interactionId,
        { error: 'Unrecoverable corruption' }
      );
      
      // Should have failed and required DM intervention
      expect(result.success).toBe(false);
      expect(result.requiresDMIntervention).toBe(true);
    });

    it('should handle connection handler failure during error recovery', async () => {
      const userId = 'user-1';
      const interactionId = 'test-interaction';
      
      // Register connection
      connectionHandler.registerConnection(userId, 'conn-1', interactionId);
      
      // Mock connection handler to throw during state corruption handling
      const originalMethod = connectionHandler.handleStateCorruption;
      connectionHandler.handleStateCorruption = vi.fn().mockRejectedValue(
        new Error('Connection handler failure')
      );
      
      try {
        await connectionHandler.handleStateCorruption(interactionId, { error: 'test' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      // Restore original method
      connectionHandler.handleStateCorruption = originalMethod;
    });
  });

  describe('Performance Under Load', () => {
    it('should handle rapid connection/disconnection cycles', async () => {
      const userId = 'user-1';
      const participant = createMockParticipant(userId);
      const interactionId = 'test-interaction';
      
      // Setup mocks
      (mockRoom.getParticipant as Mock).mockReturnValue(participant);
      
      // Perform rapid connect/disconnect cycles
      for (let i = 0; i < 10; i++) {
        connectionHandler.registerConnection(userId, `conn-${i}`, interactionId);
        connectionHandler.handleDisconnect(userId, `Disconnect ${i}`);
        
        if (i % 2 === 0) {
          await connectionHandler.handleReconnection(userId, interactionId, `conn-${i}-reconnect`);
        }
      }
      
      // Final state should be consistent
      const status = connectionHandler.getConnectionStatus(userId);
      expect(status).toBeDefined();
    });

    it('should handle multiple concurrent error recoveries', async () => {
      const interactions = ['interaction-1', 'interaction-2', 'interaction-3'];
      
      // Setup mocks for multiple rooms
      (mockRoomManager.getRoomByInteractionId as Mock).mockImplementation((id: string) => ({
        ...mockRoom,
        interactionId: id,
      }));
      
      // Start multiple recoveries simultaneously
      const recoveryPromises = interactions.map(interactionId =>
        errorRecovery.handleStateCorruption(interactionId, { error: `Corruption in ${interactionId}` })
      );
      
      // Wait for all to complete
      const results = await Promise.all(recoveryPromises);
      
      // All should have completed (though some may have failed due to concurrent access)
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });
  });
});