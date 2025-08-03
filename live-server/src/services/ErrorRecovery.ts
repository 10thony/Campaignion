import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { RoomManager } from './RoomManager';
import { EventBroadcaster } from './EventBroadcaster';
import { StatePersistence } from './StatePersistence';
import { GameState, GameEvent, TurnAction, ValidationResult } from '../types';

/**
 * Error types that can occur in the live interaction system
 */
export type ErrorType = 
  | 'STATE_CORRUPTION'
  | 'CONCURRENT_ACTION_CONFLICT'
  | 'INVALID_GAME_STATE'
  | 'PERSISTENCE_FAILURE'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'TIMEOUT_ERROR';

/**
 * Recovery strategy for different error types
 */
export type RecoveryStrategy = 
  | 'ROLLBACK_TO_SNAPSHOT'
  | 'FIRST_ACTION_WINS'
  | 'DM_RESOLUTION'
  | 'PAUSE_AND_NOTIFY'
  | 'FORCE_COMPLETE'
  | 'RETRY_OPERATION';

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  maxRetryAttempts?: number;
  retryDelayMs?: number;
  snapshotRetentionCount?: number;
  recoveryTimeoutMs?: number;
  enableAutoRecovery?: boolean;
  dmNotificationRequired?: boolean;
}

/**
 * Error context information
 */
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

/**
 * Recovery result information
 */
export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  errorContext: ErrorContext;
  recoveredState?: GameState;
  rollbackTurns?: number;
  message: string;
  requiresDMIntervention: boolean;
}

/**
 * ErrorRecovery handles error detection, recovery strategies, and state restoration
 * 
 * Features:
 * - Automatic error detection and classification
 * - Multiple recovery strategies based on error type
 * - State rollback and restoration capabilities
 * - Concurrent action conflict resolution
 * - DM notification for critical errors
 * - Comprehensive error logging and metrics
 */
export class ErrorRecovery extends EventEmitter {
  private config: Required<ErrorRecoveryConfig>;
  private roomManager: RoomManager;
  private eventBroadcaster: EventBroadcaster;
  private statePersistence: StatePersistence;
  private errorHistory: Map<string, ErrorContext[]> = new Map();
  private recoveryInProgress: Set<string> = new Set();
  private stateSnapshots: Map<string, GameState[]> = new Map();

