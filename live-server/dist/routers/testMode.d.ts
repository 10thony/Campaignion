import { TestScenario } from '../types/testMode';
export declare const testModeRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../middleware").TRPCContext;
    meta: object;
    errorShape: {
        data: {
            zodError: Error | null;
            code: import("@trpc/server").TRPC_ERROR_CODE_KEY;
            httpStatus: number;
            path?: string;
            stack?: string;
        };
        message: string;
        code: import("@trpc/server").TRPC_ERROR_CODE_NUMBER;
    };
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    health: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            status: string;
            timestamp: string;
            service: string;
            availableScenarios: number;
            version: string;
        };
        meta: object;
    }>;
    getScenarios: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            success: boolean;
            scenarios: TestScenario[];
            count: number;
        };
        meta: object;
    }>;
    createTestInteraction: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            scenarioId: string;
            options?: {
                duration?: number | undefined;
                participantCount?: number | undefined;
                aiParticipants?: number | undefined;
                customSettings?: Record<string, any> | undefined;
            } | undefined;
        };
        output: {
            success: boolean;
            sessionId: string;
            message: string;
        };
        meta: object;
    }>;
    simulateActions: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            actions: {
                entityId: string;
                action: {
                    type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
                    target?: string | undefined;
                    position?: {
                        x: number;
                        y: number;
                    } | undefined;
                    itemId?: string | undefined;
                    spellId?: string | undefined;
                    parameters?: Record<string, any> | undefined;
                };
                delay: number;
                probability: number;
            }[];
        };
        output: {
            success: boolean;
            message: string;
            actionsExecuted: number;
        };
        meta: object;
    }>;
    injectNetworkErrors: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
            errorType: "disconnect" | "timeout" | "packet_loss" | "high_latency";
            options?: {
                duration?: number | undefined;
                targetEntityId?: string | undefined;
                intensity?: number | undefined;
            } | undefined;
        };
        output: {
            success: boolean;
            message: string;
            errorType: "disconnect" | "timeout" | "packet_loss" | "high_latency";
            options: {
                duration?: number | undefined;
                targetEntityId?: string | undefined;
                intensity?: number | undefined;
            };
        };
        meta: object;
    }>;
    validateStateConsistency: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
        };
        output: {
            success: boolean;
            report: import("../types/testMode").ValidationReport;
        };
        meta: object;
    }>;
    runLoadTest: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            concurrentUsers: number;
            rampUpTime: number;
            testDuration: number;
            actionFrequency: number;
            scenarios: string[];
            targetMetrics: {
                maxResponseTime: number;
                maxErrorRate: number;
                minThroughput: number;
            };
        };
        output: {
            success: boolean;
            testId: string;
            message: string;
            estimatedDuration: number;
        };
        meta: object;
    }>;
    getTestResults: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            sessionId: string;
        };
        output: {
            success: boolean;
            results: import("../types/testMode").TestSession;
        };
        meta: object;
    }>;
    getLoadTestResults: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            testId: string;
        };
        output: {
            success: boolean;
            results: import("../types/testMode").LoadTestResult;
        };
        meta: object;
    }>;
    addTestScenario: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            duration: number;
            description: string;
            type: "combat" | "social" | "puzzle" | "mixed";
            participantCount: number;
            id: string;
            name: string;
            entities: any[];
            expectedOutcomes: any[];
            initialState?: any;
            metadata?: any;
        };
        output: {
            success: boolean;
            message: string;
            scenarioId: string;
        };
        meta: object;
    }>;
    cleanupTestSession: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            sessionId: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
}>>;
//# sourceMappingURL=testMode.d.ts.map