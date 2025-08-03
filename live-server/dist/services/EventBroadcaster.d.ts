import { EventEmitter } from 'events';
import { GameEvent } from '../schemas/gameEvents';
import { TypedStateDelta } from '../schemas/stateDelta';
export type EventHandler<T = GameEvent> = (event: T) => void | Promise<void>;
export interface EventBroadcasterConfig {
    maxSubscriptionsPerUser?: number;
    subscriptionTimeoutMs?: number;
    batchDelayMs?: number;
    maxBatchSize?: number;
    enableMetrics?: boolean;
}
interface BroadcastMetrics {
    totalEvents: number;
    totalSubscriptions: number;
    eventsByType: Map<string, number>;
    subscriptionsByRoom: Map<string, number>;
    averageDeliveryTime: number;
    failedDeliveries: number;
}
export declare class EventBroadcaster extends EventEmitter {
    private subscriptions;
    private userSubscriptions;
    private roomSubscriptions;
    private pendingDeltas;
    private batchTimers;
    private metrics;
    private config;
    constructor(config?: EventBroadcasterConfig);
    subscribe(interactionId: string, eventTypes: string[], handler: EventHandler, userId?: string): string;
    unsubscribe(subscriptionId: string): boolean;
    broadcast(interactionId: string, event: GameEvent): Promise<void>;
    broadcastToUser(interactionId: string, userId: string, event: GameEvent): Promise<void>;
    broadcastDelta(interactionId: string, delta: TypedStateDelta): Promise<void>;
    getMetrics(): BroadcastMetrics;
    getUserSubscriptionCount(userId: string): number;
    getRoomSubscriptionCount(interactionId: string): number;
    cleanup(): void;
    shutdown(): Promise<void>;
    private generateSubscriptionId;
    private deliverEvent;
    private flushPendingDeltas;
    private updateMetrics;
    private startCleanupTimer;
}
export {};
//# sourceMappingURL=EventBroadcaster.d.ts.map