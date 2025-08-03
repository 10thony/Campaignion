import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { MemoryManager, MemoryManagerConfig } from './MemoryManager';
import { GarbageCollector, GarbageCollectorConfig } from './GarbageCollector';
import { MemoryLeakDetector, MemoryLeakDetectorConfig } from './MemoryLeakDetector';
import { DataStructureOptimizer, OptimizationConfig } from './DataStructureOptimizer';
import { RoomManager } from './RoomManager';

export interface MemoryManagementSystemConfig {
  memoryManager?: MemoryManagerConfig;
  garbageCollector?: GarbageCollectorConfig;
  leakDetector?: MemoryLeakDetectorConfig;
  optimizer?: OptimizationConfig;
  
  // System-wide settings
  enableMemoryManagement?: boolean;
  enableGarbageCollection?: boolean;
  enableLeakDetection?: boolean;
  enableOptimization?: boolean;
  
  // Integration settings
  autoOptimizeRooms?: boolean;
  optimizationIntervalMs?: number;
}

export class MemoryManagementSystem extends EventEmitter {
  private readonly config: Required<MemoryManagementSystemConfig>;
  private readonly systemLogger;
  
  // Core components
  private memoryManager: MemoryManager;
  private garbageCollector: GarbageCollector;
  private leakDetector: MemoryLeakDetector;
  private optimizer: DataStructureOptimizer;
  
