"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManagementSystem = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const MemoryManager_1 = require("./MemoryManager");
const GarbageCollector_1 = require("./GarbageCollector");
const MemoryLeakDetector_1 = require("./MemoryLeakDetector");
const DataStructureOptimizer_1 = require("./DataStructureOptimizer");
class MemoryManagementSystem extends events_1.EventEmitter {
    config;
    systemLogger;
    memoryManager;
    garbageCollector;
    leakDetector;
    optimizer;
    roomManager;
    optimizationInterval;
    isInitialized = false;
    constructor(config = {}) {
        super();
        this.config = {
            memoryManager: config.memoryManager || {},
            garbageCollector: config.garbageCollector || {},
            leakDetector: config.leakDetector || {},
            optimizer: config.optimizer || {},
            enableMemoryManagement: config.enableMemoryManagement ?? true,
            enableGarbageCollection: config.enableGarbageCollection ?? true,
            enableLeakDetection: config.enableLeakDetection ?? true,
            enableOptimization: config.enableOptimization ?? true,
            autoOptimizeRooms: config.autoOptimizeRooms ?? true,
            optimizationIntervalMs: config.optimizationIntervalMs || 300000,
        };
        this.systemLogger = logger_1.logger.child({ component: 'MemoryManagementSystem' });
        this.memoryManager = new MemoryManager_1.MemoryManager(this.config.memoryManager);
        this.garbageCollector = new GarbageCollector_1.GarbageCollector(this.config.garbageCollector);
        this.leakDetector = new MemoryLeakDetector_1.MemoryLeakDetector(this.config.leakDetector);
        this.optimizer = new DataStructureOptimizer_1.DataStructureOptimizer(this.config.optimizer);
        this.setupEventHandlers();
        this.systemLogger.info('MemoryManagementSystem initialized', {
            enableMemoryManagement: this.config.enableMemoryManagement,
            enableGarbageCollection: this.config.enableGarbageCollection,
            enableLeakDetection: this.config.enableLeakDetection,
            enableOptimization: this.config.enableOptimization
        });
    }
    async initialize(roomManager) {
        if (this.isInitialized) {
            this.systemLogger.warn('Memory management system already initialized');
            return;
        }
        try {
            if (roomManager) {
                this.setRoomManager(roomManager);
            }
            if (this.config.enableOptimization && this.config.autoOptimizeRooms) {
                this.startOptimizationInterval();
            }
            this.isInitialized = true;
            this.systemLogger.info('Memory management system initialized successfully', {
                hasRoomManager: !!this.roomManager,
                autoOptimizeRooms: this.config.autoOptimizeRooms
            });
            this.emit('initialized');
        }
        catch (error) {
            this.systemLogger.error('Failed to initialize memory management system', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    setRoomManager(roomManager) {
        this.roomManager = roomManager;
        if (this.config.enableMemoryManagement) {
            this.memoryManager.setRoomManager(roomManager);
        }
        if (this.config.enableOptimization) {
            roomManager.on('roomCreated', (room) => {
                this.optimizer.optimizeGameState(room.gameState);
            });
            roomManager.on('roomStateChanged', ({ room }) => {
                if (this.config.autoOptimizeRooms) {
                    this.optimizer.optimizeGameState(room.gameState);
                }
            });
        }
        if (this.config.enableLeakDetection) {
            roomManager.on('roomCreated', () => {
                this.leakDetector.trackObject('rooms', 1);
            });
            roomManager.on('roomRemoved', () => {
                this.leakDetector.trackObject('rooms', -1);
            });
            roomManager.on('participantJoined', () => {
                this.leakDetector.trackObject('participants', 1);
            });
            roomManager.on('participantLeft', () => {
                this.leakDetector.trackObject('participants', -1);
            });
        }
        this.systemLogger.info('Room manager connected to memory management system');
    }
    getMemoryStatus() {
        const memoryReport = this.memoryManager.getMemoryReport();
        const gcStats = this.garbageCollector.getGcStats();
        const leakStatus = this.leakDetector.getDetectionStatus();
        const optimizationHistory = this.optimizer.getOptimizationHistory();
        let systemHealth = 'healthy';
        const recentAlerts = memoryReport.alerts.filter(alert => Date.now() - alert.timestamp.getTime() < 300000);
        const criticalAlerts = recentAlerts.filter(alert => alert.type === 'critical');
        const warningAlerts = recentAlerts.filter(alert => alert.type === 'warning');
        const leakAlerts = leakStatus.leakReports.filter(report => Date.now() - report.timestamp.getTime() < 300000 &&
            (report.severity === 'high' || report.severity === 'critical'));
        if (criticalAlerts.length > 0 || leakAlerts.length > 2) {
            systemHealth = 'critical';
        }
        else if (warningAlerts.length > 2 || leakAlerts.length > 0) {
            systemHealth = 'warning';
        }
        return {
            memoryStats: memoryReport,
            gcStats,
            leakDetectionStatus: leakStatus,
            optimizationHistory: optimizationHistory.slice(-10),
            systemHealth
        };
    }
    async forceCleanup() {
        this.systemLogger.info('Starting forced memory cleanup');
        const results = {
            gcResult: null,
            staleDataCleaned: 0,
            optimizationResults: []
        };
        try {
            if (this.config.enableGarbageCollection) {
                results.gcResult = await this.garbageCollector.forceGc();
            }
            if (this.config.enableMemoryManagement) {
                results.staleDataCleaned = await this.memoryManager.cleanupStaleData();
            }
            if (this.config.enableOptimization && this.roomManager) {
                const rooms = this.roomManager.getAllRooms();
                for (const room of rooms) {
                    const optimizations = this.optimizer.optimizeGameState(room.gameState);
                    results.optimizationResults.push(...optimizations);
                }
            }
            this.systemLogger.info('Forced memory cleanup completed', {
                gcSuccess: results.gcResult?.success,
                memoryFreed: results.gcResult?.memoryFreed || 0,
                staleDataCleaned: results.staleDataCleaned,
                optimizations: results.optimizationResults.length
            });
            this.emit('cleanupCompleted', results);
        }
        catch (error) {
            this.systemLogger.error('Error during forced cleanup', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
        return results;
    }
    getPoolStats() {
        return this.optimizer.getPoolStats();
    }
    forceLeakDetection() {
        return this.leakDetector.forceDetection();
    }
    optimizeRoom(roomId) {
        if (!this.roomManager) {
            throw new Error('Room manager not set');
        }
        const room = this.roomManager.getRoom(roomId);
        if (!room) {
            throw new Error(`Room not found: ${roomId}`);
        }
        return this.optimizer.optimizeGameState(room.gameState);
    }
    setComponentEnabled(component, enabled) {
        switch (component) {
            case 'memoryManager':
                this.config.enableMemoryManagement = enabled;
                break;
            case 'garbageCollector':
                this.config.enableGarbageCollection = enabled;
                break;
            case 'leakDetector':
                this.config.enableLeakDetection = enabled;
                if (enabled) {
                    this.leakDetector.startDetection();
                }
                else {
                    this.leakDetector.stopDetection();
                }
                break;
            case 'optimizer':
                this.config.enableOptimization = enabled;
                if (enabled && this.config.autoOptimizeRooms && !this.optimizationInterval) {
                    this.startOptimizationInterval();
                }
                else if (!enabled && this.optimizationInterval) {
                    this.stopOptimizationInterval();
                }
                break;
        }
        this.systemLogger.info('Component enabled/disabled', { component, enabled });
    }
    async shutdown() {
        this.systemLogger.info('Shutting down memory management system');
        try {
            this.stopOptimizationInterval();
            this.memoryManager.shutdown();
            this.garbageCollector.shutdown();
            this.leakDetector.shutdown();
            this.optimizer.shutdown();
            this.roomManager = undefined;
            this.isInitialized = false;
            this.removeAllListeners();
            this.systemLogger.info('Memory management system shutdown completed');
        }
        catch (error) {
            this.systemLogger.error('Error during shutdown', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    setupEventHandlers() {
        this.memoryManager.on('memoryAlert', (alert) => {
            if (alert.type === 'critical' && this.config.enableGarbageCollection) {
                this.garbageCollector.triggerGc('pressure');
            }
            this.emit('memoryAlert', alert);
        });
        this.garbageCollector.on('gcCompleted', (metrics) => {
            if (this.config.enableLeakDetection) {
                if (metrics.memoryFreed < 10 && metrics.beforeStats.heapUsed > 200) {
                    this.leakDetector.forceDetection();
                }
            }
            this.emit('gcCompleted', metrics);
        });
        this.leakDetector.on('leakDetected', (result) => {
            if (result.severity === 'high' || result.severity === 'critical') {
                if (this.config.enableOptimization && this.roomManager) {
                    const rooms = this.roomManager.getAllRooms();
                    for (const room of rooms) {
                        this.optimizer.optimizeGameState(room.gameState);
                    }
                }
            }
            this.emit('leakDetected', result);
        });
        this.memoryManager.on('memoryStats', (stats) => {
            if (this.config.enableGarbageCollection) {
                const previousStats = this.memoryManager.getMemoryHistory().slice(-2)[0]?.stats;
                if (this.garbageCollector.shouldTriggerGc(stats, previousStats)) {
                    this.garbageCollector.triggerGc('automatic');
                }
            }
            this.emit('memoryStats', stats);
        });
    }
    startOptimizationInterval() {
        if (this.optimizationInterval) {
            return;
        }
        this.optimizationInterval = setInterval(async () => {
            if (!this.roomManager || !this.config.enableOptimization) {
                return;
            }
            try {
                const rooms = this.roomManager.getAllRooms();
                let totalOptimizations = 0;
                for (const room of rooms) {
                    const results = this.optimizer.optimizeGameState(room.gameState);
                    totalOptimizations += results.length;
                }
                if (totalOptimizations > 0) {
                    this.systemLogger.debug('Automatic room optimization completed', {
                        roomsProcessed: rooms.length,
                        totalOptimizations
                    });
                }
            }
            catch (error) {
                this.systemLogger.error('Error during automatic optimization', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }, this.config.optimizationIntervalMs);
        this.systemLogger.info('Optimization interval started', {
            intervalMs: this.config.optimizationIntervalMs
        });
    }
    stopOptimizationInterval() {
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
            this.optimizationInterval = undefined;
            this.systemLogger.info('Optimization interval stopped');
        }
    }
}
exports.MemoryManagementSystem = MemoryManagementSystem;
//# sourceMappingURL=MemoryManagementSystem.js.map