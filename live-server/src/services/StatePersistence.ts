import { ConvexHttpClient } from 'convex/browser';
import { InteractionRoom } from './InteractionRoom';
import { GameState } from '../types';
import { logger } from '../utils/logger';
import { validateGameState, validateWithSchema } from '../schemas/validators';
import { GameStateSchema } from '../schemas/gameState';
import * as zlib from 'zlib';
import { promisify } from 'util';

export interface PersistenceConfig {
  convexUrl: string;
  batchSize?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  compressionEnabled?: boolean;
  compressionThreshold?: number; // bytes
  maxSnapshotAge?: number; // milliseconds
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

export class StatePersistence {
  private readonly config: Required<PersistenceConfig>;
  private readonly persistenceLogger;
  private readonly gzip = promisify(zlib.gzip);
  private readonly gunzip = promisify(zlib.gunzip);
  private readonly recoveryCache = new Map<string, RecoveryInfo>();

  constructor(config: PersistenceConfig) {
    this.config = {
      batchSize: config.batchSize || 10,
      retryAttempts: config.retryAttempts || 3,
      retryDelayMs: config.retryDelayMs || 1000,
      compressionEnabled: config.compressionEnabled ?? true,
      compressionThreshold: config.compressionThreshold || 1024, // 1KB
      maxSnapshotAge: config.maxSnapshotAge || 24 * 60 * 60 * 1000, // 24 hours
      recoveryEnabled: config.recoveryEnabled ?? true,
      ...config
    };

    // Removed: this.convex = new ConvexHttpClient(this.config.convexUrl);
    this.persistenceLogger = logger.child({ component: 'StatePersistence' });
    
    this.persistenceLogger.info('StatePersistence initialized', {
      convexUrl: this.config.convexUrl,
      batchSize: this.config.batchSize,
      compressionEnabled: this.config.compressionEnabled,
      compressionThreshold: this.config.compressionThreshold,
      recoveryEnabled: this.config.recoveryEnabled
    });
  }

  /**
   * Convert Maps to plain objects for validation and serialization
   */
  private convertMapsToObjects(gameState: GameState): any {
    return {
      ...gameState,
      participants: gameState.participants instanceof Map 
        ? Object.fromEntries(gameState.participants)
        : gameState.participants,
      mapState: {
        ...gameState.mapState,
        entities: gameState.mapState.entities instanceof Map
          ? Object.fromEntries(gameState.mapState.entities)
          : gameState.mapState.entities
      }
    };
  }

  /**
   * Save a room state snapshot to Convex
   */
  public async saveSnapshot(room: InteractionRoom, trigger: string): Promise<void> {
    // Convert Maps to objects for validation
    const validationGameState = this.convertMapsToObjects(room.gameState);
    
    // Validate game state before saving
    const validationResult = validateGameState(validationGameState);
    if (!validationResult.valid) {
      this.persistenceLogger.error('Invalid game state detected before save', {
        interactionId: room.interactionId,
        errors: validationResult.errors,
        trigger
      });
      throw new Error(`Invalid game state: ${validationResult.errors.join(', ')}`);
    }

    // Optimize game state before saving
    const optimizedGameState = this.optimizeGameState(room.gameState);

    let snapshot: StateSnapshot = {
      interactionId: room.interactionId,
      gameState: optimizedGameState,
      participantCount: room.participants.size,
      connectedParticipants: room.getAllParticipants()
        .filter(p => p.isConnected)
        .map(p => p.userId),
      timestamp: Date.now(),
      trigger
    };

    // Apply compression if enabled and data is large enough
    snapshot = await this.compressSnapshotIfNeeded(snapshot);

    // Add checksum for data integrity
    snapshot.checksum = this.calculateChecksum(snapshot);

    await this.saveSnapshotWithRetry(snapshot);
  }

