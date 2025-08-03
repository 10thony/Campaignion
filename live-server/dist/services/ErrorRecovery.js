"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorRecovery = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
class ErrorRecovery extends events_1.EventEmitter {
    config;
    roomManager;
    eventBroadcaster;
    statePersistence;
    errorHistory = new Map();
    recoveryInProgress = new Set();
    stateSnapshots = new Map();
    constructor(roomManager, eventBroadcaster, statePersistence, config = {}) {
        super();
        this.roomManager = roomManager;
        this.eventBroadcaster = eventBroadcaster;
        this.statePersistence = statePersistence;
        this.config = {
            maxRetryAttempts: config.maxRetryAttempts ?? 3,
            retryDelayMs: config.retryDelayMs ?? 1000,
            snapshotRetentionCount: config.snapshotRetentionCount ?? 10,
            recoveryTimeoutMs: config.recoveryTimeoutMs ?? 30000,
            enableAutoRecovery: config.enableAutoRecovery ?? true,
            dmNotificationRequired: config.dmNotificationRequired ?? true,
        };
        this.setupRoomManagerListeners();
        logger_1.logger.info('ErrorRecovery initialized', {
            config: this.config,
            timestamp: new Date().toISOString(),
        });
    }
    async handleError(errorContext) {
        const { interactionId, errorType } = errorContext;
        logger_1.logger.error('Error detected, initiating recovery', {
            interactionId,
            errorType,
            errorMessage: errorContext.errorMessage,
            userId: errorContext.userId,
            entityId: errorContext.entityId,
        });
        if (this.recoveryInProgress.has(interactionId)) {
            logger_1.logger.warn('Recovery already in progress for interaction', { interactionId });
            return {
                success: false,
                strategy: 'PAUSE_AND_NOTIFY',
                errorContext,
                message: 'Recovery already in progress',
                requiresDMIntervention: true,
            };
        }
        this.recoveryInProgress.add(interactionId);
        try {
            this.addToErrorHistory(errorContext);
            const strategy = this.determineRecoveryStrategy(errorContext);
            const result = await this.executeRecovery(errorContext, strategy);
            await this.notifyRecoveryResult(result);
            return result;
        }
        catch (recoveryError) {
            logger_1.logger.error('Recovery failed', {
                interactionId,
                errorType,
                recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
            });
            return {
                success: false,
                strategy: 'FORCE_COMPLETE',
                errorContext,
                message: 'Recovery failed - interaction will be completed',
                requiresDMIntervention: true,
            };
        }
        finally {
            this.recoveryInProgress.delete(interactionId);
        }
    }
    async handleConcurrentActions(interactionId, conflictingActions) {
        const errorContext = {
            interactionId,
            timestamp: new Date(),
            errorType: 'CONCURRENT_ACTION_CONFLICT',
            errorMessage: `${conflictingActions.length} concurrent actions detected`,
            errorDetails: { actionCount: conflictingActions.length },
            conflictingActions,
            recoveryAttempts: 0,
        };
        return this.handleError(errorContext);
    }
    async handleStateCorruption(interactionId, corruptionDetails, gameStateBefore) {
        const errorContext = {
            interactionId,
            timestamp: new Date(),
            errorType: 'STATE_CORRUPTION',
            errorMessage: 'Game state corruption detected',
            errorDetails: corruptionDetails,
            gameStateBefore,
            recoveryAttempts: 0,
        };
        return this.handleError(errorContext);
    }
    async handleValidationError(interactionId, validationResult, action, userId) {
        const errorContext = {
            interactionId,
            userId,
            entityId: action.entityId,
            timestamp: new Date(),
            errorType: 'VALIDATION_ERROR',
            errorMessage: `Action validation failed: ${validationResult.errors.join(', ')}`,
            errorDetails: { validationResult, action },
            recoveryAttempts: 0,
        };
        return this.handleError(errorContext);
    }
    createStateSnapshot(interactionId, gameState) {
        if (!this.stateSnapshots.has(interactionId)) {
            this.stateSnapshots.set(interactionId, []);
        }
        const snapshots = this.stateSnapshots.get(interactionId);
        snapshots.push({
            ...gameState,
            timestamp: new Date(),
        });
        if (snapshots.length > this.config.snapshotRetentionCount) {
            snapshots.shift();
        }
        logger_1.logger.debug('State snapshot created', {
            interactionId,
            snapshotCount: snapshots.length,
            gameStateTimestamp: gameState.timestamp,
        });
    }
    getErrorHistory(interactionId) {
        return this.errorHistory.get(interactionId) || [];
    }
    isRecoveryInProgress(interactionId) {
        return this.recoveryInProgress.has(interactionId);
    }
    getRecoveryStats() {
        const totalErrors = Array.from(this.errorHistory.values())
            .reduce((sum, errors) => sum + errors.length, 0);
        const errorsByType = new Map();
        for (const errors of this.errorHistory.values()) {
            for (const error of errors) {
                const count = errorsByType.get(error.errorType) || 0;
                errorsByType.set(error.errorType, count + 1);
            }
        }
        return {
            totalErrors,
            errorsByType: Object.fromEntries(errorsByType),
            activeRecoveries: this.recoveryInProgress.size,
            interactionsWithErrors: this.errorHistory.size,
            snapshotCounts: Object.fromEntries(Array.from(this.stateSnapshots.entries()).map(([id, snapshots]) => [id, snapshots.length])),
        };
    }
    cleanupInteraction(interactionId) {
        this.errorHistory.delete(interactionId);
        this.stateSnapshots.delete(interactionId);
        this.recoveryInProgress.delete(interactionId);
        logger_1.logger.debug('Error recovery cleanup completed', { interactionId });
    }
    shutdown() {
        logger_1.logger.info('Shutting down ErrorRecovery');
        this.errorHistory.clear();
        this.stateSnapshots.clear();
        this.recoveryInProgress.clear();
        this.removeAllListeners();
        logger_1.logger.info('ErrorRecovery shutdown completed');
    }
    setupRoomManagerListeners() {
        this.roomManager.on('roomStateChanged', ({ room, gameState }) => {
            this.createStateSnapshot(room.interactionId, gameState);
        });
        this.roomManager.on('roomCompleted', ({ room }) => {
            this.cleanupInteraction(room.interactionId);
        });
    }
    addToErrorHistory(errorContext) {
        const { interactionId } = errorContext;
        if (!this.errorHistory.has(interactionId)) {
            this.errorHistory.set(interactionId, []);
        }
        const history = this.errorHistory.get(interactionId);
        history.push(errorContext);
        if (history.length > 100) {
            history.shift();
        }
    }
    determineRecoveryStrategy(errorContext) {
        const { errorType, recoveryAttempts } = errorContext;
        if (recoveryAttempts >= this.config.maxRetryAttempts) {
            return 'PAUSE_AND_NOTIFY';
        }
        switch (errorType) {
            case 'STATE_CORRUPTION':
                return 'ROLLBACK_TO_SNAPSHOT';
            case 'CONCURRENT_ACTION_CONFLICT':
                return 'FIRST_ACTION_WINS';
            case 'INVALID_GAME_STATE':
                return 'ROLLBACK_TO_SNAPSHOT';
            case 'PERSISTENCE_FAILURE':
                return 'RETRY_OPERATION';
            case 'NETWORK_ERROR':
                return 'RETRY_OPERATION';
            case 'VALIDATION_ERROR':
                return 'PAUSE_AND_NOTIFY';
            case 'TIMEOUT_ERROR':
                return 'DM_RESOLUTION';
            default:
                return 'PAUSE_AND_NOTIFY';
        }
    }
    async executeRecovery(errorContext, strategy) {
        const { interactionId } = errorContext;
        logger_1.logger.info('Executing recovery strategy', {
            interactionId,
            strategy,
            errorType: errorContext.errorType,
        });
        switch (strategy) {
            case 'ROLLBACK_TO_SNAPSHOT':
                return this.executeRollbackRecovery(errorContext);
            case 'FIRST_ACTION_WINS':
                return this.executeFirstActionWinsRecovery(errorContext);
            case 'DM_RESOLUTION':
                return this.executeDMResolutionRecovery(errorContext);
            case 'PAUSE_AND_NOTIFY':
                return this.executePauseAndNotifyRecovery(errorContext);
            case 'FORCE_COMPLETE':
                return this.executeForceCompleteRecovery(errorContext);
            case 'RETRY_OPERATION':
                return this.executeRetryRecovery(errorContext);
            default:
                throw new Error(`Unknown recovery strategy: ${strategy}`);
        }
    }
    async executeRollbackRecovery(errorContext) {
        const { interactionId } = errorContext;
        try {
            const snapshots = this.stateSnapshots.get(interactionId);
            if (!snapshots || snapshots.length === 0) {
                throw new Error('No snapshots available for rollback');
            }
            const rollbackState = snapshots[snapshots.length - 1];
            const room = this.roomManager.getRoomByInteractionId(interactionId);
            if (!room) {
                throw new Error('Room not found for rollback');
            }
            await this.roomManager.pauseRoom(interactionId, 'State rollback in progress');
            room.updateGameState(rollbackState);
            await this.roomManager.resumeRoom(interactionId);
            return {
                success: true,
                strategy: 'ROLLBACK_TO_SNAPSHOT',
                errorContext,
                recoveredState: rollbackState,
                message: 'Game state rolled back to previous snapshot',
                requiresDMIntervention: false,
            };
        }
        catch (error) {
            logger_1.logger.error('Rollback recovery failed', {
                interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
            return {
                success: false,
                strategy: 'ROLLBACK_TO_SNAPSHOT',
                errorContext,
                message: 'Rollback recovery failed',
                requiresDMIntervention: true,
            };
        }
    }
    async executeFirstActionWinsRecovery(errorContext) {
        const { interactionId, conflictingActions } = errorContext;
        if (!conflictingActions || conflictingActions.length === 0) {
            return {
                success: false,
                strategy: 'FIRST_ACTION_WINS',
                errorContext,
                message: 'No conflicting actions to resolve',
                requiresDMIntervention: true,
            };
        }
        try {
            const winningAction = conflictingActions[0];
            const rejectedActions = conflictingActions.slice(1);
            const room = this.roomManager.getRoomByInteractionId(interactionId);
            if (!room) {
                throw new Error('Room not found for conflict resolution');
            }
            const success = room.processTurnAction(winningAction);
            if (!success) {
                throw new Error('Failed to process winning action');
            }
            for (const rejectedAction of rejectedActions) {
                await this.eventBroadcaster.broadcast(interactionId, {
                    type: 'ERROR',
                    error: {
                        code: 'ACTION_REJECTED',
                        message: 'Action rejected due to concurrent conflict',
                        details: { rejectedAction },
                    },
                    timestamp: Date.now(),
                    interactionId,
                });
            }
            return {
                success: true,
                strategy: 'FIRST_ACTION_WINS',
                errorContext,
                message: `Conflict resolved: 1 action accepted, ${rejectedActions.length} rejected`,
                requiresDMIntervention: false,
            };
        }
        catch (error) {
            logger_1.logger.error('First action wins recovery failed', {
                interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
            return {
                success: false,
                strategy: 'FIRST_ACTION_WINS',
                errorContext,
                message: 'Conflict resolution failed',
                requiresDMIntervention: true,
            };
        }
    }
    async executeDMResolutionRecovery(errorContext) {
        const { interactionId } = errorContext;
        await this.roomManager.pauseRoom(interactionId, 'Waiting for DM resolution');
        return {
            success: true,
            strategy: 'DM_RESOLUTION',
            errorContext,
            message: 'Interaction paused - DM intervention required',
            requiresDMIntervention: true,
        };
    }
    async executePauseAndNotifyRecovery(errorContext) {
        const { interactionId } = errorContext;
        await this.roomManager.pauseRoom(interactionId, 'Error recovery - manual intervention required');
        return {
            success: true,
            strategy: 'PAUSE_AND_NOTIFY',
            errorContext,
            message: 'Interaction paused due to error - manual intervention required',
            requiresDMIntervention: true,
        };
    }
    async executeForceCompleteRecovery(errorContext) {
        const { interactionId } = errorContext;
        await this.roomManager.completeRoom(interactionId, 'Interaction completed due to unrecoverable error');
        return {
            success: true,
            strategy: 'FORCE_COMPLETE',
            errorContext,
            message: 'Interaction completed due to unrecoverable error',
            requiresDMIntervention: false,
        };
    }
    async executeRetryRecovery(errorContext) {
        const { interactionId } = errorContext;
        errorContext.recoveryAttempts++;
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs));
        return {
            success: true,
            strategy: 'RETRY_OPERATION',
            errorContext,
            message: `Retry attempt ${errorContext.recoveryAttempts} completed`,
            requiresDMIntervention: false,
        };
    }
    async notifyRecoveryResult(result) {
        const { errorContext, success, strategy, message, requiresDMIntervention } = result;
        const { interactionId } = errorContext;
        await this.eventBroadcaster.broadcast(interactionId, {
            type: 'ERROR',
            error: {
                code: success ? 'RECOVERY_SUCCESS' : 'RECOVERY_FAILED',
                message,
                details: {
                    strategy,
                    requiresDMIntervention,
                    errorType: errorContext.errorType,
                },
            },
            timestamp: Date.now(),
            interactionId,
        });
        this.emit('recoveryCompleted', result);
        logger_1.logger.info('Recovery result notification sent', {
            interactionId,
            success,
            strategy,
            requiresDMIntervention,
        });
    }
}
exports.ErrorRecovery = ErrorRecovery;
//# sourceMappingURL=ErrorRecovery.js.map