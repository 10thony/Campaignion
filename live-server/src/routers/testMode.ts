import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router } from '../utils/trpc';
import { adminOnlyProcedure } from '../middleware/adminAuth';
import { logger } from '../utils/logger';
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

// Global test mode service instance
let testModeService: TestModeService | null = null;

function getTestModeService(): TestModeService {
  if (!testModeService) {
    // In a production environment, these would be injected via dependency injection
    const roomManager = new RoomManager();
    const eventBroadcaster = new EventBroadcaster();
    const gameStateEngine = new GameStateEngine();
    
    testModeService = new TestModeService(roomManager, eventBroadcaster, gameStateEngine);
  }
  return testModeService;
}

// Zod schemas for validation
const TestScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  type: z.enum(['combat', 'social', 'puzzle', 'mixed']),
  participantCount: z.number().min(1).max(20),
  duration: z.number().min(1).max(240), // max 4 hours
  entities: z.array(z.any()), // Simplified for now
  initialState: z.any(), // Simplified for now
  expectedOutcomes: z.array(z.any()), // Simplified for now
  metadata: z.any(), // Simplified for now
});

const SimulatedActionSchema = z.object({
  entityId: z.string().min(1),
  action: z.object({
    type: z.enum(['move', 'attack', 'useItem', 'cast', 'interact', 'end']),
    target: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
    itemId: z.string().optional(),
    spellId: z.string().optional(),
    parameters: z.record(z.any()).optional(),
  }),
  delay: z.number().min(0).max(300000), // max 5 minutes delay
  probability: z.number().min(0).max(1),
});

const LoadTestConfigSchema = z.object({
  concurrentUsers: z.number().min(1).max(100),
  rampUpTime: z.number().min(1).max(300), // max 5 minutes
  testDuration: z.number().min(10).max(3600), // 10 seconds to 1 hour
  actionFrequency: z.number().min(1).max(60), // actions per minute
  scenarios: z.array(z.string().min(1)).min(1),
  targetMetrics: z.object({
    maxResponseTime: z.number().min(1),
    maxErrorRate: z.number().min(0).max(1),
    minThroughput: z.number().min(0),
  }),
});

/**
 * Test Mode router for admin-only testing functionality
 * Provides comprehensive testing capabilities for the live interaction system
 */
