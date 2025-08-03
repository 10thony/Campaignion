"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatePersistence = void 0;
const logger_1 = require("../utils/logger");
const validators_1 = require("../schemas/validators");
const zlib = __importStar(require("zlib"));
const util_1 = require("util");
class StatePersistence {
    config;
    persistenceLogger;
    gzip = (0, util_1.promisify)(zlib.gzip);
    gunzip = (0, util_1.promisify)(zlib.gunzip);
    recoveryCache = new Map();
    constructor(config) {
        this.config = {
            batchSize: config.batchSize || 10,
            retryAttempts: config.retryAttempts || 3,
            retryDelayMs: config.retryDelayMs || 1000,
            compressionEnabled: config.compressionEnabled ?? true,
            compressionThreshold: config.compressionThreshold || 1024,
            maxSnapshotAge: config.maxSnapshotAge || 24 * 60 * 60 * 1000,
            recoveryEnabled: config.recoveryEnabled ?? true,
            ...config
        };
        this.persistenceLogger = logger_1.logger.child({ component: 'StatePersistence' });
        this.persistenceLogger.info('StatePersistence initialized', {
            convexUrl: this.config.convexUrl,
            batchSize: this.config.batchSize,
            compressionEnabled: this.config.compressionEnabled,
            compressionThreshold: this.config.compressionThreshold,
            recoveryEnabled: this.config.recoveryEnabled
        });
    }
    convertMapsToObjects(gameState) {
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
    async saveSnapshot(room, trigger) {
        const validationGameState = this.convertMapsToObjects(room.gameState);
        const validationResult = (0, validators_1.validateGameState)(validationGameState);
        if (!validationResult.valid) {
            this.persistenceLogger.error('Invalid game state detected before save', {
                interactionId: room.interactionId,
                errors: validationResult.errors,
                trigger
            });
            throw new Error(`Invalid game state: ${validationResult.errors.join(', ')}`);
        }
        const optimizedGameState = this.optimizeGameState(room.gameState);
        let snapshot = {
            interactionId: room.interactionId,
            gameState: optimizedGameState,
            participantCount: room.participants.size,
            connectedParticipants: room.getAllParticipants()
                .filter(p => p.isConnected)
                .map(p => p.userId),
            timestamp: Date.now(),
            trigger
        };
        snapshot = await this.compressSnapshotIfNeeded(snapshot);
        snapshot.checksum = this.calculateChecksum(snapshot);
        await this.saveSnapshotWithRetry(snapshot);
    }
    async loadSnapshot(interactionId) {
        try {
            this.persistenceLogger.debug('Loading state snapshot', { interactionId });
            const snapshot = await this.loadSnapshotWithRetry(interactionId);
            if (snapshot) {
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
            }
            else {
                this.persistenceLogger.debug('No state snapshot found', { interactionId });
            }
            return snapshot;
        }
        catch (error) {
            this.persistenceLogger.error('Error loading state snapshot', {
                interactionId,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }
    async saveEventLog(interactionId, eventType, eventData, userId, entityId) {
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
        }
        catch (error) {
            this.persistenceLogger.error('Error saving event log', {
                interactionId,
                eventType,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async saveTurnRecord(interactionId, turnRecord) {
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
        }
        catch (error) {
            this.persistenceLogger.error('Error saving turn record', {
                interactionId,
                entityId: turnRecord.entityId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    async updateInteractionStatus(interactionId, status, additionalData) {
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
        }
        catch (error) {
            this.persistenceLogger.error('Error updating interaction status', {
                interactionId,
                status,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    shouldPersist(trigger) {
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
    async recoverRoomState(interactionId) {
        if (!this.config.recoveryEnabled) {
            this.persistenceLogger.warn('Recovery disabled, cannot recover room state', { interactionId });
            return null;
        }
        const recoveryInfo = {
            interactionId,
            lastSnapshot: null,
            lastActivity: Date.now(),
            recoveryAttempts: 0,
            recoveryStatus: 'pending'
        };
        this.recoveryCache.set(interactionId, recoveryInfo);
        try {
            this.persistenceLogger.info('Starting room state recovery', { interactionId });
            const snapshot = await this.loadSnapshot(interactionId);
            if (!snapshot) {
                recoveryInfo.recoveryStatus = 'failed';
                recoveryInfo.errorDetails = 'No snapshot found';
                this.persistenceLogger.warn('No snapshot found for recovery', { interactionId });
                return null;
            }
            recoveryInfo.lastSnapshot = snapshot;
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
            let gameState = snapshot.gameState;
            if (snapshot.compressed) {
                gameState = await this.decompressGameState(snapshot);
            }
            const validationResult = (0, validators_1.validateGameState)(gameState);
            if (!validationResult.valid) {
                recoveryInfo.recoveryStatus = 'failed';
                recoveryInfo.errorDetails = `Invalid recovered state: ${validationResult.errors.join(', ')}`;
                this.persistenceLogger.error('Recovered state validation failed', {
                    interactionId,
                    errors: validationResult.errors
                });
                return null;
            }
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
        }
        catch (error) {
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
    getRecoveryInfo(interactionId) {
        return this.recoveryCache.get(interactionId) || null;
    }
    clearRecoveryInfo(interactionId) {
        this.recoveryCache.delete(interactionId);
    }
    getStatistics() {
        return {
            totalSnapshots: 0,
            compressionRatio: 0,
            averageSnapshotSize: 0,
            recoveryAttempts: 0,
            successfulRecoveries: 0
        };
    }
    async compressSnapshotIfNeeded(snapshot) {
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
                gameState: compressed,
                compressed: true,
                originalSize,
                compressedSize
            };
        }
        catch (error) {
            this.persistenceLogger.warn('Compression failed, saving uncompressed', {
                interactionId: snapshot.interactionId,
                error: error instanceof Error ? error.message : String(error)
            });
            return snapshot;
        }
    }
    async decompressGameState(snapshot) {
        if (!snapshot.compressed) {
            return snapshot.gameState;
        }
        try {
            const decompressed = await this.gunzip(snapshot.gameState);
            const gameState = JSON.parse(decompressed.toString('utf8'));
            this.persistenceLogger.debug('State decompressed', {
                interactionId: snapshot.interactionId,
                originalSize: snapshot.originalSize,
                compressedSize: snapshot.compressedSize
            });
            return gameState;
        }
        catch (error) {
            this.persistenceLogger.error('Decompression failed', {
                interactionId: snapshot.interactionId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`Failed to decompress game state: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    calculateChecksum(snapshot) {
        const crypto = require('crypto');
        const data = JSON.stringify({
            interactionId: snapshot.interactionId,
            gameState: snapshot.gameState,
            timestamp: snapshot.timestamp,
            trigger: snapshot.trigger
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    optimizeGameState(gameState) {
        const optimized = JSON.parse(JSON.stringify(gameState));
        const maxChatMessages = 100;
        if (optimized.chatLog.length > maxChatMessages) {
            optimized.chatLog = optimized.chatLog.slice(-maxChatMessages);
        }
        const maxTurnHistory = 50;
        if (optimized.turnHistory.length > maxTurnHistory) {
            optimized.turnHistory = optimized.turnHistory.slice(-maxTurnHistory);
        }
        Object.values(optimized.participants).forEach((participant) => {
            delete participant.tempUIState;
            delete participant.clientPredictions;
        });
        return optimized;
    }
    async saveSnapshotWithRetry(snapshot) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                await this.simulateConvexMutation('saveStateSnapshot', snapshot);
                this.persistenceLogger.info('State snapshot saved', {
                    interactionId: snapshot.interactionId,
                    trigger: snapshot.trigger,
                    timestamp: snapshot.timestamp,
                    attempt
                });
                return;
            }
            catch (error) {
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
    async loadSnapshotWithRetry(interactionId) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const snapshot = await this.simulateConvexQuery('getLatestStateSnapshot', { interactionId });
                return snapshot;
            }
            catch (error) {
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
    async saveEventLogWithRetry(logEntry) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                await this.simulateConvexMutation('saveEventLog', logEntry);
                return;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelayMs * attempt);
                }
            }
        }
        throw new Error(`Failed to save event log after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
    }
    async saveTurnRecordWithRetry(record) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                await this.simulateConvexMutation('saveTurnRecord', record);
                return;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelayMs * attempt);
                }
            }
        }
        throw new Error(`Failed to save turn record after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
    }
    async updateInteractionStatusWithRetry(interactionId, updateData) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                await this.simulateConvexMutation('updateInteractionStatus', { interactionId, ...updateData });
                return;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelayMs * attempt);
                }
            }
        }
        throw new Error(`Failed to update interaction status after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
    }
    generateSessionId(interactionId) {
        const timestamp = Date.now();
        return `${interactionId}-${timestamp}`;
    }
    async simulateConvexMutation(mutationName, args) {
        this.persistenceLogger.debug('Simulated Convex mutation', { mutationName, args });
        await this.delay(50 + Math.random() * 100);
        if (Math.random() < 0.05) {
            throw new Error(`Simulated ${mutationName} failure`);
        }
        return { success: true, id: `sim_${Date.now()}` };
    }
    async simulateConvexQuery(queryName, args) {
        this.persistenceLogger.debug('Simulated Convex query', { queryName, args });
        await this.delay(30 + Math.random() * 70);
        if (Math.random() < 0.03) {
            throw new Error(`Simulated ${queryName} failure`);
        }
        return null;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.StatePersistence = StatePersistence;
//# sourceMappingURL=StatePersistence.js.map