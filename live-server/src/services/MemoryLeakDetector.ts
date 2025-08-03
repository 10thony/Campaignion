import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { MemoryStats } from './MemoryManager';

export interface MemoryLeakDetectorConfig {
  // Detection intervals
  detectionIntervalMs?: number;
  heapSnapshotIntervalMs?: number;
  
  // Thresholds
  memoryGrowthThreshold?: number; // MB per minute
  heapGrowthRateThreshold?: number; // Percentage growth rate
  consecutiveGrowthThreshold?: number; // Number of consecutive growth periods
  
  // Object tracking
  enableObjectTracking?: boolean;
  maxTrackedObjects?: number;
  objectGrowthThreshold?: number; // Objects per minute
  
  // Event listener tracking
  enableEventListenerTracking?: boolean;
  maxEventListeners?: number;
  
  // Timer tracking
  enableTimerTracking?: boolean;
  maxActiveTimers?: number;
  
  // History
  maxHistorySize?: number;
  maxLeakReports?: number;
}

export interface LeakDetectionResult {
  timestamp: Date;
  type: 'memory_growth' | 'object_leak' | 'event_listener_leak' | 'timer_leak' | 'heap_fragmentation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  memoryStats: MemoryStats;
  details: any;
  recommendations: string[];
}

export interface ObjectTrackingData {
  name: string;
  count: number;
  growthRate: number;
  samples: { timestamp: Date; count: number }[];
  lastUpdate: Date;
}

export interface HeapSnapshot {
  timestamp: Date;
  memoryStats: MemoryStats;
  objectCounts: Map<string, number>;
  eventListenerCount: number;
  timerCount: number;
}

export class MemoryLeakDetector extends EventEmitter {
  private readonly config: Required<MemoryLeakDetectorConfig>;
  private readonly leakLogger;
  
  // Detection state
  private detectionInterval?: NodeJS.Timeout;
  private snapshotInterval?: NodeJS.Timeout;
  private isDetectionActive = false;
  
  // Memory tracking
  private memoryHistory: { timestamp: Date; stats: MemoryStats }[] = [];
  private consecutiveGrowthCount = 0;
  private lastMemoryCheck = 0;
  
  // Object tracking
  private objectTrackers = new Map<string, ObjectTrackingData>();
  private heapSnapshots: HeapSnapshot[] = [];
  
  // Leak reports
  private leakReports: LeakDetectionResult[] = [];
  
  // Built-in object tracking
  private originalSetTimeout: typeof setTimeout;
  private originalSetInterval: typeof setInterval;
  private originalClearTimeout: typeof clearTimeout;
  private originalClearInterval: typeof clearInterval;
  private activeTimers = new Set<NodeJS.Timeout>();
  private timerCreationStack = new Map<NodeJS.Timeout, string>();

  constructor(config: MemoryLeakDetectorConfig = {}) {
    super();
    
    this.config = {
      detectionIntervalMs: config.detectionIntervalMs || 60000, // 1 minute
      heapSnapshotIntervalMs: config.heapSnapshotIntervalMs || 300000, // 5 minutes
      memoryGrowthThreshold: config.memoryGrowthThreshold || 10, // 10 MB per minute
      heapGrowthRateThreshold: config.heapGrowthRateThreshold || 0.1, // 10% growth
      consecutiveGrowthThreshold: config.consecutiveGrowthThreshold || 3,
      enableObjectTracking: config.enableObjectTracking ?? true,
      maxTrackedObjects: config.maxTrackedObjects || 1000,
      objectGrowthThreshold: config.objectGrowthThreshold || 100, // objects per minute
      enableEventListenerTracking: config.enableEventListenerTracking ?? true,
      maxEventListeners: config.maxEventListeners || 100,
      enableTimerTracking: config.enableTimerTracking ?? true,
      maxActiveTimers: config.maxActiveTimers || 50,
      maxHistorySize: config.maxHistorySize || 100,
      maxLeakReports: config.maxLeakReports || 50,
    };
    
    this.leakLogger = logger.child({ component: 'MemoryLeakDetector' });
    
    // Store original timer functions
    this.originalSetTimeout = global.setTimeout;
    this.originalSetInterval = global.setInterval;
    this.originalClearTimeout = global.clearTimeout;
    this.originalClearInterval = global.clearInterval;
    
    this.leakLogger.info('MemoryLeakDetector initialized', {
      config: this.config
    });
    
    this.startDetection();
  }

  /**
   * Start leak detection
   */
  public startDetection(): void {
    if (this.isDetectionActive) {
      this.leakLogger.warn('Detection already active');
      return;
    }

    this.isDetectionActive = true;
    
    // Install timer tracking if enabled
    if (this.config.enableTimerTracking) {
      this.installTimerTracking();
    }
    
    // Start detection interval
    this.detectionInterval = setInterval(() => {
      this.performLeakDetection();
    }, this.config.detectionIntervalMs);
    
    // Start snapshot interval
    this.snapshotInterval = setInterval(() => {
      this.takeHeapSnapshot();
    }, this.config.heapSnapshotIntervalMs);
    
    this.leakLogger.info('Leak detection started', {
      detectionInterval: this.config.detectionIntervalMs,
      snapshotInterval: this.config.heapSnapshotIntervalMs
    });
  }

