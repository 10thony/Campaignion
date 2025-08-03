import { GameState, GameEvent } from '../types';
export declare const interactionRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
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
            config: Required<import("../services/RoomManager").RoomManagerConfig>;
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
        gameState: GameState;
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
        gameState: GameState;
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
        gameState: GameState;
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
    }, import("@trpc/server/observable").Observable<GameEvent, unknown>>;
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
        gameState: GameState;
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
        message: import("../schemas").ChatMessage;
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
        messages: import("../schemas").ChatMessage[];
        totalCount: number;
    }>;
}>;
//# sourceMappingURL=interaction.d.ts.map