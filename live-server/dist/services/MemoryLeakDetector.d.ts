import { EventEmitter } from 'events';
import { MemoryStats } from './MemoryManager';
export interface MemoryLeakDetectorConfig {
    detectionIntervalMs?: number;
    heapSnapshotIntervalMs?: number;
    memoryGrowthThreshold?: number;
    heapGrowthRateThreshold?: number;
    consecutiveGrowthThreshold?: number;
    enableObjectTracking?: boolean;
    maxTrackedObjects?: number;
    objectGrowthThreshold?: number;
    enableEventListenerTracking?: boolean;
    maxEventListeners?: number;
    enableTimerTracking?: boolean;
    maxActiveTimers?: number;
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
    samples: {
        timestamp: Date;
        count: number;
    }[];
    lastUpdate: Date;
}
export interface HeapSnapshot {
    timestamp: Date;
    memoryStats: MemoryStats;
    objectCounts: Map<string, number>;
    eventListenerCount: number;
    timerCount: number;
}
export declare class MemoryLeakDetector extends EventEmitter {
    private readonly config;
    private readonly leakLogger;
    private detectionInterval?;
    private snapshotInterval?;
    private isDetectionActive;
    private memoryHistory;
    private consecutiveGrowthCount;
    private lastMemoryCheck;
    private objectTrackers;
    private heapSnapshots;
    private leakReports;
    private originalSetTimeout;
    private originalSetInterval;
    private originalClearTimeout;
    private originalClearInterval;
    private activeTimers;
    private timerCreationStack;
    constructor(config?: MemoryLeakDetectorConfig);
    startDetection(): void;
    stopDetection(): void;
    trackObject(name: string, countChange: number): void;
    getDetectionStatus(): {
        isActive: boolean;
        memoryHistory: {
            timestamp: Date;
            stats: MemoryStats;
        }[];
        objectTrackers: ObjectTrackingData[];
        heapSnapshots: HeapSnapshot[];
        leakReports: LeakDetectionResult[];
        activeTimers: number;
        consecutiveGrowthCount: number;
    };
    getLeakReportsBySeverity(severity?: 'low' | 'medium' | 'high' | 'critical'): LeakDetectionResult[];
    clearTrackingData(): void;
    forceDetection(): LeakDetectionResult[];
    shutdown(): void;
    private performLeakDetection;
    private checkMemoryGrowth;
    private checkObjectLeaks;
    private checkTimerLeaks;
    private checkEventListenerLeaks;
    private takeHeapSnapshot;
    private installTimerTracking;
    private uninstallTimerTracking;
    private getEventListenerCount;
    private getMemoryStats;
    private reportLeak;
}
//# sourceMappingURL=MemoryLeakDetector.d.ts.map