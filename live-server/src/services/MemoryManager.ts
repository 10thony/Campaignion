import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { RoomManager } from './RoomManager';
import { InteractionRoom } from './InteractionRoom';

export interface MemoryManagerConfig {
  // Memory monitoring
  memoryCheckIntervalMs?: number;
  memoryWarningThresholdMB?: number;
  memoryCriticalThresholdMB?: number;
  
  // Garbage collection
  gcIntervalMs?: number;
  forceGcThresholdMB?: number;
  
  // Data cleanup
  staleDataCleanupIntervalMs?: number;
  maxTurnHistoryEntries?: number;
  maxChatHistoryEntries?: number;
  
  // Room cleanup
  inactiveRoomCleanupIntervalMs?: number;
  maxInactiveTimeMs?: number;
  
  // Memory optimization
  enableDataCompression?: boolean;
  enableStateOptimization?: boolean;
  maxStateDeltaHistory?: number;
  
  // Leak detection
  enableLeakDetection?: boolean;
  leakDetectionIntervalMs?: number;
  maxObjectGrowthRate?: number;
}

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
}

export interface MemoryAlert {
  type: 'warning' | 'critical' | 'leak_detected' | 'gc_forced';
  timestamp: Date;
  memoryStats: MemoryStats;
  message: string;
  details?: any;
}

export interface ObjectTracker {
  name: string;
  count: number;
  lastCount: number;
  growthRate: number;
  maxGrowthRate: number;
  samples: number[];
  lastSampleTime: Date;
}

export class MemoryManager extends EventEmitter {
  private readonly config: Required<MemoryManagerConfig>;
  private readonly memoryLogger;
  private roomManager?: RoomManager;
  
  // Monitoring intervals
  private memoryCheckInterval?: NodeJS.Timeout;
  private gcInterval?: NodeJS.Timeout;
  private staleDataCleanupInterval?: NodeJS.Timeout;
  private inactiveRoomCleanupInterval?: NodeJS.Timeout;
  private leakDetectionInterval?: NodeJS.Timeout;
  
  // Memory tracking
  private memoryHistory: MemoryStats[] = [];
  private maxMemoryHistorySize = 100;
  private lastGcTime = Date.now();
  private gcCount = 0;
  
  // Object tracking for leak detection
  private objectTrackers = new Map<string, ObjectTracker>();
  private trackingEnabled = false;
  
  // Alert tracking
  private recentAlerts: MemoryAlert[] = [];
  private maxRecentAlerts = 50;

  constructor(config: MemoryManagerConfig = {}) {
    super();
    
    this.config = {
      memoryCheckIntervalMs: config.memoryCheckIntervalMs || 30000, // 30 seconds
      memoryWarningThresholdMB: config.memoryWarningThresholdMB || 512, // 512 MB
      memoryCriticalThresholdMB: config.memoryCriticalThresholdMB || 1024, // 1 GB
      gcIntervalMs: config.gcIntervalMs || 300000, // 5 minutes
      forceGcThresholdMB: config.forceGcThresholdMB || 768, // 768 MB
      staleDataCleanupIntervalMs: config.staleDataCleanupIntervalMs || 600000, // 10 minutes
      maxTurnHistoryEntries: config.maxTurnHistoryEntries || 1000,
      maxChatHistoryEntries: config.maxChatHistoryEntries || 500,
      inactiveRoomCleanupIntervalMs: config.inactiveRoomCleanupIntervalMs || 300000, // 5 minutes
      maxInactiveTimeMs: config.maxInactiveTimeMs || 1800000, // 30 minutes
      enableDataCompression: config.enableDataCompression ?? true,
      enableStateOptimization: config.enableStateOptimization ?? true,
      maxStateDeltaHistory: config.maxStateDeltaHistory || 50,
      enableLeakDetection: config.enableLeakDetection ?? true,
      leakDetectionIntervalMs: config.leakDetectionIntervalMs || 120000, // 2 minutes
      maxObjectGrowthRate: config.maxObjectGrowthRate || 0.5, // 50% growth per interval
    };
    
    this.memoryLogger = logger.child({ component: 'MemoryManager' });
    
    this.memoryLogger.info('MemoryManager initialized', {
      config: this.config,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    });
    
    this.startMonitoring();
  }