export const testModeRouter = router({
  /**
   * Health check for test mode service
   */
  health: adminOnlyProcedure
    .query(() => {
      const service = getTestModeService();
      const scenarios = service.getAvailableScenarios();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'test-mode-service',
        availableScenarios: scenarios.length,
        version: '1.0.0',
      };
    }),

  /**
   * Get all available test scenarios
   */
  getScenarios: adminOnlyProcedure
    .query(async ({ ctx }) => {
      try {
        logger.info('Admin requesting test scenarios', {
          userId: ctx.user.userId,
        });

        const service = getTestModeService();
        const scenarios = service.getAvailableScenarios();

        return {
          success: true,
          scenarios,
          count: scenarios.length,
        };

      } catch (error) {
        logger.error('Failed to get test scenarios', {
          userId: ctx.user.userId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve test scenarios',
        });
      }
    }),

  /**
   * Create a new test interaction
   */
  createTestInteraction: adminOnlyProcedure
    .input(z.object({
      scenarioId: z.string().min(1, 'Scenario ID is required'),
      options: z.object({
        participantCount: z.number().min(1).max(20).optional(),
        aiParticipants: z.number().min(0).max(10).optional(),
        duration: z.number().min(1).max(240).optional(), // minutes
        customSettings: z.record(z.any()).optional(),
      }).optional().default({}),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Admin creating test interaction', {
          userId: ctx.user.userId,
          scenarioId: input.scenarioId,
          options: input.options,
        });

        const service = getTestModeService();
        const sessionId = await service.createTestInteraction(
          input.scenarioId,
          ctx.user.userId,
          input.options
        );

        logger.info('Test interaction created successfully', {
          userId: ctx.user.userId,
          sessionId,
          scenarioId: input.scenarioId,
        });

        return {
          success: true,
          sessionId,
          message: 'Test interaction created successfully',
        };

      } catch (error) {
        logger.error('Failed to create test interaction', {
          userId: ctx.user.userId,
          scenarioId: input.scenarioId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create test interaction',
        });
      }
    }),

  /**
   * Simulate player actions for automated testing
   */
  simulateActions: adminOnlyProcedure
    .input(z.object({
      sessionId: z.string().min(1, 'Session ID is required'),
      actions: z.array(SimulatedActionSchema).min(1, 'At least one action is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Admin starting action simulation', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          actionCount: input.actions.length,
        });

        const service = getTestModeService();
        await service.simulatePlayerActions(input.sessionId, input.actions);

        logger.info('Action simulation completed successfully', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          actionCount: input.actions.length,
        });

        return {
          success: true,
          message: 'Action simulation completed successfully',
          actionsExecuted: input.actions.length,
        };

      } catch (error) {
        logger.error('Failed to simulate player actions', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to simulate player actions',
        });
      }
    }),

  /**
   * Inject network errors for testing error handling
   */
  injectNetworkErrors: adminOnlyProcedure
    .input(z.object({
      sessionId: z.string().min(1, 'Session ID is required'),
      errorType: z.enum(['disconnect', 'timeout', 'packet_loss', 'high_latency']),
      options: z.object({
        targetEntityId: z.string().optional(),
        duration: z.number().min(100).max(60000).optional(), // 100ms to 1 minute
        intensity: z.number().min(0).max(1).optional(), // 0-1 for packet loss, or latency in ms
      }).optional().default({}),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Admin injecting network errors', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          errorType: input.errorType,
          options: input.options,
        });

        const service = getTestModeService();
        await service.injectNetworkErrors(
          input.sessionId,
          input.errorType as NetworkErrorType,
          input.options
        );

        logger.info('Network errors injected successfully', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          errorType: input.errorType,
        });

        return {
          success: true,
          message: `Network error injected: ${input.errorType}`,
          errorType: input.errorType,
          options: input.options,
        };

      } catch (error) {
        logger.error('Failed to inject network errors', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          errorType: input.errorType,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to inject network errors',
        });
      }
    }),

  /**
   * Validate state consistency
   */
  validateStateConsistency: adminOnlyProcedure
    .input(z.object({
      sessionId: z.string().min(1, 'Session ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Admin validating state consistency', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
        });

        const service = getTestModeService();
        const report = await service.validateStateConsistency(input.sessionId);

        logger.info('State consistency validation completed', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          valid: report.valid,
          errorCount: report.errors.length,
          warningCount: report.warnings.length,
        });

        return {
          success: true,
          report,
        };

      } catch (error) {
        logger.error('Failed to validate state consistency', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to validate state consistency',
        });
      }
    }),

  /**
   * Run load testing
   */
  runLoadTest: adminOnlyProcedure
    .input(LoadTestConfigSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Admin starting load test', {
          userId: ctx.user.userId,
          config: input,
        });

        const service = getTestModeService();
        const testId = await service.runLoadTest(input);

        logger.info('Load test started successfully', {
          userId: ctx.user.userId,
          testId,
          concurrentUsers: input.concurrentUsers,
          duration: input.testDuration,
        });

        return {
          success: true,
          testId,
          message: 'Load test started successfully',
          estimatedDuration: input.testDuration + input.rampUpTime,
        };

      } catch (error) {
        logger.error('Failed to start load test', {
          userId: ctx.user.userId,
          config: input,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to start load test',
        });
      }
    }),

  /**
   * Get test session results
   */
  getTestResults: adminOnlyProcedure
    .input(z.object({
      sessionId: z.string().min(1, 'Session ID is required'),
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.debug('Admin requesting test results', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
        });

        const service = getTestModeService();
        const results = service.getTestResults(input.sessionId);

        if (!results) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Test session not found',
          });
        }

        return {
          success: true,
          results,
        };

      } catch (error) {
        logger.error('Failed to get test results', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve test results',
        });
      }
    }),

  /**
   * Get load test results
   */
  getLoadTestResults: adminOnlyProcedure
    .input(z.object({
      testId: z.string().min(1, 'Test ID is required'),
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.debug('Admin requesting load test results', {
          userId: ctx.user.userId,
          testId: input.testId,
        });

        const service = getTestModeService();
        const results = service.getLoadTestResults(input.testId);

        if (!results) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Load test results not found',
          });
        }

        return {
          success: true,
          results,
        };

      } catch (error) {
        logger.error('Failed to get load test results', {
          userId: ctx.user.userId,
          testId: input.testId,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve load test results',
        });
      }
    }),

  /**
   * Add a new test scenario
   */
  addTestScenario: adminOnlyProcedure
    .input(TestScenarioSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Admin adding test scenario', {
          userId: ctx.user.userId,
          scenarioId: input.id,
          scenarioName: input.name,
          scenarioType: input.type,
        });

        const service = getTestModeService();
        service.addTestScenario(input as TestScenario);

        logger.info('Test scenario added successfully', {
          userId: ctx.user.userId,
          scenarioId: input.id,
          scenarioName: input.name,
        });

        return {
          success: true,
          message: 'Test scenario added successfully',
          scenarioId: input.id,
        };

      } catch (error) {
        logger.error('Failed to add test scenario', {
          userId: ctx.user.userId,
          scenarioId: input.id,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to add test scenario',
        });
      }
    }),

  /**
   * Clean up a test session
   */
  cleanupTestSession: adminOnlyProcedure
    .input(z.object({
      sessionId: z.string().min(1, 'Session ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Admin cleaning up test session', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
        });

        const service = getTestModeService();
        await service.cleanupTestSession(input.sessionId);

        logger.info('Test session cleaned up successfully', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
        });

        return {
          success: true,
          message: 'Test session cleaned up successfully',
        };

      } catch (error) {
        logger.error('Failed to cleanup test session', {
          userId: ctx.user.userId,
          sessionId: input.sessionId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to cleanup test session',
        });
      }
    }),
});