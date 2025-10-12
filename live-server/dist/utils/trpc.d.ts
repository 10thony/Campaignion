export declare const router: import("@trpc/server").TRPCRouterBuilder<{
    ctx: import("../middleware/context").TRPCContext;
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
}>;
export declare const middleware: <$ContextOverrides>(fn: import("@trpc/server").TRPCMiddlewareFunction<import("../middleware/context").TRPCContext, object, object, $ContextOverrides, unknown>) => import("@trpc/server").TRPCMiddlewareBuilder<import("../middleware/context").TRPCContext, object, $ContextOverrides, unknown>;
export declare const publicProcedure: import("@trpc/server").TRPCProcedureBuilder<import("../middleware/context").TRPCContext, object, object, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
//# sourceMappingURL=trpc.d.ts.map