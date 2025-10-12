import { EventEmitter } from 'events';
import { RoomManager } from './RoomManager';
import { InteractionRoom } from './InteractionRoom';
export interface MemoryManagerConfig {
    memoryCheckIntervalMs?: number;
    memoryWarningThresholdMB?: number;
    memoryCriticalThresholdMB?: number;
    gcIntervalMs?: number;
    forceGcThresholdMB?: number;
    staleDataCleanupIntervalMs?: number;
    maxTurnHistoryEntries?: number;
    maxChatHistoryEntries?: number;
    inactiveRoomCleanupIntervalMs?: number;
    maxInactiveTimeMs?: number;
    enableDataCompression?: boolean;
    enableStateOptimization?: boolean;
    maxStateDeltaHistory?: number;
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
export declare class MemoryManager extends EventEmitter {
    private readonly config;
    private readonly memoryLogger;
    private roomManager?;
    private memoryCheckInterval?;
    private gcInterval?;
    private staleDataCleanupInterval?;
    private inactiveRoomCleanupInterval?;
    private leakDetectionInterval?;
    private memoryHistory;
    private maxMemoryHistorySize;
    private lastGcTime;
    private gcCount;
    private objectTrackers;
    private trackingEnabled;
    private recentAlerts;
    private maxRecentAlerts;
    constructor(config?: MemoryManagerConfig);
    setRoomManager(roomManager: RoomManager): void;
    getMemoryStats(): MemoryStats;
    getMemoryHistory(): MemoryStats[];
    getRecentAlerts(): MemoryAlert[];
    getObjectTrackingStats(): ObjectTracker[];
    forceGarbageCollection(): boolean;
    cleanupStaleData(): Promise<number>;
    optimizeRoomMemory(room: InteractionRoom): void;
    detectMemoryLeaks(): ObjectTracker[];
    getMemoryReport(): {
        currentStats: MemoryStats;
        history: MemoryStats[];
        alerts: MemoryAlert[];
        objectTracking: ObjectTracker[];
        gcStats: {
            count: number;
            lastGcTime: number;
        };
        roomStats?: {
            totalRooms: number;
            activeRooms: number;
            totalParticipants: number;
        };
    };
    shutdown(): void;
    private startMonitoring;
    private checkMemoryUsage;
    private checkGarbageCollection;
    private cleanupInactiveRooms;
    private cleanupRoomStaleData;
    private compressRoomData;
    private trackObject;
    private emitAlert;
}
//# sourceMappingURL=MemoryManager.d.ts.map