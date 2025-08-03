import { InteractionRoom } from './InteractionRoom';
import { GameState } from '../types';
export interface PersistenceConfig {
    convexUrl: string;
    batchSize?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
    compressionEnabled?: boolean;
    compressionThreshold?: number;
    maxSnapshotAge?: number;
    recoveryEnabled?: boolean;
}
export interface StateSnapshot {
    interactionId: string;
    gameState: GameState;
    participantCount: number;
    connectedParticipants: string[];
    timestamp: number;
    trigger: string;
    compressed?: boolean;
    originalSize?: number;
    compressedSize?: number;
    checksum?: string;
}
export interface RecoveryInfo {
    interactionId: string;
    lastSnapshot: StateSnapshot | null;
    lastActivity: number;
    recoveryAttempts: number;
    recoveryStatus: 'pending' | 'success' | 'failed';
    errorDetails?: string;
}
export declare class StatePersistence {
    private readonly config;
    private readonly persistenceLogger;
    private readonly gzip;
    private readonly gunzip;
    private readonly recoveryCache;
    constructor(config: PersistenceConfig);
    private convertMapsToObjects;
    saveSnapshot(room: InteractionRoom, trigger: string): Promise<void>;
    loadSnapshot(interactionId: string): Promise<StateSnapshot | null>;
    saveEventLog(interactionId: string, eventType: string, eventData: any, userId?: string, entityId?: string): Promise<void>;
    saveTurnRecord(interactionId: string, turnRecord: {
        entityId: string;
        entityType: 'playerCharacter' | 'npc' | 'monster';
        turnNumber: number;
        roundNumber: number;
        actions: any[];
        startTime: number;
        endTime?: number;
        status: 'completed' | 'skipped' | 'timeout';
        userId?: string;
    }): Promise<void>;
    updateInteractionStatus(interactionId: string, status: 'idle' | 'live' | 'paused' | 'completed', additionalData?: {
        liveRoomId?: string;
        connectedParticipants?: string[];
        lastActivity?: number;
    }): Promise<void>;
    shouldPersist(trigger: string): boolean;
    recoverRoomState(interactionId: string): Promise<GameState | null>;
    getRecoveryInfo(interactionId: string): RecoveryInfo | null;
    clearRecoveryInfo(interactionId: string): void;
    getStatistics(): {
        totalSnapshots: number;
        compressionRatio: number;
        averageSnapshotSize: number;
        recoveryAttempts: number;
        successfulRecoveries: number;
    };
    private compressSnapshotIfNeeded;
    private decompressGameState;
    private calculateChecksum;
    private optimizeGameState;
    private saveSnapshotWithRetry;
    private loadSnapshotWithRetry;
    private saveEventLogWithRetry;
    private saveTurnRecordWithRetry;
    private updateInteractionStatusWithRetry;
    private generateSessionId;
    private simulateConvexMutation;
    private simulateConvexQuery;
    private delay;
}
//# sourceMappingURL=StatePersistence.d.ts.map