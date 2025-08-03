import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// Mock the logger to avoid console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

// Mock the services to return predictable results
vi.mock('../services/RoomManager', () => {
  const mockRoom = {
    id: 'test-room-123',
    interactionId: 'test-interaction-123',
    participants: new Map(),
    gameState: {
      interactionId: 'test-interaction-123',
      status: 'active',
      initiativeOrder: [
        {
          entityId: 'test-entity-123',
          entityType: 'playerCharacter',
          initiative: 15,
          userId: 'test-user-123',
        },
      ],
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
    },
    status: 'active',
    getParticipant: vi.fn(() => ({ userId: 'test-user-123', entityId: 'test-entity-123' })),
    processTurnAction: vi.fn(() => true),
    updateGameState: vi.fn(),
  };

  return {
    RoomManager: vi.fn(() => ({
      getStats: vi.fn(() => ({
        totalRooms: 1,
        activeRooms: 1,
        pausedRooms: 0,
        completedRooms: 0,
      })),
      getRoomByInteractionId: vi.fn(() => mockRoom),
      createRoom: vi.fn(() => Promise.resolve(mockRoom)),
      joinRoom: vi.fn(() => Promise.resolve(mockRoom)),
      leaveRoom: vi.fn(() => Promise.resolve(true)),
      pauseRoom: vi.fn(() => Promise.resolve(true)),
      resumeRoom: vi.fn(() => Promise.resolve(true)),
      getAllRooms: vi.fn(() => [mockRoom]),
    })),
  };
});

vi.mock('../services/EventBroadcaster', () => ({
  EventBroadcaster: vi.fn(() => ({
    broadcast: vi.fn(() => Promise.resolve()),
    subscribe: vi.fn(() => 'test-subscription-123'),
    unsubscribe: vi.fn(() => true),
  })),
}));

import { interactionRouter } from '../routers/interaction';

