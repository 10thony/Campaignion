/**
 * API-related Zod schemas for runtime validation
 * These schemas provide validation for API responses, errors, and client-server communication
 */
import { z } from 'zod';
export declare const ConnectionStatusSchema: z.ZodEnum<["connecting", "connected", "disconnected", "reconnecting", "error"]>;
export declare const ApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        stack: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }>>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    success: boolean;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    data?: any;
}, {
    timestamp: number;
    success: boolean;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    data?: any;
}>;
export declare const ApiErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    stack: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    message: string;
    details?: Record<string, any> | undefined;
    stack?: string | undefined;
}, {
    code: string;
    message: string;
    details?: Record<string, any> | undefined;
    stack?: string | undefined;
}>;
export declare const AuthContextSchema: z.ZodObject<{
    userId: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
    connectionId: z.ZodOptional<z.ZodString>;
    permissions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    userId: string;
    permissions: string[];
    connectionId?: string | undefined;
    sessionId?: string | undefined;
}, {
    userId: string;
    permissions: string[];
    connectionId?: string | undefined;
    sessionId?: string | undefined;
}>;
export declare const UserPermissionsSchema: z.ZodObject<{
    canJoinInteraction: z.ZodBoolean;
    canControlEntity: z.ZodBoolean;
    canSendChat: z.ZodBoolean;
    canUseDMControls: z.ZodBoolean;
    canAccessTestMode: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    canJoinInteraction: boolean;
    canControlEntity: boolean;
    canSendChat: boolean;
    canUseDMControls: boolean;
    canAccessTestMode: boolean;
}, {
    canJoinInteraction: boolean;
    canControlEntity: boolean;
    canSendChat: boolean;
    canUseDMControls: boolean;
    canAccessTestMode: boolean;
}>;
export declare const RoomStatsSchema: z.ZodObject<{
    activeRooms: z.ZodNumber;
    totalParticipants: z.ZodNumber;
    uptime: z.ZodNumber;
    averageRoomSize: z.ZodNumber;
    peakConcurrentUsers: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    activeRooms: number;
    totalParticipants: number;
    uptime: number;
    averageRoomSize: number;
    peakConcurrentUsers: number;
}, {
    activeRooms: number;
    totalParticipants: number;
    uptime: number;
    averageRoomSize: number;
    peakConcurrentUsers: number;
}>;
export declare const RoomMetadataSchema: z.ZodObject<{
    id: z.ZodString;
    interactionId: z.ZodString;
    createdAt: z.ZodDate;
    lastActivity: z.ZodDate;
    participantCount: z.ZodNumber;
    status: z.ZodEnum<["active", "paused", "completed"]>;
    dmUserId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "completed" | "paused";
    id: string;
    interactionId: string;
    lastActivity: Date;
    createdAt: Date;
    participantCount: number;
    dmUserId?: string | undefined;
}, {
    status: "active" | "completed" | "paused";
    id: string;
    interactionId: string;
    lastActivity: Date;
    createdAt: Date;
    participantCount: number;
    dmUserId?: string | undefined;
}>;
export declare const SubscriptionOptionsSchema: z.ZodObject<{
    interactionId: z.ZodString;
    eventTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    userId: z.ZodOptional<z.ZodString>;
    reconnectOnError: z.ZodOptional<z.ZodBoolean>;
    maxReconnectAttempts: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    interactionId: string;
    userId?: string | undefined;
    eventTypes?: string[] | undefined;
    reconnectOnError?: boolean | undefined;
    maxReconnectAttempts?: number | undefined;
}, {
    interactionId: string;
    userId?: string | undefined;
    eventTypes?: string[] | undefined;
    reconnectOnError?: boolean | undefined;
    maxReconnectAttempts?: number | undefined;
}>;
export declare const SubscriptionStatusSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["connecting", "connected", "disconnected", "reconnecting", "error"]>;
    lastEvent: z.ZodOptional<z.ZodDate>;
    reconnectAttempts: z.ZodNumber;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        stack: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "connecting" | "connected" | "disconnected" | "reconnecting" | "error";
    id: string;
    reconnectAttempts: number;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    lastEvent?: Date | undefined;
}, {
    status: "connecting" | "connected" | "disconnected" | "reconnecting" | "error";
    id: string;
    reconnectAttempts: number;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    lastEvent?: Date | undefined;
}>;
export declare const BatchOperationSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    data: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    data?: any;
}, {
    type: string;
    id: string;
    data?: any;
}>;
export declare const BatchRequestSchema: z.ZodObject<{
    operations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        data: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        type: string;
        id: string;
        data?: any;
    }, {
        type: string;
        id: string;
        data?: any;
    }>, "many">;
    transactional: z.ZodOptional<z.ZodBoolean>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    operations: {
        type: string;
        id: string;
        data?: any;
    }[];
    timeout?: number | undefined;
    transactional?: boolean | undefined;
}, {
    operations: {
        type: string;
        id: string;
        data?: any;
    }[];
    timeout?: number | undefined;
    transactional?: boolean | undefined;
}>;
export declare const BatchOperationResultSchema: z.ZodObject<{
    id: z.ZodString;
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        stack: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    success: boolean;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    data?: any;
}, {
    id: string;
    success: boolean;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    } | undefined;
    data?: any;
}>;
export declare const BatchResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    results: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        success: z.ZodBoolean;
        data: z.ZodOptional<z.ZodAny>;
        error: z.ZodOptional<z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            stack: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        }, {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        success: boolean;
        error?: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        } | undefined;
        data?: any;
    }, {
        id: string;
        success: boolean;
        error?: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        } | undefined;
        data?: any;
    }>, "many">;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        stack: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }, {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    results: {
        id: string;
        success: boolean;
        error?: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        } | undefined;
        data?: any;
    }[];
    errors?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }[] | undefined;
}, {
    success: boolean;
    results: {
        id: string;
        success: boolean;
        error?: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        } | undefined;
        data?: any;
    }[];
    errors?: {
        code: string;
        message: string;
        details?: Record<string, any> | undefined;
        stack?: string | undefined;
    }[] | undefined;
}>;
export declare const RateLimitInfoSchema: z.ZodObject<{
    limit: z.ZodNumber;
    remaining: z.ZodNumber;
    resetTime: z.ZodDate;
    retryAfter: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    remaining: number;
    resetTime: Date;
    retryAfter?: number | undefined;
}, {
    limit: number;
    remaining: number;
    resetTime: Date;
    retryAfter?: number | undefined;
}>;
export declare const RateLimitErrorSchema: z.ZodObject<{
    code: z.ZodString;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    stack: z.ZodOptional<z.ZodString>;
} & {
    rateLimitInfo: z.ZodObject<{
        limit: z.ZodNumber;
        remaining: z.ZodNumber;
        resetTime: z.ZodDate;
        retryAfter: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        remaining: number;
        resetTime: Date;
        retryAfter?: number | undefined;
    }, {
        limit: number;
        remaining: number;
        resetTime: Date;
        retryAfter?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    rateLimitInfo: {
        limit: number;
        remaining: number;
        resetTime: Date;
        retryAfter?: number | undefined;
    };
    code: string;
    message: string;
    details?: Record<string, any> | undefined;
    stack?: string | undefined;
}, {
    rateLimitInfo: {
        limit: number;
        remaining: number;
        resetTime: Date;
        retryAfter?: number | undefined;
    };
    code: string;
    message: string;
    details?: Record<string, any> | undefined;
    stack?: string | undefined;
}>;
export declare const HealthCheckSchema: z.ZodObject<{
    name: z.ZodString;
    status: z.ZodEnum<["pass", "fail", "warn"]>;
    message: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status: "pass" | "fail" | "warn";
    name: string;
    message?: string | undefined;
    duration?: number | undefined;
    details?: Record<string, any> | undefined;
}, {
    status: "pass" | "fail" | "warn";
    name: string;
    message?: string | undefined;
    duration?: number | undefined;
    details?: Record<string, any> | undefined;
}>;
export declare const HealthStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
    timestamp: z.ZodString;
    service: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
    uptime: z.ZodNumber;
    checks: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<["pass", "fail", "warn"]>;
        message: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        status: "pass" | "fail" | "warn";
        name: string;
        message?: string | undefined;
        duration?: number | undefined;
        details?: Record<string, any> | undefined;
    }, {
        status: "pass" | "fail" | "warn";
        name: string;
        message?: string | undefined;
        duration?: number | undefined;
        details?: Record<string, any> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    uptime: number;
    service: string;
    checks: {
        status: "pass" | "fail" | "warn";
        name: string;
        message?: string | undefined;
        duration?: number | undefined;
        details?: Record<string, any> | undefined;
    }[];
    version?: string | undefined;
}, {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    uptime: number;
    service: string;
    checks: {
        status: "pass" | "fail" | "warn";
        name: string;
        message?: string | undefined;
        duration?: number | undefined;
        details?: Record<string, any> | undefined;
    }[];
    version?: string | undefined;
}>;
export declare const PaginationOptionsSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    filter: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    filter?: Record<string, any> | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    filter?: Record<string, any> | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const PaginatedResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodAny, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    data: any[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}, {
    data: any[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare const WebSocketMessageSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    data: z.ZodAny;
    timestamp: z.ZodNumber;
    userId: z.ZodOptional<z.ZodString>;
    interactionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    timestamp: number;
    userId?: string | undefined;
    interactionId?: string | undefined;
    data?: any;
}, {
    type: string;
    id: string;
    timestamp: number;
    userId?: string | undefined;
    interactionId?: string | undefined;
    data?: any;
}>;
export declare const WebSocketErrorSchema: z.ZodObject<{
    code: z.ZodNumber;
    message: z.ZodString;
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    code: number;
    message: string;
    data?: any;
}, {
    code: number;
    message: string;
    data?: any;
}>;
export declare const ClientConfigSchema: z.ZodObject<{
    serverUrl: z.ZodString;
    wsUrl: z.ZodString;
    authProvider: z.ZodEnum<["clerk", "custom"]>;
    reconnectOptions: z.ZodObject<{
        enabled: z.ZodBoolean;
        maxAttempts: z.ZodNumber;
        delay: z.ZodNumber;
        backoff: z.ZodEnum<["linear", "exponential"]>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoff: "linear" | "exponential";
    }, {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoff: "linear" | "exponential";
    }>;
    timeout: z.ZodObject<{
        connection: z.ZodNumber;
        request: z.ZodNumber;
        subscription: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        connection: number;
        request: number;
        subscription: number;
    }, {
        connection: number;
        request: number;
        subscription: number;
    }>;
}, "strip", z.ZodTypeAny, {
    timeout: {
        connection: number;
        request: number;
        subscription: number;
    };
    serverUrl: string;
    wsUrl: string;
    authProvider: "clerk" | "custom";
    reconnectOptions: {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoff: "linear" | "exponential";
    };
}, {
    timeout: {
        connection: number;
        request: number;
        subscription: number;
    };
    serverUrl: string;
    wsUrl: string;
    authProvider: "clerk" | "custom";
    reconnectOptions: {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoff: "linear" | "exponential";
    };
}>;
export declare const ServerConfigSchema: z.ZodObject<{
    port: z.ZodNumber;
    cors: z.ZodObject<{
        origin: z.ZodArray<z.ZodString, "many">;
        credentials: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        origin: string[];
        credentials: boolean;
    }, {
        origin: string[];
        credentials: boolean;
    }>;
    rateLimit: z.ZodObject<{
        windowMs: z.ZodNumber;
        max: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        windowMs: number;
        max: number;
    }, {
        windowMs: number;
        max: number;
    }>;
    room: z.ZodObject<{
        maxParticipants: z.ZodNumber;
        inactivityTimeout: z.ZodNumber;
        cleanupInterval: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        maxParticipants: number;
        inactivityTimeout: number;
        cleanupInterval: number;
    }, {
        maxParticipants: number;
        inactivityTimeout: number;
        cleanupInterval: number;
    }>;
    auth: z.ZodObject<{
        provider: z.ZodString;
        secretKey: z.ZodString;
        tokenExpiry: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        secretKey: string;
        tokenExpiry: number;
    }, {
        provider: string;
        secretKey: string;
        tokenExpiry: number;
    }>;
}, "strip", z.ZodTypeAny, {
    port: number;
    cors: {
        origin: string[];
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    room: {
        maxParticipants: number;
        inactivityTimeout: number;
        cleanupInterval: number;
    };
    auth: {
        provider: string;
        secretKey: string;
        tokenExpiry: number;
    };
}, {
    port: number;
    cors: {
        origin: string[];
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    room: {
        maxParticipants: number;
        inactivityTimeout: number;
        cleanupInterval: number;
    };
    auth: {
        provider: string;
        secretKey: string;
        tokenExpiry: number;
    };
}>;
export declare const MetricsSchema: z.ZodObject<{
    requests: z.ZodObject<{
        total: z.ZodNumber;
        successful: z.ZodNumber;
        failed: z.ZodNumber;
        averageResponseTime: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    }, {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    }>;
    connections: z.ZodObject<{
        active: z.ZodNumber;
        total: z.ZodNumber;
        peak: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        active: number;
        total: number;
        peak: number;
    }, {
        active: number;
        total: number;
        peak: number;
    }>;
    rooms: z.ZodObject<{
        active: z.ZodNumber;
        created: z.ZodNumber;
        completed: z.ZodNumber;
        averageDuration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        active: number;
        completed: number;
        created: number;
        averageDuration: number;
    }, {
        active: number;
        completed: number;
        created: number;
        averageDuration: number;
    }>;
    errors: z.ZodObject<{
        total: z.ZodNumber;
        byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
        recent: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            stack: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        }, {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        total: number;
        byType: Record<string, number>;
        recent: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        }[];
    }, {
        total: number;
        byType: Record<string, number>;
        recent: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    errors: {
        total: number;
        byType: Record<string, number>;
        recent: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        }[];
    };
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    };
    connections: {
        active: number;
        total: number;
        peak: number;
    };
    rooms: {
        active: number;
        completed: number;
        created: number;
        averageDuration: number;
    };
}, {
    errors: {
        total: number;
        byType: Record<string, number>;
        recent: {
            code: string;
            message: string;
            details?: Record<string, any> | undefined;
            stack?: string | undefined;
        }[];
    };
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    };
    connections: {
        active: number;
        total: number;
        peak: number;
    };
    rooms: {
        active: number;
        completed: number;
        created: number;
        averageDuration: number;
    };
}>;
export declare const LiveStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["idle", "live", "paused", "completed"]>;
    participantCount: z.ZodNumber;
    currentTurn: z.ZodOptional<z.ZodString>;
    lastActivity: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "paused" | "idle" | "live";
    lastActivity: Date;
    participantCount: number;
    currentTurn?: string | undefined;
}, {
    status: "completed" | "paused" | "idle" | "live";
    lastActivity: Date;
    participantCount: number;
    currentTurn?: string | undefined;
}>;
export declare const SubscriptionEventSchema: z.ZodObject<{
    type: z.ZodString;
    data: z.ZodAny;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: string;
    timestamp: number;
    data?: any;
}, {
    type: string;
    timestamp: number;
    data?: any;
}>;
//# sourceMappingURL=api.d.ts.map