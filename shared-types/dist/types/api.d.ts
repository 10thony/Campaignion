/**
 * API-related types for the Live Interaction System
 * These types are used for API responses, error handling, and client-server communication
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    timestamp: number;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    stack?: string;
}
export interface AuthContext {
    userId: string;
    sessionId?: string;
    connectionId?: string;
    permissions: string[];
}
export interface UserPermissions {
    canJoinInteraction: boolean;
    canControlEntity: boolean;
    canSendChat: boolean;
    canUseDMControls: boolean;
    canAccessTestMode: boolean;
}
export interface RoomStats {
    activeRooms: number;
    totalParticipants: number;
    uptime: number;
    averageRoomSize: number;
    peakConcurrentUsers: number;
}
export interface RoomMetadata {
    id: string;
    interactionId: string;
    createdAt: Date;
    lastActivity: Date;
    participantCount: number;
    status: 'active' | 'paused' | 'completed';
    dmUserId?: string;
}
export interface SubscriptionOptions {
    interactionId: string;
    eventTypes?: string[];
    userId?: string;
    reconnectOnError?: boolean;
    maxReconnectAttempts?: number;
}
export interface SubscriptionStatus {
    id: string;
    status: ConnectionStatus;
    lastEvent?: Date;
    reconnectAttempts: number;
    error?: ApiError;
}
export interface BatchRequest<T = any> {
    operations: BatchOperation<T>[];
    transactional?: boolean;
    timeout?: number;
}
export interface BatchOperation<T = any> {
    id: string;
    type: string;
    data: T;
}
export interface BatchResponse<T = any> {
    success: boolean;
    results: BatchOperationResult<T>[];
    errors?: ApiError[];
}
export interface BatchOperationResult<T = any> {
    id: string;
    success: boolean;
    data?: T;
    error?: ApiError;
}
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
}
export interface RateLimitError extends ApiError {
    rateLimitInfo: RateLimitInfo;
}
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    service: string;
    version?: string;
    uptime: number;
    checks: HealthCheck[];
}
export interface HealthCheck {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
    details?: Record<string, any>;
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Record<string, any>;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface WebSocketMessage<T = any> {
    id: string;
    type: string;
    data: T;
    timestamp: number;
    userId?: string;
    interactionId?: string;
}
export interface WebSocketError {
    code: number;
    message: string;
    data?: any;
}
export interface ClientConfig {
    serverUrl: string;
    wsUrl: string;
    authProvider: 'clerk' | 'custom';
    reconnectOptions: {
        enabled: boolean;
        maxAttempts: number;
        delay: number;
        backoff: 'linear' | 'exponential';
    };
    timeout: {
        connection: number;
        request: number;
        subscription: number;
    };
}
export interface ServerConfig {
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
}
export interface Metrics {
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
        created: number;
        completed: number;
        averageDuration: number;
    };
    errors: {
        total: number;
        byType: Record<string, number>;
        recent: ApiError[];
    };
}
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type ContentType = 'application/json' | 'application/x-www-form-urlencoded' | 'multipart/form-data';
export declare function isApiError(error: any): error is ApiError;
export declare function isRateLimitError(error: any): error is RateLimitError;
export declare function isWebSocketMessage<T>(message: any): message is WebSocketMessage<T>;
//# sourceMappingURL=api.d.ts.map