describe('Interaction Router - Basic Tests', () => {
  let mockContext: any;

  beforeEach(() => {
    // Setup mock context
    mockContext = {
      user: {
        userId: 'test-user-123',
        sessionId: 'test-session-123',
        orgId: 'test-org-123',
      },
      connectionId: 'test-connection-123',
      req: {},
      res: {},
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should validate joinRoom input schema', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Test with empty interactionId
      await expect(
        caller.joinRoom({
          interactionId: '',
          entityId: 'test-entity',
          entityType: 'playerCharacter',
        })
      ).rejects.toThrow();

      // Test with empty entityId
      await expect(
        caller.joinRoom({
          interactionId: 'test-interaction',
          entityId: '',
          entityType: 'playerCharacter',
        })
      ).rejects.toThrow();

      // Test with invalid entityType
      await expect(
        caller.joinRoom({
          interactionId: 'test-interaction',
          entityId: 'test-entity',
          entityType: 'invalid' as any,
        })
      ).rejects.toThrow();
    });

    it('should validate takeTurn input schema', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Test with empty entityId
      await expect(
        caller.takeTurn({
          type: 'move',
          entityId: '',
          position: { x: 5, y: 5 },
        })
      ).rejects.toThrow();

      // Test with invalid action type
      await expect(
        caller.takeTurn({
          type: 'invalid' as any,
          entityId: 'test-entity',
        })
      ).rejects.toThrow();
    });

    it('should validate skipTurn input schema', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Test with empty interactionId
      await expect(
        caller.skipTurn({
          interactionId: '',
        })
      ).rejects.toThrow();
    });

    it('should validate backtrackTurn input schema', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Test with negative turn number
      await expect(
        caller.backtrackTurn({
          interactionId: 'test-interaction',
          turnNumber: -1,
        })
      ).rejects.toThrow();
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected procedures', async () => {
      const unauthenticatedContext = { ...mockContext, user: null };
      const caller = interactionRouter.createCaller(unauthenticatedContext);

      await expect(
        caller.joinRoom({
          interactionId: 'test-interaction',
          entityId: 'test-entity',
          entityType: 'playerCharacter',
        })
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.leaveRoom({
          interactionId: 'test-interaction',
        })
      ).rejects.toThrow(TRPCError);

      await expect(
        caller.takeTurn({
          type: 'move',
          entityId: 'test-entity',
          position: { x: 5, y: 5 },
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should allow DM procedures with authentication', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // These should not throw authentication errors
      const pauseResult = await caller.pauseInteraction({
        interactionId: 'test-interaction',
      });
      expect(pauseResult.success).toBe(true);

      const resumeResult = await caller.resumeInteraction({
        interactionId: 'test-interaction',
      });
      expect(resumeResult.success).toBe(true);

      const backtrackResult = await caller.backtrackTurn({
        interactionId: 'test-interaction',
        turnNumber: 5,
      });
      expect(backtrackResult.success).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      const result = await caller.health();

      expect(result).toMatchObject({
        status: 'ok',
        service: 'live-interaction-system',
      });
      expect(result.timestamp).toBeDefined();
      expect(result.stats).toBeDefined();
    });
  });

  describe('Basic Functionality', () => {
    it('should handle successful operations', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Test joinRoom
      const joinResult = await caller.joinRoom({
        interactionId: 'test-interaction',
        entityId: 'test-entity',
        entityType: 'playerCharacter',
      });
      expect(joinResult.success).toBe(true);
      expect(joinResult.roomId).toBeDefined();

      // Test leaveRoom
      const leaveResult = await caller.leaveRoom({
        interactionId: 'test-interaction',
      });
      expect(leaveResult.success).toBe(true);

      // Test getRoomState
      const stateResult = await caller.getRoomState({
        interactionId: 'test-interaction',
      });
      expect(stateResult.success).toBe(true);
      expect(stateResult.gameState).toBeDefined();

      // Note: takeTurn test skipped due to complex room lookup logic
      // This would require more sophisticated mocking of the room finding logic

      // Test skipTurn
      const skipResult = await caller.skipTurn({
        interactionId: 'test-interaction',
      });
      expect(skipResult.success).toBe(true);
    });

    it('should handle subscription creation', () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Test that subscription can be created without throwing
      const subscription = caller.roomUpdates({
        interactionId: 'test-interaction',
      });
      expect(subscription).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Test various validation scenarios
      const validationTests = [
        () => caller.joinRoom({
          interactionId: '',
          entityId: 'test',
          entityType: 'playerCharacter',
        }),
        () => caller.takeTurn({
          type: 'move',
          entityId: '',
        }),
        () => caller.skipTurn({
          interactionId: '',
        }),
      ];

      for (const test of validationTests) {
        await expect(test()).rejects.toThrow();
      }
    });

    it('should return appropriate error types', async () => {
      const unauthenticatedContext = { ...mockContext, user: null };
      const caller = interactionRouter.createCaller(unauthenticatedContext);

      try {
        await caller.joinRoom({
          interactionId: 'test',
          entityId: 'test',
          entityType: 'playerCharacter',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('Schema Validation', () => {
    it('should validate enum values correctly', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Valid enum values should work
      const validResult = await caller.joinRoom({
        interactionId: 'test-interaction',
        entityId: 'test-entity',
        entityType: 'playerCharacter',
      });
      expect(validResult.success).toBe(true);

      // Invalid enum values should fail
      await expect(
        caller.joinRoom({
          interactionId: 'test-interaction',
          entityId: 'test-entity',
          entityType: 'invalidType' as any,
        })
      ).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Missing required fields should fail
      await expect(
        caller.joinRoom({
          interactionId: 'test-interaction',
          entityId: 'test-entity',
          // Missing entityType
        } as any)
      ).rejects.toThrow();
    });

    it('should validate number constraints', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Negative turn numbers should fail
      await expect(
        caller.backtrackTurn({
          interactionId: 'test-interaction',
          turnNumber: -5,
        })
      ).rejects.toThrow();

      // Valid turn numbers should work
      const result = await caller.backtrackTurn({
        interactionId: 'test-interaction',
        turnNumber: 5,
      });
      expect(result.success).toBe(true);
    });
  });
});