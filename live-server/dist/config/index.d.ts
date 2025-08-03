import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodPipeline<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    FRONTEND_URL: z.ZodPipeline<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodString>;
    CLERK_SECRET_KEY: z.ZodString;
    CLERK_PUBLISHABLE_KEY: z.ZodString;
    CONVEX_URL: z.ZodString;
    CONVEX_DEPLOY_KEY: z.ZodOptional<z.ZodString>;
    WS_HEARTBEAT_INTERVAL: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    WS_CONNECTION_TIMEOUT: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    ROOM_INACTIVITY_TIMEOUT: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    MAX_ROOMS_PER_SERVER: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    TURN_TIME_LIMIT: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    RATE_LIMIT_WINDOW: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    RATE_LIMIT_MAX_REQUESTS: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    LOG_LEVEL: z.ZodPipeline<z.ZodDefault<z.ZodOptional<z.ZodString>>, z.ZodEnum<["DEBUG", "INFO", "WARN", "ERROR"]>>;
    MESSAGE_BATCH_SIZE: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    MESSAGE_BATCH_TIMEOUT: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
    CORS_ORIGINS: z.ZodOptional<z.ZodString>;
    ENABLE_HELMET: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, boolean, string | undefined>;
    HEALTH_CHECK_TIMEOUT: z.ZodPipeline<z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, number, string | undefined>, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    LOG_LEVEL: "ERROR" | "WARN" | "INFO" | "DEBUG";
    CLERK_SECRET_KEY: string;
    RATE_LIMIT_WINDOW: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    FRONTEND_URL: string;
    CLERK_PUBLISHABLE_KEY: string;
    CONVEX_URL: string;
    WS_HEARTBEAT_INTERVAL: number;
    WS_CONNECTION_TIMEOUT: number;
    ROOM_INACTIVITY_TIMEOUT: number;
    MAX_ROOMS_PER_SERVER: number;
    TURN_TIME_LIMIT: number;
    MESSAGE_BATCH_SIZE: number;
    MESSAGE_BATCH_TIMEOUT: number;
    ENABLE_HELMET: boolean;
    HEALTH_CHECK_TIMEOUT: number;
    CONVEX_DEPLOY_KEY?: string | undefined;
    CORS_ORIGINS?: string | undefined;
}, {
    CLERK_SECRET_KEY: string;
    CLERK_PUBLISHABLE_KEY: string;
    CONVEX_URL: string;
    LOG_LEVEL?: string | undefined;
    RATE_LIMIT_WINDOW?: string | undefined;
    RATE_LIMIT_MAX_REQUESTS?: string | undefined;
    NODE_ENV?: string | undefined;
    PORT?: string | undefined;
    FRONTEND_URL?: string | undefined;
    CONVEX_DEPLOY_KEY?: string | undefined;
    WS_HEARTBEAT_INTERVAL?: string | undefined;
    WS_CONNECTION_TIMEOUT?: string | undefined;
    ROOM_INACTIVITY_TIMEOUT?: string | undefined;
    MAX_ROOMS_PER_SERVER?: string | undefined;
    TURN_TIME_LIMIT?: string | undefined;
    MESSAGE_BATCH_SIZE?: string | undefined;
    MESSAGE_BATCH_TIMEOUT?: string | undefined;
    CORS_ORIGINS?: string | undefined;
    ENABLE_HELMET?: string | undefined;
    HEALTH_CHECK_TIMEOUT?: string | undefined;
}>;
export type Config = z.infer<typeof envSchema>;
declare class ConfigurationError extends Error {
    details?: any | undefined;
    constructor(message: string, details?: any | undefined);
}
declare let config: Config;
export { config, ConfigurationError };
export declare function isDevelopment(): boolean;
export declare function isProduction(): boolean;
export declare function isTest(): boolean;
export declare function getCorsOrigins(): string[];
export declare function getConvexConfig(): {
    url: string;
    deployKey: string | undefined;
};
export declare function getClerkConfig(): {
    secretKey: string;
    publishableKey: string;
};
export declare function getWebSocketConfig(): {
    heartbeatInterval: number;
    connectionTimeout: number;
};
export declare function getRoomConfig(): {
    inactivityTimeout: number;
    maxRoomsPerServer: number;
    turnTimeLimit: number;
};
export declare function getRateLimitConfig(): {
    window: number;
    maxRequests: number;
};
export declare function getMessageBatchConfig(): {
    batchSize: number;
    batchTimeout: number;
};
//# sourceMappingURL=index.d.ts.map