import { EventEmitter } from 'events';
import { MemoryManagerConfig } from './MemoryManager';
import { GarbageCollectorConfig } from './GarbageCollector';
import { MemoryLeakDetectorConfig } from './MemoryLeakDetector';
import { OptimizationConfig } from './DataStructureOptimizer';
import { RoomManager } from './RoomManager';
export interface MemoryManagementSystemConfig {
    memoryManager?: MemoryManagerConfig;
    garbageCollector?: GarbageCollectorConfig;
    leakDetector?: MemoryLeakDetectorConfig;
    optimizer?: OptimizationConfig;
    enableMemoryManagement?: boolean;
    enableGarbageCollection?: boolean;
    enableLeakDetection?: boolean;
    enableOptimization?: boolean;
    autoOptimizeRooms?: boolean;
    optimizationIntervalMs?: number;
}
export declare class MemoryManagementSystem extends EventEmitter {
    private readonly config;
    private readonly systemLogger;
    private memoryManager;
    private garbageCollector;
    private leakDetector;
    private optimizer;
    private roomManager?;
    private optimizationInterval?;
    private isInitialized;
    constructor(config?: MemoryManagementSystemConfig);
    initialize(roomManager?: RoomManager): Promise<void>;
    setRoomManager(roomManager: RoomManager): void;
    getMemoryStatus(): {
        memoryStats: any;
        gcStats: any;
        leakDetectionStatus: any;
        optimizationHistory: any;
        systemHealth: 'healthy' | 'warning' | 'critical';
    };
    forceCleanup(): Promise<{
        gcResult: any;
        staleDataCleaned: number;
        optimizationResults: any[];
    }>;
    getPoolStats(): any;
    forceLeakDetection(): any[];
    optimizeRoom(roomId: string): any[];
    setComponentEnabled(component: 'memoryManager' | 'garbageCollector' | 'leakDetector' | 'optimizer', enabled: boolean): void;
    shutdown(): Promise<void>;
    private setupEventHandlers;
    private startOptimizationInterval;
    private stopOptimizationInterval;
}
//# sourceMappingURL=MemoryManagementSystem.d.ts.map