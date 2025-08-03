"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testModeRouter = void 0;
const zod_1 = require("zod");
const server_1 = require("@trpc/server");
const trpc_1 = require("../utils/trpc");
const adminAuth_1 = require("../middleware/adminAuth");
const logger_1 = require("../utils/logger");
const TestModeService_1 = require("../services/TestModeService");
const RoomManager_1 = require("../services/RoomManager");
const EventBroadcaster_1 = require("../services/EventBroadcaster");
const GameStateEngine_1 = require("../services/GameStateEngine");
let testModeService = null;
function getTestModeService() {
    if (!testModeService) {
        const roomManager = new RoomManager_1.RoomManager();
        const eventBroadcaster = new EventBroadcaster_1.EventBroadcaster();
        const gameStateEngine = new GameStateEngine_1.GameStateEngine();
        testModeService = new TestModeService_1.TestModeService(roomManager, eventBroadcaster, gameStateEngine);
    }
    return testModeService;
}
const TestScenarioSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    type: zod_1.z.enum(['combat', 'social', 'puzzle', 'mixed']),
    participantCount: zod_1.z.number().min(1).max(20),
    duration: zod_1.z.number().min(1).max(240),
    entities: zod_1.z.array(zod_1.z.any()),
    initialState: zod_1.z.any(),
    expectedOutcomes: zod_1.z.array(zod_1.z.any()),
    metadata: zod_1.z.any(),
});
const SimulatedActionSchema = zod_1.z.object({
    entityId: zod_1.z.string().min(1),
    action: zod_1.z.object({
        type: zod_1.z.enum(['move', 'attack', 'useItem', 'cast', 'interact', 'end']),
        target: zod_1.z.string().optional(),
        position: zod_1.z.object({
            x: zod_1.z.number(),
            y: zod_1.z.number(),
        }).optional(),
        itemId: zod_1.z.string().optional(),
        spellId: zod_1.z.string().optional(),
        parameters: zod_1.z.record(zod_1.z.any()).optional(),
    }),
    delay: zod_1.z.number().min(0).max(300000),
    probability: zod_1.z.number().min(0).max(1),
});
const LoadTestConfigSchema = zod_1.z.object({
    concurrentUsers: zod_1.z.number().min(1).max(100),
    rampUpTime: zod_1.z.number().min(1).max(300),
    testDuration: zod_1.z.number().min(10).max(3600),
    actionFrequency: zod_1.z.number().min(1).max(60),
    scenarios: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    targetMetrics: zod_1.z.object({
        maxResponseTime: zod_1.z.number().min(1),
        maxErrorRate: zod_1.z.number().min(0).max(1),
        minThroughput: zod_1.z.number().min(0),
    }),
});
exports.testModeRouter = (0, trpc_1.router)({
    health: adminAuth_1.adminOnlyProcedure
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
    getScenarios: adminAuth_1.adminOnlyProcedure
        .query(async ({ ctx }) => {
        try {
            logger_1.logger.info('Admin requesting test scenarios', {
                userId: ctx.user.userId,
            });
            const service = getTestModeService();
            const scenarios = service.getAvailableScenarios();
            return {
                success: true,
                scenarios,
                count: scenarios.length,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get test scenarios', {
                userId: ctx.user.userId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve test scenarios',
            });
        }
    }),
    createTestInteraction: adminAuth_1.adminOnlyProcedure
        .input(zod_1.z.object({
        scenarioId: zod_1.z.string().min(1, 'Scenario ID is required'),
        options: zod_1.z.object({
            participantCount: zod_1.z.number().min(1).max(20).optional(),
            aiParticipants: zod_1.z.number().min(0).max(10).optional(),
            duration: zod_1.z.number().min(1).max(240).optional(),
            customSettings: zod_1.z.record(zod_1.z.any()).optional(),
        }).optional().default({}),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('Admin creating test interaction', {
                userId: ctx.user.userId,
                scenarioId: input.scenarioId,
                options: input.options,
            });
            const service = getTestModeService();
            const sessionId = await service.createTestInteraction(input.scenarioId, ctx.user.userId, input.options);
            logger_1.logger.info('Test interaction created successfully', {
                userId: ctx.user.userId,
                sessionId,
                scenarioId: input.scenarioId,
            });
            return {
                success: true,
                sessionId,
                message: 'Test interaction created successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create test interaction', {
                userId: ctx.user.userId,
                scenarioId: input.scenarioId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to create test interaction',
            });
        }
    }),
    simulateActions: adminAuth_1.adminOnlyProcedure
        .input(zod_1.z.object({
        sessionId: zod_1.z.string().min(1, 'Session ID is required'),
        actions: zod_1.z.array(SimulatedActionSchema).min(1, 'At least one action is required'),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('Admin starting action simulation', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
                actionCount: input.actions.length,
            });
            const service = getTestModeService();
            await service.simulatePlayerActions(input.sessionId, input.actions);
            logger_1.logger.info('Action simulation completed successfully', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
                actionCount: input.actions.length,
            });
            return {
                success: true,
                message: 'Action simulation completed successfully',
                actionsExecuted: input.actions.length,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to simulate player actions', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to simulate player actions',
            });
        }
    }),
    injectNetworkErrors: adminAuth_1.adminOnlyProcedure
        .input(zod_1.z.object({
        sessionId: zod_1.z.string().min(1, 'Session ID is required'),
        errorType: zod_1.z.enum(['disconnect', 'timeout', 'packet_loss', 'high_latency']),
        options: zod_1.z.object({
            targetEntityId: zod_1.z.string().optional(),
            duration: zod_1.z.number().min(100).max(60000).optional(),
            intensity: zod_1.z.number().min(0).max(1).optional(),
        }).optional().default({}),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('Admin injecting network errors', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
                errorType: input.errorType,
                options: input.options,
            });
            const service = getTestModeService();
            await service.injectNetworkErrors(input.sessionId, input.errorType, input.options);
            logger_1.logger.info('Network errors injected successfully', {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to inject network errors', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
                errorType: input.errorType,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to inject network errors',
            });
        }
    }),
    validateStateConsistency: adminAuth_1.adminOnlyProcedure
        .input(zod_1.z.object({
        sessionId: zod_1.z.string().min(1, 'Session ID is required'),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('Admin validating state consistency', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
            });
            const service = getTestModeService();
            const report = await service.validateStateConsistency(input.sessionId);
            logger_1.logger.info('State consistency validation completed', {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to validate state consistency', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to validate state consistency',
            });
        }
    }),
    runLoadTest: adminAuth_1.adminOnlyProcedure
        .input(LoadTestConfigSchema)
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('Admin starting load test', {
                userId: ctx.user.userId,
                config: input,
            });
            const service = getTestModeService();
            const testId = await service.runLoadTest(input);
            logger_1.logger.info('Load test started successfully', {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to start load test', {
                userId: ctx.user.userId,
                config: input,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to start load test',
            });
        }
    }),
    getTestResults: adminAuth_1.adminOnlyProcedure
        .input(zod_1.z.object({
        sessionId: zod_1.z.string().min(1, 'Session ID is required'),
    }))
        .query(async ({ input, ctx }) => {
        try {
            logger_1.logger.debug('Admin requesting test results', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
            });
            const service = getTestModeService();
            const results = service.getTestResults(input.sessionId);
            if (!results) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Test session not found',
                });
            }
            return {
                success: true,
                results,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get test results', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve test results',
            });
        }
    }),
    getLoadTestResults: adminAuth_1.adminOnlyProcedure
        .input(zod_1.z.object({
        testId: zod_1.z.string().min(1, 'Test ID is required'),
    }))
        .query(async ({ input, ctx }) => {
        try {
            logger_1.logger.debug('Admin requesting load test results', {
                userId: ctx.user.userId,
                testId: input.testId,
            });
            const service = getTestModeService();
            const results = service.getLoadTestResults(input.testId);
            if (!results) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Load test results not found',
                });
            }
            return {
                success: true,
                results,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get load test results', {
                userId: ctx.user.userId,
                testId: input.testId,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve load test results',
            });
        }
    }),
    addTestScenario: adminAuth_1.adminOnlyProcedure
        .input(TestScenarioSchema)
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('Admin adding test scenario', {
                userId: ctx.user.userId,
                scenarioId: input.id,
                scenarioName: input.name,
                scenarioType: input.type,
            });
            const service = getTestModeService();
            service.addTestScenario(input);
            logger_1.logger.info('Test scenario added successfully', {
                userId: ctx.user.userId,
                scenarioId: input.id,
                scenarioName: input.name,
            });
            return {
                success: true,
                message: 'Test scenario added successfully',
                scenarioId: input.id,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to add test scenario', {
                userId: ctx.user.userId,
                scenarioId: input.id,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to add test scenario',
            });
        }
    }),
    cleanupTestSession: adminAuth_1.adminOnlyProcedure
        .input(zod_1.z.object({
        sessionId: zod_1.z.string().min(1, 'Session ID is required'),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('Admin cleaning up test session', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
            });
            const service = getTestModeService();
            await service.cleanupTestSession(input.sessionId);
            logger_1.logger.info('Test session cleaned up successfully', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
            });
            return {
                success: true,
                message: 'Test session cleaned up successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup test session', {
                userId: ctx.user.userId,
                sessionId: input.sessionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to cleanup test session',
            });
        }
    }),
});
//# sourceMappingURL=testMode.js.map