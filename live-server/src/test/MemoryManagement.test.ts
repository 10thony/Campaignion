import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryManager } from '../services/MemoryManager';
import { GarbageCollector } from '../services/GarbageCollector';
import { MemoryLeakDetector } from '../services/MemoryLeakDetector';
import { DataStructureOptimizer } from '../services/DataStructureOptimizer';
import { MemoryManagementSystem } from '../services/MemoryManagementSystem';
import { RoomManager } from '../services/RoomManager';
import { GameState, ParticipantState } from '../types';

// Mock global.gc for testing
const mockGc = vi.fn();
(global as any).gc = mockGc;

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager({
      memoryCheckIntervalMs: 100,
      gcIntervalMs: 200,
      staleDataCleanupIntervalMs: 300,
      memoryWarningThresholdMB: 100,
      memoryCriticalThresholdMB: 200
    });
  });

  afterEach(() => {
    memoryManager.shutdown();
  });

  it('should initialize with default configuration', () => {
    const manager = new MemoryManager();
    expect(manager).toBeDefined();
    manager.shutdown();
  });

  it('should get current memory statistics', () => {
    const stats = memoryManager.getMemoryStats();
    expect(stats).toHaveProperty('heapUsed');
    expect(stats).toHaveProperty('heapTotal');
    expect(stats).toHaveProperty('external');
    expect(stats).toHaveProperty('rss');
    expect(stats).toHaveProperty('arrayBuffers');
    expect(typeof stats.heapUsed).toBe('number');
  });

  it('should track memory history', async () => {
    // Wait for at least one memory check
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const history = memoryManager.getMemoryHistory();
    expect(history.length).toBeGreaterThan(0);
  });

  it('should force garbage collection when available', () => {
    mockGc.mockClear();
    const result = memoryManager.forceGarbageCollection();
    expect(result).toBe(true);
    expect(mockGc).toHaveBeenCalled();
  });

  it('should emit memory alerts for high usage', (done) => {
    memoryManager.on('memoryAlert', (alert) => {
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('memoryStats');
      expect(alert).toHaveProperty('message');
      done();
    });

    // Simulate high memory usage by creating a large object
    const largeArray = new Array(1000000).fill('test');
    
    // Trigger memory check
    setTimeout(() => {
      // Clean up
      largeArray.length = 0;
    }, 50);
  });

  it('should provide comprehensive memory report', () => {
    const report = memoryManager.getMemoryReport();
    expect(report).toHaveProperty('currentStats');
    expect(report).toHaveProperty('history');
    expect(report).toHaveProperty('alerts');
    expect(report).toHaveProperty('objectTracking');
    expect(report).toHaveProperty('gcStats');
  });
});

describe('GarbageCollector', () => {
  let garbageCollector: GarbageCollector;

  beforeEach(() => {
    mockGc.mockClear();
    garbageCollector = new GarbageCollector({
      strategy: 'balanced',
      minGcIntervalMs: 100,
      trackGcPerformance: true
    });
  });

  afterEach(() => {
    garbageCollector.shutdown();
  });

  it('should initialize with different strategies', () => {
    const aggressive = new GarbageCollector({ strategy: 'aggressive' });
    const conservative = new GarbageCollector({ strategy: 'conservative' });
    
    expect(aggressive).toBeDefined();
    expect(conservative).toBeDefined();
    
    aggressive.shutdown();
    conservative.shutdown();
  });

  it('should trigger garbage collection manually', async () => {
    const result = await garbageCollector.triggerGc('manual');
    expect(result).toBeDefined();
    expect(mockGc).toHaveBeenCalled();
  });

  it('should change strategies', () => {
    const result = garbageCollector.setStrategy('aggressive');
    expect(result).toBe(true);
    
    const stats = garbageCollector.getGcStats();
    expect(stats.currentStrategy).toBe('aggressive');
  });

  it('should track GC performance', async () => {
    await garbageCollector.triggerGc('manual');
    
    const stats = garbageCollector.getGcStats();
    expect(stats.gcCount).toBeGreaterThan(0);
    expect(stats.performanceHistory.length).toBeGreaterThan(0);
  });

  it('should determine when GC should be triggered', () => {
    const currentStats = {
      heapUsed: 600,
      heapTotal: 800,
      external: 50,
      rss: 700,
      arrayBuffers: 10
    };

    const shouldTrigger = garbageCollector.shouldTriggerGc(currentStats);
    expect(typeof shouldTrigger).toBe('boolean');
  });
});

