export declare const adminMiddleware: import("@trpc/server").MiddlewareBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: import("./context").TRPCContext;
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
    _ctx_out: {};
    _input_out: typeof import("@trpc/server").unsetMarker;
    _input_in: unknown;
    _output_in: unknown;
    _output_out: unknown;
    _meta: object;
}, {
    _config: import("@trpc/server").RootConfig<{
        ctx: import("./context").TRPCContext;
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
    _ctx_out: {
        user: import("./context").AuthenticatedUser;
        req: Request | undefined;
        connectionId: string | undefined;
    };
    _input_in: unknown;
    _input_out: typeof import("@trpc/server").unsetMarker;
    _output_in: unknown;
    _output_out: unknown;
    _meta: object;
}>;
export declare const adminRateLimitMiddleware: import("@trpc/server").MiddlewareBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: import("./context").TRPCContext;
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
    _ctx_out: {};
    _input_out: typeof import("@trpc/server").unsetMarker;
    _input_in: unknown;
    _output_in: unknown;
    _output_out: unknown;
    _meta: object;
}, {
    _config: import("@trpc/server").RootConfig<{
        ctx: import("./context").TRPCContext;
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
    _ctx_out: {};
    _input_out: typeof import("@trpc/server").unsetMarker;
    _input_in: unknown;
    _output_in: unknown;
    _output_out: unknown;
    _meta: object;
}>;
export declare const adminOnlyProcedure: import("@trpc/server").ProcedureBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: import("./context").TRPCContext;
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
        user: import("./context").AuthenticatedUser;
        connectionId: string | undefined;
    };
    _input_in: typeof import("@trpc/server").unsetMarker;
    _input_out: typeof import("@trpc/server").unsetMarker;
    _output_in: typeof import("@trpc/server").unsetMarker;
    _output_out: typeof import("@trpc/server").unsetMarker;
}>;
export declare function isAdminUser(userId: string, orgId?: string): boolean;
//# sourceMappingURL=adminAuth.d.ts.map