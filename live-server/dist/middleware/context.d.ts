import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
export interface AuthenticatedUser {
    userId: string;
    sessionId: string;
    orgId?: string | undefined;
}
export interface TRPCContext {
    user: AuthenticatedUser | null;
    req?: Request;
    connectionId?: string;
}
export declare function createHTTPContext({ req }: CreateExpressContextOptions): Promise<TRPCContext>;
export declare function createWSContext({ req }: CreateWSSContextFnOptions): Promise<TRPCContext>;
export declare function createContext(opts: CreateExpressContextOptions | CreateWSSContextFnOptions): Promise<TRPCContext>;
export type Context = inferAsyncReturnType<typeof createContext>;
//# sourceMappingURL=context.d.ts.map