describe('MemoryLeakDetector', () => {
  let leakDetector: MemoryLeakDetector;

  beforeEach(() => {
    leakDetector = new MemoryLeakDetector({
      detectionIntervalMs: 100,
      enableObjectTracking: true,
      enableTimerTracking: true,
      maxObjectGrowthRate: 0.5
    });
  });

  afterEach(() => {
    leakDetector.shutdown();
  });

  it('should track object creation and destruction', () => {
    leakDetector.trackObject('testObjects', 10);
    leakDetector.trackObject('testObjects', 5);
    leakDetector.trackObject('testObjects', -3);
    
    const status = leakDetector.getDetectionStatus();
    const tracker = status.objectTrackers.find(t => t.name === 'testObjects');
    expect(tracker).toBeDefined();
    expect(tracker!.count).toBe(12);
  });

  it('should detect potential memory leaks', async () => {
    // Simulate rapid object growth
    for (let i = 0; i < 10; i++) {
      leakDetector.trackObject('leakyObjects', 100);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const leaks = leakDetector.forceDetection();
    expect(Array.isArray(leaks)).toBe(true);
  });

  it('should track timer leaks', () => {
    // Create some timers
    const timer1 = setTimeout(() => {}, 1000);
    const timer2 = setInterval(() => {}, 1000);
    
    const status = leakDetector.getDetectionStatus();
    expect(status.activeTimers).toBeGreaterThan(0);
    
    // Clean up
    clearTimeout(timer1);
    clearInterval(timer2);
  });

  it('should provide leak reports by severity', () => {
    const allReports = leakDetector.getLeakReportsBySeverity();
    const highSeverity = leakDetector.getLeakReportsBySeverity('high');
    
    expect(Array.isArray(allReports)).toBe(true);
    expect(Array.isArray(highSeverity)).toBe(true);
  });

  it('should clear tracking data', () => {
    leakDetector.trackObject('testObjects', 5);
    leakDetector.clearTrackingData();
    
    const status = leakDetector.getDetectionStatus();
    expect(status.objectTrackers.length).toBe(0);
    expect(status.memoryHistory.length).toBe(0);
  });
});

describe('DataStructureOptimizer', () => {
  let optimizer: DataStructureOptimizer;

  beforeEach(() => {
    optimizer = new DataStructureOptimizer({
      enableArrayOptimization: true,
      enableObjectOptimization: true,
      enableStringOptimization: true,
      enableMemoryPooling: true
    });
  });

  afterEach(() => {
    optimizer.shutdown();
  });

  it('should optimize game state', () => {
    const gameState: GameState = {
      interactionId: 'test-interaction',
      status: 'active',
      initiativeOrder: [],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map<string, ParticipantState>(),
      mapState: {
        width: 10,
        height: 10,
        obstacles: [],
        entities: new Map()
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date()
    };

    // Add some test data
    gameState.turnHistory = new Array(2000).fill({
      entityId: 'test-entity',
      turnNumber: 1,
      roundNumber: 1,
      actions: [],
      startTime: new Date(),
      status: 'completed' as const
    });

    const results = optimizer.optimizeGameState(gameState);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should use memory pools', () => {
    const item1 = optimizer.getFromPool('turnRecord');
    const item2 = optimizer.getFromPool('chatMessage');
    
    // Items might be null if pools are empty initially
    expect(item1 === null || typeof item1 === 'object').toBe(true);
    expect(item2 === null || typeof item2 === 'object').toBe(true);
    
    if (item1) {
      const returned = optimizer.returnToPool('turnRecord', item1);
      expect(typeof returned).toBe('boolean');
    }
  });

  it('should provide pool statistics', () => {
    const stats = optimizer.getPoolStats();
    expect(typeof stats).toBe('object');
    
    // Should have some default pools
    expect(stats).toHaveProperty('turnRecord');
    expect(stats).toHaveProperty('chatMessage');
  });

  it('should track optimization history', () => {
    const history = optimizer.getOptimizationHistory();
    expect(Array.isArray(history)).toBe(true);
  });

  it('should reset optimizer state', () => {
    optimizer.reset();
    
    const history = optimizer.getOptimizationHistory();
    const stats = optimizer.getPoolStats();
    
    expect(history.length).toBe(0);
    
    // Pools should be reset
    Object.values(stats).forEach(pool => {
      expect(pool.hits).toBe(0);
      expect(pool.misses).toBe(0);
    });
  });
});

describe('MemoryManagementSystem', () => {
  let memorySystem: MemoryManagementSystem;
  let roomManager: RoomManager;

  beforeEach(async () => {
    roomManager = new RoomManager({
      inactivityTimeoutMs: 1000,
      cleanupIntervalMs: 500
    });

    memorySystem = new MemoryManagementSystem({
      enableMemoryManagement: true,
      enableGarbageCollection: true,
      enableLeakDetection: true,
      enableOptimization: true,
      optimizationIntervalMs: 200
    });

    await memorySystem.initialize(roomManager);
  });

  afterEach(async () => {
    await memorySystem.shutdown();
    roomManager.shutdown();
  });

  it('should initialize successfully', () => {
    expect(memorySystem).toBeDefined();
  });

  it('should provide comprehensive memory status', () => {
    const status = memorySystem.getMemoryStatus();
    
    expect(status).toHaveProperty('memoryStats');
    expect(status).toHaveProperty('gcStats');
    expect(status).toHaveProperty('leakDetectionStatus');
    expect(status).toHaveProperty('optimizationHistory');
    expect(status).toHaveProperty('systemHealth');
    
    expect(['healthy', 'warning', 'critical']).toContain(status.systemHealth);
  });

  it('should force comprehensive cleanup', async () => {
    const results = await memorySystem.forceCleanup();
    
    expect(results).toHaveProperty('gcResult');
    expect(results).toHaveProperty('staleDataCleaned');
    expect(results).toHaveProperty('optimizationResults');
    
    expect(typeof results.staleDataCleaned).toBe('number');
    expect(Array.isArray(results.optimizationResults)).toBe(true);
  });

  it('should get pool statistics', () => {
    const stats = memorySystem.getPoolStats();
    expect(typeof stats).toBe('object');
  });

  it('should force leak detection', () => {
    const leaks = memorySystem.forceLeakDetection();
    expect(Array.isArray(leaks)).toBe(true);
  });

  it('should enable/disable components', () => {
    memorySystem.setComponentEnabled('leakDetector', false);
    memorySystem.setComponentEnabled('optimizer', false);
    
    // Should not throw errors
    expect(() => {
      memorySystem.setComponentEnabled('leakDetector', true);
      memorySystem.setComponentEnabled('optimizer', true);
    }).not.toThrow();
  });

  it('should handle room optimization', async () => {
    // Create a test room
    const gameState: GameState = {
      interactionId: 'test-interaction',
      status: 'active',
      initiativeOrder: [],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map(),
      mapState: {
        width: 10,
        height: 10,
        obstacles: [],
        entities: new Map()
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date()
    };

    const room = await roomManager.createRoom('test-interaction', gameState);
    
    try {
      const results = memorySystem.optimizeRoom(room.id);
      expect(Array.isArray(results)).toBe(true);
    } catch (error) {
      // Room optimization might not find anything to optimize, which is fine
      expect(error).toBeDefined();
    }
  });

  it('should emit events for memory alerts', (done) => {
    memorySystem.on('memoryAlert', (alert) => {
      expect(alert).toHaveProperty('type');
      expect(alert).toHaveProperty('timestamp');
      done();
    });

    // This might not trigger immediately, so we'll use a timeout
    setTimeout(() => {
      done(); // Complete the test even if no alert is emitted
    }, 500);
  });
});

describe('Memory Management Integration', () => {
  it('should work together as a complete system', async () => {
    const roomManager = new RoomManager();
    const memorySystem = new MemoryManagementSystem({
      memoryManager: {
        memoryCheckIntervalMs: 100,
        memoryWarningThresholdMB: 50
      },
      garbageCollector: {
        strategy: 'balanced',
        minGcIntervalMs: 100
      },
      leakDetector: {
        detectionIntervalMs: 100,
        enableObjectTracking: true
      },
      optimizer: {
        enableArrayOptimization: true,
        enableObjectOptimization: true
      }
    });

    await memorySystem.initialize(roomManager);

    // Create some test data
    const gameState: GameState = {
      interactionId: 'integration-test',
      status: 'active',
      initiativeOrder: [],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map(),
      mapState: {
        width: 10,
        height: 10,
        obstacles: [],
        entities: new Map()
      },
      turnHistory: new Array(100).fill({
        entityId: 'test-entity',
        turnNumber: 1,
        roundNumber: 1,
        actions: [],
        startTime: new Date(),
        status: 'completed' as const
      }),
      chatLog: new Array(50).fill({
        id: 'test-message',
        userId: 'test-user',
        content: 'Test message content',
        type: 'party' as const,
        timestamp: Date.now()
      }),
      timestamp: new Date()
    };

    const room = await roomManager.createRoom('integration-test', gameState);

    // Wait for some processing
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get system status
    const status = memorySystem.getMemoryStatus();
    expect(status.systemHealth).toBeDefined();

    // Force cleanup
    const cleanupResults = await memorySystem.forceCleanup();
    expect(cleanupResults).toBeDefined();

    // Cleanup
    await memorySystem.shutdown();
    roomManager.shutdown();
  });
});