import { TestScenario } from '../types/testMode';
export declare const testModeRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../middleware").TRPCContext;
    meta: object;
    errorShape: {
        data: {
            zodError: Error | null;
            code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
            httpStatus: number;
            path?: string;
            stack?: string;
        };
        message: string;
        code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
    };
    transformer: import("@trpc/server").DefaultDataTransformer;
}>, {
    health: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        status: string;
        timestamp: string;
        service: string;
        availableScenarios: number;
        version: string;
    }>;
    getScenarios: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: typeof import("@trpc/server").unsetMarker;
        _input_out: typeof import("@trpc/server").unsetMarker;
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        scenarios: TestScenario[];
        count: number;
    }>;
    createTestInteraction: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: {
            scenarioId: string;
            options?: {
                duration?: number | undefined;
                participantCount?: number | undefined;
                aiParticipants?: number | undefined;
                customSettings?: Record<string, any> | undefined;
            } | undefined;
        };
        _input_out: {
            options: {
                duration?: number | undefined;
                participantCount?: number | undefined;
                aiParticipants?: number | undefined;
                customSettings?: Record<string, any> | undefined;
            };
            scenarioId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        sessionId: string;
        message: string;
    }>;
    simulateActions: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: {
            sessionId: string;
            actions: {
                entityId: string;
                action: {
                    type: "end" | "move" | "attack" | "useItem" | "cast" | "interact";
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
        _input_out: {
            sessionId: string;
            actions: {
                entityId: string;
                action: {
                    type: "end" | "move" | "attack" | "useItem" | "cast" | "interact";
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
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        message: string;
        actionsExecuted: number;
    }>;
    injectNetworkErrors: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: {
            sessionId: string;
            errorType: "disconnect" | "timeout" | "packet_loss" | "high_latency";
            options?: {
                duration?: number | undefined;
                targetEntityId?: string | undefined;
                intensity?: number | undefined;
            } | undefined;
        };
        _input_out: {
            sessionId: string;
            options: {
                duration?: number | undefined;
                targetEntityId?: string | undefined;
                intensity?: number | undefined;
            };
            errorType: "disconnect" | "timeout" | "packet_loss" | "high_latency";
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        message: string;
        errorType: "disconnect" | "timeout" | "packet_loss" | "high_latency";
        options: {
            duration?: number | undefined;
            targetEntityId?: string | undefined;
            intensity?: number | undefined;
        };
    }>;
    validateStateConsistency: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: {
            sessionId: string;
        };
        _input_out: {
            sessionId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        report: import("../types/testMode").ValidationReport;
    }>;
    runLoadTest: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: {
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
        _input_out: {
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
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        testId: string;
        message: string;
        estimatedDuration: number;
    }>;
    getTestResults: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: {
            sessionId: string;
        };
        _input_out: {
            sessionId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        results: import("../types/testMode").TestSession;
    }>;
    getLoadTestResults: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: {
            testId: string;
        };
        _input_out: {
            testId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        results: import("../types/testMode").LoadTestResult;
    }>;
    addTestScenario: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: {
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
        _input_out: {
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
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        message: string;
        scenarioId: string;
    }>;
    cleanupTestSession: import("@trpc/server").BuildProcedure<"mutation", {
        _config: import("@trpc/server").RootConfig<{
            ctx: import("../middleware").TRPCContext;
            meta: object;
            errorShape: {
                data: {
                    zodError: Error | null;
                    code: import("@trpc/server/rpc").TRPC_ERROR_CODE_KEY;
                    httpStatus: number;
                    path?: string;
                    stack?: string;
                };
                message: string;
                code: import("@trpc/server/rpc").TRPC_ERROR_CODE_NUMBER;
            };
            transformer: import("@trpc/server").DefaultDataTransformer;
        }>;
        _meta: object;
        _ctx_out: {
            req: Request | undefined;
            user: import("../middleware").AuthenticatedUser;
            connectionId: string | undefined;
        };
        _input_in: {
            sessionId: string;
        };
        _input_out: {
            sessionId: string;
        };
        _output_in: typeof import("@trpc/server").unsetMarker;
        _output_out: typeof import("@trpc/server").unsetMarker;
    }, {
        success: boolean;
        message: string;
    }>;
}>;
//# sourceMappingURL=testMode.d.ts.map