import { EventEmitter } from 'events';
import { RoomManager } from './RoomManager';
import { EventBroadcaster } from './EventBroadcaster';
export interface ConnectionStatus {
    userId: string;
    connectionId: string;
    isConnected: boolean;
    lastSeen: Date;
    reconnectAttempts: number;
    disconnectReason?: string;
}
export interface ConnectionHandlerConfig {
    heartbeatIntervalMs?: number;
    connectionTimeoutMs?: number;
    maxReconnectAttempts?: number;
    dmDisconnectGraceMs?: number;
    stateRecoveryTimeoutMs?: number;
}
export type ConnectionEvent = {
    type: 'PLAYER_DISCONNECTED';
    userId: string;
    interactionId: string;
    reason: string;
} | {
    type: 'PLAYER_RECONNECTED';
    userId: string;
    interactionId: string;
    connectionId: string;
} | {
    type: 'DM_DISCONNECTED';
    userId: string;
    interactionId: string;
    reason: string;
} | {
    type: 'DM_RECONNECTED';
    userId: string;
    interactionId: string;
    connectionId: string;
} | {
    type: 'CONNECTION_TIMEOUT';
    userId: string;
    interactionId: string;
} | {
    type: 'RECONNECT_FAILED';
    userId: string;
    interactionId: string;
    attempts: number;
} | {
    type: 'STATE_SYNC_REQUIRED';
    userId: string;
    interactionId: string;
} | {
    type: 'ERROR_RECOVERY_INITIATED';
    interactionId: string;
    errorType: string;
};
export declare class ConnectionHandler extends EventEmitter {
    private connections;
    private heartbeatTimers;
    private reconnectTimers;
    private dmGraceTimers;
    private config;
    private roomManager;
    private eventBroadcaster;
    constructor(roomManager: RoomManager, eventBroadcaster: EventBroadcaster, config?: ConnectionHandlerConfig);
    registerConnection(userId: string, connectionId: string, interactionId: string): void;
    updateHeartbeat(userId: string): void;
    handleDisconnect(userId: string, reason?: string): void;
    handleReconnection(userId: string, interactionId: string, connectionId: string): Promise<void>;
    removeConnection(userId: string): void;
    getConnectionStatus(userId: string): ConnectionStatus | undefined;
    getAllConnectionStatuses(): ConnectionStatus[];
    isUserConnected(userId: string): boolean;
    handleStateCorruption(interactionId: string, errorDetails: any): Promise<void>;
    handleConcurrentActionConflict(interactionId: string, conflictingActions: any[], resolution?: 'first_wins' | 'dm_decides' | 'rollback'): void;
    cleanup(): void;
    private setupRoomManagerListeners;
    private startHeartbeat;
    private stopHeartbeat;
    private checkConnectionHealth;
    private handlePlayerDisconnect;
    private handleDMDisconnect;
    private startReconnectTimer;
    private startDMGraceTimer;
    private clearReconnectTimer;
    private clearDMGraceTimer;
    private findUserRoom;
    private isDMUser;
    private synchronizeUserState;
}
//# sourceMappingURL=ConnectionHandler.d.ts.map