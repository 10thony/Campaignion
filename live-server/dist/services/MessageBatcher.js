"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBatcher = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const stateDelta_1 = require("../schemas/stateDelta");
class MessageBatcher extends events_1.EventEmitter {
    queues = new Map();
    config;
    metrics;
    messageIdCounter = 0;
    constructor(config = {}) {
        super();
        this.config = {
            batchDelayMs: config.batchDelayMs ?? 50,
            maxBatchSize: config.maxBatchSize ?? 25,
            maxQueueSize: config.maxQueueSize ?? 100,
            enableCompression: config.enableCompression ?? true,
            enableMetrics: config.enableMetrics ?? true,
            priorityThreshold: config.priorityThreshold ?? 5,
        };
        this.metrics = {
            totalMessages: 0,
            totalBatches: 0,
            averageBatchSize: 0,
            compressionRatio: 1.0,
            queueOverflows: 0,
            processingTime: 0,
        };
        logger_1.logger.info('MessageBatcher initialized', {
            config: this.config,
            timestamp: new Date().toISOString(),
        });
    }
    queueDelta(roomId, delta, priority = 1) {
        try {
            const validatedDelta = stateDelta_1.TypedStateDeltaSchema.parse(delta);
            const message = {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to queue delta', {
                roomId,
                deltaType: delta.type,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    queueEvent(roomId, event, priority = 1) {
        try {
            const message = {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to queue event', {
                roomId,
                eventType: event.type,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    async flushRoom(roomId) {
        const queue = this.queues.get(roomId);
        if (!queue || queue.messages.length === 0) {
            return;
        }
        await this.processQueue(roomId);
    }
    async flushAll() {
        const flushPromises = [];
        for (const roomId of this.queues.keys()) {
            flushPromises.push(this.flushRoom(roomId));
        }
        await Promise.allSettled(flushPromises);
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getQueueStatus(roomId) {
        const queue = this.queues.get(roomId);
        if (!queue)
            return null;
        return {
            size: queue.messages.length,
            isProcessing: queue.isProcessing,
            lastFlush: queue.lastFlush,
        };
    }
    clearQueue(roomId) {
        const queue = this.queues.get(roomId);
        if (!queue)
            return false;
        if (queue.timer) {
            clearTimeout(queue.timer);
        }
        this.queues.delete(roomId);
        logger_1.logger.debug('Queue cleared', {
            roomId,
            messageCount: queue.messages.length,
        });
        return true;
    }
    async shutdown() {
        logger_1.logger.info('Shutting down MessageBatcher');
        await this.flushAll();
        for (const queue of this.queues.values()) {
            if (queue.timer) {
                clearTimeout(queue.timer);
            }
        }
        this.queues.clear();
        this.removeAllListeners();
        logger_1.logger.info('MessageBatcher shutdown complete');
    }
    addToQueue(roomId, message) {
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
        if (queue.messages.length >= this.config.maxQueueSize) {
            const lowPriorityIndex = queue.messages.findIndex(m => m.priority < this.config.priorityThreshold);
            if (lowPriorityIndex !== -1) {
                queue.messages.splice(lowPriorityIndex, 1);
            }
            else {
                queue.messages.shift();
            }
            if (this.config.enableMetrics) {
                this.metrics.queueOverflows++;
            }
            logger_1.logger.warn('Queue overflow, dropped message', {
                roomId,
                queueSize: queue.messages.length,
            });
        }
        const insertIndex = this.findInsertIndex(queue.messages, message);
        queue.messages.splice(insertIndex, 0, message);
        if (message.priority >= this.config.priorityThreshold ||
            queue.messages.length >= this.config.maxBatchSize) {
            this.scheduleFlush(roomId, 0);
        }
        else {
            this.scheduleFlush(roomId, this.config.batchDelayMs);
        }
        logger_1.logger.debug('Message queued', {
            roomId,
            messageId: message.id,
            type: message.type,
            priority: message.priority,
            queueSize: queue.messages.length,
        });
    }
    findInsertIndex(messages, newMessage) {
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (newMessage.priority > msg.priority ||
                (newMessage.priority === msg.priority && newMessage.timestamp < msg.timestamp)) {
                return i;
            }
        }
        return messages.length;
    }
    scheduleFlush(roomId, delay) {
        const queue = this.queues.get(roomId);
        if (!queue)
            return;
        if (queue.timer) {
            clearTimeout(queue.timer);
        }
        queue.timer = setTimeout(() => {
            this.processQueue(roomId).catch(error => {
                logger_1.logger.error('Failed to process queue', {
                    roomId,
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }, delay);
    }
    async processQueue(roomId) {
        const queue = this.queues.get(roomId);
        if (!queue || queue.isProcessing || queue.messages.length === 0) {
            return;
        }
        queue.isProcessing = true;
        const startTime = Date.now();
        try {
            if (queue.timer) {
                clearTimeout(queue.timer);
                queue.timer = undefined;
            }
            const messagesToProcess = queue.messages.splice(0, this.config.maxBatchSize);
            const deltas = messagesToProcess
                .filter(m => m.type === 'delta')
                .map(m => m.data);
            const events = messagesToProcess
                .filter(m => m.type === 'event')
                .map(m => m.data);
            const batches = [];
            if (deltas.length > 0) {
                const compressedDeltas = this.config.enableCompression ?
                    this.compressDeltas(deltas) : deltas;
                const batchDelta = {
                    deltas: compressedDeltas,
                    timestamp: Date.now(),
                    batchId: this.generateBatchId(),
                };
                const validatedBatch = stateDelta_1.BatchDeltaSchema.parse(batchDelta);
                batches.push(validatedBatch);
            }
            if (events.length > 0) {
                batches.push(events);
            }
            for (const batch of batches) {
                this.emit('batch', roomId, batch);
            }
            if (this.config.enableMetrics) {
                this.updateMetrics(messagesToProcess.length, Date.now() - startTime);
            }
            queue.lastFlush = Date.now();
            logger_1.logger.debug('Queue processed', {
                roomId,
                messageCount: messagesToProcess.length,
                batchCount: batches.length,
                processingTime: Date.now() - startTime,
            });
        }
        catch (error) {
            logger_1.logger.error('Queue processing failed', {
                roomId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
        finally {
            queue.isProcessing = false;
            if (queue.messages.length > 0) {
                this.scheduleFlush(roomId, this.config.batchDelayMs);
            }
        }
    }
    compressDeltas(deltas) {
        const compressed = new Map();
        for (const delta of deltas) {
            const key = `${delta.type}`;
            if (compressed.has(key)) {
                const existing = compressed.get(key);
                if (existing.type === delta.type) {
                    existing.changes = { ...existing.changes, ...delta.changes };
                    existing.timestamp = Math.max(existing.timestamp, delta.timestamp);
                }
            }
            else {
                compressed.set(key, { ...delta });
            }
        }
        const result = Array.from(compressed.values());
        if (this.config.enableMetrics && deltas.length > 0) {
            const ratio = result.length / deltas.length;
            this.metrics.compressionRatio =
                (this.metrics.compressionRatio * (this.metrics.totalBatches - 1) + ratio) / this.metrics.totalBatches;
        }
        return result;
    }
    calculateMessageSize(data) {
        return JSON.stringify(data).length;
    }
    generateMessageId() {
        return `msg_${++this.messageIdCounter}_${Date.now()}`;
    }
    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    updateMetrics(messageCount, processingTime) {
        this.metrics.totalBatches++;
        this.metrics.averageBatchSize =
            (this.metrics.averageBatchSize * (this.metrics.totalBatches - 1) + messageCount) / this.metrics.totalBatches;
        this.metrics.processingTime =
            (this.metrics.processingTime * (this.metrics.totalBatches - 1) + processingTime) / this.metrics.totalBatches;
    }
}
exports.MessageBatcher = MessageBatcher;
//# sourceMappingURL=MessageBatcher.js.map