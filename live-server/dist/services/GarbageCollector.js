"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GarbageCollector = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
class GarbageCollector extends events_1.EventEmitter {
    config;
    gcLogger;
    lastGcTime = 0;
    gcCount = 0;
    performanceHistory = [];
    strategies = new Map();
    currentStrategy;
    gcTimer;
    isGcInProgress = false;
    constructor(config = {}) {
        super();
        this.config = {
            strategy: config.strategy || 'balanced',
            heapGrowthThreshold: config.heapGrowthThreshold || 0.3,
            memoryPressureThreshold: config.memoryPressureThreshold || 512,
            minGcIntervalMs: config.minGcIntervalMs || 30000,
            maxGcIntervalMs: config.maxGcIntervalMs || 300000,
            enableIncrementalGc: config.enableIncrementalGc ?? true,
            enableGenerationalGc: config.enableGenerationalGc ?? true,
            trackGcPerformance: config.trackGcPerformance ?? true,
            maxPerformanceHistory: config.maxPerformanceHistory || 100,
        };
        this.gcLogger = logger_1.logger.child({ component: 'GarbageCollector' });
        this.initializeStrategies();
        this.currentStrategy = this.strategies.get(this.config.strategy);
        this.gcLogger.info('GarbageCollector initialized', {
            strategy: this.config.strategy,
            config: this.config,
            gcAvailable: !!global.gc
        });
        this.startGcTimer();
    }
    shouldTriggerGc(currentStats, previousStats) {
        if (this.isGcInProgress) {
            return false;
        }
        const timeSinceLastGc = Date.now() - this.lastGcTime;
        if (timeSinceLastGc < this.config.minGcIntervalMs) {
            return false;
        }
        if (timeSinceLastGc > this.config.maxGcIntervalMs) {
            this.gcLogger.info('GC triggered by maximum interval', {
                timeSinceLastGc,
                maxInterval: this.config.maxGcIntervalMs
            });
            return true;
        }
        if (currentStats.heapUsed > this.config.memoryPressureThreshold) {
            this.gcLogger.info('GC triggered by memory pressure', {
                heapUsed: currentStats.heapUsed,
                threshold: this.config.memoryPressureThreshold
            });
            return true;
        }
        if (previousStats) {
            const growthRate = (currentStats.heapUsed - previousStats.heapUsed) / previousStats.heapUsed;
            if (growthRate > this.config.heapGrowthThreshold) {
                this.gcLogger.info('GC triggered by heap growth', {
                    growthRate,
                    threshold: this.config.heapGrowthThreshold,
                    previousHeap: previousStats.heapUsed,
                    currentHeap: currentStats.heapUsed
                });
                return true;
            }
        }
        return this.currentStrategy.shouldTrigger(currentStats, this.lastGcTime);
    }
    async triggerGc(type = 'manual') {
        if (this.isGcInProgress) {
            this.gcLogger.warn('GC already in progress, skipping trigger');
            return null;
        }
        if (!global.gc) {
            this.gcLogger.warn('Garbage collection not available (run with --expose-gc)');
            return null;
        }
        this.isGcInProgress = true;
        try {
            const metrics = await this.currentStrategy.execute();
            metrics.type = type;
            this.lastGcTime = Date.now();
            this.gcCount++;
            if (this.config.trackGcPerformance) {
                this.addPerformanceMetrics(metrics);
            }
            this.gcLogger.info('Garbage collection completed', {
                type,
                durationMs: metrics.durationMs,
                memoryFreed: metrics.memoryFreed,
                heapReduction: metrics.heapReduction,
                gcCount: this.gcCount,
                strategy: this.currentStrategy.name
            });
            this.emit('gcCompleted', metrics);
            return metrics;
        }
        catch (error) {
            const errorMetrics = {
                timestamp: new Date(),
                type,
                beforeStats: this.getMemoryStats(),
                afterStats: this.getMemoryStats(),
                durationMs: 0,
                memoryFreed: 0,
                heapReduction: 0,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
            this.gcLogger.error('Garbage collection failed', {
                error: errorMetrics.error,
                type
            });
            this.emit('gcError', errorMetrics);
            return errorMetrics;
        }
        finally {
            this.isGcInProgress = false;
        }
    }
    setStrategy(strategyName) {
        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            this.gcLogger.error('Unknown GC strategy', { strategyName });
            return false;
        }
        const previousStrategy = this.currentStrategy.name;
        this.currentStrategy = strategy;
        this.config.strategy = strategyName;
        this.gcLogger.info('GC strategy changed', {
            from: previousStrategy,
            to: strategyName
        });
        this.emit('strategyChanged', { from: previousStrategy, to: strategyName });
        return true;
    }
    getGcStats() {
        const successfulGcs = this.performanceHistory.filter(m => m.success);
        const averageGcTime = successfulGcs.length > 0
            ? successfulGcs.reduce((sum, m) => sum + m.durationMs, 0) / successfulGcs.length
            : 0;
        const averageMemoryFreed = successfulGcs.length > 0
            ? successfulGcs.reduce((sum, m) => sum + m.memoryFreed, 0) / successfulGcs.length
            : 0;
        const successRate = this.performanceHistory.length > 0
            ? successfulGcs.length / this.performanceHistory.length
            : 1;
        return {
            gcCount: this.gcCount,
            lastGcTime: this.lastGcTime,
            isGcInProgress: this.isGcInProgress,
            currentStrategy: this.currentStrategy.name,
            performanceHistory: [...this.performanceHistory],
            averageGcTime,
            averageMemoryFreed,
            successRate
        };
    }
    optimizeGcStrategy() {
        if (this.performanceHistory.length < 10) {
            return;
        }
        const recentMetrics = this.performanceHistory.slice(-10);
        const averageDuration = recentMetrics.reduce((sum, m) => sum + m.durationMs, 0) / recentMetrics.length;
        const averageFreed = recentMetrics.reduce((sum, m) => sum + m.memoryFreed, 0) / recentMetrics.length;
        const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;
        this.gcLogger.info('GC performance analysis', {
            averageDuration,
            averageFreed,
            successRate,
            currentStrategy: this.currentStrategy.name
        });
        if (successRate < 0.8) {
            if (this.currentStrategy.name !== 'conservative') {
                this.setStrategy('conservative');
            }
        }
        else if (averageDuration > 100 && averageFreed < 50) {
            if (this.currentStrategy.name === 'aggressive') {
                this.setStrategy('balanced');
            }
        }
        else if (averageFreed > 100 && averageDuration < 50) {
            if (this.currentStrategy.name === 'conservative') {
                this.setStrategy('balanced');
            }
            else if (this.currentStrategy.name === 'balanced') {
                this.setStrategy('aggressive');
            }
        }
    }
    forceGc() {
        return this.triggerGc('manual');
    }
    shutdown() {
        this.gcLogger.info('Shutting down GarbageCollector');
        if (this.gcTimer) {
            clearTimeout(this.gcTimer);
            this.gcTimer = undefined;
        }
        this.performanceHistory.length = 0;
        this.strategies.clear();
        this.removeAllListeners();
        this.gcLogger.info('GarbageCollector shutdown completed');
    }
    initializeStrategies() {
        this.strategies.set('conservative', {
            name: 'conservative',
            shouldTrigger: (stats, lastGc) => {
                const timeSinceLastGc = Date.now() - lastGc;
                return stats.heapUsed > 800 || timeSinceLastGc > 600000;
            },
            execute: async () => this.executeBasicGc()
        });
        this.strategies.set('balanced', {
            name: 'balanced',
            shouldTrigger: (stats, lastGc) => {
                const timeSinceLastGc = Date.now() - lastGc;
                return stats.heapUsed > 400 || timeSinceLastGc > 300000;
            },
            execute: async () => this.executeBalancedGc()
        });
        this.strategies.set('aggressive', {
            name: 'aggressive',
            shouldTrigger: (stats, lastGc) => {
                const timeSinceLastGc = Date.now() - lastGc;
                return stats.heapUsed > 200 || timeSinceLastGc > 120000;
            },
            execute: async () => this.executeAggressiveGc()
        });
    }
    async executeBasicGc() {
        const startTime = Date.now();
        const beforeStats = this.getMemoryStats();
        try {
            global.gc();
            const afterStats = this.getMemoryStats();
            const durationMs = Date.now() - startTime;
            const memoryFreed = beforeStats.heapUsed - afterStats.heapUsed;
            const heapReduction = beforeStats.heapUsed > 0 ? memoryFreed / beforeStats.heapUsed : 0;
            return {
                timestamp: new Date(),
                type: 'manual',
                beforeStats,
                afterStats,
                durationMs,
                memoryFreed,
                heapReduction,
                success: true
            };
        }
        catch (error) {
            return {
                timestamp: new Date(),
                type: 'manual',
                beforeStats,
                afterStats: beforeStats,
                durationMs: Date.now() - startTime,
                memoryFreed: 0,
                heapReduction: 0,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async executeBalancedGc() {
        const startTime = Date.now();
        const beforeStats = this.getMemoryStats();
        try {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 10));
            global.gc();
            const afterStats = this.getMemoryStats();
            const durationMs = Date.now() - startTime;
            const memoryFreed = beforeStats.heapUsed - afterStats.heapUsed;
            const heapReduction = beforeStats.heapUsed > 0 ? memoryFreed / beforeStats.heapUsed : 0;
            return {
                timestamp: new Date(),
                type: 'manual',
                beforeStats,
                afterStats,
                durationMs,
                memoryFreed,
                heapReduction,
                success: true
            };
        }
        catch (error) {
            return {
                timestamp: new Date(),
                type: 'manual',
                beforeStats,
                afterStats: beforeStats,
                durationMs: Date.now() - startTime,
                memoryFreed: 0,
                heapReduction: 0,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async executeAggressiveGc() {
        const startTime = Date.now();
        const beforeStats = this.getMemoryStats();
        try {
            for (let i = 0; i < 3; i++) {
                global.gc();
                if (i < 2) {
                    await new Promise(resolve => setTimeout(resolve, 5));
                }
            }
            const afterStats = this.getMemoryStats();
            const durationMs = Date.now() - startTime;
            const memoryFreed = beforeStats.heapUsed - afterStats.heapUsed;
            const heapReduction = beforeStats.heapUsed > 0 ? memoryFreed / beforeStats.heapUsed : 0;
            return {
                timestamp: new Date(),
                type: 'manual',
                beforeStats,
                afterStats,
                durationMs,
                memoryFreed,
                heapReduction,
                success: true
            };
        }
        catch (error) {
            return {
                timestamp: new Date(),
                type: 'manual',
                beforeStats,
                afterStats: beforeStats,
                durationMs: Date.now() - startTime,
                memoryFreed: 0,
                heapReduction: 0,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
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
    addPerformanceMetrics(metrics) {
        this.performanceHistory.push(metrics);
        if (this.performanceHistory.length > this.config.maxPerformanceHistory) {
            this.performanceHistory.shift();
        }
    }
    startGcTimer() {
        this.gcTimer = setTimeout(() => {
            this.optimizeGcStrategy();
            this.startGcTimer();
        }, 300000);
    }
}
exports.GarbageCollector = GarbageCollector;
//# sourceMappingURL=GarbageCollector.js.map