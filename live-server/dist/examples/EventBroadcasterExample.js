"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicEventBroadcastingExample = basicEventBroadcastingExample;
exports.userSpecificBroadcastingExample = userSpecificBroadcastingExample;
exports.deltaBroadcastingExample = deltaBroadcastingExample;
exports.errorHandlingExample = errorHandlingExample;
exports.subscriptionManagementExample = subscriptionManagementExample;
exports.tRPCIntegrationExample = tRPCIntegrationExample;
exports.runAllExamples = runAllExamples;
const EventBroadcaster_1 = require("../services/EventBroadcaster");
async function basicEventBroadcastingExample() {
    console.log('=== Basic Event Broadcasting Example ===');
    const broadcaster = new EventBroadcaster_1.EventBroadcaster({
        maxSubscriptionsPerUser: 5,
        batchDelayMs: 100,
        maxBatchSize: 10,
        enableMetrics: true,
    });
    const playerHandler = (event) => {
        console.log(`Player received event: ${event.type}`, event);
    };
    const dmHandler = (event) => {
        console.log(`DM received event: ${event.type}`, event);
    };
    const playerSubscription = broadcaster.subscribe('interaction-123', ['PARTICIPANT_JOINED', 'TURN_STARTED', 'STATE_DELTA'], playerHandler, 'player-1');
    const dmSubscription = broadcaster.subscribe('interaction-123', ['*'], dmHandler, 'dm-1');
    const joinEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-123',
        userId: 'player-2',
        entityId: 'character-456',
    };
    await broadcaster.broadcast('interaction-123', joinEvent);
    const turnEvent = {
        type: 'TURN_STARTED',
        timestamp: Date.now(),
        interactionId: 'interaction-123',
        entityId: 'character-456',
        timeLimit: 90,
    };
    await broadcaster.broadcast('interaction-123', turnEvent);
    broadcaster.unsubscribe(playerSubscription);
    broadcaster.unsubscribe(dmSubscription);
    await broadcaster.shutdown();
}
async function userSpecificBroadcastingExample() {
    console.log('=== User-Specific Broadcasting Example ===');
    const broadcaster = new EventBroadcaster_1.EventBroadcaster();
    const player1Handler = (event) => {
        console.log(`Player 1 received private event: ${event.type}`);
    };
    const player2Handler = (event) => {
        console.log(`Player 2 received private event: ${event.type}`);
    };
    broadcaster.subscribe('interaction-123', ['TURN_STARTED'], player1Handler, 'player-1');
    broadcaster.subscribe('interaction-123', ['TURN_STARTED'], player2Handler, 'player-2');
    const turnEvent = {
        type: 'TURN_STARTED',
        timestamp: Date.now(),
        interactionId: 'interaction-123',
        entityId: 'character-1',
        timeLimit: 90,
    };
    await broadcaster.broadcastToUser('interaction-123', 'player-1', turnEvent);
    await broadcaster.shutdown();
}
async function deltaBroadcastingExample() {
    console.log('=== Delta Broadcasting Example ===');
    const broadcaster = new EventBroadcaster_1.EventBroadcaster({
        batchDelayMs: 50,
        maxBatchSize: 3,
    });
    const stateHandler = (event) => {
        if (event.type === 'STATE_DELTA') {
            const deltaEvent = event;
            console.log(`Received state delta: ${deltaEvent.changes.type}`, deltaEvent.changes);
        }
    };
    broadcaster.subscribe('interaction-123', ['STATE_DELTA'], stateHandler, 'player-1');
    const participantDelta = {
        type: 'participant',
        changes: {
            entityId: 'character-1',
            updates: {
                currentHP: 45,
                position: { x: 10, y: 15 },
            },
        },
        timestamp: Date.now(),
    };
    const turnDelta = {
        type: 'turn',
        changes: {
            currentTurnIndex: 2,
            activeEntityId: 'character-2',
        },
        timestamp: Date.now(),
    };
    await broadcaster.broadcastDelta('interaction-123', participantDelta);
    await broadcaster.broadcastDelta('interaction-123', turnDelta);
    await new Promise(resolve => setTimeout(resolve, 100));
    await broadcaster.shutdown();
}
async function errorHandlingExample() {
    console.log('=== Error Handling Example ===');
    const broadcaster = new EventBroadcaster_1.EventBroadcaster();
    const faultyHandler = (event) => {
        throw new Error('Handler failed!');
    };
    const goodHandler = (event) => {
        console.log(`Good handler received: ${event.type}`);
    };
    broadcaster.subscribe('interaction-123', ['PARTICIPANT_JOINED'], faultyHandler, 'faulty-user');
    broadcaster.subscribe('interaction-123', ['PARTICIPANT_JOINED'], goodHandler, 'good-user');
    const joinEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-123',
        userId: 'player-1',
        entityId: 'character-1',
    };
    await broadcaster.broadcast('interaction-123', joinEvent);
    const metrics = broadcaster.getMetrics();
    console.log('Failed deliveries:', metrics.failedDeliveries);
    console.log('Total events:', metrics.totalEvents);
    await broadcaster.shutdown();
}
async function subscriptionManagementExample() {
    console.log('=== Subscription Management Example ===');
    const broadcaster = new EventBroadcaster_1.EventBroadcaster({
        maxSubscriptionsPerUser: 3,
        subscriptionTimeoutMs: 1000,
    });
    const handler = (event) => {
        console.log(`Received: ${event.type}`);
    };
    const sub1 = broadcaster.subscribe('room-1', ['*'], handler, 'user-1');
    broadcaster.subscribe('room-2', ['*'], handler, 'user-1');
    broadcaster.subscribe('room-3', ['*'], handler, 'user-1');
    console.log('User 1 subscriptions:', broadcaster.getUserSubscriptionCount('user-1'));
    console.log('Room 1 subscriptions:', broadcaster.getRoomSubscriptionCount('room-1'));
    try {
        broadcaster.subscribe('room-4', ['*'], handler, 'user-1');
    }
    catch (error) {
        console.log('Expected error:', error.message);
    }
    broadcaster.unsubscribe(sub1);
    console.log('After unsubscribe - User 1 subscriptions:', broadcaster.getUserSubscriptionCount('user-1'));
    await new Promise(resolve => setTimeout(resolve, 1100));
    broadcaster.cleanup();
    console.log('After cleanup - User 1 subscriptions:', broadcaster.getUserSubscriptionCount('user-1'));
    await broadcaster.shutdown();
}
async function tRPCIntegrationExample() {
    console.log('=== tRPC Integration Example ===');
    const broadcaster = new EventBroadcaster_1.EventBroadcaster();
    const createTRPCSubscription = (interactionId, userId) => {
        return broadcaster.subscribe(interactionId, ['*'], (event) => {
            console.log(`Sending to tRPC client ${userId}:`, {
                type: event.type,
                timestamp: event.timestamp,
                data: event,
            });
        }, userId);
    };
    const subscription1 = createTRPCSubscription('interaction-123', 'player-1');
    createTRPCSubscription('interaction-123', 'player-2');
    createTRPCSubscription('interaction-123', 'dm-1');
    await broadcaster.broadcast('interaction-123', {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-123',
        userId: 'player-3',
        entityId: 'character-3',
    });
    await broadcaster.broadcast('interaction-123', {
        type: 'TURN_STARTED',
        timestamp: Date.now(),
        interactionId: 'interaction-123',
        entityId: 'character-1',
        timeLimit: 90,
    });
    await broadcaster.broadcast('interaction-123', {
        type: 'TURN_COMPLETED',
        timestamp: Date.now(),
        interactionId: 'interaction-123',
        entityId: 'character-1',
        actions: [{ type: 'end', entityId: 'character-1' }],
    });
    broadcaster.unsubscribe(subscription1);
    console.log('Player 1 disconnected');
    await broadcaster.broadcast('interaction-123', {
        type: 'TURN_COMPLETED',
        timestamp: Date.now(),
        interactionId: 'interaction-123',
        entityId: 'character-1',
        actions: [],
    });
    await broadcaster.shutdown();
}
async function runAllExamples() {
    try {
        await basicEventBroadcastingExample();
        console.log('\n');
        await userSpecificBroadcastingExample();
        console.log('\n');
        await deltaBroadcastingExample();
        console.log('\n');
        await errorHandlingExample();
        console.log('\n');
        await subscriptionManagementExample();
        console.log('\n');
        await tRPCIntegrationExample();
        console.log('\n=== All examples completed successfully! ===');
    }
    catch (error) {
        console.error('Example failed:', error);
    }
}
if (require.main === module) {
    runAllExamples();
}
//# sourceMappingURL=EventBroadcasterExample.js.map