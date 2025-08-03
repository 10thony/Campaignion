"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBroadcaster = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const gameEvents_1 = require("../schemas/gameEvents");
const stateDelta_1 = require("../schemas/stateDelta");
class EventBroadcaster extends events_1.EventEmitter {
    subscriptions = new Map();
    userSubscriptions = new Map();
    roomSubscriptions = new Map();
    pendingDeltas = new Map();
    batchTimers = new Map();
    metrics;
    config;
    constructor(config = {}) {
        super();
        this.config = {
            maxSubscriptionsPerUser: config.maxSubscriptionsPerUser ?? 10,
            subscriptionTimeoutMs: config.subscriptionTimeoutMs ?? 300000,
            batchDelayMs: config.batchDelayMs ?? 100,
            maxBatchSize: config.maxBatchSize ?? 50,
            enableMetrics: config.enableMetrics ?? true,
        };
        this.metrics = {
            totalEvents: 0,
            totalSubscriptions: 0,
            eventsByType: new Map(),
            subscriptionsByRoom: new Map(),
            averageDeliveryTime: 0,
            failedDeliveries: 0,
        };
        this.startCleanupTimer();
        logger_1.logger.info('EventBroadcaster initialized', {
            config: this.config,
            timestamp: new Date().toISOString(),
        });
    }
    subscribe(interactionId, eventTypes, handler, userId) {
        const subscriptionId = this.generateSubscriptionId();
        if (userId && this.getUserSubscriptionCount(userId) >= this.config.maxSubscriptionsPerUser) {
            throw new Error(`User ${userId} has reached maximum subscription limit`);
        }
        const subscription = {
            id: subscriptionId,
            userId,
            interactionId,
            eventTypes,
            handler,
            createdAt: new Date(),
            lastActivity: new Date(),
        };
        this.subscriptions.set(subscriptionId, subscription);
        if (userId) {
            if (!this.userSubscriptions.has(userId)) {
                this.userSubscriptions.set(userId, new Set());
            }
            this.userSubscriptions.get(userId).add(subscriptionId);
        }
        if (!this.roomSubscriptions.has(interactionId)) {
            this.roomSubscriptions.set(interactionId, new Set());
        }
        this.roomSubscriptions.get(interactionId).add(subscriptionId);
        if (this.config.enableMetrics) {
            this.metrics.totalSubscriptions++;
            const roomCount = this.metrics.subscriptionsByRoom.get(interactionId) || 0;
            this.metrics.subscriptionsByRoom.set(interactionId, roomCount + 1);
        }
        logger_1.logger.debug('Event subscription created', {
            subscriptionId,
            userId,
            interactionId,
            eventTypes,
            timestamp: new Date().toISOString(),
        });
        return subscriptionId;
    }
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            return false;
        }
        if (subscription.userId) {
            const userSubs = this.userSubscriptions.get(subscription.userId);
            if (userSubs) {
                userSubs.delete(subscriptionId);
                if (userSubs.size === 0) {
                    this.userSubscriptions.delete(subscription.userId);
                }
            }
        }
        const roomSubs = this.roomSubscriptions.get(subscription.interactionId);
        if (roomSubs) {
            roomSubs.delete(subscriptionId);
            if (roomSubs.size === 0) {
                this.roomSubscriptions.delete(subscription.interactionId);
            }
        }
        this.subscriptions.delete(subscriptionId);
        if (this.config.enableMetrics) {
            this.metrics.totalSubscriptions--;
            const roomCount = this.metrics.subscriptionsByRoom.get(subscription.interactionId) || 0;
            this.metrics.subscriptionsByRoom.set(subscription.interactionId, Math.max(0, roomCount - 1));
        }
        logger_1.logger.debug('Event subscription removed', {
            subscriptionId,
            userId: subscription.userId,
            interactionId: subscription.interactionId,
            timestamp: new Date().toISOString(),
        });
        return true;
    }
    async broadcast(interactionId, event) {
        const startTime = Date.now();
        try {
            const enrichedEvent = {
                ...event,
                timestamp: event.timestamp ?? Date.now(),
                interactionId: event.interactionId ?? interactionId,
            };
            const validatedEvent = gameEvents_1.GameEventSchema.parse(enrichedEvent);
            const roomSubs = this.roomSubscriptions.get(interactionId);
            if (!roomSubs || roomSubs.size === 0) {
                logger_1.logger.debug('No subscribers for room broadcast', {
                    interactionId,
                    eventType: event.type,
                });
                return;
            }
            const deliveryPromises = [];
            for (const subscriptionId of roomSubs) {
                const subscription = this.subscriptions.get(subscriptionId);
                if (!subscription)
                    continue;
                if (!subscription.eventTypes.includes(event.type) && !subscription.eventTypes.includes('*')) {
                    continue;
                }
                subscription.lastActivity = new Date();
                deliveryPromises.push(this.deliverEvent(subscription, validatedEvent));
            }
            await Promise.allSettled(deliveryPromises);
            if (this.config.enableMetrics) {
                this.updateMetrics(event.type, Date.now() - startTime, deliveryPromises.length);
            }
            logger_1.logger.debug('Event broadcast completed', {
                interactionId,
                eventType: event.type,
                subscriberCount: deliveryPromises.length,
                deliveryTime: Date.now() - startTime,
            });
        }
        catch (error) {
            logger_1.logger.error('Event broadcast failed', {
                interactionId,
                eventType: event.type,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            if (this.config.enableMetrics) {
                this.metrics.failedDeliveries++;
            }
            throw error;
        }
    }
    async broadcastToUser(interactionId, userId, event) {
        const startTime = Date.now();
        try {
            const enrichedEvent = {
                ...event,
                timestamp: event.timestamp ?? Date.now(),
                interactionId: event.interactionId ?? interactionId,
            };
            const validatedEvent = gameEvents_1.GameEventSchema.parse(enrichedEvent);
            const userSubs = this.userSubscriptions.get(userId);
            if (!userSubs || userSubs.size === 0) {
                logger_1.logger.debug('No subscriptions for user broadcast', {
                    interactionId,
                    userId,
                    eventType: event.type,
                });
                return;
            }
            const deliveryPromises = [];
            for (const subscriptionId of userSubs) {
                const subscription = this.subscriptions.get(subscriptionId);
                if (!subscription || subscription.interactionId !== interactionId)
                    continue;
                if (!subscription.eventTypes.includes(event.type) && !subscription.eventTypes.includes('*')) {
                    continue;
                }
                subscription.lastActivity = new Date();
                deliveryPromises.push(this.deliverEvent(subscription, validatedEvent));
            }
            await Promise.allSettled(deliveryPromises);
            if (this.config.enableMetrics) {
                this.updateMetrics(event.type, Date.now() - startTime, deliveryPromises.length);
            }
            logger_1.logger.debug('User event broadcast completed', {
                interactionId,
                userId,
                eventType: event.type,
                subscriberCount: deliveryPromises.length,
                deliveryTime: Date.now() - startTime,
            });
        }
        catch (error) {
            logger_1.logger.error('User event broadcast failed', {
                interactionId,
                userId,
                eventType: event.type,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            if (this.config.enableMetrics) {
                this.metrics.failedDeliveries++;
            }
            throw error;
        }
    }
    async broadcastDelta(interactionId, delta) {
        try {
            const validatedDelta = stateDelta_1.TypedStateDeltaSchema.parse({
                ...delta,
                timestamp: delta.timestamp || Date.now(),
            });
            if (!this.pendingDeltas.has(interactionId)) {
                this.pendingDeltas.set(interactionId, []);
            }
            const pendingDeltas = this.pendingDeltas.get(interactionId);
            pendingDeltas.push(validatedDelta);
            if (pendingDeltas.length >= this.config.maxBatchSize) {
                await this.flushPendingDeltas(interactionId);
            }
            else {
                if (!this.batchTimers.has(interactionId)) {
                    const timer = setTimeout(() => {
                        this.flushPendingDeltas(interactionId).catch(error => {
                            logger_1.logger.error('Failed to flush pending deltas', {
                                interactionId,
                                error: error instanceof Error ? error.message : String(error),
                            });
                        });
                    }, this.config.batchDelayMs);
                    this.batchTimers.set(interactionId, timer);
                }
            }
            logger_1.logger.debug('Delta queued for broadcast', {
                interactionId,
                deltaType: delta.type,
                pendingCount: pendingDeltas.length,
            });
        }
        catch (error) {
            logger_1.logger.error('Delta broadcast failed', {
                interactionId,
                deltaType: delta.type,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    }
    getMetrics() {
        return {
            ...this.metrics,
            eventsByType: new Map(this.metrics.eventsByType),
            subscriptionsByRoom: new Map(this.metrics.subscriptionsByRoom),
        };
    }
    getUserSubscriptionCount(userId) {
        const userSubs = this.userSubscriptions.get(userId);
        return userSubs ? userSubs.size : 0;
    }
    getRoomSubscriptionCount(interactionId) {
        const roomSubs = this.roomSubscriptions.get(interactionId);
        return roomSubs ? roomSubs.size : 0;
    }
    cleanup() {
        const now = new Date();
        const expiredSubscriptions = [];
        for (const [subscriptionId, subscription] of this.subscriptions) {
            const timeSinceActivity = now.getTime() - subscription.lastActivity.getTime();
            if (timeSinceActivity > this.config.subscriptionTimeoutMs) {
                expiredSubscriptions.push(subscriptionId);
            }
        }
        for (const subscriptionId of expiredSubscriptions) {
            this.unsubscribe(subscriptionId);
        }
        for (const [interactionId, timer] of this.batchTimers) {
            const pendingDeltas = this.pendingDeltas.get(interactionId);
            if (!pendingDeltas || pendingDeltas.length === 0) {
                clearTimeout(timer);
                this.batchTimers.delete(interactionId);
                this.pendingDeltas.delete(interactionId);
            }
        }
        if (expiredSubscriptions.length > 0) {
            logger_1.logger.info('Cleaned up expired subscriptions', {
                expiredCount: expiredSubscriptions.length,
                remainingCount: this.subscriptions.size,
                timestamp: new Date().toISOString(),
            });
        }
    }
    async shutdown() {
        logger_1.logger.info('Shutting down EventBroadcaster');
        for (const timer of this.batchTimers.values()) {
            clearTimeout(timer);
        }
        this.batchTimers.clear();
        const flushPromises = [];
        for (const interactionId of this.pendingDeltas.keys()) {
            flushPromises.push(this.flushPendingDeltas(interactionId));
        }
        await Promise.allSettled(flushPromises);
        this.subscriptions.clear();
        this.userSubscriptions.clear();
        this.roomSubscriptions.clear();
        this.pendingDeltas.clear();
        this.removeAllListeners();
        logger_1.logger.info('EventBroadcaster shutdown complete');
    }
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    async deliverEvent(subscription, event) {
        try {
            await subscription.handler(event);
        }
        catch (error) {
            logger_1.logger.error('Event delivery failed', {
                subscriptionId: subscription.id,
                userId: subscription.userId,
                interactionId: subscription.interactionId,
                eventType: event.type,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            if (this.config.enableMetrics) {
                this.metrics.failedDeliveries++;
            }
        }
    }
    async flushPendingDeltas(interactionId) {
        const pendingDeltas = this.pendingDeltas.get(interactionId);
        if (!pendingDeltas || pendingDeltas.length === 0) {
            return;
        }
        const timer = this.batchTimers.get(interactionId);
        if (timer) {
            clearTimeout(timer);
            this.batchTimers.delete(interactionId);
        }
        const batchDelta = {
            deltas: [...pendingDeltas],
            timestamp: Date.now(),
            batchId: `batch_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        };
        this.pendingDeltas.set(interactionId, []);
        const validatedBatch = stateDelta_1.BatchDeltaSchema.parse(batchDelta);
        const deltaEvent = {
            type: 'STATE_DELTA',
            timestamp: Date.now(),
            interactionId: interactionId,
            changes: {
                type: 'participant',
                changes: {},
                timestamp: Date.now(),
            },
        };
        await this.broadcast(interactionId, deltaEvent);
        logger_1.logger.debug('Delta batch flushed', {
            interactionId,
            batchId: batchDelta.batchId,
            deltaCount: batchDelta.deltas.length,
        });
    }
    updateMetrics(eventType, deliveryTime, subscriberCount) {
        this.metrics.totalEvents++;
        const currentCount = this.metrics.eventsByType.get(eventType) || 0;
        this.metrics.eventsByType.set(eventType, currentCount + 1);
        const totalDeliveries = this.metrics.totalEvents;
        this.metrics.averageDeliveryTime =
            (this.metrics.averageDeliveryTime * (totalDeliveries - 1) + deliveryTime) / totalDeliveries;
    }
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
}
exports.EventBroadcaster = EventBroadcaster;
//# sourceMappingURL=EventBroadcaster.js.map