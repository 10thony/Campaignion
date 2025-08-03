import { EventEmitter } from 'events';
import { TypedStateDelta } from '../schemas/stateDelta';
import { GameEvent } from '../schemas/gameEvents';
export interface MessageBatcherConfig {
    batchDelayMs?: number;
    maxBatchSize?: number;
    maxQueueSize?: number;
    enableCompression?: boolean;
    enableMetrics?: boolean;
    priorityThreshold?: number;
}
export interface BatchMessage {
    id: string;
    type: 'delta' | 'event';
    data: TypedStateDelta | GameEvent;
    priority: number;
    timestamp: number;
    size: number;
}
interface BatchMetrics {
    totalMessages: number;
    totalBatches: number;
    averageBatchSize: number;
    compressionRatio: number;
    queueOverflows: number;
    processingTime: number;
}
export declare class MessageBatcher extends EventEmitter {
    private queues;
    private config;
    private metrics;
    private messageIdCounter;
    constructor(config?: MessageBatcherConfig);
    queueDelta(roomId: string, delta: TypedStateDelta, priority?: number): string;
    queueEvent(roomId: string, event: GameEvent, priority?: number): string;
    flushRoom(roomId: string): Promise<void>;
    flushAll(): Promise<void>;
    getMetrics(): BatchMetrics;
    getQueueStatus(roomId: string): {
        size: number;
        isProcessing: boolean;
        lastFlush: number;
    } | null;
    clearQueue(roomId: string): boolean;
    shutdown(): Promise<void>;
    private addToQueue;
    private findInsertIndex;
    private scheduleFlush;
    private processQueue;
    private compressDeltas;
    private calculateMessageSize;
    private generateMessageId;
    private generateBatchId;
    private updateMetrics;
}
export {};
//# sourceMappingURL=MessageBatcher.d.ts.map