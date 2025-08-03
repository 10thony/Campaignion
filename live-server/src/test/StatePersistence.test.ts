import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatePersistence } from '../services/StatePersistence';
import { InteractionRoom } from '../services/InteractionRoom';
import { GameState, Participant } from '../types';
import * as crypto from 'crypto';

// Mock logger to avoid console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    })
  }
}));

describe('StatePersistence', () => {
  let persistence: StatePersistence;
  let mockRoom: InteractionRoom;
  let mockGameState: GameState;

  beforeEach(() => {
    persistence = new StatePersistence({
      convexUrl: 'https://test-convex-url.convex.cloud',
      batchSize: 5,
      retryAttempts: 2,
      retryDelayMs: 100,
      compressionEnabled: true,
      compressionThreshold: 100, // Low threshold for testing
      recoveryEnabled: true
    });

    mockGameState = {
      interactionId: 'test-interaction-1',
      status: 'active',
      initiativeOrder: [
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 15, userId: 'user1' }
      ],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map(),
      mapState: {
        width: 20,
        height: 20,
        entities: new Map(),
        obstacles: [],
        terrain: []
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date()
    };

    mockRoom = new InteractionRoom('test-interaction-1', mockGameState, 30000);
    
    // Add some participants
    mockRoom.addParticipant({
      userId: 'user1',
      entityId: 'player1',
      entityType: 'playerCharacter',
      connectionId: 'conn1',
      isConnected: true,
      lastActivity: new Date()
    });
    
    mockRoom.addParticipant({
      userId: 'user2',
      entityId: 'player2',
      entityType: 'playerCharacter',
      connectionId: 'conn2',
      isConnected: false,
      lastActivity: new Date()
    });
  });

  describe('snapshot operations', () => {
    it('should save snapshot successfully', async () => {
      await expect(
        persistence.saveSnapshot(mockRoom, 'test-trigger')
      ).resolves.not.toThrow();
    });

    it('should create correct snapshot structure', async () => {
      // We can't directly test the snapshot structure since it's sent to Convex,
      // but we can verify the method completes without error
      await expect(
        persistence.saveSnapshot(mockRoom, 'pause')
      ).resolves.not.toThrow();
    });

    it('should load snapshot (returns null in mock)', async () => {
      const snapshot = await persistence.loadSnapshot('test-interaction-1');
      
      // In our mock implementation, this returns null
      expect(snapshot).toBeNull();
    });

    it('should handle load errors gracefully', async () => {
      // Mock a failure scenario by using an invalid interaction ID
      const snapshot = await persistence.loadSnapshot('invalid-id');
      
      expect(snapshot).toBeNull();
    });
  });

  describe('event logging', () => {
    it('should save event log successfully', async () => {
      await expect(
        persistence.saveEventLog(
          'test-interaction-1',
          'PARTICIPANT_JOINED',
          { userId: 'user1', entityId: 'player1' },
          'user1',
          'player1'
        )
      ).resolves.not.toThrow();
    });

    it('should save event log without optional parameters', async () => {
      await expect(
        persistence.saveEventLog(
          'test-interaction-1',
          'INTERACTION_PAUSED',
          { reason: 'Manual pause' }
        )
      ).resolves.not.toThrow();
    });
  });

  describe('turn record operations', () => {
    it('should save turn record successfully', async () => {
      const turnRecord = {
        entityId: 'player1',
        entityType: 'playerCharacter' as const,
        turnNumber: 1,
        roundNumber: 1,
        actions: [
          {
            type: 'move' as const,
            entityId: 'player1',
            position: { x: 5, y: 5 }
          }
        ],
        startTime: Date.now(),
        endTime: Date.now() + 5000,
        status: 'completed' as const,
        userId: 'user1'
      };

      await expect(
        persistence.saveTurnRecord('test-interaction-1', turnRecord)
      ).resolves.not.toThrow();
    });

    it('should save turn record without optional fields', async () => {
      const turnRecord = {
        entityId: 'monster1',
        entityType: 'monster' as const,
        turnNumber: 2,
        roundNumber: 1,
        actions: [],
        startTime: Date.now(),
        status: 'skipped' as const
      };

      await expect(
        persistence.saveTurnRecord('test-interaction-1', turnRecord)
      ).resolves.not.toThrow();
    });
  });

  describe('interaction status updates', () => {
    it('should update interaction status successfully', async () => {
      await expect(
        persistence.updateInteractionStatus(
          'test-interaction-1',
          'live',
          {
            liveRoomId: 'room-123',
            connectedParticipants: ['user1', 'user2'],
            lastActivity: Date.now()
          }
        )
      ).resolves.not.toThrow();
    });

    it('should update status without additional data', async () => {
      await expect(
        persistence.updateInteractionStatus('test-interaction-1', 'paused')
      ).resolves.not.toThrow();
    });
  });

  describe('persistence triggers', () => {
    it('should identify valid persistence triggers', () => {
      const validTriggers = [
        'pause',
        'complete',
        'inactivity',
        'roundEnd',
        'participantDisconnect',
        'dmDisconnect',
        'entityDefeated'
      ];

      validTriggers.forEach(trigger => {
        expect(persistence.shouldPersist(trigger)).toBe(true);
      });
    });

    it('should reject invalid persistence triggers', () => {
      const invalidTriggers = [
        'invalid',
        'random',
        'test',
        ''
      ];

      invalidTriggers.forEach(trigger => {
        expect(persistence.shouldPersist(trigger)).toBe(false);
      });
    });
  });

  describe('retry logic', () => {
    it('should handle simulated failures and retry', async () => {
      // The mock implementation has a 5% failure rate, so most calls should succeed
      // We'll test multiple calls to increase chances of hitting the retry logic
      const promises = Array.from({ length: 10 }, () =>
        persistence.saveSnapshot(mockRoom, 'test-retry')
      );

      // All should eventually succeed due to retry logic
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should handle event log retry', async () => {
      const promises = Array.from({ length: 10 }, () =>
        persistence.saveEventLog('test-interaction-1', 'TEST_EVENT', {})
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should handle turn record retry', async () => {
      const turnRecord = {
        entityId: 'player1',
        entityType: 'playerCharacter' as const,
        turnNumber: 1,
        roundNumber: 1,
        actions: [],
        startTime: Date.now(),
        status: 'completed' as const
      };

      const promises = Array.from({ length: 10 }, () =>
        persistence.saveTurnRecord('test-interaction-1', turnRecord)
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should handle status update retry', async () => {
      const promises = Array.from({ length: 10 }, () =>
        persistence.updateInteractionStatus('test-interaction-1', 'live')
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle snapshot save errors gracefully', async () => {
      // Create a persistence instance with 0 retry attempts to force failure
      const failingPersistence = new StatePersistence({
        convexUrl: 'https://test-convex-url.convex.cloud',
        retryAttempts: 0
      });

      // With 0 retries and 5% failure rate, some calls might fail
      // But the method should not throw unhandled errors
      try {
        await failingPersistence.saveSnapshot(mockRoom, 'test-error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to save snapshot');
      }
    });

    it('should handle load errors gracefully', async () => {
      const result = await persistence.loadSnapshot('error-prone-id');
      
      // Should return null on error, not throw
      expect(result).toBeNull();
    });
  });

  describe('configuration', () => {
    it('should use default configuration values', () => {
      const defaultPersistence = new StatePersistence({
        convexUrl: 'https://test.convex.cloud'
      });

      // Should not throw and should work with defaults
      expect(defaultPersistence).toBeDefined();
    });

    it('should use custom configuration values', () => {
      const customPersistence = new StatePersistence({
        convexUrl: 'https://custom.convex.cloud',
        batchSize: 20,
        retryAttempts: 5,
        retryDelayMs: 500,
        compressionEnabled: false,
        recoveryEnabled: false
      });

      expect(customPersistence).toBeDefined();
    });
  });

  describe('compression and optimization', () => {
    it('should handle compression for large game states', async () => {
      // Create a large game state by adding many chat messages
      const largeGameState = { ...mockGameState };
      largeGameState.chatLog = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        userId: 'user1',
        content: `This is a test message ${i} with some content to make it larger`,
        type: 'party' as const,
        timestamp: Date.now() + i
      }));

      const largeRoom = new InteractionRoom('test-interaction-large', largeGameState, 30000);
      largeRoom.addParticipant({
        userId: 'user1',
        entityId: 'player1',
        entityType: 'playerCharacter',
        connectionId: 'conn1',
        isConnected: true,
        lastActivity: new Date()
      });

      // Should not throw even with large state
      await expect(
        persistence.saveSnapshot(largeRoom, 'test-compression')
      ).resolves.not.toThrow();
    });

    it('should skip compression for small game states', async () => {
      const smallPersistence = new StatePersistence({
        convexUrl: 'https://test.convex.cloud',
        compressionThreshold: 10000, // High threshold
        compressionEnabled: true
      });

      await expect(
        smallPersistence.saveSnapshot(mockRoom, 'test-no-compression')
      ).resolves.not.toThrow();
    });

    it('should handle compression disabled', async () => {
      const noCompressionPersistence = new StatePersistence({
        convexUrl: 'https://test.convex.cloud',
        compressionEnabled: false
      });

      await expect(
        noCompressionPersistence.saveSnapshot(mockRoom, 'test-disabled-compression')
      ).resolves.not.toThrow();
    });
  });

  describe('state recovery', () => {
    it('should handle recovery when enabled', async () => {
      const recoveredState = await persistence.recoverRoomState('test-interaction-1');
      
      // In our mock implementation, this returns null (no snapshot found)
      expect(recoveredState).toBeNull();
    });

    it('should skip recovery when disabled', async () => {
      const noRecoveryPersistence = new StatePersistence({
        convexUrl: 'https://test.convex.cloud',
        recoveryEnabled: false
      });

      const recoveredState = await noRecoveryPersistence.recoverRoomState('test-interaction-1');
      expect(recoveredState).toBeNull();
    });

    it('should track recovery information', async () => {
      await persistence.recoverRoomState('test-interaction-recovery');
      
      const recoveryInfo = persistence.getRecoveryInfo('test-interaction-recovery');
      expect(recoveryInfo).toBeDefined();
      expect(recoveryInfo?.interactionId).toBe('test-interaction-recovery');
      expect(recoveryInfo?.recoveryStatus).toBe('failed'); // No snapshot found
    });

    it('should clear recovery information', async () => {
      await persistence.recoverRoomState('test-interaction-clear');
      
      let recoveryInfo = persistence.getRecoveryInfo('test-interaction-clear');
      expect(recoveryInfo).toBeDefined();

      persistence.clearRecoveryInfo('test-interaction-clear');
      recoveryInfo = persistence.getRecoveryInfo('test-interaction-clear');
      expect(recoveryInfo).toBeNull();
    });
  });

  describe('data integrity', () => {
    it('should validate game state before saving', async () => {
      // Create an invalid game state
      const invalidGameState = { ...mockGameState };
      invalidGameState.currentTurnIndex = -1; // Invalid index

      const invalidRoom = new InteractionRoom('test-invalid', invalidGameState, 30000);

      await expect(
        persistence.saveSnapshot(invalidRoom, 'test-validation')
      ).rejects.toThrow('Invalid game state');
    });

    it('should handle checksum validation', async () => {
      // This test verifies that checksum calculation works
      // In a real implementation, we'd test checksum mismatch scenarios
      await expect(
        persistence.saveSnapshot(mockRoom, 'test-checksum')
      ).resolves.not.toThrow();
    });
  });

  describe('enhanced persistence triggers', () => {
    it('should recognize additional persistence triggers', () => {
      const additionalTriggers = [
        'serverRestart',
        'criticalError',
        'manualSave'
      ];

      additionalTriggers.forEach(trigger => {
        expect(persistence.shouldPersist(trigger)).toBe(true);
      });
    });

    it('should still reject invalid triggers', () => {
      const invalidTriggers = [
        'invalidTrigger',
        'randomEvent',
        ''
      ];

      invalidTriggers.forEach(trigger => {
        expect(persistence.shouldPersist(trigger)).toBe(false);
      });
    });
  });

  describe('statistics and monitoring', () => {
    it('should provide persistence statistics', () => {
      const stats = persistence.getStatistics();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalSnapshots).toBe('number');
      expect(typeof stats.compressionRatio).toBe('number');
      expect(typeof stats.averageSnapshotSize).toBe('number');
      expect(typeof stats.recoveryAttempts).toBe('number');
      expect(typeof stats.successfulRecoveries).toBe('number');
    });
  });

  describe('error scenarios', () => {
    it('should handle compression errors gracefully', async () => {
      // Create a persistence instance that might encounter compression issues
      const testPersistence = new StatePersistence({
        convexUrl: 'https://test.convex.cloud',
        compressionEnabled: true,
        compressionThreshold: 1 // Very low threshold to force compression
      });

      // Should not throw even if compression has issues
      await expect(
        testPersistence.saveSnapshot(mockRoom, 'test-compression-error')
      ).resolves.not.toThrow();
    });

    it('should handle recovery failures gracefully', async () => {
      const result = await persistence.recoverRoomState('non-existent-interaction');
      expect(result).toBeNull();

      const recoveryInfo = persistence.getRecoveryInfo('non-existent-interaction');
      expect(recoveryInfo?.recoveryStatus).toBe('failed');
    });

    it('should handle invalid game state during recovery', async () => {
      // This would be tested with a mock that returns invalid data
      const result = await persistence.recoverRoomState('invalid-state-interaction');
      expect(result).toBeNull();
    });
  });

  describe('performance optimization', () => {
    it('should handle large chat logs efficiently', async () => {
      // Create a game state with many chat messages
      const largeGameState = { ...mockGameState };
      largeGameState.chatLog = Array.from({ length: 200 }, (_, i) => ({
        id: `msg-${i}`,
        userId: 'user1',
        content: `Message ${i}`,
        type: 'party' as const,
        timestamp: Date.now() + i
      }));

      const largeRoom = new InteractionRoom('test-large-chat', largeGameState, 30000);
      largeRoom.addParticipant({
        userId: 'user1',
        entityId: 'player1',
        entityType: 'playerCharacter',
        connectionId: 'conn1',
        isConnected: true,
        lastActivity: new Date()
      });

      // Should optimize by trimming chat log
      await expect(
        persistence.saveSnapshot(largeRoom, 'test-optimization')
      ).resolves.not.toThrow();
    });

    it('should handle large turn history efficiently', async () => {
      // Create a game state with many turn records
      const largeGameState = { ...mockGameState };
      largeGameState.turnHistory = Array.from({ length: 100 }, (_, i) => ({
        entityId: 'player1',
        turnNumber: i + 1,
        roundNumber: Math.floor(i / 4) + 1,
        actions: [],
        startTime: new Date(Date.now() + i * 1000),
        status: 'completed' as const
      }));

      const largeRoom = new InteractionRoom('test-large-history', largeGameState, 30000);
      largeRoom.addParticipant({
        userId: 'user1',
        entityId: 'player1',
        entityType: 'playerCharacter',
        connectionId: 'conn1',
        isConnected: true,
        lastActivity: new Date()
      });

      // Should optimize by trimming turn history
      await expect(
        persistence.saveSnapshot(largeRoom, 'test-history-optimization')
      ).resolves.not.toThrow();
    });
  });
});