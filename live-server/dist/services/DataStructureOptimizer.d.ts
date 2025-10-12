import { GameState } from '../types';
export interface OptimizationConfig {
    enableArrayOptimization?: boolean;
    arrayCompactionThreshold?: number;
    enableObjectOptimization?: boolean;
    objectPropertyThreshold?: number;
    enableStringOptimization?: boolean;
    stringDeduplicationThreshold?: number;
    enableMapOptimization?: boolean;
    mapSizeThreshold?: number;
    enableHistoryOptimization?: boolean;
    maxHistorySize?: number;
    historyCompressionRatio?: number;
    enableMemoryPooling?: boolean;
    poolSizeThreshold?: number;
}
export interface OptimizationResult {
    type: 'array' | 'object' | 'string' | 'map' | 'history' | 'pool';
    description: string;
    memoryBefore: number;
    memoryAfter: number;
    memorySaved: number;
    itemsProcessed: number;
    timestamp: Date;
}
export interface MemoryPool<T> {
    name: string;
    pool: T[];
    factory: () => T;
    reset: (item: T) => void;
    maxSize: number;
    hits: number;
    misses: number;
}
export declare class DataStructureOptimizer {
    private readonly config;
    private readonly optimizerLogger;
    private stringPool;
    private stringUsageCount;
    private memoryPools;
    private optimizationHistory;
    private maxHistorySize;
    constructor(config?: OptimizationConfig);
    optimizeGameState(gameState: GameState): OptimizationResult[];
    optimizeParticipants(gameState: GameState): OptimizationResult | null;
    optimizeTurnHistory(gameState: GameState): OptimizationResult | null;
    optimizeChatLog(gameState: GameState): OptimizationResult | null;
    optimizeStrings(obj: any): OptimizationResult | null;
    optimizeArrays(obj: any): OptimizationResult | null;
    getFromPool<T>(poolName: string): T | null;
    returnToPool<T>(poolName: string, item: T): boolean;
    getPoolStats(): {
        [poolName: string]: {
            size: number;
            maxSize: number;
            hits: number;
            misses: number;
            hitRate: number;
        };
    };
    getOptimizationHistory(): OptimizationResult[];
    reset(): void;
    shutdown(): void;
    private initializeMemoryPools;
    private optimizeParticipantState;
    private optimizeInventory;
    private compressTurnRecord;
    private isTurnCompressed;
    private optimizeChatMessage;
    private deduplicateStrings;
    private deduplicateString;
    private compactArrays;
    private estimateObjectSize;
    private estimateArraySize;
    private addOptimizationResult;
}
//# sourceMappingURL=DataStructureOptimizer.d.ts.map