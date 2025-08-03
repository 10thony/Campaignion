import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { EventBroadcaster, EventBroadcasterConfig } from '../services/EventBroadcaster';
import { GameEvent, ParticipantJoinedEvent, TurnStartedEvent, StateDeltaEvent } from '../schemas/gameEvents';
import { ParticipantDelta, TurnDelta } from '../schemas/stateDelta';

describe('EventBroadcaster', () => {
  let broadcaster: EventBroadcaster;
  let mockHandler: Mock;
  let mockHandler2: Mock;

  beforeEach(() => {
    mockHandler = vi.fn();
    mockHandler2 = vi.fn();
    broadcaster = new EventBroadcaster({
      batchDelayMs: 50, // Shorter delay for testing
      maxBatchSize: 3,
      subscriptionTimeoutMs: 1000, // 1 second for testing
      enableMetrics: true,
    });
  });

  afterEach(async () => {
    await broadcaster.shutdown();
  });

  describe('Subscription Management', () => {
    it('should create and manage subscriptions', () => {
      const subscriptionId = broadcaster.subscribe(
        'interaction-1',
        ['PARTICIPANT_JOINED', 'TURN_STARTED'],
        mockHandler,
        'user-1'
      );

      expect(subscriptionId).toMatch(/^sub_\d+_[a-z0-9]+$/);
      expect(broadcaster.getUserSubscriptionCount('user-1')).toBe(1);
      expect(broadcaster.getRoomSubscriptionCount('interaction-1')).toBe(1);
    });

    it('should unsubscribe successfully', () => {
      const subscriptionId = broadcaster.subscribe(
        'interaction-1',
        ['PARTICIPANT_JOINED'],
        mockHandler,
        'user-1'
      );

      const result = broadcaster.unsubscribe(subscriptionId);
      expect(result).toBe(true);
      expect(broadcaster.getUserSubscriptionCount('user-1')).toBe(0);
      expect(broadcaster.getRoomSubscriptionCount('interaction-1')).toBe(0);
    });

    it('should return false when unsubscribing non-existent subscription', () => {
      const result = broadcaster.unsubscribe('non-existent');
      expect(result).toBe(false);
    });

    it('should enforce subscription limits per user', () => {
      const config: EventBroadcasterConfig = { maxSubscriptionsPerUser: 2 };
      const limitedBroadcaster = new EventBroadcaster(config);

      // Create maximum allowed subscriptions
      limitedBroadcaster.subscribe('interaction-1', ['*'], mockHandler, 'user-1');
      limitedBroadcaster.subscribe('interaction-2', ['*'], mockHandler, 'user-1');

      // Third subscription should throw error
      expect(() => {
        limitedBroadcaster.subscribe('interaction-3', ['*'], mockHandler, 'user-1');
      }).toThrow('User user-1 has reached maximum subscription limit');

      limitedBroadcaster.shutdown();
    });

    it('should allow subscriptions without userId', () => {
      const subscriptionId = broadcaster.subscribe(
        'interaction-1',
        ['PARTICIPANT_JOINED'],
        mockHandler
      );

      expect(subscriptionId).toMatch(/^sub_\d+_[a-z0-9]+$/);
      expect(broadcaster.getRoomSubscriptionCount('interaction-1')).toBe(1);
    });
  });

  describe('Room-wide Broadcasting', () => {
    it('should broadcast events to all room subscribers', async () => {
      // Create multiple subscriptions for the same room
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], mockHandler, 'user-1');
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], mockHandler2, 'user-2');

      const event: ParticipantJoinedEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        userId: 'user-3',
        entityId: 'entity-1',
      };

      await broadcaster.broadcast('interaction-1', event);

      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'PARTICIPANT_JOINED',
        userId: 'user-3',
        entityId: 'entity-1',
        interactionId: 'interaction-1',
      }));
      expect(mockHandler2).toHaveBeenCalledWith(expect.objectContaining({
        type: 'PARTICIPANT_JOINED',
        userId: 'user-3',
        entityId: 'entity-1',
        interactionId: 'interaction-1',
      }));
    });

    it('should only broadcast to subscribers interested in event type', async () => {
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], mockHandler, 'user-1');
      broadcaster.subscribe('interaction-1', ['TURN_STARTED'], mockHandler2, 'user-2');

      const event: ParticipantJoinedEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        userId: 'user-3',
        entityId: 'entity-1',
      };

      await broadcaster.broadcast('interaction-1', event);

      expect(mockHandler).toHaveBeenCalledOnce();
      expect(mockHandler2).not.toHaveBeenCalled();
    });

    it('should broadcast to wildcard subscribers', async () => {
      broadcaster.subscribe('interaction-1', ['*'], mockHandler, 'user-1');
      broadcaster.subscribe('interaction-1', ['TURN_STARTED'], mockHandler2, 'user-2');

      const event: ParticipantJoinedEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        userId: 'user-3',
        entityId: 'entity-1',
      };

      await broadcaster.broadcast('interaction-1', event);

      expect(mockHandler).toHaveBeenCalledOnce();
      expect(mockHandler2).not.toHaveBeenCalled();
    });

    it('should handle rooms with no subscribers gracefully', async () => {
      const event: ParticipantJoinedEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'empty-room',
        userId: 'user-1',
        entityId: 'entity-1',
      };

      await expect(broadcaster.broadcast('empty-room', event)).resolves.not.toThrow();
    });

    it('should handle handler errors gracefully', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], errorHandler, 'user-1');
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], mockHandler, 'user-2');

      const event: ParticipantJoinedEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        userId: 'user-3',
        entityId: 'entity-1',
      };

      await expect(broadcaster.broadcast('interaction-1', event)).resolves.not.toThrow();
      expect(mockHandler).toHaveBeenCalledOnce();
    });
  });

  describe('User-specific Broadcasting', () => {
    it('should broadcast events to specific user only', async () => {
      broadcaster.subscribe('interaction-1', ['TURN_STARTED'], mockHandler, 'user-1');
      broadcaster.subscribe('interaction-1', ['TURN_STARTED'], mockHandler2, 'user-2');

      const event: TurnStartedEvent = {
        type: 'TURN_STARTED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        entityId: 'entity-1',
        timeLimit: 90,
      };

      await broadcaster.broadcastToUser('interaction-1', 'user-1', event);

      expect(mockHandler).toHaveBeenCalledOnce();
      expect(mockHandler2).not.toHaveBeenCalled();
    });

    it('should handle user with no subscriptions gracefully', async () => {
      const event: TurnStartedEvent = {
        type: 'TURN_STARTED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        entityId: 'entity-1',
        timeLimit: 90,
      };

      await expect(
        broadcaster.broadcastToUser('interaction-1', 'non-existent-user', event)
      ).resolves.not.toThrow();
    });

    it('should only broadcast to user subscriptions in the correct room', async () => {
      broadcaster.subscribe('interaction-1', ['TURN_STARTED'], mockHandler, 'user-1');
      broadcaster.subscribe('interaction-2', ['TURN_STARTED'], mockHandler2, 'user-1');

      const event: TurnStartedEvent = {
        type: 'TURN_STARTED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        entityId: 'entity-1',
        timeLimit: 90,
      };

      await broadcaster.broadcastToUser('interaction-1', 'user-1', event);

      expect(mockHandler).toHaveBeenCalledOnce();
      expect(mockHandler2).not.toHaveBeenCalled();
    });
  });

  describe('Delta Broadcasting with Batching', () => {
    it('should batch deltas and broadcast them together', async () => {
      broadcaster.subscribe('interaction-1', ['STATE_DELTA'], mockHandler, 'user-1');

      const delta1: ParticipantDelta = {
        type: 'participant',
        changes: {
          entityId: 'entity-1',
          updates: { currentHP: 50 },
        },
        timestamp: Date.now(),
      };

      const delta2: TurnDelta = {
        type: 'turn',
        changes: {
          currentTurnIndex: 1,
          activeEntityId: 'entity-2',
        },
        timestamp: Date.now(),
      };

      // Broadcast deltas quickly
      await broadcaster.broadcastDelta('interaction-1', delta1);
      await broadcaster.broadcastDelta('interaction-1', delta2);

      // Wait for batch to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'STATE_DELTA',
        changes: expect.objectContaining({
          batch: expect.objectContaining({
            deltas: expect.arrayContaining([
              expect.objectContaining({ type: 'participant' }),
              expect.objectContaining({ type: 'turn' }),
            ]),
          }),
        }),
      }));
    });

    it('should flush batch immediately when max batch size is reached', async () => {
      broadcaster.subscribe('interaction-1', ['STATE_DELTA'], mockHandler, 'user-1');

      const delta: ParticipantDelta = {
        type: 'participant',
        changes: {
          entityId: 'entity-1',
          updates: { currentHP: 50 },
        },
        timestamp: Date.now(),
      };

      // Send max batch size (3) deltas
      await broadcaster.broadcastDelta('interaction-1', delta);
      await broadcaster.broadcastDelta('interaction-1', delta);
      await broadcaster.broadcastDelta('interaction-1', delta);

      // Should have been called immediately due to batch size limit
      expect(mockHandler).toHaveBeenCalledOnce();
    });

    it('should handle delta validation errors', async () => {
      const invalidDelta = {
        type: 'invalid-type',
        changes: {},
        timestamp: Date.now(),
      } as any;

      await expect(
        broadcaster.broadcastDelta('interaction-1', invalidDelta)
      ).rejects.toThrow();
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track metrics when enabled', async () => {
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], mockHandler, 'user-1');

      const event: ParticipantJoinedEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        userId: 'user-2',
        entityId: 'entity-1',
      };

      await broadcaster.broadcast('interaction-1', event);

      const metrics = broadcaster.getMetrics();
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.totalSubscriptions).toBe(1);
      expect(metrics.eventsByType.get('PARTICIPANT_JOINED')).toBe(1);
      expect(metrics.subscriptionsByRoom.get('interaction-1')).toBe(1);
      expect(metrics.averageDeliveryTime).toBeGreaterThan(0);
    });

    it('should track failed deliveries', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], errorHandler, 'user-1');

      const event: ParticipantJoinedEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        userId: 'user-2',
        entityId: 'entity-1',
      };

      await broadcaster.broadcast('interaction-1', event);

      const metrics = broadcaster.getMetrics();
      expect(metrics.failedDeliveries).toBe(1);
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should clean up expired subscriptions', async () => {
      const shortTimeoutBroadcaster = new EventBroadcaster({
        subscriptionTimeoutMs: 100, // 100ms timeout
      });

      const subscriptionId = shortTimeoutBroadcaster.subscribe(
        'interaction-1',
        ['PARTICIPANT_JOINED'],
        mockHandler,
        'user-1'
      );

      expect(shortTimeoutBroadcaster.getUserSubscriptionCount('user-1')).toBe(1);

      // Wait for subscription to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Trigger cleanup
      shortTimeoutBroadcaster.cleanup();

      expect(shortTimeoutBroadcaster.getUserSubscriptionCount('user-1')).toBe(0);

      await shortTimeoutBroadcaster.shutdown();
    });

    it('should shutdown gracefully', async () => {
      broadcaster.subscribe('interaction-1', ['STATE_DELTA'], mockHandler, 'user-1');

      const delta: ParticipantDelta = {
        type: 'participant',
        changes: {
          entityId: 'entity-1',
          updates: { currentHP: 50 },
        },
        timestamp: Date.now(),
      };

      // Queue some deltas
      await broadcaster.broadcastDelta('interaction-1', delta);

      // Shutdown should flush pending deltas
      await broadcaster.shutdown();

      expect(mockHandler).toHaveBeenCalledOnce();
      expect(broadcaster.getUserSubscriptionCount('user-1')).toBe(0);
      expect(broadcaster.getRoomSubscriptionCount('interaction-1')).toBe(0);
    });
  });

  describe('Event Validation', () => {
    it('should validate events before broadcasting', async () => {
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], mockHandler, 'user-1');

      const invalidEvent = {
        type: 'PARTICIPANT_JOINED',
        // Missing required fields
      } as any;

      await expect(
        broadcaster.broadcast('interaction-1', invalidEvent)
      ).rejects.toThrow();
    });

    it('should add timestamp and interactionId if missing', async () => {
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], mockHandler, 'user-1');

      const event = {
        type: 'PARTICIPANT_JOINED',
        userId: 'user-2',
        entityId: 'entity-1',
        // Missing timestamp and interactionId
      } as any;

      await broadcaster.broadcast('interaction-1', event);

      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'PARTICIPANT_JOINED',
        timestamp: expect.any(Number),
        interactionId: 'interaction-1',
      }));
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent subscriptions safely', () => {
      const subscriptionPromises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(broadcaster.subscribe(
          'interaction-1',
          ['PARTICIPANT_JOINED'],
          mockHandler,
          `user-${i}`
        ))
      );

      return Promise.all(subscriptionPromises).then(subscriptionIds => {
        expect(subscriptionIds).toHaveLength(10);
        expect(new Set(subscriptionIds)).toHaveProperty('size', 10); // All unique
        expect(broadcaster.getRoomSubscriptionCount('interaction-1')).toBe(10);
      });
    });

    it('should handle concurrent broadcasts safely', async () => {
      broadcaster.subscribe('interaction-1', ['PARTICIPANT_JOINED'], mockHandler, 'user-1');

      const event: ParticipantJoinedEvent = {
        type: 'PARTICIPANT_JOINED',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
        userId: 'user-2',
        entityId: 'entity-1',
      };

      const broadcastPromises = Array.from({ length: 5 }, () =>
        broadcaster.broadcast('interaction-1', event)
      );

      await Promise.all(broadcastPromises);

      expect(mockHandler).toHaveBeenCalledTimes(5);
    });
  });
});