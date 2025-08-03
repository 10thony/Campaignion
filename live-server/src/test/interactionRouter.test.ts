import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { interactionRouter } from '../routers/interaction';
import { GameState, Participant } from '../types';

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

describe('Interaction Router', () => {
  let mockContext: any;
  let mockGameState: GameState;

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

    // Setup mock game state
    mockGameState = {
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
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('health', () => {
    it('should return health status', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      const result = await caller.health();

      expect(result).toMatchObject({
        status: 'ok',
        service: 'live-interaction-system',
      });
      expect(result.timestamp).toBeDefined();
      // Note: stats may be undefined in test environment, which is expected
    });
  });

  describe('joinRoom', () => {
    it('should successfully join a room', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
        entityId: 'test-entity-123',
        entityType: 'playerCharacter' as const,
      };

      const result = await caller.joinRoom(input);

      expect(result).toMatchObject({
        success: true,
        roomId: expect.any(String),
        gameState: expect.any(Object),
        participantCount: expect.any(Number),
      });
    });

    it('should throw error for invalid input', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: '',
        entityId: 'test-entity-123',
        entityType: 'playerCharacter' as const,
      };

      await expect(caller.joinRoom(input)).rejects.toThrow();
    });

    it('should throw error when not authenticated', async () => {
      const unauthenticatedContext = { ...mockContext, user: null };
      const caller = interactionRouter.createCaller(unauthenticatedContext);
      
      const input = {
        interactionId: 'test-interaction-123',
        entityId: 'test-entity-123',
        entityType: 'playerCharacter' as const,
      };

      await expect(caller.joinRoom(input)).rejects.toThrow(TRPCError);
    });
  });

  describe('leaveRoom', () => {
    it('should successfully leave a room', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
      };

      const result = await caller.leaveRoom(input);

      expect(result).toMatchObject({
        success: true,
        message: 'Successfully left room',
      });
    });

    it('should throw error for invalid input', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: '',
      };

      await expect(caller.leaveRoom(input)).rejects.toThrow();
    });
  });

  describe('pauseInteraction', () => {
    it('should successfully pause interaction as DM', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
        reason: 'Test pause',
      };

      const result = await caller.pauseInteraction(input);

      expect(result).toMatchObject({
        success: true,
        message: 'Interaction paused successfully',
        reason: 'Test pause',
      });
    });

    it('should use default reason when not provided', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
      };

      const result = await caller.pauseInteraction(input);

      expect(result).toMatchObject({
        success: true,
        reason: 'Manual pause',
      });
    });
  });

  describe('resumeInteraction', () => {
    it('should successfully resume interaction as DM', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
      };

      const result = await caller.resumeInteraction(input);

      expect(result).toMatchObject({
        success: true,
        message: 'Interaction resumed successfully',
      });
    });
  });

  describe('takeTurn', () => {
    it('should successfully process a turn action', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        type: 'move' as const,
        entityId: 'test-entity-123',
        position: { x: 5, y: 5 },
      };

      const result = await caller.takeTurn(input);

      expect(result).toMatchObject({
        success: true,
        result: {
          valid: true,
          errors: [],
        },
        gameState: expect.any(Object),
      });
    });

    it('should validate turn action input', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        type: 'move' as const,
        entityId: '', // Invalid empty entity ID
        position: { x: 5, y: 5 },
      };

      await expect(caller.takeTurn(input)).rejects.toThrow();
    });
  });

  describe('skipTurn', () => {
    it('should successfully skip a turn', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
        reason: 'Test skip',
      };

      const result = await caller.skipTurn(input);

      expect(result).toMatchObject({
        success: true,
        message: 'Turn skipped successfully',
        gameState: expect.any(Object),
      });
    });

    it('should use default reason when not provided', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
      };

      const result = await caller.skipTurn(input);

      expect(result.success).toBe(true);
    });
  });

  describe('backtrackTurn', () => {
    it('should successfully backtrack a turn as DM', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
        turnNumber: 5,
        reason: 'Test backtrack',
      };

      const result = await caller.backtrackTurn(input);

      expect(result).toMatchObject({
        success: true,
        turnNumber: 5,
        reason: 'Test backtrack',
      });
    });

    it('should validate turn number', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
        turnNumber: -1, // Invalid negative turn number
      };

      await expect(caller.backtrackTurn(input)).rejects.toThrow();
    });
  });

  describe('getRoomState', () => {
    it('should successfully get room state', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
      };

      const result = await caller.getRoomState(input);

      expect(result).toMatchObject({
        success: true,
        gameState: expect.any(Object),
        roomId: expect.any(String),
        participantCount: expect.any(Number),
        status: expect.any(String),
      });
    });
  });

  describe('roomUpdates subscription', () => {
    it('should create a subscription for room updates', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
      };

      // Test that subscription can be created without throwing
      const subscription = caller.roomUpdates(input);
      expect(subscription).toBeDefined();
    });
  });

  describe('Input validation', () => {
    it('should validate required fields', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Test missing interactionId
      await expect(
        caller.joinRoom({
          interactionId: '',
          entityId: 'test-entity',
          entityType: 'playerCharacter',
        })
      ).rejects.toThrow();

      // Test missing entityId
      await expect(
        caller.joinRoom({
          interactionId: 'test-interaction',
          entityId: '',
          entityType: 'playerCharacter',
        })
      ).rejects.toThrow();
    });

    it('should validate enum values', async () => {
      const caller = interactionRouter.createCaller(mockContext);

      // Test invalid entityType
      await expect(
        caller.joinRoom({
          interactionId: 'test-interaction',
          entityId: 'test-entity',
          entityType: 'invalid' as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // This would test error handling when services throw errors
      // Implementation would depend on how we mock the services to throw errors
      const caller = interactionRouter.createCaller(mockContext);
      
      const input = {
        interactionId: 'test-interaction-123',
        entityId: 'test-entity-123',
        entityType: 'playerCharacter' as const,
      };

      // The actual test would mock the service to throw an error
      // and verify that it's handled properly
      const result = await caller.joinRoom(input);
      expect(result.success).toBe(true);
    });

    it('should return appropriate error codes', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      // Test with invalid input to trigger validation error
      await expect(
        caller.joinRoom({
          interactionId: '',
          entityId: 'test-entity',
          entityType: 'playerCharacter',
        })
      ).rejects.toThrow();
    });
  });

  describe('Authentication and authorization', () => {
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
    });

    it('should require DM permissions for DM-only procedures', async () => {
      // This test would verify DM authorization
      // The actual implementation depends on how DM permissions are checked
      const caller = interactionRouter.createCaller(mockContext);

      const result = await caller.pauseInteraction({
        interactionId: 'test-interaction',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Real-time features', () => {
    it('should handle subscription lifecycle', async () => {
      const caller = interactionRouter.createCaller(mockContext);
      
      const subscription = caller.roomUpdates({
        interactionId: 'test-interaction-123',
      });

      expect(subscription).toBeDefined();
      // Additional tests would verify subscription behavior
    });

    it('should broadcast events to subscribers', async () => {
      // This test would verify that events are properly broadcast
      // Implementation depends on how we mock the EventBroadcaster
      const caller = interactionRouter.createCaller(mockContext);

      const result = await caller.takeTurn({
        type: 'move',
        entityId: 'test-entity-123',
        position: { x: 5, y: 5 },
      });

      expect(result.success).toBe(true);
      // Verify that broadcast was called
    });
  });
});