  // Integration
  private roomManager?: RoomManager;
  private optimizationInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: MemoryManagementSystemConfig = {}) {
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
      optimizationIntervalMs: config.optimizationIntervalMs || 300000, // 5 minutes
    };
    
    this.systemLogger = logger.child({ component: 'MemoryManagementSystem' });
    
    // Initialize components
    this.memoryManager = new MemoryManager(this.config.memoryManager);
    this.garbageCollector = new GarbageCollector(this.config.garbageCollector);
    this.leakDetector = new MemoryLeakDetector(this.config.leakDetector);
    this.optimizer = new DataStructureOptimizer(this.config.optimizer);
    
    this.setupEventHandlers();
    
    this.systemLogger.info('MemoryManagementSystem initialized', {
      enableMemoryManagement: this.config.enableMemoryManagement,
      enableGarbageCollection: this.config.enableGarbageCollection,
      enableLeakDetection: this.config.enableLeakDetection,
      enableOptimization: this.config.enableOptimization
    });
  }

  /**
   * Initialize the memory management system
   */
  public async initialize(roomManager?: RoomManager): Promise<void> {
    if (this.isInitialized) {
      this.systemLogger.warn('Memory management system already initialized');
      return;
    }

    try {
      // Set room manager if provided
      if (roomManager) {
        this.setRoomManager(roomManager);
      }

      // Start optimization interval if enabled
      if (this.config.enableOptimization && this.config.autoOptimizeRooms) {
        this.startOptimizationInterval();
      }

      this.isInitialized = true;
      
      this.systemLogger.info('Memory management system initialized successfully', {
        hasRoomManager: !!this.roomManager,
        autoOptimizeRooms: this.config.autoOptimizeRooms
      });
      
      this.emit('initialized');
      
    } catch (error) {
      this.systemLogger.error('Failed to initialize memory management system', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Set the room manager for integration
   */
  public setRoomManager(roomManager: RoomManager): void {
    this.roomManager = roomManager;
    
    // Connect memory manager to room manager
    if (this.config.enableMemoryManagement) {
      this.memoryManager.setRoomManager(roomManager);
    }
    
    // Set up room optimization
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
    
    // Set up leak detection tracking
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

  /**
   * Get comprehensive memory status
   */
  public getMemoryStatus(): {
    memoryStats: any;
    gcStats: any;
    leakDetectionStatus: any;
    optimizationHistory: any;
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const memoryReport = this.memoryManager.getMemoryReport();
    const gcStats = this.garbageCollector.getGcStats();
    const leakStatus = this.leakDetector.getDetectionStatus();
    const optimizationHistory = this.optimizer.getOptimizationHistory();
    
    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    const recentAlerts = memoryReport.alerts.filter(
      alert => Date.now() - alert.timestamp.getTime() < 300000 // Last 5 minutes
    );
    
    const criticalAlerts = recentAlerts.filter(alert => alert.type === 'critical');
    const warningAlerts = recentAlerts.filter(alert => alert.type === 'warning');
    const leakAlerts = leakStatus.leakReports.filter(
      report => Date.now() - report.timestamp.getTime() < 300000 && 
                (report.severity === 'high' || report.severity === 'critical')
    );
    
    if (criticalAlerts.length > 0 || leakAlerts.length > 2) {
      systemHealth = 'critical';
    } else if (warningAlerts.length > 2 || leakAlerts.length > 0) {
      systemHealth = 'warning';
    }
    
    return {
      memoryStats: memoryReport,
      gcStats,
      leakDetectionStatus: leakStatus,
      optimizationHistory: optimizationHistory.slice(-10), // Last 10 optimizations
      systemHealth
    };
  }

  /**
   * Force comprehensive memory cleanup
   */
  public async forceCleanup(): Promise<{
    gcResult: any;
    staleDataCleaned: number;
    optimizationResults: any[];
  }> {
    this.systemLogger.info('Starting forced memory cleanup');
    
    const results = {
      gcResult: null as any,
      staleDataCleaned: 0,
      optimizationResults: [] as any[]
    };
    
    try {
      // Force garbage collection
      if (this.config.enableGarbageCollection) {
        results.gcResult = await this.garbageCollector.forceGc();
      }
      
      // Clean stale data
      if (this.config.enableMemoryManagement) {
        results.staleDataCleaned = await this.memoryManager.cleanupStaleData();
      }
      
      // Optimize all rooms
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
      
    } catch (error) {
      this.systemLogger.error('Error during forced cleanup', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
    
    return results;
  }

  /**
   * Get memory pool statistics
   */
  public getPoolStats(): any {
    return this.optimizer.getPoolStats();
  }

  /**
   * Force leak detection
   */
  public forceLeakDetection(): any[] {
    return this.leakDetector.forceDetection();
  }

  /**
   * Optimize specific room
   */
  public optimizeRoom(roomId: string): any[] {
    if (!this.roomManager) {
      throw new Error('Room manager not set');
    }
    
    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      throw new Error(`Room not found: ${roomId}`);
    }
    
    return this.optimizer.optimizeGameState(room.gameState);
  }

  /**
   * Enable or disable specific components
   */
  public setComponentEnabled(component: 'memoryManager' | 'garbageCollector' | 'leakDetector' | 'optimizer', enabled: boolean): void {
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
        } else {
          this.leakDetector.stopDetection();
        }
        break;
      case 'optimizer':
        this.config.enableOptimization = enabled;
        if (enabled && this.config.autoOptimizeRooms && !this.optimizationInterval) {
          this.startOptimizationInterval();
        } else if (!enabled && this.optimizationInterval) {
          this.stopOptimizationInterval();
        }
        break;
    }
    
    this.systemLogger.info('Component enabled/disabled', { component, enabled });
  }

  /**
   * Shutdown the memory management system
   */
  public async shutdown(): Promise<void> {
    this.systemLogger.info('Shutting down memory management system');
    
    try {
      // Stop optimization interval
      this.stopOptimizationInterval();
      
      // Shutdown components
      this.memoryManager.shutdown();
      this.garbageCollector.shutdown();
      this.leakDetector.shutdown();
      this.optimizer.shutdown();
      
      // Clear references
      this.roomManager = undefined;
      this.isInitialized = false;
      
      this.removeAllListeners();
      
      this.systemLogger.info('Memory management system shutdown completed');
      
    } catch (error) {
      this.systemLogger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Set up event handlers between components
   */
  private setupEventHandlers(): void {
    // Memory manager alerts trigger GC if needed
    this.memoryManager.on('memoryAlert', (alert) => {
      if (alert.type === 'critical' && this.config.enableGarbageCollection) {
        this.garbageCollector.triggerGc('pressure');
      }
      
      // Forward alert
      this.emit('memoryAlert', alert);
    });
    
    // GC completion triggers leak detection
    this.garbageCollector.on('gcCompleted', (metrics) => {
      if (this.config.enableLeakDetection) {
        // Check if GC was ineffective (potential leak indicator)
        if (metrics.memoryFreed < 10 && metrics.beforeStats.heapUsed > 200) {
          this.leakDetector.forceDetection();
        }
      }
      
      // Forward event
      this.emit('gcCompleted', metrics);
    });
    
    // Leak detection results trigger optimization
    this.leakDetector.on('leakDetected', (result) => {
      if (result.severity === 'high' || result.severity === 'critical') {
        if (this.config.enableOptimization && this.roomManager) {
          // Optimize all rooms when serious leaks are detected
          const rooms = this.roomManager.getAllRooms();
          for (const room of rooms) {
            this.optimizer.optimizeGameState(room.gameState);
          }
        }
      }
      
      // Forward event
      this.emit('leakDetected', result);
    });
    
    // Memory stats updates
    this.memoryManager.on('memoryStats', (stats) => {
      // Check if GC should be triggered
      if (this.config.enableGarbageCollection) {
        const previousStats = this.memoryManager.getMemoryHistory().slice(-2)[0]?.stats;
        if (this.garbageCollector.shouldTriggerGc(stats, previousStats)) {
          this.garbageCollector.triggerGc('automatic');
        }
      }
      
      // Forward stats
      this.emit('memoryStats', stats);
    });
  }

  /**
   * Start the optimization interval
   */
  private startOptimizationInterval(): void {
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
        
      } catch (error) {
        this.systemLogger.error('Error during automatic optimization', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.optimizationIntervalMs);
    
    this.systemLogger.info('Optimization interval started', {
      intervalMs: this.config.optimizationIntervalMs
    });
  }

  /**
   * Stop the optimization interval
   */
  private stopOptimizationInterval(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = undefined;
      this.systemLogger.info('Optimization interval stopped');
    }
  }
}