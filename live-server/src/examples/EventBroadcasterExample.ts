/**
 * EventBroadcaster Usage Examples
 * 
 * This file demonstrates how to use the EventBroadcaster service
 * for real-time event distribution in live D&D interactions.
 */

import { EventBroadcaster } from '../services/EventBroadcaster';
import { GameEvent, ParticipantJoinedEvent, TurnStartedEvent, StateDeltaEvent } from '../schemas/gameEvents';
import { ParticipantDelta, TurnDelta } from '../schemas/stateDelta';

/**
 * Example 1: Basic Event Broadcasting Setup
 */
export async function basicEventBroadcastingExample() {
  console.log('=== Basic Event Broadcasting Example ===');
  
  // Create EventBroadcaster instance
  const broadcaster = new EventBroadcaster({
    maxSubscriptionsPerUser: 5,
    batchDelayMs: 100,
    maxBatchSize: 10,
    enableMetrics: true,
  });

  // Example event handlers
  const playerHandler = (event: GameEvent) => {
    console.log(`Player received event: ${event.type}`, event);
  };

  const dmHandler = (event: GameEvent) => {
    console.log(`DM received event: ${event.type}`, event);
  };

  // Subscribe players and DM to room events
  const playerSubscription = broadcaster.subscribe(
    'interaction-123',
    ['PARTICIPANT_JOINED', 'TURN_STARTED', 'STATE_DELTA'],
    playerHandler,
    'player-1'
  );

  const dmSubscription = broadcaster.subscribe(
    'interaction-123',
    ['*'], // DM gets all events
    dmHandler,
    'dm-1'
  );

  // Broadcast a participant joined event
  const joinEvent: ParticipantJoinedEvent = {
    type: 'PARTICIPANT_JOINED',
    timestamp: Date.now(),
    interactionId: 'interaction-123',
    userId: 'player-2',
    entityId: 'character-456',
  };

  await broadcaster.broadcast('interaction-123', joinEvent);

  // Broadcast a turn started event
  const turnEvent: TurnStartedEvent = {
    type: 'TURN_STARTED',
    timestamp: Date.now(),
    interactionId: 'interaction-123',
    entityId: 'character-456',
    timeLimit: 90,
  };

  await broadcaster.broadcast('interaction-123', turnEvent);

  // Clean up
  broadcaster.unsubscribe(playerSubscription);
  broadcaster.unsubscribe(dmSubscription);
  await broadcaster.shutdown();
}

/**
 * Example 2: User-Specific Broadcasting
 */
export async function userSpecificBroadcastingExample() {
  console.log('=== User-Specific Broadcasting Example ===');
  
  const broadcaster = new EventBroadcaster();

  // Create handlers for different users
  const player1Handler = (event: GameEvent) => {
    console.log(`Player 1 received private event: ${event.type}`);
  };

  const player2Handler = (event: GameEvent) => {
    console.log(`Player 2 received private event: ${event.type}`);
  };

  // Subscribe both players
  broadcaster.subscribe('interaction-123', ['TURN_STARTED'], player1Handler, 'player-1');
  broadcaster.subscribe('interaction-123', ['TURN_STARTED'], player2Handler, 'player-2');

  // Send turn notification only to player 1
  const turnEvent: TurnStartedEvent = {
    type: 'TURN_STARTED',
    timestamp: Date.now(),
    interactionId: 'interaction-123',
    entityId: 'character-1',
    timeLimit: 90,
  };

  await broadcaster.broadcastToUser('interaction-123', 'player-1', turnEvent);

  await broadcaster.shutdown();
}

/**
 * Example 3: Delta Broadcasting with Batching
 */
