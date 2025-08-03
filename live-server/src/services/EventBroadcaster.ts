import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { GameEvent, StateDelta } from '../schemas/gameEvents';
import { GameEventSchema } from '../schemas/gameEvents';
import { TypedStateDelta, BatchDelta } from '../schemas/stateDelta';
import { TypedStateDeltaSchema, BatchDeltaSchema } from '../schemas/stateDelta';

/**
 * Event handler function type for game events
 */
export type EventHandler<T = GameEvent> = (event: T) => void | Promise<void>;

/**
 * Subscription information for tracking event listeners
 */
interface EventSubscription {
  id: string;
  userId: string | undefined;
  interactionId: string;
  eventTypes: string[];
  handler: EventHandler;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Configuration for EventBroadcaster
 */
export interface EventBroadcasterConfig {
  maxSubscriptionsPerUser?: number;
  subscriptionTimeoutMs?: number;
  batchDelayMs?: number;
  maxBatchSize?: number;
  enableMetrics?: boolean;
}

/**
 * Metrics for monitoring event broadcasting performance
 */
interface BroadcastMetrics {
  totalEvents: number;
  totalSubscriptions: number;
  eventsByType: Map<string, number>;
  subscriptionsByRoom: Map<string, number>;
  averageDeliveryTime: number;
  failedDeliveries: number;
}

/**
 * EventBroadcaster handles real-time event distribution for live interactions
 * 
 * Features:
 * - Room-wide and user-specific event broadcasting
 * - Delta broadcasting for efficient state synchronization
 * - Event batching for performance optimization
 * - Subscription management with automatic cleanup
 * - Metrics and monitoring support
 */
export class EventBroadcaster extends EventEmitter {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private userSubscriptions: Map<string, Set<string>> = new Map();
  private roomSubscriptions: Map<string, Set<string>> = new Map();
  private pendingDeltas: Map<string, TypedStateDelta[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private metrics: BroadcastMetrics;
  private config: Required<EventBroadcasterConfig>;

  constructor(config: EventBroadcasterConfig = {}) {
    super();
    
    this.config = {
      maxSubscriptionsPerUser: config.maxSubscriptionsPerUser ?? 10,
      subscriptionTimeoutMs: config.subscriptionTimeoutMs ?? 300000, // 5 minutes
      batchDelayMs: config.batchDelayMs ?? 100, // 100ms batching
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

    // Start cleanup timer
    this.startCleanupTimer();
    
    logger.info('EventBroadcaster initialized', {
      config: this.config,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to events for a specific interaction room
   */
  subscribe(
    interactionId: string,
    eventTypes: string[],
    handler: EventHandler,
    userId?: string
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    
    // Check user subscription limits
    if (userId && this.getUserSubscriptionCount(userId) >= this.config.maxSubscriptionsPerUser) {
      throw new Error(`User ${userId} has reached maximum subscription limit`);
    }

    const subscription: EventSubscription = {
      id: subscriptionId,
      userId,
      interactionId,
      eventTypes,
      handler,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    // Store subscription
    this.subscriptions.set(subscriptionId, subscription);

    // Update user subscriptions index
    if (userId) {
      if (!this.userSubscriptions.has(userId)) {
        this.userSubscriptions.set(userId, new Set());
      }
      this.userSubscriptions.get(userId)!.add(subscriptionId);
    }

    // Update room subscriptions index
    if (!this.roomSubscriptions.has(interactionId)) {
      this.roomSubscriptions.set(interactionId, new Set());
    }
    this.roomSubscriptions.get(interactionId)!.add(subscriptionId);

    // Update metrics
    if (this.config.enableMetrics) {
      this.metrics.totalSubscriptions++;
      const roomCount = this.metrics.subscriptionsByRoom.get(interactionId) || 0;
      this.metrics.subscriptionsByRoom.set(interactionId, roomCount + 1);
    }

    logger.debug('Event subscription created', {
      subscriptionId,
      userId,
      interactionId,
      eventTypes,
      timestamp: new Date().toISOString(),
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    // Remove from user subscriptions index
    if (subscription.userId) {
      const userSubs = this.userSubscriptions.get(subscription.userId);
      if (userSubs) {
        userSubs.delete(subscriptionId);
        if (userSubs.size === 0) {
          this.userSubscriptions.delete(subscription.userId);
        }
      }
    }

    // Remove from room subscriptions index
    const roomSubs = this.roomSubscriptions.get(subscription.interactionId);
    if (roomSubs) {
      roomSubs.delete(subscriptionId);
      if (roomSubs.size === 0) {
        this.roomSubscriptions.delete(subscription.interactionId);
      }
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId);

    // Update metrics
    if (this.config.enableMetrics) {
      this.metrics.totalSubscriptions--;
      const roomCount = this.metrics.subscriptionsByRoom.get(subscription.interactionId) || 0;
      this.metrics.subscriptionsByRoom.set(subscription.interactionId, Math.max(0, roomCount - 1));
    }

    logger.debug('Event subscription removed', {
      subscriptionId,
      userId: subscription.userId,
      interactionId: subscription.interactionId,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Broadcast event to all subscribers in a room
   */
  async broadcast(interactionId: string, event: GameEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Add missing properties if not present
      const enrichedEvent = {
        ...event,
        timestamp: (event as any).timestamp ?? Date.now(),
        interactionId: (event as any).interactionId ?? interactionId,
      };

      // Validate event
      const validatedEvent = GameEventSchema.parse(enrichedEvent);

      const roomSubs = this.roomSubscriptions.get(interactionId);
      if (!roomSubs || roomSubs.size === 0) {
        logger.debug('No subscribers for room broadcast', {
          interactionId,
          eventType: event.type,
        });
        return;
      }

      const deliveryPromises: Promise<void>[] = [];

      for (const subscriptionId of roomSubs) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) continue;

        // Check if subscription is interested in this event type
        if (!subscription.eventTypes.includes(event.type) && !subscription.eventTypes.includes('*')) {
          continue;
        }

        // Update subscription activity
        subscription.lastActivity = new Date();

        // Deliver event
        deliveryPromises.push(this.deliverEvent(subscription, validatedEvent));
      }

      // Wait for all deliveries
      await Promise.allSettled(deliveryPromises);

      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(event.type, Date.now() - startTime, deliveryPromises.length);
      }

      logger.debug('Event broadcast completed', {
        interactionId,
        eventType: event.type,
        subscriberCount: deliveryPromises.length,
        deliveryTime: Date.now() - startTime,
      });

    } catch (error) {
      logger.error('Event broadcast failed', {
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

  /**
   * Broadcast event to a specific user
   */
  async broadcastToUser(interactionId: string, userId: string, event: GameEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Add missing properties if not present
      const enrichedEvent = {
        ...event,
        timestamp: (event as any).timestamp ?? Date.now(),
        interactionId: (event as any).interactionId ?? interactionId,
      };

      // Validate event
      const validatedEvent = GameEventSchema.parse(enrichedEvent);

      const userSubs = this.userSubscriptions.get(userId);
      if (!userSubs || userSubs.size === 0) {
        logger.debug('No subscriptions for user broadcast', {
          interactionId,
          userId,
          eventType: event.type,
        });
        return;
      }

      const deliveryPromises: Promise<void>[] = [];

      for (const subscriptionId of userSubs) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription || subscription.interactionId !== interactionId) continue;

        // Check if subscription is interested in this event type
        if (!subscription.eventTypes.includes(event.type) && !subscription.eventTypes.includes('*')) {
          continue;
        }

        // Update subscription activity
        subscription.lastActivity = new Date();

        // Deliver event
        deliveryPromises.push(this.deliverEvent(subscription, validatedEvent));
      }

      // Wait for all deliveries
      await Promise.allSettled(deliveryPromises);

      // Update metrics
      if (this.config.enableMetrics) {
        this.updateMetrics(event.type, Date.now() - startTime, deliveryPromises.length);
      }

      logger.debug('User event broadcast completed', {
        interactionId,
        userId,
        eventType: event.type,
        subscriberCount: deliveryPromises.length,
        deliveryTime: Date.now() - startTime,
      });

    } catch (error) {
      logger.error('User event broadcast failed', {
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

  /**
   * Broadcast state delta with batching for efficiency
   */
  async broadcastDelta(interactionId: string, delta: TypedStateDelta): Promise<void> {
    try {
      // Validate delta
      const validatedDelta = TypedStateDeltaSchema.parse({
        ...delta,
        timestamp: delta.timestamp || Date.now(),
      });

      // Add to pending deltas for batching
      if (!this.pendingDeltas.has(interactionId)) {
        this.pendingDeltas.set(interactionId, []);
      }
      
      const pendingDeltas = this.pendingDeltas.get(interactionId)!;
      pendingDeltas.push(validatedDelta);

      // Check if we should flush immediately
      if (pendingDeltas.length >= this.config.maxBatchSize) {
        await this.flushPendingDeltas(interactionId);
      } else {
        // Set up batch timer if not already set
        if (!this.batchTimers.has(interactionId)) {
          const timer = setTimeout(() => {
            this.flushPendingDeltas(interactionId).catch(error => {
              logger.error('Failed to flush pending deltas', {
                interactionId,
                error: error instanceof Error ? error.message : String(error),
              });
            });
          }, this.config.batchDelayMs);
          
          this.batchTimers.set(interactionId, timer);
        }
      }

      logger.debug('Delta queued for broadcast', {
        interactionId,
        deltaType: delta.type,
        pendingCount: pendingDeltas.length,
      });

    } catch (error) {
      logger.error('Delta broadcast failed', {
        interactionId,
        deltaType: delta.type,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): BroadcastMetrics {
    return {
      ...this.metrics,
      eventsByType: new Map(this.metrics.eventsByType),
      subscriptionsByRoom: new Map(this.metrics.subscriptionsByRoom),
    };
  }

  /**
   * Get subscription count for a user
   */
  getUserSubscriptionCount(userId: string): number {
    const userSubs = this.userSubscriptions.get(userId);
    return userSubs ? userSubs.size : 0;
  }

  /**
   * Get subscription count for a room
   */
  getRoomSubscriptionCount(interactionId: string): number {
    const roomSubs = this.roomSubscriptions.get(interactionId);
    return roomSubs ? roomSubs.size : 0;
  }

  /**
   * Clean up expired subscriptions and resources
   */
  cleanup(): void {
    const now = new Date();
    const expiredSubscriptions: string[] = [];

    // Find expired subscriptions
    for (const [subscriptionId, subscription] of this.subscriptions) {
      const timeSinceActivity = now.getTime() - subscription.lastActivity.getTime();
      if (timeSinceActivity > this.config.subscriptionTimeoutMs) {
        expiredSubscriptions.push(subscriptionId);
      }
    }

    // Remove expired subscriptions
    for (const subscriptionId of expiredSubscriptions) {
      this.unsubscribe(subscriptionId);
    }

    // Clean up empty batch timers
    for (const [interactionId, timer] of this.batchTimers) {
      const pendingDeltas = this.pendingDeltas.get(interactionId);
      if (!pendingDeltas || pendingDeltas.length === 0) {
        clearTimeout(timer);
        this.batchTimers.delete(interactionId);
        this.pendingDeltas.delete(interactionId);
      }
    }

    if (expiredSubscriptions.length > 0) {
      logger.info('Cleaned up expired subscriptions', {
        expiredCount: expiredSubscriptions.length,
        remainingCount: this.subscriptions.size,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Shutdown the event broadcaster
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down EventBroadcaster');

    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    // Flush any pending deltas
    const flushPromises: Promise<void>[] = [];
    for (const interactionId of this.pendingDeltas.keys()) {
      flushPromises.push(this.flushPendingDeltas(interactionId));
    }
    await Promise.allSettled(flushPromises);

    // Clear all subscriptions
    this.subscriptions.clear();
    this.userSubscriptions.clear();
    this.roomSubscriptions.clear();
    this.pendingDeltas.clear();

    // Remove all listeners
    this.removeAllListeners();

    logger.info('EventBroadcaster shutdown complete');
  }

  /**
   * Private helper methods
   */

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async deliverEvent(subscription: EventSubscription, event: GameEvent): Promise<void> {
    try {
      await subscription.handler(event);
    } catch (error) {
      logger.error('Event delivery failed', {
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
      
      // Don't rethrow - we don't want one failed delivery to break others
    }
  }

  private async flushPendingDeltas(interactionId: string): Promise<void> {
    const pendingDeltas = this.pendingDeltas.get(interactionId);
    if (!pendingDeltas || pendingDeltas.length === 0) {
      return;
    }

    // Clear timer
    const timer = this.batchTimers.get(interactionId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(interactionId);
    }

    // Create batch delta
    const batchDelta: BatchDelta = {
      deltas: [...pendingDeltas],
      timestamp: Date.now(),
      batchId: `batch_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    };

    // Clear pending deltas
    this.pendingDeltas.set(interactionId, []);

    // Validate batch
    const validatedBatch = BatchDeltaSchema.parse(batchDelta);

    // Create state delta event
    const deltaEvent = {
      type: 'STATE_DELTA' as const,
      timestamp: Date.now(),
      interactionId: interactionId,
      changes: {
        type: 'participant' as const,
        changes: {},
        timestamp: Date.now(),
      },
    };

    // Broadcast the batch
    await this.broadcast(interactionId, deltaEvent as GameEvent);

    logger.debug('Delta batch flushed', {
      interactionId,
      batchId: batchDelta.batchId,
      deltaCount: batchDelta.deltas.length,
    });
  }

  private updateMetrics(eventType: string, deliveryTime: number, subscriberCount: number): void {
    this.metrics.totalEvents++;
    
    const currentCount = this.metrics.eventsByType.get(eventType) || 0;
    this.metrics.eventsByType.set(eventType, currentCount + 1);
    
    // Update average delivery time (simple moving average)
    const totalDeliveries = this.metrics.totalEvents;
    this.metrics.averageDeliveryTime = 
      (this.metrics.averageDeliveryTime * (totalDeliveries - 1) + deliveryTime) / totalDeliveries;
  }

  private startCleanupTimer(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
}