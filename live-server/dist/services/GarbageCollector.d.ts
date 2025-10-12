import { EventEmitter } from 'events';
import { MemoryStats } from './MemoryManager';
export interface GarbageCollectorConfig {
    strategy?: 'aggressive' | 'balanced' | 'conservative';
    heapGrowthThreshold?: number;
    memoryPressureThreshold?: number;
    minGcIntervalMs?: number;
    maxGcIntervalMs?: number;
    enableIncrementalGc?: boolean;
    enableGenerationalGc?: boolean;
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
export declare class GarbageCollector extends EventEmitter {
    private readonly config;
    private readonly gcLogger;
    private lastGcTime;
    private gcCount;
    private performanceHistory;
    private strategies;
    private currentStrategy;
    private gcTimer?;
    private isGcInProgress;
    constructor(config?: GarbageCollectorConfig);
    shouldTriggerGc(currentStats: MemoryStats, previousStats?: MemoryStats): boolean;
    triggerGc(type?: 'manual' | 'automatic' | 'pressure'): Promise<GcPerformanceMetrics | null>;
    setStrategy(strategyName: 'aggressive' | 'balanced' | 'conservative'): boolean;
    getGcStats(): {
        gcCount: number;
        lastGcTime: number;
        isGcInProgress: boolean;
        currentStrategy: string;
        performanceHistory: GcPerformanceMetrics[];
        averageGcTime: number;
        averageMemoryFreed: number;
        successRate: number;
    };
    optimizeGcStrategy(): void;
    forceGc(): Promise<GcPerformanceMetrics | null>;
    shutdown(): void;
    private initializeStrategies;
    private executeBasicGc;
    private executeBalancedGc;
    private executeAggressiveGc;
    private getMemoryStats;
    private addPerformanceMetrics;
    private startGcTimer;
}
//# sourceMappingURL=GarbageCollector.d.ts.map