  constructor(
    roomManager: RoomManager,
    eventBroadcaster: EventBroadcaster,
    statePersistence: StatePersistence,
    config: ErrorRecoveryConfig = {}
  ) {
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
    
    logger.info('ErrorRecovery initialized', {
      config: this.config,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle a detected error and attempt recovery
   */
  public async handleError(errorContext: ErrorContext): Promise<RecoveryResult> {
    const { interactionId, errorType } = errorContext;
    
    logger.error('Error detected, initiating recovery', {
      interactionId,
      errorType,
      errorMessage: errorContext.errorMessage,
      userId: errorContext.userId,
      entityId: errorContext.entityId,
    });

    // Check if recovery is already in progress
    if (this.recoveryInProgress.has(interactionId)) {
      logger.warn('Recovery already in progress for interaction', { interactionId });
      return {
        success: false,
        strategy: 'PAUSE_AND_NOTIFY',
        errorContext,
        message: 'Recovery already in progress',
        requiresDMIntervention: true,
      };
    }

    // Mark recovery as in progress
    this.recoveryInProgress.add(interactionId);

    try {
      // Add to error history
      this.addToErrorHistory(errorContext);

      // Determine recovery strategy
      const strategy = this.determineRecoveryStrategy(errorContext);
      
      // Execute recovery
      const result = await this.executeRecovery(errorContext, strategy);
      
      // Notify participants of recovery result
      await this.notifyRecoveryResult(result);
      
      return result;

    } catch (recoveryError) {
      logger.error('Recovery failed', {
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

    } finally {
      // Mark recovery as complete
      this.recoveryInProgress.delete(interactionId);
    }
  }

  /**
   * Handle concurrent action conflicts
   */
  public async handleConcurrentActions(
    interactionId: string,
    conflictingActions: TurnAction[]
  ): Promise<RecoveryResult> {
    const errorContext: ErrorContext = {
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

  /**
   * Handle state corruption
   */
  public async handleStateCorruption(
    interactionId: string,
    corruptionDetails: any,
    gameStateBefore?: GameState
  ): Promise<RecoveryResult> {
    const errorContext: ErrorContext = {
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

  /**
   * Handle validation errors
   */
  public async handleValidationError(
    interactionId: string,
    validationResult: ValidationResult,
    action: TurnAction,
    userId?: string
  ): Promise<RecoveryResult> {
    const errorContext: ErrorContext = {
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

  /**
   * Create a state snapshot for potential rollback
   */
  public createStateSnapshot(interactionId: string, gameState: GameState): void {
    if (!this.stateSnapshots.has(interactionId)) {
      this.stateSnapshots.set(interactionId, []);
    }

    const snapshots = this.stateSnapshots.get(interactionId)!;
    
    // Add new snapshot
    snapshots.push({
      ...gameState,
      timestamp: new Date(),
    });

    // Maintain retention limit
    if (snapshots.length > this.config.snapshotRetentionCount) {
      snapshots.shift(); // Remove oldest snapshot
    }

    logger.debug('State snapshot created', {
      interactionId,
      snapshotCount: snapshots.length,
      gameStateTimestamp: gameState.timestamp,
    });
  }

  /**
   * Get error history for an interaction
   */
  public getErrorHistory(interactionId: string): ErrorContext[] {
    return this.errorHistory.get(interactionId) || [];
  }

  /**
   * Check if recovery is in progress
   */
  public isRecoveryInProgress(interactionId: string): boolean {
    return this.recoveryInProgress.has(interactionId);
  }

  /**
   * Get recovery statistics
   */
  public getRecoveryStats() {
    const totalErrors = Array.from(this.errorHistory.values())
      .reduce((sum, errors) => sum + errors.length, 0);
    
    const errorsByType = new Map<ErrorType, number>();
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
      snapshotCounts: Object.fromEntries(
        Array.from(this.stateSnapshots.entries()).map(([id, snapshots]) => [id, snapshots.length])
      ),
    };
  }

  /**
   * Cleanup resources for completed interactions
   */
  public cleanupInteraction(interactionId: string): void {
    this.errorHistory.delete(interactionId);
    this.stateSnapshots.delete(interactionId);
    this.recoveryInProgress.delete(interactionId);
    
    logger.debug('Error recovery cleanup completed', { interactionId });
  }

  /**
   * Shutdown error recovery system
   */
  public shutdown(): void {
    logger.info('Shutting down ErrorRecovery');
    
    this.errorHistory.clear();
    this.stateSnapshots.clear();
    this.recoveryInProgress.clear();
    this.removeAllListeners();
    
    logger.info('ErrorRecovery shutdown completed');
  }

  /**
   * Private helper methods
   */

  private setupRoomManagerListeners(): void {
    // Listen for room state changes to create snapshots
    this.roomManager.on('roomStateChanged', ({ room, gameState }) => {
      this.createStateSnapshot(room.interactionId, gameState);
    });

    // Listen for room completion to cleanup
    this.roomManager.on('roomCompleted', ({ room }) => {
      this.cleanupInteraction(room.interactionId);
    });
  }

  private addToErrorHistory(errorContext: ErrorContext): void {
    const { interactionId } = errorContext;
    
    if (!this.errorHistory.has(interactionId)) {
      this.errorHistory.set(interactionId, []);
    }

    const history = this.errorHistory.get(interactionId)!;
    history.push(errorContext);

    // Limit history size to prevent memory issues
    if (history.length > 100) {
      history.shift();
    }
  }

  private determineRecoveryStrategy(errorContext: ErrorContext): RecoveryStrategy {
    const { errorType, recoveryAttempts } = errorContext;

    // If too many attempts, escalate to DM
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

  private async executeRecovery(
    errorContext: ErrorContext,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const { interactionId } = errorContext;
    
    logger.info('Executing recovery strategy', {
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

  private async executeRollbackRecovery(errorContext: ErrorContext): Promise<RecoveryResult> {
    const { interactionId } = errorContext;
    
    try {
      // Get the most recent snapshot
      const snapshots = this.stateSnapshots.get(interactionId);
      if (!snapshots || snapshots.length === 0) {
        throw new Error('No snapshots available for rollback');
      }

      const rollbackState = snapshots[snapshots.length - 1];
      
      // Get the room and update its state
      const room = this.roomManager.getRoomByInteractionId(interactionId);
      if (!room) {
        throw new Error('Room not found for rollback');
      }

      // Pause interaction during rollback
      await this.roomManager.pauseRoom(interactionId, 'State rollback in progress');

      // Update room state
      room.updateGameState(rollbackState);

      // Resume interaction
      await this.roomManager.resumeRoom(interactionId);

      return {
        success: true,
        strategy: 'ROLLBACK_TO_SNAPSHOT',
        errorContext,
        recoveredState: rollbackState,
        message: 'Game state rolled back to previous snapshot',
        requiresDMIntervention: false,
      };

    } catch (error) {
      logger.error('Rollback recovery failed', {
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

  private async executeFirstActionWinsRecovery(errorContext: ErrorContext): Promise<RecoveryResult> {
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
      // Accept the first action, reject the rest
      const winningAction = conflictingActions[0];
      const rejectedActions = conflictingActions.slice(1);

      // Process the winning action
      const room = this.roomManager.getRoomByInteractionId(interactionId);
      if (!room) {
        throw new Error('Room not found for conflict resolution');
      }

      const success = room.processTurnAction(winningAction);
      if (!success) {
        throw new Error('Failed to process winning action');
      }

      // Notify about rejected actions
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
        } as GameEvent);
      }

      return {
        success: true,
        strategy: 'FIRST_ACTION_WINS',
        errorContext,
        message: `Conflict resolved: 1 action accepted, ${rejectedActions.length} rejected`,
        requiresDMIntervention: false,
      };

    } catch (error) {
      logger.error('First action wins recovery failed', {
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

  private async executeDMResolutionRecovery(errorContext: ErrorContext): Promise<RecoveryResult> {
    const { interactionId } = errorContext;
    
    // Pause the interaction and wait for DM intervention
    await this.roomManager.pauseRoom(interactionId, 'Waiting for DM resolution');

    return {
      success: true,
      strategy: 'DM_RESOLUTION',
      errorContext,
      message: 'Interaction paused - DM intervention required',
      requiresDMIntervention: true,
    };
  }

  private async executePauseAndNotifyRecovery(errorContext: ErrorContext): Promise<RecoveryResult> {
    const { interactionId } = errorContext;
    
    // Pause the interaction
    await this.roomManager.pauseRoom(interactionId, 'Error recovery - manual intervention required');

    return {
      success: true,
      strategy: 'PAUSE_AND_NOTIFY',
      errorContext,
      message: 'Interaction paused due to error - manual intervention required',
      requiresDMIntervention: true,
    };
  }

  private async executeForceCompleteRecovery(errorContext: ErrorContext): Promise<RecoveryResult> {
    const { interactionId } = errorContext;
    
    // Complete the interaction due to unrecoverable error
    await this.roomManager.completeRoom(interactionId, 'Interaction completed due to unrecoverable error');

    return {
      success: true,
      strategy: 'FORCE_COMPLETE',
      errorContext,
      message: 'Interaction completed due to unrecoverable error',
      requiresDMIntervention: false,
    };
  }

  private async executeRetryRecovery(errorContext: ErrorContext): Promise<RecoveryResult> {
    const { interactionId } = errorContext;
    
    // Increment retry attempts
    errorContext.recoveryAttempts++;

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs));

    // For now, just return success - actual retry logic would depend on the specific error
    return {
      success: true,
      strategy: 'RETRY_OPERATION',
      errorContext,
      message: `Retry attempt ${errorContext.recoveryAttempts} completed`,
      requiresDMIntervention: false,
    };
  }

  private async notifyRecoveryResult(result: RecoveryResult): Promise<void> {
    const { errorContext, success, strategy, message, requiresDMIntervention } = result;
    const { interactionId } = errorContext;

    // Broadcast recovery result to all participants
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
    } as GameEvent);

    // Emit recovery event for external handling
    this.emit('recoveryCompleted', result);

    logger.info('Recovery result notification sent', {
      interactionId,
      success,
      strategy,
      requiresDMIntervention,
    });
  }
}