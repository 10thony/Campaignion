import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCallerFactory } from '@trpc/server';
import { testModeRouter } from '../routers/testMode';
import { Context } from '../middleware/context';
import { TestScenario, LoadTestConfig } from '../types/testMode';

// Mock the TestModeService
vi.mock('../services/TestModeService');
vi.mock('../services/RoomManager');
vi.mock('../services/EventBroadcaster');
vi.mock('../services/GameStateEngine');
vi.mock('../utils/logger');

// Mock admin auth middleware
vi.mock('../middleware/adminAuth', () => ({
  adminOnlyProcedure: {
    input: vi.fn().mockReturnThis(),
    query: vi.fn().mockImplementation((handler) => ({ handler })),
    mutation: vi.fn().mockImplementation((handler) => ({ handler })),
  },
}));

describe('testModeRouter', () => {
  let caller: ReturnType<typeof createCallerFactory>;
  let mockContext: Context;

  beforeEach(() => {
    // Create mock context with admin user
    mockContext = {
      user: {
        userId: 'admin-user-1',
        sessionId: 'session-1',
        orgId: 'org-1',
      },
      connectionId: 'conn-1',
    } as Context;

    // Create caller factory
    const createCaller = createCallerFactory(testModeRouter);
    caller = createCaller(mockContext);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('health', () => {
    it('should return health status', async () => {
      const result = await caller.health();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'test-mode-service',
        availableScenarios: expect.any(Number),
        version: '1.0.0',
      });
    });
  });

  describe('getScenarios', () => {
    it('should return available test scenarios', async () => {
      const result = await caller.getScenarios();

      expect(result).toEqual({
        success: true,
        scenarios: expect.any(Array),
        count: expect.any(Number),
      });
    });
  });

  describe('createTestInteraction', () => {
    it('should create test interaction with valid input', async () => {
      const input = {
        scenarioId: 'basic-combat',
        options: {
          participantCount: 4,
          aiParticipants: 2,
          duration: 30,
        },
      };

      const result = await caller.createTestInteraction(input);

      expect(result).toEqual({
        success: true,
        sessionId: expect.any(String),
        message: 'Test interaction created successfully',
      });
    });

    it('should create test interaction with minimal input', async () => {
      const input = {
        scenarioId: 'basic-combat',
      };

      const result = await caller.createTestInteraction(input);

      expect(result).toEqual({
        success: true,
        sessionId: expect.any(String),
        message: 'Test interaction created successfully',
      });
    });

    it('should validate scenario ID is required', async () => {
      const input = {
        scenarioId: '',
      };

      await expect(caller.createTestInteraction(input)).rejects.toThrow();
    });

    it('should validate participant count limits', async () => {
      const input = {
        scenarioId: 'basic-combat',
        options: {
          participantCount: 25, // Exceeds max of 20
        },
      };

      await expect(caller.createTestInteraction(input)).rejects.toThrow();
    });

    it('should validate AI participant limits', async () => {
      const input = {
        scenarioId: 'basic-combat',
        options: {
          aiParticipants: 15, // Exceeds max of 10
        },
      };

      await expect(caller.createTestInteraction(input)).rejects.toThrow();
    });

    it('should validate duration limits', async () => {
      const input = {
        scenarioId: 'basic-combat',
        options: {
          duration: 300, // Exceeds max of 240 minutes
        },
      };

      await expect(caller.createTestInteraction(input)).rejects.toThrow();
    });
  });

  describe('simulateActions', () => {
    it('should simulate actions with valid input', async () => {
      const input = {
        sessionId: 'test-session-1',
        actions: [
          {
            entityId: 'player1',
            action: {
              type: 'move' as const,
              position: { x: 5, y: 5 },
            },
            delay: 1000,
            probability: 0.8,
          },
          {
            entityId: 'player1',
            action: {
              type: 'attack' as const,
              target: 'orc1',
            },
            delay: 2000,
            probability: 1.0,
          },
        ],
      };

      const result = await caller.simulateActions(input);

      expect(result).toEqual({
        success: true,
        message: 'Action simulation completed successfully',
        actionsExecuted: 2,
      });
    });

    it('should validate session ID is required', async () => {
      const input = {
        sessionId: '',
        actions: [
          {
            entityId: 'player1',
            action: { type: 'move' as const, position: { x: 5, y: 5 } },
            delay: 0,
            probability: 1.0,
          },
        ],
      };

      await expect(caller.simulateActions(input)).rejects.toThrow();
    });

    it('should validate at least one action is required', async () => {
      const input = {
        sessionId: 'test-session-1',
        actions: [],
      };

      await expect(caller.simulateActions(input)).rejects.toThrow();
    });

    it('should validate action delay limits', async () => {
      const input = {
        sessionId: 'test-session-1',
        actions: [
          {
            entityId: 'player1',
            action: { type: 'move' as const, position: { x: 5, y: 5 } },
            delay: 400000, // Exceeds max of 300000ms
            probability: 1.0,
          },
        ],
      };

      await expect(caller.simulateActions(input)).rejects.toThrow();
    });

    it('should validate probability range', async () => {
      const input = {
        sessionId: 'test-session-1',
        actions: [
          {
            entityId: 'player1',
            action: { type: 'move' as const, position: { x: 5, y: 5 } },
            delay: 0,
            probability: 1.5, // Exceeds max of 1.0
          },
        ],
      };

      await expect(caller.simulateActions(input)).rejects.toThrow();
    });
  });

  describe('injectNetworkErrors', () => {
    it('should inject disconnect errors', async () => {
      const input = {
        sessionId: 'test-session-1',
        errorType: 'disconnect' as const,
        options: {
          targetEntityId: 'player1',
          duration: 5000,
        },
      };

      const result = await caller.injectNetworkErrors(input);

      expect(result).toEqual({
        success: true,
        message: 'Network error injected: disconnect',
        errorType: 'disconnect',
        options: input.options,
      });
    });

    it('should inject timeout errors', async () => {
      const input = {
        sessionId: 'test-session-1',
        errorType: 'timeout' as const,
        options: {
          duration: 3000,
        },
      };

      const result = await caller.injectNetworkErrors(input);

      expect(result).toEqual({
        success: true,
        message: 'Network error injected: timeout',
        errorType: 'timeout',
        options: input.options,
      });
    });

    it('should inject packet loss errors', async () => {
      const input = {
        sessionId: 'test-session-1',
        errorType: 'packet_loss' as const,
        options: {
          intensity: 0.1,
          duration: 10000,
        },
      };

      const result = await caller.injectNetworkErrors(input);

      expect(result).toEqual({
        success: true,
        message: 'Network error injected: packet_loss',
        errorType: 'packet_loss',
        options: input.options,
      });
    });

    it('should inject high latency errors', async () => {
      const input = {
        sessionId: 'test-session-1',
        errorType: 'high_latency' as const,
        options: {
          intensity: 1000,
          duration: 15000,
        },
      };

      const result = await caller.injectNetworkErrors(input);

      expect(result).toEqual({
        success: true,
        message: 'Network error injected: high_latency',
        errorType: 'high_latency',
        options: input.options,
      });
    });

    it('should validate session ID is required', async () => {
      const input = {
        sessionId: '',
        errorType: 'disconnect' as const,
      };

      await expect(caller.injectNetworkErrors(input)).rejects.toThrow();
    });

    it('should validate error type', async () => {
      const input = {
        sessionId: 'test-session-1',
        errorType: 'invalid_error' as any,
      };

      await expect(caller.injectNetworkErrors(input)).rejects.toThrow();
    });

    it('should validate duration limits', async () => {
      const input = {
        sessionId: 'test-session-1',
        errorType: 'disconnect' as const,
        options: {
          duration: 70000, // Exceeds max of 60000ms
        },
      };

      await expect(caller.injectNetworkErrors(input)).rejects.toThrow();
    });

    it('should validate intensity range', async () => {
      const input = {
        sessionId: 'test-session-1',
        errorType: 'packet_loss' as const,
        options: {
          intensity: 1.5, // Exceeds max of 1.0
        },
      };

      await expect(caller.injectNetworkErrors(input)).rejects.toThrow();
    });
  });

  describe('validateStateConsistency', () => {
    it('should validate state consistency', async () => {
      const input = {
        sessionId: 'test-session-1',
      };

      const result = await caller.validateStateConsistency(input);

      expect(result).toEqual({
        success: true,
        report: expect.objectContaining({
          valid: expect.any(Boolean),
          errors: expect.any(Array),
          warnings: expect.any(Array),
          summary: expect.objectContaining({
            totalChecks: expect.any(Number),
            passedChecks: expect.any(Number),
            failedChecks: expect.any(Number),
            warningCount: expect.any(Number),
          }),
        }),
      });
    });

    it('should validate session ID is required', async () => {
      const input = {
        sessionId: '',
      };

      await expect(caller.validateStateConsistency(input)).rejects.toThrow();
    });
  });

  describe('runLoadTest', () => {
    it('should run load test with valid configuration', async () => {
      const input: LoadTestConfig = {
        concurrentUsers: 5,
        rampUpTime: 10,
        testDuration: 60,
        actionFrequency: 10,
        scenarios: ['basic-combat'],
        targetMetrics: {
          maxResponseTime: 1000,
          maxErrorRate: 0.05,
          minThroughput: 5,
        },
      };

      const result = await caller.runLoadTest(input);

      expect(result).toEqual({
        success: true,
        testId: expect.any(String),
        message: 'Load test started successfully',
        estimatedDuration: 70, // testDuration + rampUpTime
      });
    });

    it('should validate concurrent users limits', async () => {
      const input: LoadTestConfig = {
        concurrentUsers: 150, // Exceeds max of 100
        rampUpTime: 10,
        testDuration: 60,
        actionFrequency: 10,
        scenarios: ['basic-combat'],
        targetMetrics: {
          maxResponseTime: 1000,
          maxErrorRate: 0.05,
          minThroughput: 5,
        },
      };

      await expect(caller.runLoadTest(input)).rejects.toThrow();
    });

    it('should validate ramp up time limits', async () => {
      const input: LoadTestConfig = {
        concurrentUsers: 5,
        rampUpTime: 400, // Exceeds max of 300
        testDuration: 60,
        actionFrequency: 10,
        scenarios: ['basic-combat'],
        targetMetrics: {
          maxResponseTime: 1000,
          maxErrorRate: 0.05,
          minThroughput: 5,
        },
      };

      await expect(caller.runLoadTest(input)).rejects.toThrow();
    });

    it('should validate test duration limits', async () => {
      const input: LoadTestConfig = {
        concurrentUsers: 5,
        rampUpTime: 10,
        testDuration: 4000, // Exceeds max of 3600
        actionFrequency: 10,
        scenarios: ['basic-combat'],
        targetMetrics: {
          maxResponseTime: 1000,
          maxErrorRate: 0.05,
          minThroughput: 5,
        },
      };

      await expect(caller.runLoadTest(input)).rejects.toThrow();
    });

    it('should validate action frequency limits', async () => {
      const input: LoadTestConfig = {
        concurrentUsers: 5,
        rampUpTime: 10,
        testDuration: 60,
        actionFrequency: 100, // Exceeds max of 60
        scenarios: ['basic-combat'],
        targetMetrics: {
          maxResponseTime: 1000,
          maxErrorRate: 0.05,
          minThroughput: 5,
        },
      };

      await expect(caller.runLoadTest(input)).rejects.toThrow();
    });

    it('should validate at least one scenario is required', async () => {
      const input: LoadTestConfig = {
        concurrentUsers: 5,
        rampUpTime: 10,
        testDuration: 60,
        actionFrequency: 10,
        scenarios: [], // Empty scenarios array
        targetMetrics: {
          maxResponseTime: 1000,
          maxErrorRate: 0.05,
          minThroughput: 5,
        },
      };

      await expect(caller.runLoadTest(input)).rejects.toThrow();
    });
  });

  describe('getTestResults', () => {
    it('should return test results for valid session', async () => {
      const input = {
        sessionId: 'test-session-1',
      };

      const result = await caller.getTestResults(input);

      expect(result).toEqual({
        success: true,
        results: expect.any(Object),
      });
    });

    it('should validate session ID is required', async () => {
      const input = {
        sessionId: '',
      };

      await expect(caller.getTestResults(input)).rejects.toThrow();
    });
  });

  describe('getLoadTestResults', () => {
    it('should return load test results for valid test ID', async () => {
      const input = {
        testId: 'load-test-1',
      };

      const result = await caller.getLoadTestResults(input);

      expect(result).toEqual({
        success: true,
        results: expect.any(Object),
      });
    });

    it('should validate test ID is required', async () => {
      const input = {
        testId: '',
      };

      await expect(caller.getLoadTestResults(input)).rejects.toThrow();
    });
  });

  describe('addTestScenario', () => {
    it('should add test scenario with valid input', async () => {
      const input: TestScenario = {
        id: 'custom-scenario',
        name: 'Custom Test Scenario',
        description: 'A custom scenario for testing',
        type: 'combat',
        participantCount: 4,
        duration: 30,
        entities: [],
        initialState: {
          mapSize: { width: 20, height: 20 },
          terrain: [],
          objectives: [],
          environmentalEffects: [],
          turnTimeLimit: 90,
        },
        expectedOutcomes: [],
        metadata: {
          difficulty: 'medium',
          tags: ['custom', 'test'],
          author: 'admin-user-1',
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        },
      };

      const result = await caller.addTestScenario(input);

      expect(result).toEqual({
        success: true,
        message: 'Test scenario added successfully',
        scenarioId: 'custom-scenario',
      });
    });

    it('should validate scenario ID is required', async () => {
      const input = {
        id: '',
        name: 'Test Scenario',
        description: 'A test scenario',
        type: 'combat' as const,
        participantCount: 4,
        duration: 30,
        entities: [],
        initialState: {},
        expectedOutcomes: [],
        metadata: {},
      };

      await expect(caller.addTestScenario(input as any)).rejects.toThrow();
    });

    it('should validate participant count limits', async () => {
      const input = {
        id: 'test-scenario',
        name: 'Test Scenario',
        description: 'A test scenario',
        type: 'combat' as const,
        participantCount: 25, // Exceeds max of 20
        duration: 30,
        entities: [],
        initialState: {},
        expectedOutcomes: [],
        metadata: {},
      };

      await expect(caller.addTestScenario(input as any)).rejects.toThrow();
    });

    it('should validate duration limits', async () => {
      const input = {
        id: 'test-scenario',
        name: 'Test Scenario',
        description: 'A test scenario',
        type: 'combat' as const,
        participantCount: 4,
        duration: 300, // Exceeds max of 240
        entities: [],
        initialState: {},
        expectedOutcomes: [],
        metadata: {},
      };

      await expect(caller.addTestScenario(input as any)).rejects.toThrow();
    });
  });

  describe('cleanupTestSession', () => {
    it('should cleanup test session', async () => {
      const input = {
        sessionId: 'test-session-1',
      };

      const result = await caller.cleanupTestSession(input);

      expect(result).toEqual({
        success: true,
        message: 'Test session cleaned up successfully',
      });
    });

    it('should validate session ID is required', async () => {
      const input = {
        sessionId: '',
      };

      await expect(caller.cleanupTestSession(input)).rejects.toThrow();
    });
  });
});