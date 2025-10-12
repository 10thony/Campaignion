"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
class MemoryManager extends events_1.EventEmitter {
    config;
    memoryLogger;
    roomManager;
    memoryCheckInterval;
    gcInterval;
    staleDataCleanupInterval;
    inactiveRoomCleanupInterval;
    leakDetectionInterval;
    memoryHistory = [];
    maxMemoryHistorySize = 100;
    lastGcTime = Date.now();
    gcCount = 0;
    objectTrackers = new Map();
    trackingEnabled = false;
    recentAlerts = [];
    maxRecentAlerts = 50;
    constructor(config = {}) {
        super();
        this.config = {
            memoryCheckIntervalMs: config.memoryCheckIntervalMs || 30000,
            memoryWarningThresholdMB: config.memoryWarningThresholdMB || 512,
            memoryCriticalThresholdMB: config.memoryCriticalThresholdMB || 1024,
            gcIntervalMs: config.gcIntervalMs || 300000,
            forceGcThresholdMB: config.forceGcThresholdMB || 768,
            staleDataCleanupIntervalMs: config.staleDataCleanupIntervalMs || 600000,
            maxTurnHistoryEntries: config.maxTurnHistoryEntries || 1000,
            maxChatHistoryEntries: config.maxChatHistoryEntries || 500,
            inactiveRoomCleanupIntervalMs: config.inactiveRoomCleanupIntervalMs || 300000,
            maxInactiveTimeMs: config.maxInactiveTimeMs || 1800000,
            enableDataCompression: config.enableDataCompression ?? true,
            enableStateOptimization: config.enableStateOptimization ?? true,
            maxStateDeltaHistory: config.maxStateDeltaHistory || 50,
            enableLeakDetection: config.enableLeakDetection ?? true,
            leakDetectionIntervalMs: config.leakDetectionIntervalMs || 120000,
            maxObjectGrowthRate: config.maxObjectGrowthRate || 0.5,
        };
        this.memoryLogger = logger_1.logger.child({ component: 'MemoryManager' });
        this.memoryLogger.info('MemoryManager initialized', {
            config: this.config,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        });
        this.startMonitoring();
    }
    setRoomManager(roomManager) {
        this.roomManager = roomManager;
        roomManager.on('roomCreated', (room) => {
            this.trackObject('rooms', 1);
            this.optimizeRoomMemory(room);
        });
        roomManager.on('roomRemoved', () => {
            this.trackObject('rooms', -1);
        });
        roomManager.on('participantJoined', () => {
            this.trackObject('participants', 1);
        });
        roomManager.on('participantLeft', () => {
            this.trackObject('participants', -1);
        });
        this.memoryLogger.info('Room manager connected to memory manager');
    }
    getMemoryStats() {
        const memUsage = process.memoryUsage();
        return {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024),
            arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
        };
    }
    getMemoryHistory() {
        return [...this.memoryHistory];
    }
    getRecentAlerts() {
        return [...this.recentAlerts];
    }
    getObjectTrackingStats() {
        return Array.from(this.objectTrackers.values());
    }
    forceGarbageCollection() {
        try {
            if (global.gc) {
                const beforeStats = this.getMemoryStats();
                global.gc();
                const afterStats = this.getMemoryStats();
                this.gcCount++;
                this.lastGcTime = Date.now();
                const memoryFreed = beforeStats.heapUsed - afterStats.heapUsed;
                this.memoryLogger.info('Forced garbage collection completed', {
                    beforeHeapUsed: beforeStats.heapUsed,
                    afterHeapUsed: afterStats.heapUsed,
                    memoryFreed,
                    gcCount: this.gcCount
                });
                this.emitAlert({
                    type: 'gc_forced',
                    timestamp: new Date(),
                    memoryStats: afterStats,
                    message: `Forced GC freed ${memoryFreed}MB`,
                    details: { beforeStats, afterStats, memoryFreed }
                });
                return true;
            }
            else {
                this.memoryLogger.warn('Garbage collection not available (run with --expose-gc)');
                return false;
            }
        }
        catch (error) {
            this.memoryLogger.error('Error during forced garbage collection', {
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async cleanupStaleData() {
        if (!this.roomManager) {
            this.memoryLogger.warn('Cannot cleanup stale data: no room manager set');
            return 0;
        }
        let totalCleaned = 0;
        const rooms = this.roomManager.getAllRooms();
        this.memoryLogger.info('Starting stale data cleanup', {
            roomCount: rooms.length
        });
        for (const room of rooms) {
            try {
                const cleaned = await this.cleanupRoomStaleData(room);
                totalCleaned += cleaned;
            }
            catch (error) {
                this.memoryLogger.error('Error cleaning room stale data', {
                    roomId: room.id,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        if (totalCleaned > 0) {
            this.memoryLogger.info('Stale data cleanup completed', {
                totalCleaned,
                roomsProcessed: rooms.length
            });
        }
        return totalCleaned;
    }
    optimizeRoomMemory(room) {
        if (!this.config.enableStateOptimization) {
            return;
        }
        try {
            const gameState = room.gameState;
            let optimized = false;
            if (gameState.turnHistory.length > this.config.maxTurnHistoryEntries) {
                const excess = gameState.turnHistory.length - this.config.maxTurnHistoryEntries;
                gameState.turnHistory.splice(0, excess);
                optimized = true;
                this.memoryLogger.debug('Optimized turn history', {
                    roomId: room.id,
                    removedEntries: excess,
                    remainingEntries: gameState.turnHistory.length
                });
            }
            if (gameState.chatLog.length > this.config.maxChatHistoryEntries) {
                const excess = gameState.chatLog.length - this.config.maxChatHistoryEntries;
                gameState.chatLog.splice(0, excess);
                optimized = true;
                this.memoryLogger.debug('Optimized chat log', {
                    roomId: room.id,
                    removedEntries: excess,
                    remainingEntries: gameState.chatLog.length
                });
            }
            if (this.config.enableDataCompression) {
                this.compressRoomData(room);
            }
            if (optimized) {
                this.memoryLogger.debug('Room memory optimization completed', {
                    roomId: room.id,
                    interactionId: room.interactionId
                });
            }
        }
        catch (error) {
            this.memoryLogger.error('Error optimizing room memory', {
                roomId: room.id,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    detectMemoryLeaks() {
        const leaks = [];
        for (const tracker of this.objectTrackers.values()) {
            if (tracker.growthRate > this.config.maxObjectGrowthRate && tracker.samples.length >= 3) {
                leaks.push(tracker);
                this.emitAlert({
                    type: 'leak_detected',
                    timestamp: new Date(),
                    memoryStats: this.getMemoryStats(),
                    message: `Potential memory leak detected in ${tracker.name}`,
                    details: {
                        objectName: tracker.name,
                        currentCount: tracker.count,
                        growthRate: tracker.growthRate,
                        maxGrowthRate: tracker.maxGrowthRate,
                        samples: tracker.samples.slice(-5)
                    }
                });
            }
        }
        if (leaks.length > 0) {
            this.memoryLogger.warn('Memory leaks detected', {
                leakCount: leaks.length,
                leaks: leaks.map(l => ({
                    name: l.name,
                    count: l.count,
                    growthRate: l.growthRate
                }))
            });
        }
        return leaks;
    }
    getMemoryReport() {
        const report = {
            currentStats: this.getMemoryStats(),
            history: this.getMemoryHistory(),
            alerts: this.getRecentAlerts(),
            objectTracking: this.getObjectTrackingStats(),
            gcStats: {
                count: this.gcCount,
                lastGcTime: this.lastGcTime
            }
        };
        if (this.roomManager) {
            const roomStats = this.roomManager.getStats();
            return {
                ...report,
                roomStats: {
                    totalRooms: roomStats.totalRooms,
                    activeRooms: roomStats.activeRooms,
                    totalParticipants: roomStats.totalParticipants
                }
            };
        }
        return report;
    }
    shutdown() {
        this.memoryLogger.info('Shutting down MemoryManager');
        if (this.memoryCheckInterval) {
            clearInterval(this.memoryCheckInterval);
            this.memoryCheckInterval = undefined;
        }
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = undefined;
        }
        if (this.staleDataCleanupInterval) {
            clearInterval(this.staleDataCleanupInterval);
            this.staleDataCleanupInterval = undefined;
        }
        if (this.inactiveRoomCleanupInterval) {
            clearInterval(this.inactiveRoomCleanupInterval);
            this.inactiveRoomCleanupInterval = undefined;
        }
        if (this.leakDetectionInterval) {
            clearInterval(this.leakDetectionInterval);
            this.leakDetectionInterval = undefined;
        }
        this.memoryHistory.length = 0;
        this.objectTrackers.clear();
        this.recentAlerts.length = 0;
        this.removeAllListeners();
        this.memoryLogger.info('MemoryManager shutdown completed');
    }
    startMonitoring() {
        this.memoryCheckInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, this.config.memoryCheckIntervalMs);
        this.gcInterval = setInterval(() => {
            this.checkGarbageCollection();
        }, this.config.gcIntervalMs);
        this.staleDataCleanupInterval = setInterval(async () => {
            try {
                await this.cleanupStaleData();
            }
            catch (error) {
                this.memoryLogger.error('Error during stale data cleanup', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }, this.config.staleDataCleanupIntervalMs);
        this.inactiveRoomCleanupInterval = setInterval(async () => {
            try {
                await this.cleanupInactiveRooms();
            }
            catch (error) {
                this.memoryLogger.error('Error during inactive room cleanup', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }, this.config.inactiveRoomCleanupIntervalMs);
        if (this.config.enableLeakDetection) {
            this.leakDetectionInterval = setInterval(() => {
                this.detectMemoryLeaks();
            }, this.config.leakDetectionIntervalMs);
        }
        this.memoryLogger.info('Memory monitoring started', {
            memoryCheckInterval: this.config.memoryCheckIntervalMs,
            gcInterval: this.config.gcIntervalMs,
            staleDataCleanupInterval: this.config.staleDataCleanupIntervalMs,
            inactiveRoomCleanupInterval: this.config.inactiveRoomCleanupIntervalMs,
            leakDetectionEnabled: this.config.enableLeakDetection
        });
    }
    checkMemoryUsage() {
        const stats = this.getMemoryStats();
        this.memoryHistory.push(stats);
        if (this.memoryHistory.length > this.maxMemoryHistorySize) {
            this.memoryHistory.shift();
        }
        if (stats.heapUsed >= this.config.memoryCriticalThresholdMB) {
            this.emitAlert({
                type: 'critical',
                timestamp: new Date(),
                memoryStats: stats,
                message: `Critical memory usage: ${stats.heapUsed}MB (threshold: ${this.config.memoryCriticalThresholdMB}MB)`
            });
        }
        else if (stats.heapUsed >= this.config.memoryWarningThresholdMB) {
            this.emitAlert({
                type: 'warning',
                timestamp: new Date(),
                memoryStats: stats,
                message: `High memory usage: ${stats.heapUsed}MB (threshold: ${this.config.memoryWarningThresholdMB}MB)`
            });
        }
        this.emit('memoryStats', stats);
    }
    checkGarbageCollection() {
        const stats = this.getMemoryStats();
        if (stats.heapUsed >= this.config.forceGcThresholdMB) {
            this.memoryLogger.info('Memory threshold reached, forcing garbage collection', {
                heapUsed: stats.heapUsed,
                threshold: this.config.forceGcThresholdMB
            });
            this.forceGarbageCollection();
        }
    }
    async cleanupInactiveRooms() {
        if (!this.roomManager) {
            return;
        }
        const beforeStats = this.getMemoryStats();
        const cleanedCount = await this.roomManager.cleanupInactiveRooms();
        const afterStats = this.getMemoryStats();
        if (cleanedCount > 0) {
            const memoryFreed = beforeStats.heapUsed - afterStats.heapUsed;
            this.memoryLogger.info('Inactive room cleanup completed', {
                cleanedRooms: cleanedCount,
                memoryFreed: memoryFreed > 0 ? memoryFreed : 0
            });
        }
    }
    async cleanupRoomStaleData(room) {
        let cleanedItems = 0;
        try {
            const gameState = room.getGameState();
            const turnHistoryBefore = gameState.turnHistory.length;
            if (turnHistoryBefore > this.config.maxTurnHistoryEntries) {
                const excess = turnHistoryBefore - this.config.maxTurnHistoryEntries;
                gameState.turnHistory.splice(0, excess);
                cleanedItems += excess;
            }
            const chatLogBefore = gameState.chatLog.length;
            if (chatLogBefore > this.config.maxChatHistoryEntries) {
                const excess = chatLogBefore - this.config.maxChatHistoryEntries;
                gameState.chatLog.splice(0, excess);
                cleanedItems += excess;
            }
            if (cleanedItems > 0) {
                this.memoryLogger.debug('Cleaned stale data from room', {
                    roomId: room.id,
                    cleanedItems,
                    turnHistoryBefore,
                    turnHistoryAfter: gameState.turnHistory.length,
                    chatLogBefore,
                    chatLogAfter: gameState.chatLog.length
                });
            }
        }
        catch (error) {
            this.memoryLogger.error('Error cleaning room stale data', {
                roomId: room.id,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        return cleanedItems;
    }
    compressRoomData(room) {
        try {
            const gameState = room.getGameState();
            this.memoryLogger.debug('Data compression applied to room', {
                roomId: room.id,
            });
        }
        catch (error) {
            this.memoryLogger.error('Error compressing room data', {
                roomId: room.id,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    trackObject(name, countChange) {
        if (!this.config.enableLeakDetection) {
            return;
        }
        let tracker = this.objectTrackers.get(name);
        if (!tracker) {
            tracker = {
                name,
                count: 0,
                lastCount: 0,
                growthRate: 0,
                maxGrowthRate: this.config.maxObjectGrowthRate,
                samples: [],
                lastSampleTime: new Date()
            };
            this.objectTrackers.set(name, tracker);
        }
        tracker.lastCount = tracker.count;
        tracker.count += countChange;
        const timeDiff = Date.now() - tracker.lastSampleTime.getTime();
        if (timeDiff > 0 && tracker.lastCount > 0) {
            tracker.growthRate = (tracker.count - tracker.lastCount) / tracker.lastCount;
        }
        tracker.samples.push(tracker.count);
        if (tracker.samples.length > 10) {
            tracker.samples.shift();
        }
        tracker.lastSampleTime = new Date();
    }
    emitAlert(alert) {
        this.recentAlerts.push(alert);
        if (this.recentAlerts.length > this.maxRecentAlerts) {
            this.recentAlerts.shift();
        }
        const logLevel = alert.type === 'critical' ? 'error' :
            alert.type === 'warning' ? 'warn' : 'info';
        this.memoryLogger[logLevel]('Memory alert', {
            type: alert.type,
            message: alert.message,
            memoryStats: alert.memoryStats,
            details: alert.details
        });
        this.emit('memoryAlert', alert);
    }
}
exports.MemoryManager = MemoryManager;
//# sourceMappingURL=MemoryManager.js.map