  /**
   * Stop leak detection
   */
  public stopDetection(): void {
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
    
    // Restore original timer functions
    if (this.config.enableTimerTracking) {
      this.uninstallTimerTracking();
    }
    
    this.leakLogger.info('Leak detection stopped');
  }

  /**
   * Track object creation/destruction
   */
  public trackObject(name: string, countChange: number): void {
    if (!this.config.enableObjectTracking) {
      return;
    }

    let tracker = this.objectTrackers.get(name);
    if (!tracker) {
      if (this.objectTrackers.size >= this.config.maxTrackedObjects) {
        // Remove oldest tracker
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
    
    // Add sample
    const now = new Date();
    tracker.samples.push({ timestamp: now, count: tracker.count });
    
    // Keep only recent samples (last hour)
    const oneHourAgo = new Date(now.getTime() - 3600000);
    tracker.samples = tracker.samples.filter(s => s.timestamp > oneHourAgo);
    
    // Calculate growth rate (objects per minute)
    if (tracker.samples.length >= 2) {
      const oldestSample = tracker.samples[0];
      const timeDiffMinutes = (now.getTime() - oldestSample.timestamp.getTime()) / 60000;
      if (timeDiffMinutes > 0) {
        tracker.growthRate = (tracker.count - oldestSample.count) / timeDiffMinutes;
      }
    }
    
    tracker.lastUpdate = now;
    
    // Check for object leak
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

  /**
   * Get current leak detection status
   */
  public getDetectionStatus(): {
    isActive: boolean;
    memoryHistory: { timestamp: Date; stats: MemoryStats }[];
    objectTrackers: ObjectTrackingData[];
    heapSnapshots: HeapSnapshot[];
    leakReports: LeakDetectionResult[];
    activeTimers: number;
    consecutiveGrowthCount: number;
  } {
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

  /**
   * Get leak reports by severity
   */
  public getLeakReportsBySeverity(severity?: 'low' | 'medium' | 'high' | 'critical'): LeakDetectionResult[] {
    if (severity) {
      return this.leakReports.filter(report => report.severity === severity);
    }
    return [...this.leakReports];
  }

  /**
   * Clear all tracking data
   */
  public clearTrackingData(): void {
    this.memoryHistory.length = 0;
    this.objectTrackers.clear();
    this.heapSnapshots.length = 0;
    this.leakReports.length = 0;
    this.consecutiveGrowthCount = 0;
    this.lastMemoryCheck = 0;
    
    this.leakLogger.info('Tracking data cleared');
  }

  /**
   * Force leak detection check
   */
  public forceDetection(): LeakDetectionResult[] {
    const results: LeakDetectionResult[] = [];
    
    // Check memory growth
    const memoryLeaks = this.checkMemoryGrowth();
    results.push(...memoryLeaks);
    
    // Check object leaks
    const objectLeaks = this.checkObjectLeaks();
    results.push(...objectLeaks);
    
    // Check timer leaks
    if (this.config.enableTimerTracking) {
      const timerLeaks = this.checkTimerLeaks();
      results.push(...timerLeaks);
    }
    
    // Check event listener leaks
    if (this.config.enableEventListenerTracking) {
      const listenerLeaks = this.checkEventListenerLeaks();
      results.push(...listenerLeaks);
    }
    
    return results;
  }

  /**
   * Shutdown the leak detector
   */
  public shutdown(): void {
    this.leakLogger.info('Shutting down MemoryLeakDetector');
    
    this.stopDetection();
    this.clearTrackingData();
    this.removeAllListeners();
    
    this.leakLogger.info('MemoryLeakDetector shutdown completed');
  }

  /**
   * Perform comprehensive leak detection
   */
  private performLeakDetection(): void {
    try {
      const results: LeakDetectionResult[] = [];
      
      // Update memory history
      const currentStats = this.getMemoryStats();
      this.memoryHistory.push({ timestamp: new Date(), stats: currentStats });
      
      if (this.memoryHistory.length > this.config.maxHistorySize) {
        this.memoryHistory.shift();
      }
      
      // Check various leak types
      results.push(...this.checkMemoryGrowth());
      results.push(...this.checkObjectLeaks());
      
      if (this.config.enableTimerTracking) {
        results.push(...this.checkTimerLeaks());
      }
      
      if (this.config.enableEventListenerTracking) {
        results.push(...this.checkEventListenerLeaks());
      }
      
      // Report any leaks found
      results.forEach(result => this.reportLeak(result));
      
    } catch (error) {
      this.leakLogger.error('Error during leak detection', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check for memory growth patterns
   */
  private checkMemoryGrowth(): LeakDetectionResult[] {
    const results: LeakDetectionResult[] = [];
    
    if (this.memoryHistory.length < 2) {
      return results;
    }
    
    const current = this.memoryHistory[this.memoryHistory.length - 1];
    const previous = this.memoryHistory[this.memoryHistory.length - 2];
    
    const timeDiffMinutes = (current.timestamp.getTime() - previous.timestamp.getTime()) / 60000;
    const memoryGrowth = current.stats.heapUsed - previous.stats.heapUsed;
    const growthRate = timeDiffMinutes > 0 ? memoryGrowth / timeDiffMinutes : 0;
    
    // Check absolute growth
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
    } else {
      this.consecutiveGrowthCount = 0;
    }
    
    // Check heap growth rate
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

  /**
   * Check for object leaks
   */
  private checkObjectLeaks(): LeakDetectionResult[] {
    const results: LeakDetectionResult[] = [];
    
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

  /**
   * Check for timer leaks
   */
  private checkTimerLeaks(): LeakDetectionResult[] {
    const results: LeakDetectionResult[] = [];
    
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

  /**
   * Check for event listener leaks
   */
  private checkEventListenerLeaks(): LeakDetectionResult[] {
    const results: LeakDetectionResult[] = [];
    
    // This is a simplified check - in a real implementation,
    // you'd need to track event listeners more comprehensively
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

  /**
   * Take a heap snapshot for analysis
   */
  private takeHeapSnapshot(): void {
    try {
      const snapshot: HeapSnapshot = {
        timestamp: new Date(),
        memoryStats: this.getMemoryStats(),
        objectCounts: new Map(),
        eventListenerCount: this.getEventListenerCount(),
        timerCount: this.activeTimers.size
      };
      
      // Add object counts from trackers
      for (const [name, tracker] of this.objectTrackers) {
        snapshot.objectCounts.set(name, tracker.count);
      }
      
      this.heapSnapshots.push(snapshot);
      
      // Keep only recent snapshots
      if (this.heapSnapshots.length > 20) {
        this.heapSnapshots.shift();
      }
      
      this.leakLogger.debug('Heap snapshot taken', {
        memoryUsed: snapshot.memoryStats.heapUsed,
        objectTypes: snapshot.objectCounts.size,
        eventListeners: snapshot.eventListenerCount,
        timers: snapshot.timerCount
      });
      
    } catch (error) {
      this.leakLogger.error('Error taking heap snapshot', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Install timer tracking
   */
  private installTimerTracking(): void {
    const self = this;
    
    // Override setTimeout
    global.setTimeout = function(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout {
      const timer = self.originalSetTimeout.call(this, (...callbackArgs: any[]) => {
        self.activeTimers.delete(timer);
        self.timerCreationStack.delete(timer);
        callback(...callbackArgs);
      }, ms, ...args);
      
      self.activeTimers.add(timer);
      self.timerCreationStack.set(timer, new Error().stack || 'unknown');
      
      return timer;
    } as any;
    
    // Override setInterval
    global.setInterval = function(callback: (...args: any[]) => void, ms?: number, ...args: any[]): NodeJS.Timeout {
      const timer = self.originalSetInterval.call(this, callback, ms, ...args);
      
      self.activeTimers.add(timer);
      self.timerCreationStack.set(timer, new Error().stack || 'unknown');
      
      return timer;
    } as any;
    
    // Override clearTimeout
    global.clearTimeout = function(timer?: NodeJS.Timeout): void {
      if (timer) {
        self.activeTimers.delete(timer);
        self.timerCreationStack.delete(timer);
      }
      return self.originalClearTimeout.call(this, timer);
    };
    
    // Override clearInterval
    global.clearInterval = function(timer?: NodeJS.Timeout): void {
      if (timer) {
        self.activeTimers.delete(timer);
        self.timerCreationStack.delete(timer);
      }
      return self.originalClearInterval.call(this, timer);
    };
    
    this.leakLogger.info('Timer tracking installed');
  }

  /**
   * Uninstall timer tracking
   */
  private uninstallTimerTracking(): void {
    global.setTimeout = this.originalSetTimeout;
    global.setInterval = this.originalSetInterval;
    global.clearTimeout = this.originalClearTimeout;
    global.clearInterval = this.originalClearInterval;
    
    this.activeTimers.clear();
    this.timerCreationStack.clear();
    
    this.leakLogger.info('Timer tracking uninstalled');
  }

  /**
   * Get estimated event listener count
   */
  private getEventListenerCount(): number {
    // This is a simplified estimation
    // In a real implementation, you'd track EventEmitter instances
    let count = 0;
    
    // Count listeners on process
    count += process.listenerCount('exit');
    count += process.listenerCount('uncaughtException');
    count += process.listenerCount('unhandledRejection');
    
    // Add estimated count from tracked objects
    for (const tracker of this.objectTrackers.values()) {
      if (tracker.name.includes('EventEmitter') || tracker.name.includes('emitter')) {
        count += Math.floor(tracker.count * 2); // Estimate 2 listeners per emitter
      }
    }
    
    return count;
  }

  /**
   * Get current memory statistics
   */
  private getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024), // MB
    };
  }

  /**
   * Report a detected leak
   */
  private reportLeak(result: LeakDetectionResult): void {
    // Add to reports
    this.leakReports.push(result);
    
    if (this.leakReports.length > this.config.maxLeakReports) {
      this.leakReports.shift();
    }
    
    // Log the leak
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
    
    // Emit event
    this.emit('leakDetected', result);
  }
}