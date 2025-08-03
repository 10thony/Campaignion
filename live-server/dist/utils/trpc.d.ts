export declare const router: <TProcRouterRecord extends import("@trpc/server").ProcedureRouterRecord>(procedures: TProcRouterRecord) => import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: import("../middleware/context").TRPCContext;
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
}>, TProcRouterRecord>;
export declare const middleware: <TNewParams extends import("@trpc/server").ProcedureParams<import("@trpc/server").AnyRootConfig, unknown, unknown, unknown, unknown, unknown, unknown>>(fn: import("@trpc/server").MiddlewareFunction<{
    _config: import("@trpc/server").RootConfig<{
        ctx: import("../middleware/context").TRPCContext;
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
}, TNewParams>) => import("@trpc/server").MiddlewareBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: import("../middleware/context").TRPCContext;
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
}, TNewParams>;
export declare const publicProcedure: import("@trpc/server").ProcedureBuilder<{
    _config: import("@trpc/server").RootConfig<{
        ctx: import("../middleware/context").TRPCContext;
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
    _ctx_out: import("../middleware/context").TRPCContext;
    _input_in: typeof import("@trpc/server").unsetMarker;
    _input_out: typeof import("@trpc/server").unsetMarker;
    _output_in: typeof import("@trpc/server").unsetMarker;
    _output_out: typeof import("@trpc/server").unsetMarker;
    _meta: object;
}>;
//# sourceMappingURL=trpc.d.ts.map