  /**
   * Load a room state snapshot from Convex
   */
  public async loadSnapshot(interactionId: string): Promise<StateSnapshot | null> {
    try {
      this.persistenceLogger.debug('Loading state snapshot', { interactionId });

      // Note: This would call a Convex query to get the latest snapshot
      // For now, we'll return null as the Convex schema and queries aren't implemented yet
      const snapshot = await this.loadSnapshotWithRetry(interactionId);
      
      if (snapshot) {
        // Verify checksum if available
        if (snapshot.checksum) {
          const calculatedChecksum = this.calculateChecksum(snapshot);
          if (calculatedChecksum !== snapshot.checksum) {
            this.persistenceLogger.error('Checksum mismatch detected', {
              interactionId,
              expected: snapshot.checksum,
              calculated: calculatedChecksum
            });
            throw new Error('Data corruption detected - checksum mismatch');
          }
        }

        this.persistenceLogger.info('State snapshot loaded', {
          interactionId,
          timestamp: snapshot.timestamp,
          trigger: snapshot.trigger,
          participantCount: snapshot.participantCount,
          compressed: snapshot.compressed || false,
          originalSize: snapshot.originalSize,
          compressedSize: snapshot.compressedSize
        });
      } else {
        this.persistenceLogger.debug('No state snapshot found', { interactionId });
      }

      return snapshot;
    } catch (error) {
      this.persistenceLogger.error('Error loading state snapshot', {
        interactionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Save interaction event log to Convex
   */
  public async saveEventLog(
    interactionId: string,
    eventType: string,
    eventData: any,
    userId?: string,
    entityId?: string
  ): Promise<void> {
    try {
      const logEntry = {
        interactionId,
        eventType,
        eventData,
        userId,
        entityId,
        timestamp: Date.now(),
        sessionId: this.generateSessionId(interactionId)
      };

      await this.saveEventLogWithRetry(logEntry);
      
      this.persistenceLogger.debug('Event log saved', {
        interactionId,
        eventType,
        userId,
        entityId
      });
    } catch (error) {
      this.persistenceLogger.error('Error saving event log', {
        interactionId,
        eventType,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Save turn record to Convex
   */
  public async saveTurnRecord(
    interactionId: string,
    turnRecord: {
      entityId: string;
      entityType: 'playerCharacter' | 'npc' | 'monster';
      turnNumber: number;
      roundNumber: number;
      actions: any[];
      startTime: number;
      endTime?: number;
      status: 'completed' | 'skipped' | 'timeout';
      userId?: string;
    }
  ): Promise<void> {
    try {
      const record = {
        interactionId,
        ...turnRecord
      };

      await this.saveTurnRecordWithRetry(record);
      
      this.persistenceLogger.debug('Turn record saved', {
        interactionId,
        entityId: turnRecord.entityId,
        turnNumber: turnRecord.turnNumber,
        roundNumber: turnRecord.roundNumber,
        status: turnRecord.status
      });
    } catch (error) {
      this.persistenceLogger.error('Error saving turn record', {
        interactionId,
        entityId: turnRecord.entityId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update interaction live status in Convex
   */
  public async updateInteractionStatus(
    interactionId: string,
    status: 'idle' | 'live' | 'paused' | 'completed',
    additionalData?: {
      liveRoomId?: string;
      connectedParticipants?: string[];
      lastActivity?: number;
    }
  ): Promise<void> {
    try {
      const updateData = {
        liveStatus: status,
        lastActivity: Date.now(),
        ...additionalData
      };

      await this.updateInteractionStatusWithRetry(interactionId, updateData);
      
      this.persistenceLogger.info('Interaction status updated', {
        interactionId,
        status,
        liveRoomId: additionalData?.liveRoomId
      });
    } catch (error) {
      this.persistenceLogger.error('Error updating interaction status', {
        interactionId,
        status,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check if persistence should be triggered based on event
   */
  public shouldPersist(trigger: string): boolean {
    const persistenceTriggers = [
      'pause',
      'complete',
      'inactivity',
      'roundEnd',
      'participantDisconnect',
      'dmDisconnect',
      'entityDefeated',
      'serverRestart',
      'criticalError',
      'manualSave'
    ];

    return persistenceTriggers.includes(trigger);
  }

  /**
   * Recover room state after server restart or failure
   */
  public async recoverRoomState(interactionId: string): Promise<GameState | null> {
    if (!this.config.recoveryEnabled) {
      this.persistenceLogger.warn('Recovery disabled, cannot recover room state', { interactionId });
      return null;
    }

    const recoveryInfo: RecoveryInfo = {
      interactionId,
      lastSnapshot: null,
      lastActivity: Date.now(),
      recoveryAttempts: 0,
      recoveryStatus: 'pending'
    };

    this.recoveryCache.set(interactionId, recoveryInfo);

    try {
      this.persistenceLogger.info('Starting room state recovery', { interactionId });

      // Load the latest snapshot
      const snapshot = await this.loadSnapshot(interactionId);
      if (!snapshot) {
        recoveryInfo.recoveryStatus = 'failed';
        recoveryInfo.errorDetails = 'No snapshot found';
        this.persistenceLogger.warn('No snapshot found for recovery', { interactionId });
        return null;
      }

      recoveryInfo.lastSnapshot = snapshot;

      // Check if snapshot is too old
      const snapshotAge = Date.now() - snapshot.timestamp;
      if (snapshotAge > this.config.maxSnapshotAge) {
        recoveryInfo.recoveryStatus = 'failed';
        recoveryInfo.errorDetails = `Snapshot too old: ${snapshotAge}ms`;
        this.persistenceLogger.warn('Snapshot too old for recovery', {
          interactionId,
          snapshotAge,
          maxAge: this.config.maxSnapshotAge
        });
        return null;
      }

      // Decompress if needed
      let gameState = snapshot.gameState;
      if (snapshot.compressed) {
        gameState = await this.decompressGameState(snapshot);
      }

      // Validate recovered state
      const validationResult = validateGameState(gameState);
      if (!validationResult.valid) {
        recoveryInfo.recoveryStatus = 'failed';
        recoveryInfo.errorDetails = `Invalid recovered state: ${validationResult.errors.join(', ')}`;
        this.persistenceLogger.error('Recovered state validation failed', {
          interactionId,
          errors: validationResult.errors
        });
        return null;
      }

      // Verify checksum if available
      if (snapshot.checksum) {
        const calculatedChecksum = this.calculateChecksum(snapshot);
        if (calculatedChecksum !== snapshot.checksum) {
          recoveryInfo.recoveryStatus = 'failed';
          recoveryInfo.errorDetails = 'Checksum mismatch - data corruption detected';
          this.persistenceLogger.error('Checksum mismatch during recovery', {
            interactionId,
            expected: snapshot.checksum,
            calculated: calculatedChecksum
          });
          return null;
        }
      }

      recoveryInfo.recoveryStatus = 'success';
      this.persistenceLogger.info('Room state recovery successful', {
        interactionId,
        snapshotAge,
        trigger: snapshot.trigger,
        participantCount: snapshot.participantCount
      });

      return gameState;

    } catch (error) {
      recoveryInfo.recoveryAttempts++;
      recoveryInfo.recoveryStatus = 'failed';
      recoveryInfo.errorDetails = error instanceof Error ? error.message : String(error);

      this.persistenceLogger.error('Room state recovery failed', {
        interactionId,
        attempts: recoveryInfo.recoveryAttempts,
        error: recoveryInfo.errorDetails
      });

      return null;
    }
  }

  /**
   * Get recovery information for an interaction
   */
  public getRecoveryInfo(interactionId: string): RecoveryInfo | null {
    return this.recoveryCache.get(interactionId) || null;
  }

  /**
   * Clear recovery cache for completed interactions
   */
  public clearRecoveryInfo(interactionId: string): void {
    this.recoveryCache.delete(interactionId);
  }

  /**
   * Get persistence statistics
   */
  public getStatistics(): {
    totalSnapshots: number;
    compressionRatio: number;
    averageSnapshotSize: number;
    recoveryAttempts: number;
    successfulRecoveries: number;
  } {
    // This would be enhanced with actual metrics in a production system
    return {
      totalSnapshots: 0,
      compressionRatio: 0,
      averageSnapshotSize: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0
    };
  }

  /**
   * Compress snapshot if it exceeds the threshold
   */
  private async compressSnapshotIfNeeded(snapshot: StateSnapshot): Promise<StateSnapshot> {
    if (!this.config.compressionEnabled) {
      return snapshot;
    }

    const serializedState = JSON.stringify(snapshot.gameState);
    const originalSize = Buffer.byteLength(serializedState, 'utf8');

    if (originalSize < this.config.compressionThreshold) {
      return snapshot;
    }

    try {
      const compressed = await this.gzip(serializedState);
      const compressedSize = compressed.length;
      const compressionRatio = (1 - compressedSize / originalSize) * 100;

      this.persistenceLogger.debug('State compressed', {
        interactionId: snapshot.interactionId,
        originalSize,
        compressedSize,
        compressionRatio: `${compressionRatio.toFixed(2)}%`
      });

      return {
        ...snapshot,
        gameState: compressed as any, // Store as compressed buffer
        compressed: true,
        originalSize,
        compressedSize
      };
    } catch (error) {
      this.persistenceLogger.warn('Compression failed, saving uncompressed', {
        interactionId: snapshot.interactionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return snapshot;
    }
  }

  /**
   * Decompress game state from snapshot
   */
  private async decompressGameState(snapshot: StateSnapshot): Promise<GameState> {
    if (!snapshot.compressed) {
      return snapshot.gameState;
    }

    try {
      const decompressed = await this.gunzip(snapshot.gameState as any);
      const gameState = JSON.parse(decompressed.toString('utf8'));

      this.persistenceLogger.debug('State decompressed', {
        interactionId: snapshot.interactionId,
        originalSize: snapshot.originalSize,
        compressedSize: snapshot.compressedSize
      });

      return gameState;
    } catch (error) {
      this.persistenceLogger.error('Decompression failed', {
        interactionId: snapshot.interactionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to decompress game state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate checksum for data integrity verification
   */
  private calculateChecksum(snapshot: StateSnapshot): string {
    const crypto = require('crypto');
    const data = JSON.stringify({
      interactionId: snapshot.interactionId,
      gameState: snapshot.gameState,
      timestamp: snapshot.timestamp,
      trigger: snapshot.trigger
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Optimize game state before persistence by removing unnecessary data
   */
  private optimizeGameState(gameState: GameState): GameState {
    // Create a deep copy to avoid modifying the original
    const optimized = JSON.parse(JSON.stringify(gameState));

    // Remove old chat messages beyond a certain limit
    const maxChatMessages = 100;
    if (optimized.chatLog.length > maxChatMessages) {
      optimized.chatLog = optimized.chatLog.slice(-maxChatMessages);
    }

    // Remove old turn history beyond a certain limit
    const maxTurnHistory = 50;
    if (optimized.turnHistory.length > maxTurnHistory) {
      optimized.turnHistory = optimized.turnHistory.slice(-maxTurnHistory);
    }

    // Clean up participant states - remove disconnected participants' temporary data
    Object.values(optimized.participants).forEach((participant: any) => {
      // Remove temporary UI state that doesn't need persistence
      delete participant.tempUIState;
      delete participant.clientPredictions;
    });

    return optimized;
  }

  /**
   * Save snapshot with retry logic
   */
  private async saveSnapshotWithRetry(snapshot: StateSnapshot): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Note: This would call a Convex mutation to save the snapshot
        // For now, we'll simulate the call
        await this.simulateConvexMutation('saveStateSnapshot', snapshot);
        
        this.persistenceLogger.info('State snapshot saved', {
          interactionId: snapshot.interactionId,
          trigger: snapshot.trigger,
          timestamp: snapshot.timestamp,
          attempt
        });
        
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        this.persistenceLogger.warn('Snapshot save attempt failed', {
          interactionId: snapshot.interactionId,
          attempt,
          maxAttempts: this.config.retryAttempts,
          error: lastError.message
        });

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    throw new Error(`Failed to save snapshot after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
  }

  /**
   * Load snapshot with retry logic
   */
  private async loadSnapshotWithRetry(interactionId: string): Promise<StateSnapshot | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Note: This would call a Convex query to load the snapshot
        // For now, we'll simulate the call
        const snapshot = await this.simulateConvexQuery('getLatestStateSnapshot', { interactionId });
        return snapshot;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        this.persistenceLogger.warn('Snapshot load attempt failed', {
          interactionId,
          attempt,
          maxAttempts: this.config.retryAttempts,
          error: lastError.message
        });

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    this.persistenceLogger.error('Failed to load snapshot after all attempts', {
      interactionId,
      error: lastError?.message
    });
    
    return null;
  }

  /**
   * Save event log with retry logic
   */
  private async saveEventLogWithRetry(logEntry: any): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        await this.simulateConvexMutation('saveEventLog', logEntry);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    throw new Error(`Failed to save event log after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
  }

  /**
   * Save turn record with retry logic
   */
  private async saveTurnRecordWithRetry(record: any): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        await this.simulateConvexMutation('saveTurnRecord', record);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    throw new Error(`Failed to save turn record after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
  }

  /**
   * Update interaction status with retry logic
   */
  private async updateInteractionStatusWithRetry(interactionId: string, updateData: any): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        await this.simulateConvexMutation('updateInteractionStatus', { interactionId, ...updateData });
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    throw new Error(`Failed to update interaction status after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
  }

  /**
   * Generate a session ID for grouping events
   */
  private generateSessionId(interactionId: string): string {
    const timestamp = Date.now();
    return `${interactionId}-${timestamp}`;
  }

  /**
   * Simulate Convex mutation call (placeholder)
   */
  private async simulateConvexMutation(mutationName: string, args: any): Promise<any> {
    // This is a placeholder - in real implementation, this would be:
    // return await this.convex.mutation(api.mutations[mutationName], args);
    
    this.persistenceLogger.debug('Simulated Convex mutation', { mutationName, args });
    
    // Simulate network delay
    await this.delay(50 + Math.random() * 100);
    
    // Simulate occasional failures for testing retry logic
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Simulated ${mutationName} failure`);
    }
    
    return { success: true, id: `sim_${Date.now()}` };
  }

  /**
   * Simulate Convex query call (placeholder)
   */
  private async simulateConvexQuery(queryName: string, args: any): Promise<any> {
    // This is a placeholder - in real implementation, this would be:
    // return await this.convex.query(api.queries[queryName], args);
    
    this.persistenceLogger.debug('Simulated Convex query', { queryName, args });
    
    // Simulate network delay
    await this.delay(30 + Math.random() * 70);
    
    // Simulate occasional failures for testing retry logic
    if (Math.random() < 0.03) { // 3% failure rate
      throw new Error(`Simulated ${queryName} failure`);
    }
    
    // Return null for now (no snapshot found)
    return null;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}