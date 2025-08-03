import { EventEmitter } from 'events';
import { RoomManager } from './RoomManager';
import { EventBroadcaster } from './EventBroadcaster';
import { StatePersistence } from './StatePersistence';
import { GameState, TurnAction, ValidationResult } from '../types';
export type ErrorType = 'STATE_CORRUPTION' | 'CONCURRENT_ACTION_CONFLICT' | 'INVALID_GAME_STATE' | 'PERSISTENCE_FAILURE' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT_ERROR';
export type RecoveryStrategy = 'ROLLBACK_TO_SNAPSHOT' | 'FIRST_ACTION_WINS' | 'DM_RESOLUTION' | 'PAUSE_AND_NOTIFY' | 'FORCE_COMPLETE' | 'RETRY_OPERATION';
export interface ErrorRecoveryConfig {
    maxRetryAttempts?: number;
    retryDelayMs?: number;
    snapshotRetentionCount?: number;
    recoveryTimeoutMs?: number;
    enableAutoRecovery?: boolean;
    dmNotificationRequired?: boolean;
}
export interface ErrorContext {
    interactionId: string;
    userId?: string;
    entityId?: string;
    timestamp: Date;
    errorType: ErrorType;
    errorMessage: string;
    errorDetails: any;
    gameStateBefore?: GameState;
    gameStateAfter?: GameState;
    conflictingActions?: TurnAction[];
    recoveryAttempts: number;
}
export interface RecoveryResult {
    success: boolean;
    strategy: RecoveryStrategy;
    errorContext: ErrorContext;
    recoveredState?: GameState;
    rollbackTurns?: number;
    message: string;
    requiresDMIntervention: boolean;
}
export declare class ErrorRecovery extends EventEmitter {
    private config;
    private roomManager;
    private eventBroadcaster;
    private statePersistence;
    private errorHistory;
    private recoveryInProgress;
    private stateSnapshots;
    constructor(roomManager: RoomManager, eventBroadcaster: EventBroadcaster, statePersistence: StatePersistence, config?: ErrorRecoveryConfig);
    handleError(errorContext: ErrorContext): Promise<RecoveryResult>;
    handleConcurrentActions(interactionId: string, conflictingActions: TurnAction[]): Promise<RecoveryResult>;
    handleStateCorruption(interactionId: string, corruptionDetails: any, gameStateBefore?: GameState): Promise<RecoveryResult>;
    handleValidationError(interactionId: string, validationResult: ValidationResult, action: TurnAction, userId?: string): Promise<RecoveryResult>;
    createStateSnapshot(interactionId: string, gameState: GameState): void;
    getErrorHistory(interactionId: string): ErrorContext[];
    isRecoveryInProgress(interactionId: string): boolean;
    getRecoveryStats(): {
        totalErrors: number;
        errorsByType: {
            [k: string]: number;
        };
        activeRecoveries: number;
        interactionsWithErrors: number;
        snapshotCounts: {
            [k: string]: number;
        };
    };
    cleanupInteraction(interactionId: string): void;
    shutdown(): void;
    private setupRoomManagerListeners;
    private addToErrorHistory;
    private determineRecoveryStrategy;
    private executeRecovery;
    private executeRollbackRecovery;
    private executeFirstActionWinsRecovery;
    private executeDMResolutionRecovery;
    private executePauseAndNotifyRecovery;
    private executeForceCompleteRecovery;
    private executeRetryRecovery;
    private notifyRecoveryResult;
}
//# sourceMappingURL=ErrorRecovery.d.ts.map