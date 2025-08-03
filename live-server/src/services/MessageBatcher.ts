import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { TypedStateDelta, BatchDelta, TypedStateDeltaSchema, BatchDeltaSchema } from '../schemas/stateDelta';
import { GameEvent } from '../schemas/gameEvents';

/**
 * Configuration for MessageBatcher
 */
export interface MessageBatcherConfig {
  batchDelayMs?: number;
  maxBatchSize?: number;
  maxQueueSize?: number;
  enableCompression?: boolean;
  enableMetrics?: boolean;
  priorityThreshold?: number;
}

/**
 * Batch message for efficient transmission
 */
export interface BatchMessage {
  id: string;
  type: 'delta' | 'event';
  data: TypedStateDelta | GameEvent;
  priority: number;
  timestamp: number;
  size: number;
}

/**
 * Batch queue for a specific room
 */
interface BatchQueue {
  roomId: string;
  messages: BatchMessage[];
  timer?: NodeJS.Timeout;
  isProcessing: boolean;
  lastFlush: number;
}

/**
 * Metrics for monitoring batching performance
 */
interface BatchMetrics {
  totalMessages: number;
  totalBatches: number;
  averageBatchSize: number;
  compressionRatio: number;
  queueOverflows: number;
  processingTime: number;
}

/**
 * MessageBatcher optimizes real-time message delivery through batching and compression
 * 
 * Features:
 * - Automatic message batching with configurable delays
 * - Priority-based message ordering
 * - Delta compression for state updates
 * - Queue overflow protection
 * - Performance metrics and monitoring
 */
export class MessageBatcher extends EventEmitter {
  private queues: Map<string, BatchQueue> = new Map();
  private config: Required<MessageBatcherConfig>;
  private metrics: BatchMetrics;
  private messageIdCounter: number = 0;