export async function deltaBroadcastingExample() {
  console.log('=== Delta Broadcasting Example ===');
  
  const broadcaster = new EventBroadcaster({
    batchDelayMs: 50, // Short delay for demo
    maxBatchSize: 3,
  });

  // Handler to receive batched deltas
  const stateHandler = (event: GameEvent) => {
    if (event.type === 'STATE_DELTA') {
      const deltaEvent = event as StateDeltaEvent;
      console.log(`Received state delta: ${deltaEvent.changes.type}`, deltaEvent.changes);
    }
  };

  broadcaster.subscribe('interaction-123', ['STATE_DELTA'], stateHandler, 'player-1');

  // Send multiple deltas quickly - they should be batched
  const participantDelta: ParticipantDelta = {
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

  const turnDelta: TurnDelta = {
    type: 'turn',
    changes: {
      currentTurnIndex: 2,
      activeEntityId: 'character-2',
    },
    timestamp: Date.now(),
  };

  // Broadcast deltas - they will be batched automatically
  await broadcaster.broadcastDelta('interaction-123', participantDelta);
  await broadcaster.broadcastDelta('interaction-123', turnDelta);

  // Wait for batch to be processed
  await new Promise(resolve => setTimeout(resolve, 100));

  await broadcaster.shutdown();
}

/**
 * Example 4: Error Handling and Resilience
 */
export async function errorHandlingExample() {
  console.log('=== Error Handling Example ===');
  
  const broadcaster = new EventBroadcaster();

  // Handler that throws an error
  const faultyHandler = (event: GameEvent) => {
    throw new Error('Handler failed!');
  };

  // Handler that works correctly
  const goodHandler = (event: GameEvent) => {
    console.log(`Good handler received: ${event.type}`);
  };

  // Subscribe both handlers
  broadcaster.subscribe('interaction-123', ['PARTICIPANT_JOINED'], faultyHandler, 'faulty-user');
  broadcaster.subscribe('interaction-123', ['PARTICIPANT_JOINED'], goodHandler, 'good-user');

  // Broadcast event - faulty handler should not break the good one
  const joinEvent: ParticipantJoinedEvent = {
    type: 'PARTICIPANT_JOINED',
    timestamp: Date.now(),
    interactionId: 'interaction-123',
    userId: 'player-1',
    entityId: 'character-1',
  };

  await broadcaster.broadcast('interaction-123', joinEvent);

  // Check metrics to see failed deliveries
  const metrics = broadcaster.getMetrics();
  console.log('Failed deliveries:', metrics.failedDeliveries);
  console.log('Total events:', metrics.totalEvents);

  await broadcaster.shutdown();
}

/**
 * Example 5: Subscription Management and Cleanup
 */
export async function subscriptionManagementExample() {
  console.log('=== Subscription Management Example ===');
  
  const broadcaster = new EventBroadcaster({
    maxSubscriptionsPerUser: 3,
    subscriptionTimeoutMs: 1000, // 1 second for demo
  });

  const handler = (event: GameEvent) => {
    console.log(`Received: ${event.type}`);
  };

  // Create multiple subscriptions
  const sub1 = broadcaster.subscribe('room-1', ['*'], handler, 'user-1');
  broadcaster.subscribe('room-2', ['*'], handler, 'user-1');
  broadcaster.subscribe('room-3', ['*'], handler, 'user-1');

  console.log('User 1 subscriptions:', broadcaster.getUserSubscriptionCount('user-1'));
  console.log('Room 1 subscriptions:', broadcaster.getRoomSubscriptionCount('room-1'));

  // Try to create one more subscription (should fail due to limit)
  try {
    broadcaster.subscribe('room-4', ['*'], handler, 'user-1');
  } catch (error) {
    console.log('Expected error:', (error as Error).message);
  }

  // Unsubscribe from one room
  broadcaster.unsubscribe(sub1);
  console.log('After unsubscribe - User 1 subscriptions:', broadcaster.getUserSubscriptionCount('user-1'));

  // Wait for subscriptions to expire
  await new Promise(resolve => setTimeout(resolve, 1100));

  // Trigger cleanup
  broadcaster.cleanup();
  console.log('After cleanup - User 1 subscriptions:', broadcaster.getUserSubscriptionCount('user-1'));

  await broadcaster.shutdown();
}

/**
 * Example 6: Integration with tRPC Subscriptions
 */
export async function tRPCIntegrationExample() {
  console.log('=== tRPC Integration Example ===');
  
  const broadcaster = new EventBroadcaster();

  // Simulate tRPC subscription handler
  const createTRPCSubscription = (interactionId: string, userId: string) => {
    return broadcaster.subscribe(
      interactionId,
      ['*'], // Subscribe to all events
      (event: GameEvent) => {
        // This would normally send the event through tRPC WebSocket
        console.log(`Sending to tRPC client ${userId}:`, {
          type: event.type,
          timestamp: event.timestamp,
          data: event,
        });
      },
      userId
    );
  };

  // Simulate multiple clients connecting
  const subscription1 = createTRPCSubscription('interaction-123', 'player-1');
  createTRPCSubscription('interaction-123', 'player-2');
  createTRPCSubscription('interaction-123', 'dm-1');

  // Simulate game events
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

  // Simulate client disconnection
  broadcaster.unsubscribe(subscription1);
  console.log('Player 1 disconnected');

  // Continue broadcasting to remaining clients
  await broadcaster.broadcast('interaction-123', {
    type: 'TURN_COMPLETED',
    timestamp: Date.now(),
    interactionId: 'interaction-123',
    entityId: 'character-1',
    actions: [],
  });

  await broadcaster.shutdown();
}

/**
 * Run all examples
 */
export async function runAllExamples() {
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
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}