import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateEngine, QueuedAction } from '../services/GameStateEngine';
import {
  GameState,
  TurnAction,
  ParticipantState,
  InitiativeEntry,
  MapState
} from '../types';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })
  }
}));

describe('Turn Management System', () => {
  let gameStateEngine: GameStateEngine;
  let mockGameState: GameState;

  beforeEach(() => {
    // Create mock game state
    mockGameState = {
      interactionId: 'test-interaction',
      status: 'active',
      initiativeOrder: [
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 20, userId: 'user1' },
        { entityId: 'monster1', entityType: 'monster', initiative: 15 },
        { entityId: 'player2', entityType: 'playerCharacter', initiative: 10, userId: 'user2' }
      ],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map([
        ['player1', {
          entityId: 'player1',
          entityType: 'playerCharacter',
          userId: 'user1',
          currentHP: 25,
          maxHP: 25,
          position: { x: 1, y: 1 },
          conditions: [],
          inventory: {
            items: [
              { id: 'item1', itemId: 'healing_potion', quantity: 2, properties: {} }
            ],
            equippedItems: {},
            capacity: 10
          },
          availableActions: [],
          turnStatus: 'active'
        }],
        ['monster1', {
          entityId: 'monster1',
          entityType: 'monster',
          currentHP: 15,
          maxHP: 15,
          position: { x: 2, y: 2 },
          conditions: [],
          inventory: { items: [], equippedItems: {}, capacity: 0 },
          availableActions: [],
          turnStatus: 'waiting'
        }],
        ['player2', {
          entityId: 'player2',
          entityType: 'playerCharacter',
          userId: 'user2',
          currentHP: 20,
          maxHP: 20,
          position: { x: 3, y: 3 },
          conditions: [],
          inventory: { items: [], equippedItems: {}, capacity: 10 },
          availableActions: [],
          turnStatus: 'waiting'
        }]
      ]),
      mapState: {
        width: 10,
        height: 10,
        entities: new Map([
          ['player1', { entityId: 'player1', position: { x: 1, y: 1 } }],
          ['monster1', { entityId: 'monster1', position: { x: 2, y: 2 } }],
          ['player2', { entityId: 'player2', position: { x: 3, y: 3 } }]
        ]),
        obstacles: [{ x: 5, y: 5 }],
        terrain: []
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date()
    };

    gameStateEngine = new GameStateEngine(mockGameState, {
      turnTimeoutMs: 1000, // 1 second for testing
      autoAdvanceTurns: true,
      enableActionValidation: true,
      enableTurnQueue: true
    });
  });

  afterEach(() => {
    gameStateEngine.cleanup();
    vi.clearAllTimers();
  });

  describe('Turn Timer and Timeout', () => {
    it('should automatically skip turn after timeout', (done) => {
      const skipSpy = vi.fn();
      gameStateEngine.on('turnSkipped', skipSpy);

      // Wait for timeout
      setTimeout(() => {
        expect(skipSpy).toHaveBeenCalledWith({
          type: 'TURN_SKIPPED',
          entityId: 'player1',
          reason: 'timeout'
        });

        const state = gameStateEngine.getGameState();
        expect(state.currentTurnIndex).toBe(1); // Should advance to next turn
        expect(state.turnHistory).toHaveLength(1);
        expect(state.turnHistory[0].status).toBe('skipped');
        done();
      }, 1100);
    });

    it('should clear timer when turn is completed manually', async () => {
      // Create a fresh engine for this test to avoid interference
      const isolatedEngine = new GameStateEngine(mockGameState, {
        turnTimeoutMs: 500,
        autoAdvanceTurns: true,
        enableActionValidation: true,
        enableTurnQueue: true
      });

      const skipSpy = vi.fn();
      isolatedEngine.on('turnSkipped', skipSpy);

      const endAction: TurnAction = {
        type: 'end',
        entityId: 'player1'
      };

      await isolatedEngine.processTurnAction(endAction);

      // Wait to ensure timeout doesn't fire for the original turn
      await new Promise(resolve => setTimeout(resolve, 600));

      // The skip should be for the next entity (monster1), not player1
      // This shows the timer was cleared for player1 and restarted for monster1
      if (skipSpy.mock.calls.length > 0) {
        expect(skipSpy.mock.calls[0][0].entityId).toBe('monster1');
      }

      const state = isolatedEngine.getGameState();
      // Should have at least one turn record for player1
      const player1Turns = state.turnHistory.filter(t => t.entityId === 'player1');
      expect(player1Turns).toHaveLength(1);
      expect(player1Turns[0].status).toBe('completed');

      isolatedEngine.cleanup();
    });

    it('should restart timer when turn advances', async () => {
      const skipSpy = vi.fn();
      gameStateEngine.on('turnSkipped', skipSpy);

      // Advance turn manually
      gameStateEngine.advanceTurn();

      // Wait for timeout on new turn
      setTimeout(() => {
        expect(skipSpy).toHaveBeenCalledWith({
          type: 'TURN_SKIPPED',
          entityId: 'monster1',
          reason: 'timeout'
        });
      }, 1100);
    });

    it('should not start timer when auto-advance is disabled', () => {
      const engineWithoutAutoAdvance = new GameStateEngine(mockGameState, {
        autoAdvanceTurns: false,
        turnTimeoutMs: 1000
      });

      // Should not have timer
      expect(engineWithoutAutoAdvance['turnTimer']).toBeUndefined();

      engineWithoutAutoAdvance.cleanup();
    });

    it('should pause and resume timer correctly', () => {
      // Pause game
      gameStateEngine.pause();
      expect(gameStateEngine['turnTimer']).toBeUndefined();

      // Resume game
      gameStateEngine.resume();
      expect(gameStateEngine['turnTimer']).toBeDefined();
    });
  });

  describe('Turn Queue System', () => {
    it('should queue actions when queue is enabled', async () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      const actionId = await gameStateEngine.queueTurnAction(moveAction);
      expect(actionId).toBeDefined();
      expect(actionId).not.toBe('immediate-success');

      const queue = gameStateEngine.getTurnQueue('player1');
      expect(queue).toBeDefined();
      expect(queue!.actions).toHaveLength(1);
      expect(queue!.actions[0].action).toEqual(moveAction);
    });

    it('should process queued actions in order', async () => {
      const completedSpy = vi.fn();
      gameStateEngine.on('queuedActionCompleted', completedSpy);

      // Queue multiple actions - use non-turn-ending actions
      const moveAction1: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 1, y: 2 } // Valid move
      };

      const moveAction2: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 1, y: 3 } // Another valid move (not occupied)
      };

      await gameStateEngine.queueTurnAction(moveAction1);
      await gameStateEngine.queueTurnAction(moveAction2);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(completedSpy).toHaveBeenCalledTimes(2);
      
      const queue = gameStateEngine.getTurnQueue('player1');
      expect(queue!.actions[0].status).toBe('completed');
      expect(queue!.actions[1].status).toBe('completed');
    });

    it('should get pending actions correctly', async () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      await gameStateEngine.queueTurnAction(moveAction);

      // Check immediately before processing starts
      const pendingActions = gameStateEngine.getPendingActions('player1');
      expect(pendingActions).toHaveLength(1);
      expect(pendingActions[0].action).toEqual(moveAction);
    });

    it('should get completed actions correctly', async () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      await gameStateEngine.queueTurnAction(moveAction);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const completedActions = gameStateEngine.getCompletedActions('player1');
      expect(completedActions).toHaveLength(1);
      expect(completedActions[0].status).toBe('completed');
    });

    it('should cancel queued actions', async () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      const actionId = await gameStateEngine.queueTurnAction(moveAction);
      
      // Cancel immediately before processing starts
      const cancelled = gameStateEngine.cancelQueuedAction('player1', actionId);
      expect(cancelled).toBe(true);

      const queue = gameStateEngine.getTurnQueue('player1');
      expect(queue!.actions).toHaveLength(0);
    });

    it('should clear action queue', async () => {
      const moveAction1: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      const moveAction2: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 3, y: 1 }
      };

      await gameStateEngine.queueTurnAction(moveAction1);
      await gameStateEngine.queueTurnAction(moveAction2);

      const cleared = gameStateEngine.clearActionQueue('player1');
      expect(cleared).toBe(true);

      const pendingActions = gameStateEngine.getPendingActions('player1');
      expect(pendingActions).toHaveLength(0);
    });

    it('should stop processing queue on failed action', async () => {
      // Queue a valid action followed by an invalid one
      const validAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      const invalidAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 15, y: 15 } // Out of bounds
      };

      await gameStateEngine.queueTurnAction(validAction);
      await gameStateEngine.queueTurnAction(invalidAction);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const queue = gameStateEngine.getTurnQueue('player1');
      expect(queue!.actions[0].status).toBe('completed');
      expect(queue!.actions[1].status).toBe('failed');
    });

    it('should process actions immediately when queue is disabled', async () => {
      const engineWithoutQueue = new GameStateEngine(mockGameState, {
        enableTurnQueue: false
      });

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      const actionId = await engineWithoutQueue.queueTurnAction(moveAction);
      expect(actionId).toBe('immediate-success');

      const queue = engineWithoutQueue.getTurnQueue('player1');
      expect(queue).toBeNull();

      engineWithoutQueue.cleanup();
    });
  });

  describe('Turn Backtracking', () => {
    beforeEach(async () => {
      // Set up some turn history
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      const attackAction: TurnAction = {
        type: 'attack',
        entityId: 'player1',
        target: 'monster1'
      };

      await gameStateEngine.processTurnAction(moveAction);
      gameStateEngine.advanceTurn(); // monster1's turn
      gameStateEngine.skipTurn(); // skip monster1
      await gameStateEngine.processTurnAction({
        type: 'move',
        entityId: 'player2',
        position: { x: 4, y: 3 }
      });
    });

    it('should backtrack to previous turn successfully', () => {
      const backtrackSpy = vi.fn();
      gameStateEngine.on('turnBacktracked', backtrackSpy);

      const state = gameStateEngine.getGameState();
      const initialTurnCount = state.turnHistory.length;
      const initialRound = state.roundNumber;
      const initialTurnIndex = state.currentTurnIndex;

      // Backtrack to turn 0, round 1
      const success = gameStateEngine.backtrackToTurn(0, 1, 'dm-user-id');
      expect(success).toBe(true);

      const newState = gameStateEngine.getGameState();
      expect(newState.currentTurnIndex).toBe(0);
      expect(newState.roundNumber).toBe(1);
      expect(newState.turnHistory.length).toBeLessThan(initialTurnCount);

      expect(backtrackSpy).toHaveBeenCalledWith({
        type: 'TURN_BACKTRACKED',
        targetTurn: 0,
        targetRound: 1,
        removedTurns: expect.any(Number),
        dmUserId: 'dm-user-id'
      });
    });

    it('should fail to backtrack to non-existent turn', () => {
      const success = gameStateEngine.backtrackToTurn(99, 99, 'dm-user-id');
      expect(success).toBe(false);
    });

    it('should clear action queues on backtrack', async () => {
      // Queue some actions
      await gameStateEngine.queueTurnAction({
        type: 'move',
        entityId: 'player1',
        position: { x: 5, y: 5 }
      });

      const queueBefore = gameStateEngine.getTurnQueue('player1');
      expect(queueBefore).toBeDefined();

      // Backtrack
      gameStateEngine.backtrackToTurn(0, 1, 'dm-user-id');

      const queueAfter = gameStateEngine.getTurnQueue('player1');
      expect(queueAfter).toBeNull();
    });

    it('should reset participant turn statuses on backtrack', () => {
      // Backtrack to beginning
      gameStateEngine.backtrackToTurn(0, 1, 'dm-user-id');

      const state = gameStateEngine.getGameState();
      const currentEntity = gameStateEngine.getCurrentTurnEntity();
      
      // Current entity should be active, others waiting
      if (state.participants instanceof Map) {
        for (const [entityId, participant] of state.participants) {
          if (entityId === currentEntity?.entityId) {
            expect(participant.turnStatus).toBe('active');
          } else {
            expect(participant.turnStatus).toBe('waiting');
          }
        }
      }
    });

    it('should restart turn timer after backtrack', () => {
      gameStateEngine.backtrackToTurn(0, 1, 'dm-user-id');
      
      // Timer should be restarted
      expect(gameStateEngine['turnTimer']).toBeDefined();
    });
  });

  describe('Turn Redo', () => {
    beforeEach(async () => {
      // Set up initial state
      await gameStateEngine.processTurnAction({
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      });
    });

    it('should redo turn with new actions successfully', async () => {
      const redoSpy = vi.fn();
      gameStateEngine.on('turnRedoCompleted', redoSpy);

      // Verify we're at player1's turn
      const currentEntity = gameStateEngine.getCurrentTurnEntity();
      expect(currentEntity?.entityId).toBe('player1');

      // Redo with actions
      const newActions: TurnAction[] = [
        {
          type: 'move',
          entityId: 'player1',
          position: { x: 1, y: 2 }
        }
      ];

      const success = await gameStateEngine.redoTurn('player1', newActions, 'dm-user-id');
      expect(success).toBe(true);

      expect(redoSpy).toHaveBeenCalledWith({
        entityId: 'player1',
        actions: newActions,
        results: expect.any(Array),
        dmUserId: 'dm-user-id'
      });

      // Check that actions were applied
      const finalState = gameStateEngine.getGameState();
      const player1 = gameStateEngine.getParticipant('player1');
      expect(player1).toBeDefined();
      expect(player1?.position).toEqual({ x: 1, y: 2 });
    });

    it('should fail redo when not entity\'s turn', async () => {
      gameStateEngine.advanceTurn(); // Move to monster1's turn

      const actions: TurnAction[] = [
        {
          type: 'move',
          entityId: 'player1', // Not their turn
          position: { x: 1, y: 2 }
        }
      ];

      const success = await gameStateEngine.redoTurn('player1', actions, 'dm-user-id');
      expect(success).toBe(false);
    });

    it('should fail redo with invalid actions', async () => {
      const actions: TurnAction[] = [
        {
          type: 'move',
          entityId: 'player1',
          position: { x: 15, y: 15 } // Out of bounds
        }
      ];

      const success = await gameStateEngine.redoTurn('player1', actions, 'dm-user-id');
      expect(success).toBe(false);
    });

    it('should fail redo with mismatched entity ID', async () => {
      const actions: TurnAction[] = [
        {
          type: 'move',
          entityId: 'monster1', // Different entity
          position: { x: 1, y: 2 }
        }
      ];

      const success = await gameStateEngine.redoTurn('player1', actions, 'dm-user-id');
      expect(success).toBe(false);
    });
  });

  describe('Initiative Order Management', () => {
    it('should update initiative order and reset turn index', () => {
      const newOrder: InitiativeEntry[] = [
        { entityId: 'player2', entityType: 'playerCharacter', initiative: 25, userId: 'user2' },
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 20, userId: 'user1' },
        { entityId: 'monster1', entityType: 'monster', initiative: 15 }
      ];

      gameStateEngine.updateInitiativeOrder(newOrder);

      const state = gameStateEngine.getGameState();
      expect(state.initiativeOrder).toEqual(newOrder);
      expect(state.currentTurnIndex).toBe(0);

      const currentEntity = gameStateEngine.getCurrentTurnEntity();
      expect(currentEntity?.entityId).toBe('player2');
    });

    it('should handle empty initiative order', () => {
      gameStateEngine.updateInitiativeOrder([]);

      const state = gameStateEngine.getGameState();
      expect(state.initiativeOrder).toHaveLength(0);
      expect(gameStateEngine.getCurrentTurnEntity()).toBeNull();
    });

    it('should emit initiative updated event', () => {
      const eventSpy = vi.fn();
      gameStateEngine.on('initiativeUpdated', eventSpy);

      const newOrder: InitiativeEntry[] = [
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 25, userId: 'user1' }
      ];

      gameStateEngine.updateInitiativeOrder(newOrder);

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'INITIATIVE_UPDATED',
        order: newOrder
      });
    });
  });

  describe('Turn Progression Scenarios', () => {
    it('should handle complete round progression', async () => {
      const newRoundSpy = vi.fn();
      gameStateEngine.on('newRound', newRoundSpy);

      // Complete all turns in round 1
      await gameStateEngine.processTurnAction({ type: 'end', entityId: 'player1' });
      gameStateEngine.skipTurn(); // monster1
      await gameStateEngine.processTurnAction({ type: 'end', entityId: 'player2' });

      const state = gameStateEngine.getGameState();
      expect(state.roundNumber).toBe(2);
      expect(state.currentTurnIndex).toBe(0);
      expect(state.turnHistory).toHaveLength(3);

      expect(newRoundSpy).toHaveBeenCalledWith({
        roundNumber: 2,
        previousRound: 1
      });
    });

    it('should handle mixed action types in sequence', async () => {
      // Move (doesn't end turn)
      await gameStateEngine.processTurnAction({
        type: 'move',
        entityId: 'player1',
        position: { x: 1, y: 2 }
      });

      // End turn explicitly (ends turn)
      await gameStateEngine.processTurnAction({
        type: 'end',
        entityId: 'player1'
      });

      const state = gameStateEngine.getGameState();
      expect(state.currentTurnIndex).toBe(1); // Should have advanced
      expect(state.turnHistory).toHaveLength(2); // Two separate actions create separate records
    });

    it('should handle participant disconnection during turn', () => {
      // Simulate disconnection by skipping turn
      const success = gameStateEngine.skipTurn('player disconnected');
      expect(success).toBe(true);

      const state = gameStateEngine.getGameState();
      expect(state.currentTurnIndex).toBe(1);
      expect(state.turnHistory[0].status).toBe('skipped');
    });
  });

  describe('Error Handling', () => {
    it('should handle queue processing errors gracefully', async () => {
      // Mock an error in action processing
      const originalProcess = gameStateEngine.processTurnAction;
      gameStateEngine.processTurnAction = vi.fn().mockRejectedValue(new Error('Test error'));

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      await gameStateEngine.queueTurnAction(moveAction);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const queue = gameStateEngine.getTurnQueue('player1');
      expect(queue!.actions[0].status).toBe('failed');

      // Restore original method
      gameStateEngine.processTurnAction = originalProcess;
    });

    it('should handle backtrack with invalid parameters', () => {
      const success = gameStateEngine.backtrackToTurn(-1, -1, 'dm-user-id');
      expect(success).toBe(false);
    });

    it('should handle redo with empty actions array', async () => {
      const success = await gameStateEngine.redoTurn('player1', [], 'dm-user-id');
      expect(success).toBe(true); // Empty actions should succeed
    });
  });

  describe('Configuration Impact', () => {
    it('should respect turn timeout configuration', (done) => {
      const shortTimeoutEngine = new GameStateEngine(mockGameState, {
        turnTimeoutMs: 500, // 0.5 seconds
        autoAdvanceTurns: true
      });

      const skipSpy = vi.fn();
      shortTimeoutEngine.on('turnSkipped', skipSpy);

      setTimeout(() => {
        expect(skipSpy).toHaveBeenCalled();
        shortTimeoutEngine.cleanup();
        done();
      }, 600);
    });

    it('should handle disabled action validation in queue', async () => {
      const engineWithoutValidation = new GameStateEngine(mockGameState, {
        enableActionValidation: false,
        enableTurnQueue: true
      });

      // This would normally fail validation
      const invalidAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 15, y: 15 } // Out of bounds
      };

      await engineWithoutValidation.queueTurnAction(invalidAction);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const queue = engineWithoutValidation.getTurnQueue('player1');
      expect(queue!.actions[0].status).toBe('completed'); // Should pass

      engineWithoutValidation.cleanup();
    });
  });
});