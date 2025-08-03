import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { MemoryStats } from './MemoryManager';

export interface GarbageCollectorConfig {
  // GC Strategy
  strategy?: 'aggressive' | 'balanced' | 'conservative';
  
  // Thresholds
  heapGrowthThreshold?: number; // Percentage growth before GC
  memoryPressureThreshold?: number; // MB threshold for memory pressure
  
  // Timing
  minGcIntervalMs?: number; // Minimum time between GC calls
  maxGcIntervalMs?: number; // Maximum time without GC
  
  // Optimization
  enableIncrementalGc?: boolean;
  enableGenerationalGc?: boolean;
  
  // Monitoring
  trackGcPerformance?: boolean;
  maxPerformanceHistory?: number;
}

export interface GcPerformanceMetrics {
  timestamp: Date;
  type: 'manual' | 'automatic' | 'pressure';
  beforeStats: MemoryStats;
  afterStats: MemoryStats;
  durationMs: number;
  memoryFreed: number;
  heapReduction: number;
  success: boolean;
  error?: string;
}

export interface GcStrategy {
  name: string;
  shouldTrigger: (stats: MemoryStats, lastGc: number) => boolean;
  execute: () => Promise<GcPerformanceMetrics>;
}

export class GarbageCollector extends EventEmitter {
  private readonly config: Required<GarbageCollectorConfig>;
  private readonly gcLogger;
  
  private lastGcTime = 0;
  private gcCount = 0;
  private performanceHistory: GcPerformanceMetrics[] = [];
  
  private strategies: Map<string, GcStrategy> = new Map();
  private currentStrategy: GcStrategy;
  
  private gcTimer?: NodeJS.Timeout;
  private isGcInProgress = false;

  constructor(config: GarbageCollectorConfig = {}) {
    super();
    
    this.config = {
      strategy: config.strategy || 'balanced',
      heapGrowthThreshold: config.heapGrowthThreshold || 0.3, // 30% growth
      memoryPressureThreshold: config.memoryPressureThreshold || 512, // 512 MB
      minGcIntervalMs: config.minGcIntervalMs || 30000, // 30 seconds
      maxGcIntervalMs: config.maxGcIntervalMs || 300000, // 5 minutes
      enableIncrementalGc: config.enableIncrementalGc ?? true,
      enableGenerationalGc: config.enableGenerationalGc ?? true,
      trackGcPerformance: config.trackGcPerformance ?? true,
      maxPerformanceHistory: config.maxPerformanceHistory || 100,
    };
    
    this.gcLogger = logger.child({ component: 'GarbageCollector' });
    
    this.initializeStrategies();
    this.currentStrategy = this.strategies.get(this.config.strategy)!;
    
    this.gcLogger.info('GarbageCollector initialized', {
      strategy: this.config.strategy,
      config: this.config,
      gcAvailable: !!global.gc
    });
    
    this.startGcTimer();
  }

  /**
   * Check if garbage collection should be triggered
   */
  public shouldTriggerGc(currentStats: MemoryStats, previousStats?: MemoryStats): boolean {
    if (this.isGcInProgress) {
      return false;
    }

    const timeSinceLastGc = Date.now() - this.lastGcTime;
    
    // Minimum interval check
    if (timeSinceLastGc < this.config.minGcIntervalMs) {
      return false;
    }
    
    // Maximum interval check
    if (timeSinceLastGc > this.config.maxGcIntervalMs) {
      this.gcLogger.info('GC triggered by maximum interval', {
        timeSinceLastGc,
        maxInterval: this.config.maxGcIntervalMs
      });
      return true;
    }
    
    // Memory pressure check
    if (currentStats.heapUsed > this.config.memoryPressureThreshold) {
      this.gcLogger.info('GC triggered by memory pressure', {
        heapUsed: currentStats.heapUsed,
        threshold: this.config.memoryPressureThreshold
      });
      return true;
    }
    
    // Heap growth check
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
    
    // Strategy-specific check
    return this.currentStrategy.shouldTrigger(currentStats, this.lastGcTime);
  }

  /**
   * Trigger garbage collection
   */
  public async triggerGc(type: 'manual' | 'automatic' | 'pressure' = 'manual'): Promise<GcPerformanceMetrics | null> {
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
      
      // Track performance if enabled
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
      
    } catch (error) {
      const errorMetrics: GcPerformanceMetrics = {
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
      
    } finally {
      this.isGcInProgress = false;
    }
  }

