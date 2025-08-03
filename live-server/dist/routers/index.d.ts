export declare const appRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
    interaction: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
            _ctx_out: import("../middleware").TRPCContext;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            status: string;
            timestamp: string;
            service: string;
            stats: {
                totalRooms: number;
                activeRooms: number;
                pausedRooms: number;
                completedRooms: number;
                totalParticipants: number;
                connectedParticipants: number;
                config: Required<import("../services").RoomManagerConfig>;
            };
        }>;
        joinRoom: import("@trpc/server").BuildProcedure<"mutation", {
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
                interactionId: string;
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
            };
            _input_out: {
                interactionId: string;
                entityId: string;
                entityType: "playerCharacter" | "npc" | "monster";
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            roomId: string;
            gameState: import("@campaignion/shared-types").GameState;
            participantCount: number;
        }>;
        leaveRoom: import("@trpc/server").BuildProcedure<"mutation", {
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
                interactionId: string;
            };
            _input_out: {
                interactionId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
        }>;
        pauseInteraction: import("@trpc/server").BuildProcedure<"mutation", {
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
                interactionId: string;
                reason?: string | undefined;
            };
            _input_out: {
                interactionId: string;
                reason: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
            reason: string;
        }>;
        resumeInteraction: import("@trpc/server").BuildProcedure<"mutation", {
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
                interactionId: string;
            };
            _input_out: {
                interactionId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
        }>;
        takeTurn: import("@trpc/server").BuildProcedure<"mutation", {
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
                type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
                entityId: string;
                target?: string | undefined;
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                itemId?: string | undefined;
                spellId?: string | undefined;
                actionId?: string | undefined;
                parameters?: Record<string, any> | undefined;
            };
            _input_out: {
                type: "move" | "attack" | "useItem" | "cast" | "interact" | "end";
                entityId: string;
                target?: string | undefined;
                position?: {
                    x: number;
                    y: number;
                } | undefined;
                itemId?: string | undefined;
                spellId?: string | undefined;
                actionId?: string | undefined;
                parameters?: Record<string, any> | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            result: {
                valid: boolean;
                errors: never[];
            };
            gameState: import("@campaignion/shared-types").GameState;
        }>;
        skipTurn: import("@trpc/server").BuildProcedure<"mutation", {
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
                interactionId: string;
                reason?: string | undefined;
            };
            _input_out: {
                interactionId: string;
                reason: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
            gameState: import("@campaignion/shared-types").GameState;
        }>;
        backtrackTurn: import("@trpc/server").BuildProcedure<"mutation", {
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
                interactionId: string;
                turnNumber: number;
                reason?: string | undefined;
            };
            _input_out: {
                interactionId: string;
                reason: string;
                turnNumber: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: string;
            turnNumber: number;
            reason: string;
        }>;
        roomUpdates: import("@trpc/server").BuildProcedure<"subscription", {
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
                interactionId: string;
            };
            _input_out: {
                interactionId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, import("@trpc/server/observable").Observable<import("@campaignion/shared-types").GameEvent, unknown>>;
        getRoomState: import("@trpc/server").BuildProcedure<"query", {
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
                interactionId: string;
            };
            _input_out: {
                interactionId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            gameState: import("@campaignion/shared-types").GameState;
            roomId: string;
            participantCount: number;
            status: "active" | "paused" | "completed";
        }>;
        sendChatMessage: import("@trpc/server").BuildProcedure<"mutation", {
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
                type: "party" | "dm" | "private";
                interactionId: string;
                content: string;
                entityId?: string | undefined;
                recipients?: string[] | undefined;
            };
            _input_out: {
                type: "party" | "dm" | "private";
                interactionId: string;
                content: string;
                entityId?: string | undefined;
                recipients?: string[] | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            message: import("@campaignion/shared-types").ChatMessage;
        }>;
        getChatHistory: import("@trpc/server").BuildProcedure<"query", {
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
                interactionId: string;
                channelType?: "party" | "dm" | "private" | "system" | undefined;
                limit?: number | undefined;
            };
            _input_out: {
                interactionId: string;
                limit: number;
                channelType?: "party" | "dm" | "private" | "system" | undefined;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            success: boolean;
            messages: import("@campaignion/shared-types").ChatMessage[];
            totalCount: number;
        }>;
    }>;
    testMode: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
            scenarios: import("../types/testMode").TestScenario[];
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
}>;
export type AppRouter = typeof appRouter;
//# sourceMappingURL=index.d.ts.map