  constructor(config: MessageBatcherConfig = {}) {
    super();
    
    this.config = {
      batchDelayMs: config.batchDelayMs ?? 50, // 50ms batching delay
      maxBatchSize: config.maxBatchSize ?? 25,
      maxQueueSize: config.maxQueueSize ?? 100,
      enableCompression: config.enableCompression ?? true,
      enableMetrics: config.enableMetrics ?? true,
      priorityThreshold: config.priorityThreshold ?? 5, // High priority messages
    };

    this.metrics = {
      totalMessages: 0,
      totalBatches: 0,
      averageBatchSize: 0,
      compressionRatio: 1.0,
      queueOverflows: 0,
      processingTime: 0,
    };

    logger.info('MessageBatcher initialized', {
      config: this.config,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Queue a state delta for batching
   */
  queueDelta(roomId: string, delta: TypedStateDelta, priority: number = 1): string {
    try {
      // Validate delta
      const validatedDelta = TypedStateDeltaSchema.parse(delta);
      
      const message: BatchMessage = {
        id: this.generateMessageId(),
        type: 'delta',
        data: validatedDelta,
        priority,
        timestamp: Date.now(),
        size: this.calculateMessageSize(validatedDelta),
      };

      this.addToQueue(roomId, message);
      
      if (this.config.enableMetrics) {
        this.metrics.totalMessages++;
      }

      return message.id;
    } catch (error) {
      logger.error('Failed to queue delta', {
        roomId,
        deltaType: delta.type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Queue a game event for batching
   */
  queueEvent(roomId: string, event: GameEvent, priority: number = 1): string {
    try {
      const message: BatchMessage = {
        id: this.generateMessageId(),
        type: 'event',
        data: event,
        priority,
        timestamp: Date.now(),
        size: this.calculateMessageSize(event),
      };

      this.addToQueue(roomId, message);
      
      if (this.config.enableMetrics) {
        this.metrics.totalMessages++;
      }

      return message.id;
    } catch (error) {
      logger.error('Failed to queue event', {
        roomId,
        eventType: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Force flush all pending messages for a room
   */
  async flushRoom(roomId: string): Promise<void> {
    const queue = this.queues.get(roomId);
    if (!queue || queue.messages.length === 0) {
      return;
    }

    await this.processQueue(roomId);
  }

  /**
   * Force flush all pending messages for all rooms
   */
  async flushAll(): Promise<void> {
    const flushPromises: Promise<void>[] = [];
    
    for (const roomId of this.queues.keys()) {
      flushPromises.push(this.flushRoom(roomId));
    }

    await Promise.allSettled(flushPromises);
  }

  /**
   * Get current metrics
   */
  getMetrics(): BatchMetrics {
    return { ...this.metrics };
  }

  /**
   * Get queue status for a room
   */
  getQueueStatus(roomId: string): { size: number; isProcessing: boolean; lastFlush: number } | null {
    const queue = this.queues.get(roomId);
    if (!queue) return null;

    return {
      size: queue.messages.length,
      isProcessing: queue.isProcessing,
      lastFlush: queue.lastFlush,
    };
  }

  /**
   * Clear queue for a room
   */
  clearQueue(roomId: string): boolean {
    const queue = this.queues.get(roomId);
    if (!queue) return false;

    // Clear timer
    if (queue.timer) {
      clearTimeout(queue.timer);
    }

    // Remove queue
    this.queues.delete(roomId);

    logger.debug('Queue cleared', {
      roomId,
      messageCount: queue.messages.length,
    });

    return true;
  }

  /**
   * Shutdown the message batcher
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down MessageBatcher');

    // Flush all pending messages
    await this.flushAll();

    // Clear all timers
    for (const queue of this.queues.values()) {
      if (queue.timer) {
        clearTimeout(queue.timer);
      }
    }

    // Clear queues
    this.queues.clear();

    // Remove all listeners
    this.removeAllListeners();

    logger.info('MessageBatcher shutdown complete');
  }

  /**
   * Private helper methods
   */

  private addToQueue(roomId: string, message: BatchMessage): void {
    let queue = this.queues.get(roomId);
    
    if (!queue) {
      queue = {
        roomId,
        messages: [],
        isProcessing: false,
        lastFlush: Date.now(),
      };
      this.queues.set(roomId, queue);
    }

    // Check queue size limit
    if (queue.messages.length >= this.config.maxQueueSize) {
      // Remove oldest low-priority message
      const lowPriorityIndex = queue.messages.findIndex(m => m.priority < this.config.priorityThreshold);
      if (lowPriorityIndex !== -1) {
        queue.messages.splice(lowPriorityIndex, 1);
      } else {
        // Remove oldest message if all are high priority
        queue.messages.shift();
      }
      
      if (this.config.enableMetrics) {
        this.metrics.queueOverflows++;
      }
      
      logger.warn('Queue overflow, dropped message', {
        roomId,
        queueSize: queue.messages.length,
      });
    }

    // Insert message in priority order
    const insertIndex = this.findInsertIndex(queue.messages, message);
    queue.messages.splice(insertIndex, 0, message);

    // Check if we should flush immediately for high-priority messages
    if (message.priority >= this.config.priorityThreshold || 
        queue.messages.length >= this.config.maxBatchSize) {
      this.scheduleFlush(roomId, 0); // Immediate flush
    } else {
      this.scheduleFlush(roomId, this.config.batchDelayMs);
    }

    logger.debug('Message queued', {
      roomId,
      messageId: message.id,
      type: message.type,
      priority: message.priority,
      queueSize: queue.messages.length,
    });
  }

  private findInsertIndex(messages: BatchMessage[], newMessage: BatchMessage): number {
    // Insert by priority (higher priority first), then by timestamp
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (newMessage.priority > msg.priority || 
          (newMessage.priority === msg.priority && newMessage.timestamp < msg.timestamp)) {
        return i;
      }
    }
    return messages.length;
  }

  private scheduleFlush(roomId: string, delay: number): void {
    const queue = this.queues.get(roomId);
    if (!queue) return;

    // Clear existing timer
    if (queue.timer) {
      clearTimeout(queue.timer);
    }

    // Schedule new flush
    queue.timer = setTimeout(() => {
      this.processQueue(roomId).catch(error => {
        logger.error('Failed to process queue', {
          roomId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, delay);
  }

  private async processQueue(roomId: string): Promise<void> {
    const queue = this.queues.get(roomId);
    if (!queue || queue.isProcessing || queue.messages.length === 0) {
      return;
    }

    queue.isProcessing = true;
    const startTime = Date.now();

    try {
      // Clear timer
      if (queue.timer) {
        clearTimeout(queue.timer);
        queue.timer = undefined;
      }

      // Extract messages to process
      const messagesToProcess = queue.messages.splice(0, this.config.maxBatchSize);
      
      // Separate deltas and events
      const deltas = messagesToProcess
        .filter(m => m.type === 'delta')
        .map(m => m.data as TypedStateDelta);
      
      const events = messagesToProcess
        .filter(m => m.type === 'event')
        .map(m => m.data as GameEvent);

      // Create batches
      const batches: (BatchDelta | GameEvent[])[] = [];

      if (deltas.length > 0) {
        // Compress deltas if enabled
        const compressedDeltas = this.config.enableCompression ? 
          this.compressDeltas(deltas) : deltas;

        const batchDelta: BatchDelta = {
          deltas: compressedDeltas,
          timestamp: Date.now(),
          batchId: this.generateBatchId(),
        };

        // Validate batch
        const validatedBatch = BatchDeltaSchema.parse(batchDelta);
        batches.push(validatedBatch);
      }

      if (events.length > 0) {
        batches.push(events);
      }

      // Emit batches
      for (const batch of batches) {
        this.emit('batch', roomId, batch);
      }

      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(messagesToProcess.length, Date.now() - startTime);
      }

      queue.lastFlush = Date.now();

      logger.debug('Queue processed', {
        roomId,
        messageCount: messagesToProcess.length,
        batchCount: batches.length,
        processingTime: Date.now() - startTime,
      });

    } catch (error) {
      logger.error('Queue processing failed', {
        roomId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      queue.isProcessing = false;

      // Schedule next flush if there are remaining messages
      if (queue.messages.length > 0) {
        this.scheduleFlush(roomId, this.config.batchDelayMs);
      }
    }
  }

  private compressDeltas(deltas: TypedStateDelta[]): TypedStateDelta[] {
    // Simple delta compression - merge deltas of the same type and entity
    const compressed = new Map<string, TypedStateDelta>();

    for (const delta of deltas) {
      const key = `${delta.type}`;
      
      if (compressed.has(key)) {
        const existing = compressed.get(key)!;
        // Merge changes (later changes override earlier ones)
        if (existing.type === delta.type) {
          existing.changes = { ...existing.changes, ...delta.changes };
          existing.timestamp = Math.max(existing.timestamp, delta.timestamp);
        }
      } else {
        compressed.set(key, { ...delta });
      }
    }

    const result = Array.from(compressed.values());
    
    // Update compression ratio metric
    if (this.config.enableMetrics && deltas.length > 0) {
      const ratio = result.length / deltas.length;
      this.metrics.compressionRatio = 
        (this.metrics.compressionRatio * (this.metrics.totalBatches - 1) + ratio) / this.metrics.totalBatches;
    }

    return result;
  }

  private calculateMessageSize(data: any): number {
    // Rough estimate of message size in bytes
    return JSON.stringify(data).length;
  }

  private generateMessageId(): string {
    return `msg_${++this.messageIdCounter}_${Date.now()}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private updateMetrics(messageCount: number, processingTime: number): void {
    this.metrics.totalBatches++;
    this.metrics.averageBatchSize = 
      (this.metrics.averageBatchSize * (this.metrics.totalBatches - 1) + messageCount) / this.metrics.totalBatches;
    this.metrics.processingTime = 
      (this.metrics.processingTime * (this.metrics.totalBatches - 1) + processingTime) / this.metrics.totalBatches;
  }
}