  /**
   * Set the room manager for room-specific memory management
   */
  public setRoomManager(roomManager: RoomManager): void {
    this.roomManager = roomManager;
    
    // Set up room manager event listeners
    roomManager.on('roomCreated', (room: InteractionRoom) => {
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

  /**
   * Get current memory statistics
   */
  public getMemoryStats(): MemoryStats {
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
   * Get memory usage history
   */
  public getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * Get recent memory alerts
   */
  public getRecentAlerts(): MemoryAlert[] {
    return [...this.recentAlerts];
  }

  /**
   * Get object tracking statistics
   */
  public getObjectTrackingStats(): ObjectTracker[] {
    return Array.from(this.objectTrackers.values());
  }

  /**
   * Force garbage collection
   */
  public forceGarbageCollection(): boolean {
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
      } else {
        this.memoryLogger.warn('Garbage collection not available (run with --expose-gc)');
        return false;
      }
    } catch (error) {
      this.memoryLogger.error('Error during forced garbage collection', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Clean up stale data across all rooms
   */
  public async cleanupStaleData(): Promise<number> {
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
      } catch (error) {
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

  /**
   * Optimize memory usage for a specific room
   */
  public optimizeRoomMemory(room: InteractionRoom): void {
    if (!this.config.enableStateOptimization) {
      return;
    }

    try {
      const gameState = room.gameState;
      let optimized = false;

      // Optimize turn history
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

      // Optimize chat log
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

      // Compress large data structures if enabled
      if (this.config.enableDataCompression) {
        this.compressRoomData(room);
      }

      if (optimized) {
        this.memoryLogger.debug('Room memory optimization completed', {
          roomId: room.id,
          interactionId: room.interactionId
        });
      }
    } catch (error) {
      this.memoryLogger.error('Error optimizing room memory', {
        roomId: room.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Detect potential memory leaks
   */
  public detectMemoryLeaks(): ObjectTracker[] {
    const leaks: ObjectTracker[] = [];
    
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
            samples: tracker.samples.slice(-5) // Last 5 samples
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

  /**
   * Get comprehensive memory report
   */
  public getMemoryReport(): {
    currentStats: MemoryStats;
    history: MemoryStats[];
    alerts: MemoryAlert[];
    objectTracking: ObjectTracker[];
    gcStats: { count: number; lastGcTime: number };
    roomStats?: { totalRooms: number; activeRooms: number; totalParticipants: number };
  } {
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

  /**
   * Shutdown the memory manager
   */
  public shutdown(): void {
    this.memoryLogger.info('Shutting down MemoryManager');
    
    // Clear all intervals
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
    
    // Clear tracking data
    this.memoryHistory.length = 0;
    this.objectTrackers.clear();
    this.recentAlerts.length = 0;
    
    this.removeAllListeners();
    this.memoryLogger.info('MemoryManager shutdown completed');
  }

  /**
   * Start all monitoring intervals
   */
  private startMonitoring(): void {
    // Memory monitoring
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.memoryCheckIntervalMs);

    // Garbage collection
    this.gcInterval = setInterval(() => {
      this.checkGarbageCollection();
    }, this.config.gcIntervalMs);

    // Stale data cleanup
    this.staleDataCleanupInterval = setInterval(async () => {
      try {
        await this.cleanupStaleData();
      } catch (error) {
        this.memoryLogger.error('Error during stale data cleanup', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.staleDataCleanupIntervalMs);

    // Inactive room cleanup
    this.inactiveRoomCleanupInterval = setInterval(async () => {
      try {
        await this.cleanupInactiveRooms();
      } catch (error) {
        this.memoryLogger.error('Error during inactive room cleanup', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.inactiveRoomCleanupIntervalMs);

    // Leak detection
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

  /**
   * Check current memory usage and emit alerts if needed
   */
  private checkMemoryUsage(): void {
    const stats = this.getMemoryStats();
    
    // Add to history
    this.memoryHistory.push(stats);
    if (this.memoryHistory.length > this.maxMemoryHistorySize) {
      this.memoryHistory.shift();
    }

    // Check thresholds
    if (stats.heapUsed >= this.config.memoryCriticalThresholdMB) {
      this.emitAlert({
        type: 'critical',
        timestamp: new Date(),
        memoryStats: stats,
        message: `Critical memory usage: ${stats.heapUsed}MB (threshold: ${this.config.memoryCriticalThresholdMB}MB)`
      });
    } else if (stats.heapUsed >= this.config.memoryWarningThresholdMB) {
      this.emitAlert({
        type: 'warning',
        timestamp: new Date(),
        memoryStats: stats,
        message: `High memory usage: ${stats.heapUsed}MB (threshold: ${this.config.memoryWarningThresholdMB}MB)`
      });
    }

    // Emit memory stats for monitoring
    this.emit('memoryStats', stats);
  }

  /**
   * Check if garbage collection should be forced
   */
  private checkGarbageCollection(): void {
    const stats = this.getMemoryStats();
    
    if (stats.heapUsed >= this.config.forceGcThresholdMB) {
      this.memoryLogger.info('Memory threshold reached, forcing garbage collection', {
        heapUsed: stats.heapUsed,
        threshold: this.config.forceGcThresholdMB
      });
      
      this.forceGarbageCollection();
    }
  }

  /**
   * Clean up inactive rooms
   */
  private async cleanupInactiveRooms(): Promise<void> {
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

  /**
   * Clean up stale data in a specific room
   */
  private async cleanupRoomStaleData(room: InteractionRoom): Promise<number> {
    let cleanedItems = 0;
    
    try {
      const gameState = room.getGameState();
      
      // Clean old turn history
      const turnHistoryBefore = gameState.turnHistory.length;
      if (turnHistoryBefore > this.config.maxTurnHistoryEntries) {
        const excess = turnHistoryBefore - this.config.maxTurnHistoryEntries;
        gameState.turnHistory.splice(0, excess);
        cleanedItems += excess;
      }
      
      // Clean old chat messages
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
    } catch (error) {
      this.memoryLogger.error('Error cleaning room stale data', {
        roomId: room.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return cleanedItems;
  }

  /**
   * Compress room data to save memory
   */
  private compressRoomData(room: InteractionRoom): void {
    // This is a placeholder for data compression logic
    // In a real implementation, you might compress large JSON objects,
    // use more efficient data structures, or implement custom serialization
    
    try {
      const gameState = room.getGameState();
      
      // Example: Convert arrays to more memory-efficient structures
      // This is a simplified example - real compression would be more sophisticated
      
      this.memoryLogger.debug('Data compression applied to room', {
        roomId: room.id,
        // Add compression metrics here
      });
    } catch (error) {
      this.memoryLogger.error('Error compressing room data', {
        roomId: room.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Track object count changes for leak detection
   */
  private trackObject(name: string, countChange: number): void {
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
    
    // Calculate growth rate
    const timeDiff = Date.now() - tracker.lastSampleTime.getTime();
    if (timeDiff > 0 && tracker.lastCount > 0) {
      tracker.growthRate = (tracker.count - tracker.lastCount) / tracker.lastCount;
    }
    
    // Add sample
    tracker.samples.push(tracker.count);
    if (tracker.samples.length > 10) {
      tracker.samples.shift();
    }
    
    tracker.lastSampleTime = new Date();
  }

  /**
   * Emit a memory alert
   */
  private emitAlert(alert: MemoryAlert): void {
    // Add to recent alerts
    this.recentAlerts.push(alert);
    if (this.recentAlerts.length > this.maxRecentAlerts) {
      this.recentAlerts.shift();
    }

    // Log the alert
    const logLevel = alert.type === 'critical' ? 'error' : 
                    alert.type === 'warning' ? 'warn' : 'info';
    
    this.memoryLogger[logLevel]('Memory alert', {
      type: alert.type,
      message: alert.message,
      memoryStats: alert.memoryStats,
      details: alert.details
    });

    // Emit event
    this.emit('memoryAlert', alert);
  }
}