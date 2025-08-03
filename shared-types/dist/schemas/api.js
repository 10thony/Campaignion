/**
 * API-related Zod schemas for runtime validation
 * These schemas provide validation for API responses, errors, and client-server communication
 */
import { z } from 'zod';
// Connection status schema
export const ConnectionStatusSchema = z.enum(['connecting', 'connected', 'disconnected', 'reconnecting', 'error']);
// API Response wrapper schema
export const ApiResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.any()).optional(),
        stack: z.string().optional(),
    }).optional(),
    timestamp: z.number(),
});
// API Error schema
export const ApiErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    stack: z.string().optional(),
});
// Authentication context schema
export const AuthContextSchema = z.object({
    userId: z.string(),
    sessionId: z.string().optional(),
    connectionId: z.string().optional(),
    permissions: z.array(z.string()),
});
// User permissions schema
export const UserPermissionsSchema = z.object({
    canJoinInteraction: z.boolean(),
    canControlEntity: z.boolean(),
    canSendChat: z.boolean(),
    canUseDMControls: z.boolean(),
    canAccessTestMode: z.boolean(),
});
// Room statistics schema
export const RoomStatsSchema = z.object({
    activeRooms: z.number(),
    totalParticipants: z.number(),
    uptime: z.number(),
    averageRoomSize: z.number(),
    peakConcurrentUsers: z.number(),
});
// Room metadata schema
export const RoomMetadataSchema = z.object({
    id: z.string(),
    interactionId: z.string(),
    createdAt: z.date(),
    lastActivity: z.date(),
    participantCount: z.number(),
    status: z.enum(['active', 'paused', 'completed']),
    dmUserId: z.string().optional(),
});
// Subscription options schema
export const SubscriptionOptionsSchema = z.object({
    interactionId: z.string(),
    eventTypes: z.array(z.string()).optional(),
    userId: z.string().optional(),
    reconnectOnError: z.boolean().optional(),
    maxReconnectAttempts: z.number().optional(),
});
// Subscription status schema
export const SubscriptionStatusSchema = z.object({
    id: z.string(),
    status: ConnectionStatusSchema,
    lastEvent: z.date().optional(),
    reconnectAttempts: z.number(),
    error: ApiErrorSchema.optional(),
});
// Batch operation schemas
export const BatchOperationSchema = z.object({
    id: z.string(),
    type: z.string(),
    data: z.any(),
});
export const BatchRequestSchema = z.object({
    operations: z.array(BatchOperationSchema),
    transactional: z.boolean().optional(),
    timeout: z.number().optional(),
});
export const BatchOperationResultSchema = z.object({
    id: z.string(),
    success: z.boolean(),
    data: z.any().optional(),
    error: ApiErrorSchema.optional(),
});
export const BatchResponseSchema = z.object({
    success: z.boolean(),
    results: z.array(BatchOperationResultSchema),
    errors: z.array(ApiErrorSchema).optional(),
});
// Rate limiting schemas
export const RateLimitInfoSchema = z.object({
    limit: z.number(),
    remaining: z.number(),
    resetTime: z.date(),
    retryAfter: z.number().optional(),
});
export const RateLimitErrorSchema = ApiErrorSchema.extend({
    rateLimitInfo: RateLimitInfoSchema,
});
// Health check schemas
export const HealthCheckSchema = z.object({
    name: z.string(),
    status: z.enum(['pass', 'fail', 'warn']),
    message: z.string().optional(),
    duration: z.number().optional(),
    details: z.record(z.any()).optional(),
});
export const HealthStatusSchema = z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    timestamp: z.string(),
    service: z.string(),
    version: z.string().optional(),
    uptime: z.number(),
    checks: z.array(HealthCheckSchema),
});
// Pagination schemas
export const PaginationOptionsSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    filter: z.record(z.any()).optional(),
});
export const PaginatedResponseSchema = z.object({
    data: z.array(z.any()),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
    }),
});
// WebSocket message schemas
export const WebSocketMessageSchema = z.object({
    id: z.string(),
    type: z.string(),
    data: z.any(),
    timestamp: z.number(),
    userId: z.string().optional(),
    interactionId: z.string().optional(),
});
export const WebSocketErrorSchema = z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
});
// Configuration schemas
export const ClientConfigSchema = z.object({
    serverUrl: z.string(),
    wsUrl: z.string(),
    authProvider: z.enum(['clerk', 'custom']),
    reconnectOptions: z.object({
        enabled: z.boolean(),
        maxAttempts: z.number(),
        delay: z.number(),
        backoff: z.enum(['linear', 'exponential']),
    }),
    timeout: z.object({
        connection: z.number(),
        request: z.number(),
        subscription: z.number(),
    }),
});
export const ServerConfigSchema = z.object({
    port: z.number(),
    cors: z.object({
        origin: z.array(z.string()),
        credentials: z.boolean(),
    }),
    rateLimit: z.object({
        windowMs: z.number(),
        max: z.number(),
    }),
    room: z.object({
        maxParticipants: z.number(),
        inactivityTimeout: z.number(),
        cleanupInterval: z.number(),
    }),
    auth: z.object({
        provider: z.string(),
        secretKey: z.string(),
        tokenExpiry: z.number(),
    }),
});
// Metrics schema
export const MetricsSchema = z.object({
    requests: z.object({
        total: z.number(),
        successful: z.number(),
        failed: z.number(),
        averageResponseTime: z.number(),
    }),
    connections: z.object({
        active: z.number(),
        total: z.number(),
        peak: z.number(),
    }),
    rooms: z.object({
        active: z.number(),
        created: z.number(),
        completed: z.number(),
        averageDuration: z.number(),
    }),
    errors: z.object({
        total: z.number(),
        byType: z.record(z.number()),
        recent: z.array(ApiErrorSchema),
    }),
});
// Live status schema (for interactions list)
export const LiveStatusSchema = z.object({
    status: z.enum(['idle', 'live', 'paused', 'completed']),
    participantCount: z.number(),
    currentTurn: z.string().optional(),
    lastActivity: z.date(),
});
// Subscription event wrapper schema
export const SubscriptionEventSchema = z.object({
    type: z.string(),
    data: z.any(),
    timestamp: z.number(),
});