  /**
   * Change garbage collection strategy
   */
  public setStrategy(strategyName: 'aggressive' | 'balanced' | 'conservative'): boolean {
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

  /**
   * Get garbage collection statistics
   */
  public getGcStats(): {
    gcCount: number;
    lastGcTime: number;
    isGcInProgress: boolean;
    currentStrategy: string;
    performanceHistory: GcPerformanceMetrics[];
    averageGcTime: number;
    averageMemoryFreed: number;
    successRate: number;
  } {
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

  /**
   * Optimize garbage collection based on performance history
   */
  public optimizeGcStrategy(): void {
    if (this.performanceHistory.length < 10) {
      return; // Need more data
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

    // Simple optimization logic
    if (successRate < 0.8) {
      // High failure rate, switch to conservative
      if (this.currentStrategy.name !== 'conservative') {
        this.setStrategy('conservative');
      }
    } else if (averageDuration > 100 && averageFreed < 50) {
      // Slow GC with little benefit, switch to balanced
      if (this.currentStrategy.name === 'aggressive') {
        this.setStrategy('balanced');
      }
    } else if (averageFreed > 100 && averageDuration < 50) {
      // Fast and effective, can be more aggressive
      if (this.currentStrategy.name === 'conservative') {
        this.setStrategy('balanced');
      } else if (this.currentStrategy.name === 'balanced') {
        this.setStrategy('aggressive');
      }
    }
  }

  /**
   * Force immediate garbage collection
   */
  public forceGc(): Promise<GcPerformanceMetrics | null> {
    return this.triggerGc('manual');
  }

  /**
   * Shutdown the garbage collector
   */
  public shutdown(): void {
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

  /**
   * Initialize garbage collection strategies
   */
  private initializeStrategies(): void {
    // Conservative strategy - minimal GC
    this.strategies.set('conservative', {
      name: 'conservative',
      shouldTrigger: (stats: MemoryStats, lastGc: number) => {
        const timeSinceLastGc = Date.now() - lastGc;
        return stats.heapUsed > 800 || timeSinceLastGc > 600000; // 10 minutes
      },
      execute: async () => this.executeBasicGc()
    });

    // Balanced strategy - moderate GC
    this.strategies.set('balanced', {
      name: 'balanced',
      shouldTrigger: (stats: MemoryStats, lastGc: number) => {
        const timeSinceLastGc = Date.now() - lastGc;
        return stats.heapUsed > 400 || timeSinceLastGc > 300000; // 5 minutes
      },
      execute: async () => this.executeBalancedGc()
    });

    // Aggressive strategy - frequent GC
    this.strategies.set('aggressive', {
      name: 'aggressive',
      shouldTrigger: (stats: MemoryStats, lastGc: number) => {
        const timeSinceLastGc = Date.now() - lastGc;
        return stats.heapUsed > 200 || timeSinceLastGc > 120000; // 2 minutes
      },
      execute: async () => this.executeAggressiveGc()
    });
  }

  /**
   * Execute basic garbage collection
   */
  private async executeBasicGc(): Promise<GcPerformanceMetrics> {
    const startTime = Date.now();
    const beforeStats = this.getMemoryStats();
    
    try {
      global.gc!();
      
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
    } catch (error) {
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

  /**
   * Execute balanced garbage collection
   */
  private async executeBalancedGc(): Promise<GcPerformanceMetrics> {
    // For balanced strategy, we might do multiple smaller GC calls
    const startTime = Date.now();
    const beforeStats = this.getMemoryStats();
    
    try {
      // First pass
      global.gc!();
      
      // Small delay to allow cleanup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Second pass for better cleanup
      global.gc!();
      
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
    } catch (error) {
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

  /**
   * Execute aggressive garbage collection
   */
  private async executeAggressiveGc(): Promise<GcPerformanceMetrics> {
    // For aggressive strategy, we do thorough cleanup
    const startTime = Date.now();
    const beforeStats = this.getMemoryStats();
    
    try {
      // Multiple GC passes with delays
      for (let i = 0; i < 3; i++) {
        global.gc!();
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
    } catch (error) {
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
   * Add performance metrics to history
   */
  private addPerformanceMetrics(metrics: GcPerformanceMetrics): void {
    this.performanceHistory.push(metrics);
    
    if (this.performanceHistory.length > this.config.maxPerformanceHistory) {
      this.performanceHistory.shift();
    }
  }

  /**
   * Start the GC timer for automatic optimization
   */
  private startGcTimer(): void {
    // Periodically optimize GC strategy based on performance
    this.gcTimer = setTimeout(() => {
      this.optimizeGcStrategy();
      this.startGcTimer(); // Restart timer
    }, 300000); // 5 minutes
  }
}