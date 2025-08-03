import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestModeService } from '../services/TestModeService';
import { RoomManager } from '../services/RoomManager';
import { EventBroadcaster } from '../services/EventBroadcaster';
import { GameStateEngine } from '../services/GameStateEngine';
import {
  TestScenario,
  SimulatedAction,
  LoadTestConfig,
  NetworkErrorType,
} from '../types/testMode';

// Mock dependencies
vi.mock('../services/RoomManager');
vi.mock('../services/EventBroadcaster');
vi.mock('../services/GameStateEngine');
vi.mock('../utils/logger');

describe('TestModeService', () => {
  let testModeService: TestModeService;
  let mockRoomManager: vi.Mocked<RoomManager>;
  let mockEventBroadcaster: vi.Mocked<EventBroadcaster>;
  let mockGameStateEngine: vi.Mocked<GameStateEngine>;

  beforeEach(() => {
    mockRoomManager = new RoomManager() as any;
    mockEventBroadcaster = new EventBroadcaster() as any;
    mockGameStateEngine = new GameStateEngine() as any;

    // Mock room manager methods
    mockRoomManager.createRoom = vi.fn().mockResolvedValue({
      id: 'test-room-1',
      interactionId: 'test_session-1',
      participants: new Map(),
      gameState: {
        interactionId: 'test_session-1',
        status: 'waiting',
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
      },
      lastActivity: new Date(),
      status: 'active',
    });

    mockRoomManager.getRoomByInteractionId = vi.fn().mockReturnValue(null);
    mockRoomManager.getAllRooms = vi.fn().mockReturnValue([]);
    mockRoomManager.joinRoom = vi.fn().mockResolvedValue(undefined);
    mockRoomManager.leaveRoom = vi.fn().mockResolvedValue(true);

    testModeService = new TestModeService(
      mockRoomManager,
      mockEventBroadcaster,
      mockGameStateEngine
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createTestInteraction', () => {
    it('should create a test interaction with default scenario', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(mockRoomManager.createRoom).toHaveBeenCalledOnce();
    });

    it('should create a test interaction with AI participants', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1',
        { aiParticipants: 2 }
      );

      expect(sessionId).toBeDefined();
      expect(mockRoomManager.createRoom).toHaveBeenCalledOnce();
      
      const testResults = testModeService.getTestResults(sessionId);
      expect(testResults).toBeDefined();
      expect(testResults?.participants).toHaveLength(2);
    });

    it('should throw error for invalid scenario', async () => {
      await expect(
        testModeService.createTestInteraction('invalid-scenario', 'admin-user-1')
      ).rejects.toThrow('Test scenario not found: invalid-scenario');
    });
  });

  describe('simulatePlayerActions', () => {
    it('should execute simulated actions successfully', async () => {
      // Create a test session first
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      // Mock room with processTurnAction method
      const mockRoom = {
        id: 'test-room-1',
        interactionId: `test_${sessionId}`,
        processTurnAction: vi.fn().mockReturnValue(true),
        gameState: {
          participants: new Map([['player1', { entityId: 'player1' }]]),
        },
      };

      mockRoomManager.getRoomByInteractionId.mockReturnValue(mockRoom as any);

      const actions: SimulatedAction[] = [
        {
          entityId: 'player1',
          action: {
            type: 'move',
            position: { x: 5, y: 5 },
          },
          delay: 0,
          probability: 1.0,
        },
        {
          entityId: 'player1',
          action: {
            type: 'attack',
            target: 'orc1',
          },
          delay: 1000,
          probability: 0.8,
        },
      ];

      await testModeService.simulatePlayerActions(sessionId, actions);

      // Should have attempted to execute actions
      expect(mockRoom.processTurnAction).toHaveBeenCalled();
    });

    it('should handle action execution failures gracefully', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      // Mock room that throws error
      const mockRoom = {
        id: 'test-room-1',
        interactionId: `test_${sessionId}`,
        processTurnAction: vi.fn().mockImplementation(() => {
          throw new Error('Action validation failed');
        }),
        gameState: {
          participants: new Map([['player1', { entityId: 'player1' }]]),
        },
      };

      mockRoomManager.getRoomByInteractionId.mockReturnValue(mockRoom as any);

      const actions: SimulatedAction[] = [
        {
          entityId: 'player1',
          action: { type: 'move', position: { x: 5, y: 5 } },
          delay: 0,
          probability: 1.0,
        },
      ];

      await expect(
        testModeService.simulatePlayerActions(sessionId, actions)
      ).rejects.toThrow();

      const testResults = testModeService.getTestResults(sessionId);
      expect(testResults?.status).toBe('failed');
    });

    it('should skip actions based on probability', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      const mockRoom = {
        id: 'test-room-1',
        interactionId: `test_${sessionId}`,
        processTurnAction: vi.fn().mockReturnValue(true),
        gameState: {
          participants: new Map([['player1', { entityId: 'player1' }]]),
        },
      };

      mockRoomManager.getRoomByInteractionId.mockReturnValue(mockRoom as any);

      // Mock Math.random to always return 0.9 (higher than probability)
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.9);

      const actions: SimulatedAction[] = [
        {
          entityId: 'player1',
          action: { type: 'move', position: { x: 5, y: 5 } },
          delay: 0,
          probability: 0.5, // Should be skipped since random > probability
        },
      ];

      await testModeService.simulatePlayerActions(sessionId, actions);

      // Action should not have been executed
      expect(mockRoom.processTurnAction).not.toHaveBeenCalled();

      // Restore Math.random
      Math.random = originalRandom;
    });
  });

  describe('injectNetworkErrors', () => {
    it('should inject disconnect errors', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      await testModeService.injectNetworkErrors(
        sessionId,
        'disconnect' as NetworkErrorType,
        { targetEntityId: 'player1', duration: 5000 }
      );

      const testResults = testModeService.getTestResults(sessionId);
      expect(testResults?.logs).toContainEqual(
        expect.objectContaining({
          category: 'network',
          message: 'Simulating disconnect',
        })
      );
    });

    it('should inject timeout errors', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      await testModeService.injectNetworkErrors(
        sessionId,
        'timeout' as NetworkErrorType,
        { duration: 3000 }
      );

      const testResults = testModeService.getTestResults(sessionId);
      expect(testResults?.logs).toContainEqual(
        expect.objectContaining({
          category: 'network',
          message: 'Simulating timeout',
        })
      );
    });

    it('should inject packet loss errors', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      await testModeService.injectNetworkErrors(
        sessionId,
        'packet_loss' as NetworkErrorType,
        { intensity: 0.1, duration: 10000 }
      );

      const testResults = testModeService.getTestResults(sessionId);
      expect(testResults?.logs).toContainEqual(
        expect.objectContaining({
          category: 'network',
          message: 'Simulating packet loss',
        })
      );
    });

    it('should inject high latency errors', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      await testModeService.injectNetworkErrors(
        sessionId,
        'high_latency' as NetworkErrorType,
        { intensity: 1000, duration: 15000 }
      );

      const testResults = testModeService.getTestResults(sessionId);
      expect(testResults?.logs).toContainEqual(
        expect.objectContaining({
          category: 'network',
          message: 'Simulating high latency',
        })
      );
    });

    it('should throw error for unknown network error type', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      await expect(
        testModeService.injectNetworkErrors(
          sessionId,
          'unknown_error' as NetworkErrorType
        )
      ).rejects.toThrow('Unknown network error type: unknown_error');
    });
  });

  describe('validateStateConsistency', () => {
    it('should validate state consistency successfully', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      // Mock a valid room state
      const mockRoom = {
        id: 'test-room-1',
        interactionId: `test_${sessionId}`,
        gameState: {
          participants: new Map([
            ['player1', { entityId: 'player1' }],
            ['orc1', { entityId: 'orc1' }],
          ]),
          initiativeOrder: [
            { entityId: 'player1', initiative: 15 },
            { entityId: 'orc1', initiative: 12 },
          ],
          currentTurnIndex: 0,
          mapState: {
            entities: new Map([
              ['player1', { entityId: 'player1', position: { x: 1, y: 1 } }],
              ['orc1', { entityId: 'orc1', position: { x: 8, y: 8 } }],
            ]),
          },
        },
      };

      mockRoomManager.getAllRooms.mockReturnValue([mockRoom as any]);

      // Mock session with matching participant count
      const testResults = testModeService.getTestResults(sessionId);
      if (testResults) {
        testResults.participants = [
          { id: 'p1', type: 'human', entityId: 'player1', isConnected: true },
          { id: 'p2', type: 'ai', entityId: 'orc1', isConnected: true },
        ];
      }

      const report = await testModeService.validateStateConsistency(sessionId);

      expect(report.valid).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.summary.passedChecks).toBeGreaterThan(0);
    });

    it('should detect participant count mismatch', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      // Mock room with mismatched participant count
      const mockRoom = {
        id: 'test-room-1',
        interactionId: `test_${sessionId}`,
        gameState: {
          participants: new Map([
            ['player1', { entityId: 'player1' }],
          ]), // Only 1 participant
          initiativeOrder: [
            { entityId: 'player1', initiative: 15 },
            { entityId: 'orc1', initiative: 12 },
          ],
          currentTurnIndex: 0,
          mapState: {
            entities: new Map(),
          },
        },
      };

      mockRoomManager.getAllRooms.mockReturnValue([mockRoom as any]);

      // Mock session with 2 participants
      const testResults = testModeService.getTestResults(sessionId);
      if (testResults) {
        testResults.participants = [
          { id: 'p1', type: 'human', entityId: 'player1', isConnected: true },
          { id: 'p2', type: 'ai', entityId: 'orc1', isConnected: true },
        ];
      }

      const report = await testModeService.validateStateConsistency(sessionId);

      expect(report.valid).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: 'state_inconsistency',
          message: 'Participant count mismatch between game state and session',
        })
      );
    });

    it('should detect turn index out of bounds', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      // Mock room with invalid turn index
      const mockRoom = {
        id: 'test-room-1',
        interactionId: `test_${sessionId}`,
        gameState: {
          participants: new Map([
            ['player1', { entityId: 'player1' }],
          ]),
          initiativeOrder: [
            { entityId: 'player1', initiative: 15 },
          ],
          currentTurnIndex: 5, // Out of bounds
          mapState: {
            entities: new Map(),
          },
        },
      };

      mockRoomManager.getAllRooms.mockReturnValue([mockRoom as any]);

      const report = await testModeService.validateStateConsistency(sessionId);

      expect(report.valid).toBe(false);
      expect(report.errors).toContainEqual(
        expect.objectContaining({
          type: 'state_inconsistency',
          message: 'Current turn index out of bounds',
        })
      );
    });
  });

  describe('runLoadTest', () => {
    it('should run load test successfully', async () => {
      const config: LoadTestConfig = {
        concurrentUsers: 2,
        rampUpTime: 5,
        testDuration: 10,
        actionFrequency: 6, // 6 actions per minute
        scenarios: ['basic-combat'],
        targetMetrics: {
          maxResponseTime: 1000,
          maxErrorRate: 0.1,
          minThroughput: 1,
        },
      };

      const testId = await testModeService.runLoadTest(config);

      expect(testId).toBeDefined();
      expect(typeof testId).toBe('string');

      // Should have created test sessions
      expect(mockRoomManager.createRoom).toHaveBeenCalled();

      const results = testModeService.getLoadTestResults(testId);
      expect(results).toBeDefined();
      expect(results?.config).toEqual(config);
    });

    it('should handle load test with multiple scenarios', async () => {
      // Add another scenario
      const customScenario: TestScenario = {
        id: 'custom-test',
        name: 'Custom Test Scenario',
        description: 'A custom test scenario',
        type: 'combat',
        participantCount: 2,
        duration: 10,
        entities: [],
        initialState: {
          mapSize: { width: 10, height: 10 },
          terrain: [],
          objectives: [],
          environmentalEffects: [],
          turnTimeLimit: 90,
        },
        expectedOutcomes: [],
        metadata: {
          difficulty: 'easy',
          tags: ['test'],
          author: 'test',
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        },
      };

      testModeService.addTestScenario(customScenario);

      const config: LoadTestConfig = {
        concurrentUsers: 1,
        rampUpTime: 2,
        testDuration: 5,
        actionFrequency: 12,
        scenarios: ['basic-combat', 'custom-test'],
        targetMetrics: {
          maxResponseTime: 1000,
          maxErrorRate: 0.1,
          minThroughput: 1,
        },
      };

      const testId = await testModeService.runLoadTest(config);

      expect(testId).toBeDefined();
      
      const results = testModeService.getLoadTestResults(testId);
      expect(results?.totalUsers).toBe(2); // 1 user per scenario
    });
  });

  describe('scenario management', () => {
    it('should return available scenarios', () => {
      const scenarios = testModeService.getAvailableScenarios();

      expect(scenarios).toHaveLength(1); // Default basic-combat scenario
      expect(scenarios[0].id).toBe('basic-combat');
      expect(scenarios[0].name).toBe('Basic Combat Encounter');
    });

    it('should add new test scenario', () => {
      const newScenario: TestScenario = {
        id: 'social-encounter',
        name: 'Social Encounter Test',
        description: 'A test scenario for social interactions',
        type: 'social',
        participantCount: 3,
        duration: 20,
        entities: [],
        initialState: {
          mapSize: { width: 15, height: 15 },
          terrain: [],
          objectives: [],
          environmentalEffects: [],
          turnTimeLimit: 120,
        },
        expectedOutcomes: [],
        metadata: {
          difficulty: 'medium',
          tags: ['social', 'roleplay'],
          author: 'test-admin',
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        },
      };

      testModeService.addTestScenario(newScenario);

      const scenarios = testModeService.getAvailableScenarios();
      expect(scenarios).toHaveLength(2);
      expect(scenarios.find(s => s.id === 'social-encounter')).toBeDefined();
    });
  });

  describe('session cleanup', () => {
    it('should cleanup test session successfully', async () => {
      const sessionId = await testModeService.createTestInteraction(
        'basic-combat',
        'admin-user-1'
      );

      await testModeService.cleanupTestSession(sessionId);

      const testResults = testModeService.getTestResults(sessionId);
      expect(testResults?.status).toBe('completed');
      expect(testResults?.endTime).toBeDefined();
    });

    it('should handle cleanup of non-existent session gracefully', async () => {
      await expect(
        testModeService.cleanupTestSession('non-existent-session')
      ).resolves.not.toThrow();
    });
  });
});