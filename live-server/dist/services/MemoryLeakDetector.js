"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryLeakDetector = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
class MemoryLeakDetector extends events_1.EventEmitter {
    config;
    leakLogger;
    detectionInterval;
    snapshotInterval;
    isDetectionActive = false;
    memoryHistory = [];
    consecutiveGrowthCount = 0;
    lastMemoryCheck = 0;
    objectTrackers = new Map();
    heapSnapshots = [];
    leakReports = [];
    originalSetTimeout;
    originalSetInterval;
    originalClearTimeout;
    originalClearInterval;
    activeTimers = new Set();
    timerCreationStack = new Map();
    constructor(config = {}) {
        super();
        this.config = {
            detectionIntervalMs: config.detectionIntervalMs || 60000,
            heapSnapshotIntervalMs: config.heapSnapshotIntervalMs || 300000,
            memoryGrowthThreshold: config.memoryGrowthThreshold || 10,
            heapGrowthRateThreshold: config.heapGrowthRateThreshold || 0.1,
            consecutiveGrowthThreshold: config.consecutiveGrowthThreshold || 3,
            enableObjectTracking: config.enableObjectTracking ?? true,
            maxTrackedObjects: config.maxTrackedObjects || 1000,
            objectGrowthThreshold: config.objectGrowthThreshold || 100,
            enableEventListenerTracking: config.enableEventListenerTracking ?? true,
            maxEventListeners: config.maxEventListeners || 100,
            enableTimerTracking: config.enableTimerTracking ?? true,
            maxActiveTimers: config.maxActiveTimers || 50,
            maxHistorySize: config.maxHistorySize || 100,
            maxLeakReports: config.maxLeakReports || 50,
        };
        this.leakLogger = logger_1.logger.child({ component: 'MemoryLeakDetector' });
        this.originalSetTimeout = global.setTimeout;
        this.originalSetInterval = global.setInterval;
        this.originalClearTimeout = global.clearTimeout;
        this.originalClearInterval = global.clearInterval;
        this.leakLogger.info('MemoryLeakDetector initialized', {
            config: this.config
        });
        this.startDetection();
    }
    startDetection() {
        if (this.isDetectionActive) {
            this.leakLogger.warn('Detection already active');
            return;
        }
        this.isDetectionActive = true;
        if (this.config.enableTimerTracking) {
            this.installTimerTracking();
        }
        this.detectionInterval = setInterval(() => {
            this.performLeakDetection();
        }, this.config.detectionIntervalMs);
        this.snapshotInterval = setInterval(() => {
            this.takeHeapSnapshot();
        }, this.config.heapSnapshotIntervalMs);
        this.leakLogger.info('Leak detection started', {
            detectionInterval: this.config.detectionIntervalMs,
            snapshotInterval: this.config.heapSnapshotIntervalMs
        });
    }
    stopDetection() {
        if (!this.isDetectionActive) {
            return;
        }
        this.isDetectionActive = false;
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = undefined;
        }
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
            this.snapshotInterval = undefined;
        }
        if (this.config.enableTimerTracking) {
            this.uninstallTimerTracking();
        }
        this.leakLogger.info('Leak detection stopped');
    }
    trackObject(name, countChange) {
        if (!this.config.enableObjectTracking) {
            return;
        }
        let tracker = this.objectTrackers.get(name);
        if (!tracker) {
            if (this.objectTrackers.size >= this.config.maxTrackedObjects) {
                const oldestKey = this.objectTrackers.keys().next().value;
                this.objectTrackers.delete(oldestKey);
            }
            tracker = {
                name,
                count: 0,
                growthRate: 0,
                samples: [],
                lastUpdate: new Date()
            };
            this.objectTrackers.set(name, tracker);
        }
        const previousCount = tracker.count;
        tracker.count += countChange;
        const now = new Date();
        tracker.samples.push({ timestamp: now, count: tracker.count });
        const oneHourAgo = new Date(now.getTime() - 3600000);
        tracker.samples = tracker.samples.filter(s => s.timestamp > oneHourAgo);
        if (tracker.samples.length >= 2) {
            const oldestSample = tracker.samples[0];
            const timeDiffMinutes = (now.getTime() - oldestSample.timestamp.getTime()) / 60000;
            if (timeDiffMinutes > 0) {
                tracker.growthRate = (tracker.count - oldestSample.count) / timeDiffMinutes;
            }
        }
        tracker.lastUpdate = now;
        if (tracker.growthRate > this.config.objectGrowthThreshold) {
            this.reportLeak({
                timestamp: now,
                type: 'object_leak',
                severity: tracker.growthRate > this.config.objectGrowthThreshold * 2 ? 'high' : 'medium',
                description: `Potential object leak detected: ${name}`,
                memoryStats: this.getMemoryStats(),
                details: {
                    objectName: name,
                    currentCount: tracker.count,
                    growthRate: tracker.growthRate,
                    samples: tracker.samples.slice(-10)
                },
                recommendations: [
                    `Review ${name} object lifecycle management`,
                    'Check for proper cleanup in destructors',
                    'Verify event listeners are removed',
                    'Look for circular references'
                ]
            });
        }
    }
    getDetectionStatus() {
        return {
            isActive: this.isDetectionActive,
            memoryHistory: [...this.memoryHistory],
            objectTrackers: Array.from(this.objectTrackers.values()),
            heapSnapshots: [...this.heapSnapshots],
            leakReports: [...this.leakReports],
            activeTimers: this.activeTimers.size,
            consecutiveGrowthCount: this.consecutiveGrowthCount
        };
    }
    getLeakReportsBySeverity(severity) {
        if (severity) {
            return this.leakReports.filter(report => report.severity === severity);
        }
        return [...this.leakReports];
    }
    clearTrackingData() {
        this.memoryHistory.length = 0;
        this.objectTrackers.clear();
        this.heapSnapshots.length = 0;
        this.leakReports.length = 0;
        this.consecutiveGrowthCount = 0;
        this.lastMemoryCheck = 0;
        this.leakLogger.info('Tracking data cleared');
    }
    forceDetection() {
        const results = [];
        const memoryLeaks = this.checkMemoryGrowth();
        results.push(...memoryLeaks);
        const objectLeaks = this.checkObjectLeaks();
        results.push(...objectLeaks);
        if (this.config.enableTimerTracking) {
            const timerLeaks = this.checkTimerLeaks();
            results.push(...timerLeaks);
        }
        if (this.config.enableEventListenerTracking) {
            const listenerLeaks = this.checkEventListenerLeaks();
            results.push(...listenerLeaks);
        }
        return results;
    }
    shutdown() {
        this.leakLogger.info('Shutting down MemoryLeakDetector');
        this.stopDetection();
        this.clearTrackingData();
        this.removeAllListeners();
        this.leakLogger.info('MemoryLeakDetector shutdown completed');
    }
    performLeakDetection() {
        try {
            const results = [];
            const currentStats = this.getMemoryStats();
            this.memoryHistory.push({ timestamp: new Date(), stats: currentStats });
            if (this.memoryHistory.length > this.config.maxHistorySize) {
                this.memoryHistory.shift();
            }
            results.push(...this.checkMemoryGrowth());
            results.push(...this.checkObjectLeaks());
            if (this.config.enableTimerTracking) {
                results.push(...this.checkTimerLeaks());
            }
            if (this.config.enableEventListenerTracking) {
                results.push(...this.checkEventListenerLeaks());
            }
            results.forEach(result => this.reportLeak(result));
        }
        catch (error) {
            this.leakLogger.error('Error during leak detection', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    checkMemoryGrowth() {
        const results = [];
        if (this.memoryHistory.length < 2) {
            return results;
        }
        const current = this.memoryHistory[this.memoryHistory.length - 1];
        const previous = this.memoryHistory[this.memoryHistory.length - 2];
        const timeDiffMinutes = (current.timestamp.getTime() - previous.timestamp.getTime()) / 60000;
        const memoryGrowth = current.stats.heapUsed - previous.stats.heapUsed;
        const growthRate = timeDiffMinutes > 0 ? memoryGrowth / timeDiffMinutes : 0;
        if (growthRate > this.config.memoryGrowthThreshold) {
            this.consecutiveGrowthCount++;
            if (this.consecutiveGrowthCount >= this.config.consecutiveGrowthThreshold) {
                const severity = growthRate > this.config.memoryGrowthThreshold * 2 ? 'high' : 'medium';
                results.push({
                    timestamp: current.timestamp,
                    type: 'memory_growth',
                    severity,
                    description: `Sustained memory growth detected: ${growthRate.toFixed(2)} MB/min`,
                    memoryStats: current.stats,
                    details: {
                        growthRate,
                        consecutiveGrowthCount: this.consecutiveGrowthCount,
                        memoryGrowth,
                        timeDiffMinutes,
                        threshold: this.config.memoryGrowthThreshold
                    },
                    recommendations: [
                        'Review recent code changes for memory leaks',
                        'Check for unclosed resources (files, connections)',
                        'Verify proper cleanup of event listeners',
                        'Consider forcing garbage collection',
                        'Monitor object creation patterns'
                    ]
                });
            }
        }
        else {
            this.consecutiveGrowthCount = 0;
        }
        if (previous.stats.heapUsed > 0) {
            const heapGrowthRate = memoryGrowth / previous.stats.heapUsed;
            if (heapGrowthRate > this.config.heapGrowthRateThreshold) {
                results.push({
                    timestamp: current.timestamp,
                    type: 'memory_growth',
                    severity: heapGrowthRate > this.config.heapGrowthRateThreshold * 2 ? 'high' : 'medium',
                    description: `High heap growth rate: ${(heapGrowthRate * 100).toFixed(1)}%`,
                    memoryStats: current.stats,
                    details: {
                        heapGrowthRate,
                        previousHeap: previous.stats.heapUsed,
                        currentHeap: current.stats.heapUsed,
                        threshold: this.config.heapGrowthRateThreshold
                    },
                    recommendations: [
                        'Investigate recent heap allocations',
                        'Check for large object creation',
                        'Review data structure efficiency',
                        'Consider memory pooling for frequent allocations'
                    ]
                });
            }
        }
        return results;
    }
    checkObjectLeaks() {
        const results = [];
        for (const tracker of this.objectTrackers.values()) {
            if (tracker.growthRate > this.config.objectGrowthThreshold) {
                const severity = tracker.growthRate > this.config.objectGrowthThreshold * 3 ? 'critical' :
                    tracker.growthRate > this.config.objectGrowthThreshold * 2 ? 'high' : 'medium';
                results.push({
                    timestamp: new Date(),
                    type: 'object_leak',
                    severity,
                    description: `Object leak detected: ${tracker.name} (${tracker.growthRate.toFixed(1)} objects/min)`,
                    memoryStats: this.getMemoryStats(),
                    details: {
                        objectName: tracker.name,
                        currentCount: tracker.count,
                        growthRate: tracker.growthRate,
                        threshold: this.config.objectGrowthThreshold,
                        recentSamples: tracker.samples.slice(-5)
                    },
                    recommendations: [
                        `Review ${tracker.name} object lifecycle`,
                        'Check for proper disposal/cleanup',
                        'Verify references are released',
                        'Look for event listener cleanup',
                        'Consider object pooling'
                    ]
                });
            }
        }
        return results;
    }
    checkTimerLeaks() {
        const results = [];
        if (this.activeTimers.size > this.config.maxActiveTimers) {
            const severity = this.activeTimers.size > this.config.maxActiveTimers * 2 ? 'high' : 'medium';
            results.push({
                timestamp: new Date(),
                type: 'timer_leak',
                severity,
                description: `Excessive active timers: ${this.activeTimers.size}`,
                memoryStats: this.getMemoryStats(),
                details: {
                    activeTimerCount: this.activeTimers.size,
                    maxAllowed: this.config.maxActiveTimers,
                    timerStacks: Array.from(this.timerCreationStack.entries()).slice(0, 10)
                },
                recommendations: [
                    'Review timer cleanup in component unmounting',
                    'Check for proper clearTimeout/clearInterval calls',
                    'Look for timers created in loops',
                    'Consider using AbortController for cleanup'
                ]
            });
        }
        return results;
    }
    checkEventListenerLeaks() {
        const results = [];
        const estimatedListeners = this.getEventListenerCount();
        if (estimatedListeners > this.config.maxEventListeners) {
            const severity = estimatedListeners > this.config.maxEventListeners * 2 ? 'high' : 'medium';
            results.push({
                timestamp: new Date(),
                type: 'event_listener_leak',
                severity,
                description: `Excessive event listeners detected: ${estimatedListeners}`,
                memoryStats: this.getMemoryStats(),
                details: {
                    estimatedListenerCount: estimatedListeners,
                    maxAllowed: this.config.maxEventListeners
                },
                recommendations: [
                    'Review event listener cleanup',
                    'Use removeEventListener in cleanup code',
                    'Consider using AbortController for automatic cleanup',
                    'Check for listeners added in loops'
                ]
            });
        }
        return results;
    }
    takeHeapSnapshot() {
        try {
            const snapshot = {
                timestamp: new Date(),
                memoryStats: this.getMemoryStats(),
                objectCounts: new Map(),
                eventListenerCount: this.getEventListenerCount(),
                timerCount: this.activeTimers.size
            };
            for (const [name, tracker] of this.objectTrackers) {
                snapshot.objectCounts.set(name, tracker.count);
            }
            this.heapSnapshots.push(snapshot);
            if (this.heapSnapshots.length > 20) {
                this.heapSnapshots.shift();
            }
            this.leakLogger.debug('Heap snapshot taken', {
                memoryUsed: snapshot.memoryStats.heapUsed,
                objectTypes: snapshot.objectCounts.size,
                eventListeners: snapshot.eventListenerCount,
                timers: snapshot.timerCount
            });
        }
        catch (error) {
            this.leakLogger.error('Error taking heap snapshot', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    installTimerTracking() {
        const self = this;
        global.setTimeout = function (callback, ms, ...args) {
            const timer = self.originalSetTimeout.call(this, (...callbackArgs) => {
                self.activeTimers.delete(timer);
                self.timerCreationStack.delete(timer);
                callback(...callbackArgs);
            }, ms, ...args);
            self.activeTimers.add(timer);
            self.timerCreationStack.set(timer, new Error().stack || 'unknown');
            return timer;
        };
        global.setInterval = function (callback, ms, ...args) {
            const timer = self.originalSetInterval.call(this, callback, ms, ...args);
            self.activeTimers.add(timer);
            self.timerCreationStack.set(timer, new Error().stack || 'unknown');
            return timer;
        };
        global.clearTimeout = function (timer) {
            if (timer) {
                self.activeTimers.delete(timer);
                self.timerCreationStack.delete(timer);
            }
            return self.originalClearTimeout.call(this, timer);
        };
        global.clearInterval = function (timer) {
            if (timer) {
                self.activeTimers.delete(timer);
                self.timerCreationStack.delete(timer);
            }
            return self.originalClearInterval.call(this, timer);
        };
        this.leakLogger.info('Timer tracking installed');
    }
    uninstallTimerTracking() {
        global.setTimeout = this.originalSetTimeout;
        global.setInterval = this.originalSetInterval;
        global.clearTimeout = this.originalClearTimeout;
        global.clearInterval = this.originalClearInterval;
        this.activeTimers.clear();
        this.timerCreationStack.clear();
        this.leakLogger.info('Timer tracking uninstalled');
    }
    getEventListenerCount() {
        let count = 0;
        count += process.listenerCount('exit');
        count += process.listenerCount('uncaughtException');
        count += process.listenerCount('unhandledRejection');
        for (const tracker of this.objectTrackers.values()) {
            if (tracker.name.includes('EventEmitter') || tracker.name.includes('emitter')) {
                count += Math.floor(tracker.count * 2);
            }
        }
        return count;
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
    reportLeak(result) {
        this.leakReports.push(result);
        if (this.leakReports.length > this.config.maxLeakReports) {
            this.leakReports.shift();
        }
        const logLevel = result.severity === 'critical' ? 'error' :
            result.severity === 'high' ? 'error' :
                result.severity === 'medium' ? 'warn' : 'info';
        this.leakLogger[logLevel]('Memory leak detected', {
            type: result.type,
            severity: result.severity,
            description: result.description,
            memoryStats: result.memoryStats,
            details: result.details
        });
        this.emit('leakDetected', result);
    }
}
exports.MemoryLeakDetector = MemoryLeakDetector;
//# sourceMappingURL=MemoryLeakDetector.js.map