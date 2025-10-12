export declare const authMiddleware: import("@trpc/server").TRPCMiddlewareBuilder<import("./context").TRPCContext, object, {
    user: import("./context").AuthenticatedUser;
    req: Request | undefined;
    connectionId: string | undefined;
}, unknown>;
export declare const dmMiddleware: import("@trpc/server").TRPCMiddlewareBuilder<import("./context").TRPCContext, object, {
    user: import("./context").AuthenticatedUser;
    req: Request | undefined;
    connectionId: string | undefined;
}, unknown>;
export declare const rateLimitMiddleware: import("@trpc/server").TRPCMiddlewareBuilder<import("./context").TRPCContext, object, object, unknown>;
export declare const protectedProcedure: import("@trpc/server").TRPCProcedureBuilder<import("./context").TRPCContext, object, {
    req: Request | undefined;
    user: import("./context").AuthenticatedUser;
    connectionId: string | undefined;
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
export declare const dmOnlyProcedure: import("@trpc/server").TRPCProcedureBuilder<import("./context").TRPCContext, object, {
    req: Request | undefined;
    user: import("./context").AuthenticatedUser;
    connectionId: string | undefined;
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
//# sourceMappingURL=auth.d.ts.map