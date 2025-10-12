export declare const adminMiddleware: import("@trpc/server").TRPCMiddlewareBuilder<import("./context").TRPCContext, object, {
    user: import("./context").AuthenticatedUser;
    req: Request | undefined;
    connectionId: string | undefined;
}, unknown>;
export declare const adminRateLimitMiddleware: import("@trpc/server").TRPCMiddlewareBuilder<import("./context").TRPCContext, object, object, unknown>;
export declare const adminOnlyProcedure: import("@trpc/server").TRPCProcedureBuilder<import("./context").TRPCContext, object, {
    req: Request | undefined;
    user: import("./context").AuthenticatedUser;
    connectionId: string | undefined;
}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
export declare function isAdminUser(userId: string, orgId?: string): boolean;
//# sourceMappingURL=adminAuth.d.ts.map