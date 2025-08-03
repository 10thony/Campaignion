import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateEngine } from '../services/GameStateEngine';
import {
  GameState,
  TurnAction,
  ParticipantState,
  InitiativeEntry,
  MapState,
  Position
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

// Mock generateId
vi.mock('../utils', () => ({
  generateId: () => 'test-id-123'
}));

describe('GameStateEngine', () => {
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
      participants: {
        'player1': {
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
        },
        'monster1': {
          entityId: 'monster1',
          entityType: 'monster',
          currentHP: 15,
          maxHP: 15,
          position: { x: 2, y: 2 },
          conditions: [],
          inventory: { items: [], equippedItems: {}, capacity: 0 },
          availableActions: [],
          turnStatus: 'waiting'
        },
        'player2': {
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
        }
      },
      mapState: {
        width: 10,
        height: 10,
        entities: {
          'player1': { entityId: 'player1', position: { x: 1, y: 1 } },
          'monster1': { entityId: 'monster1', position: { x: 2, y: 2 } },
          'player2': { entityId: 'player2', position: { x: 3, y: 3 } }
        },
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
      enableActionValidation: true
    });
  });

  afterEach(() => {
    gameStateEngine.cleanup();
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with provided game state', () => {
      const state = gameStateEngine.getGameState();
      expect(state.interactionId).toBe('test-interaction');
      expect(state.status).toBe('active');
      expect(state.currentTurnIndex).toBe(0);
      expect(state.roundNumber).toBe(1);
    });

    it('should emit events when initialized', () => {
      const eventSpy = vi.fn();
      gameStateEngine.on('stateChanged', eventSpy);
      
      // Create new engine to trigger initialization events
      const newEngine = new GameStateEngine(mockGameState);
      
      // Should not emit on creation, only on updates
      expect(eventSpy).not.toHaveBeenCalled();
      
      newEngine.cleanup();
    });
  });

  describe('Turn Management', () => {
    it('should get current turn entity correctly', () => {
      const currentEntity = gameStateEngine.getCurrentTurnEntity();
      expect(currentEntity).toEqual({
        entityId: 'player1',
        entityType: 'playerCharacter',
        initiative: 20,
        userId: 'user1'
      });
    });

    it('should advance turn correctly', () => {
      const eventSpy = vi.fn();
      gameStateEngine.on('turnStarted', eventSpy);

      gameStateEngine.advanceTurn();

      const state = gameStateEngine.getGameState();
      expect(state.currentTurnIndex).toBe(1);
      expect(state.roundNumber).toBe(1);

      const currentEntity = gameStateEngine.getCurrentTurnEntity();
      expect(currentEntity?.entityId).toBe('monster1');

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'TURN_STARTED',
        entityId: 'monster1',
        timeLimit: 1000
      });
    });

    it('should start new round when reaching end of initiative order', () => {
      const newRoundSpy = vi.fn();
      gameStateEngine.on('newRound', newRoundSpy);

      // Advance through all turns
      gameStateEngine.advanceTurn(); // monster1
      gameStateEngine.advanceTurn(); // player2
      gameStateEngine.advanceTurn(); // back to player1, new round

      const state = gameStateEngine.getGameState();
      expect(state.currentTurnIndex).toBe(0);
      expect(state.roundNumber).toBe(2);

      expect(newRoundSpy).toHaveBeenCalledWith({
        roundNumber: 2,
        previousRound: 1
      });
    });

    it('should skip turn correctly', () => {
      const skipSpy = vi.fn();
      gameStateEngine.on('turnSkipped', skipSpy);

      const success = gameStateEngine.skipTurn('test reason');
      expect(success).toBe(true);

      const state = gameStateEngine.getGameState();
      expect(state.currentTurnIndex).toBe(1);
      expect(state.turnHistory).toHaveLength(1);
      expect(state.turnHistory[0].status).toBe('skipped');

      expect(skipSpy).toHaveBeenCalledWith({
        type: 'TURN_SKIPPED',
        entityId: 'player1',
        reason: 'test reason'
      });
    });

    it('should handle turn timeout', (done) => {
      const skipSpy = vi.fn();
      gameStateEngine.on('turnSkipped', skipSpy);

      // Wait for timeout
      setTimeout(() => {
        expect(skipSpy).toHaveBeenCalledWith({
          type: 'TURN_SKIPPED',
          entityId: 'player1',
          reason: 'timeout'
        });
        done();
      }, 1100);
    });
  });

  describe('Action Processing', () => {
    describe('Move Actions', () => {
      it('should process valid move action', async () => {
        const moveAction: TurnAction = {
          type: 'move',
          entityId: 'player1',
          position: { x: 2, y: 1 }
        };

        const result = await gameStateEngine.processTurnAction(moveAction);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);

        const state = gameStateEngine.getGameState();
        expect(state.participants['player1'].position).toEqual({ x: 2, y: 1 });
        expect(state.mapState.entities['player1'].position).toEqual({ x: 2, y: 1 });
      });

      it('should reject move to out of bounds position', async () => {
        const moveAction: TurnAction = {
          type: 'move',
          entityId: 'player1',
          position: { x: 15, y: 15 }
        };

        const result = await gameStateEngine.processTurnAction(moveAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target position is out of bounds');
      });

      it('should reject move to blocked position', async () => {
        const moveAction: TurnAction = {
          type: 'move',
          entityId: 'player1',
          position: { x: 5, y: 5 } // Obstacle position
        };

        const result = await gameStateEngine.processTurnAction(moveAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target position is blocked');
      });

      it('should reject move to occupied position', async () => {
        const moveAction: TurnAction = {
          type: 'move',
          entityId: 'player1',
          position: { x: 2, y: 2 } // monster1's position
        };

        const result = await gameStateEngine.processTurnAction(moveAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target position is occupied');
      });

      it('should reject move that is too far', async () => {
        const moveAction: TurnAction = {
          type: 'move',
          entityId: 'player1',
          position: { x: 8, y: 8 } // Too far from (1,1)
        };

        const result = await gameStateEngine.processTurnAction(moveAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target position is too far');
      });
    });

    describe('Attack Actions', () => {
      it('should process valid attack action', async () => {
        // Move player1 adjacent to monster1 first
        gameStateEngine.updateParticipant('player1', { position: { x: 2, y: 1 } });

        const attackAction: TurnAction = {
          type: 'attack',
          entityId: 'player1',
          target: 'monster1'
        };

        const result = await gameStateEngine.processTurnAction(attackAction);
        expect(result.valid).toBe(true);

        const state = gameStateEngine.getGameState();
        expect(state.participants['monster1'].currentHP).toBe(14); // 15 - 1 damage
      });

      it('should reject attack without target', async () => {
        const attackAction: TurnAction = {
          type: 'attack',
          entityId: 'player1'
        };

        const result = await gameStateEngine.processTurnAction(attackAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Attack action requires target');
      });

      it('should reject attack on non-existent target', async () => {
        const attackAction: TurnAction = {
          type: 'attack',
          entityId: 'player1',
          target: 'nonexistent'
        };

        const result = await gameStateEngine.processTurnAction(attackAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target not found');
      });

      it('should reject attack when target is out of range', async () => {
        const attackAction: TurnAction = {
          type: 'attack',
          entityId: 'player1',
          target: 'monster1' // monster1 is at (2,2), player1 at (1,1) - distance 2
        };

        const result = await gameStateEngine.processTurnAction(attackAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target is out of range');
      });
    });

    describe('Item Actions', () => {
      it('should process valid item usage', async () => {
        // Damage player1 first
        gameStateEngine.updateParticipant('player1', { currentHP: 20 });

        const itemAction: TurnAction = {
          type: 'useItem',
          entityId: 'player1',
          itemId: 'healing_potion'
        };

        const result = await gameStateEngine.processTurnAction(itemAction);
        expect(result.valid).toBe(true);

        const state = gameStateEngine.getGameState();
        expect(state.participants['player1'].currentHP).toBe(25); // 20 + 5 healing
        expect(state.participants['player1'].inventory.items[0].quantity).toBe(1); // 2 - 1 used
      });

      it('should reject item usage without item ID', async () => {
        const itemAction: TurnAction = {
          type: 'useItem',
          entityId: 'player1'
        };

        const result = await gameStateEngine.processTurnAction(itemAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Item action requires item ID');
      });

      it('should reject usage of unavailable item', async () => {
        const itemAction: TurnAction = {
          type: 'useItem',
          entityId: 'player1',
          itemId: 'nonexistent_item'
        };

        const result = await gameStateEngine.processTurnAction(itemAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Item not available');
      });
    });

    describe('Turn Validation', () => {
      it('should reject action when not player\'s turn', async () => {
        const moveAction: TurnAction = {
          type: 'move',
          entityId: 'player2', // Not current turn
          position: { x: 4, y: 3 }
        };

        const result = await gameStateEngine.processTurnAction(moveAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Not your turn');
      });

      it('should reject action when game is not active', async () => {
        gameStateEngine.pause();

        const moveAction: TurnAction = {
          type: 'move',
          entityId: 'player1',
          position: { x: 2, y: 1 }
        };

        const result = await gameStateEngine.processTurnAction(moveAction);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Game is not active');
      });
    });
  });

  describe('Initiative Management', () => {
    it('should update initiative order correctly', () => {
      const eventSpy = vi.fn();
      gameStateEngine.on('initiativeUpdated', eventSpy);

      const newOrder: InitiativeEntry[] = [
        { entityId: 'player2', entityType: 'playerCharacter', initiative: 25, userId: 'user2' },
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 20, userId: 'user1' },
        { entityId: 'monster1', entityType: 'monster', initiative: 15 }
      ];

      gameStateEngine.updateInitiativeOrder(newOrder);

      const state = gameStateEngine.getGameState();
      expect(state.initiativeOrder).toEqual(newOrder);
      expect(state.currentTurnIndex).toBe(0); // Should reset to 0

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'INITIATIVE_UPDATED',
        order: newOrder
      });
    });

    it('should handle empty initiative order', () => {
      gameStateEngine.updateInitiativeOrder([]);

      const state = gameStateEngine.getGameState();
      expect(state.initiativeOrder).toHaveLength(0);
      expect(state.currentTurnIndex).toBe(0);
      expect(gameStateEngine.getCurrentTurnEntity()).toBeNull();
    });
  });

  describe('Game State Management', () => {
    it('should pause game correctly', () => {
      const eventSpy = vi.fn();
      gameStateEngine.on('gamePaused', eventSpy);

      gameStateEngine.pause('test pause');

      const state = gameStateEngine.getGameState();
      expect(state.status).toBe('paused');

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'INTERACTION_PAUSED',
        reason: 'test pause'
      });
    });

    it('should resume game correctly', () => {
      const eventSpy = vi.fn();
      gameStateEngine.on('gameResumed', eventSpy);

      gameStateEngine.pause();
      gameStateEngine.resume();

      const state = gameStateEngine.getGameState();
      expect(state.status).toBe('active');

      expect(eventSpy).toHaveBeenCalledWith({
        type: 'INTERACTION_RESUMED'
      });
    });

    it('should complete game correctly', () => {
      const eventSpy = vi.fn();
      gameStateEngine.on('gameCompleted', eventSpy);

      gameStateEngine.complete('test completion');

      const state = gameStateEngine.getGameState();
      expect(state.status).toBe('completed');

      expect(eventSpy).toHaveBeenCalledWith({
        reason: 'test completion'
      });
    });
  });

  describe('Participant Management', () => {
    it('should get participant correctly', () => {
      const participant = gameStateEngine.getParticipant('player1');
      expect(participant).toBeDefined();
      expect(participant?.entityId).toBe('player1');
      expect(participant?.userId).toBe('user1');
    });

    it('should return null for non-existent participant', () => {
      const participant = gameStateEngine.getParticipant('nonexistent');
      expect(participant).toBeNull();
    });

    it('should update participant correctly', () => {
      const success = gameStateEngine.updateParticipant('player1', {
        currentHP: 15,
        position: { x: 5, y: 5 }
      });

      expect(success).toBe(true);

      const state = gameStateEngine.getGameState();
      expect(state.participants['player1'].currentHP).toBe(15);
      expect(state.participants['player1'].position).toEqual({ x: 5, y: 5 });
    });

    it('should fail to update non-existent participant', () => {
      const success = gameStateEngine.updateParticipant('nonexistent', {
        currentHP: 10
      });

      expect(success).toBe(false);
    });
  });

  describe('State Delta Calculation', () => {
    it('should emit state delta on changes', () => {
      const deltaSpy = vi.fn();
      gameStateEngine.on('stateDelta', deltaSpy);

      gameStateEngine.updateGameState({ roundNumber: 2 });

      expect(deltaSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'participant',
          changes: expect.objectContaining({
            roundNumber: 2
          }),
          timestamp: expect.any(Number)
        })
      );
    });

    it('should not emit delta when no meaningful changes occur', () => {
      const deltaSpy = vi.fn();
      gameStateEngine.on('stateDelta', deltaSpy);

      // Get current state
      const currentState = gameStateEngine.getGameState();

      // Update with same values - this should not emit a delta
      // because only timestamp changes, which is not tracked in delta
      gameStateEngine.updateGameState({
        status: currentState.status,
        roundNumber: currentState.roundNumber,
        currentTurnIndex: currentState.currentTurnIndex
      });

      // Should not emit delta because no meaningful changes occurred
      expect(deltaSpy).not.toHaveBeenCalled();
    });
  });

  describe('End Turn Action', () => {
    it('should process end turn action and advance', async () => {
      const endAction: TurnAction = {
        type: 'end',
        entityId: 'player1'
      };

      const result = await gameStateEngine.processTurnAction(endAction);
      expect(result.valid).toBe(true);

      const state = gameStateEngine.getGameState();
      expect(state.currentTurnIndex).toBe(1); // Should advance
      expect(state.turnHistory).toHaveLength(1);
      expect(state.turnHistory[0].actions[0].type).toBe('end');
    });
  });

  describe('Configuration', () => {
    it('should respect disabled action validation', async () => {
      const engineWithoutValidation = new GameStateEngine(mockGameState, {
        enableActionValidation: false
      });

      // This would normally fail validation
      const invalidAction: TurnAction = {
        type: 'move',
        entityId: 'player2', // Not their turn
        position: { x: 15, y: 15 } // Out of bounds
      };

      const result = await engineWithoutValidation.processTurnAction(invalidAction);
      expect(result.valid).toBe(true); // Should pass because validation is disabled

      engineWithoutValidation.cleanup();
    });

    it('should respect disabled auto-advance turns', () => {
      const engineWithoutAutoAdvance = new GameStateEngine(mockGameState, {
        autoAdvanceTurns: false
      });

      // Should not start turn timer
      expect(engineWithoutAutoAdvance['turnTimer']).toBeUndefined();

      engineWithoutAutoAdvance.cleanup();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in action execution gracefully', async () => {
      // Mock an error in the execution
      const originalExecute = gameStateEngine['executeMoveAction'];
      gameStateEngine['executeMoveAction'] = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 2, y: 1 }
      };

      const result = await gameStateEngine.processTurnAction(moveAction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Internal error processing action');

      // Restore original method
      gameStateEngine['executeMoveAction'] = originalExecute;
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      const removeListenersSpy = vi.spyOn(gameStateEngine, 'removeAllListeners');
      
      gameStateEngine.cleanup();
      
      expect(removeListenersSpy).toHaveBeenCalled();
      expect(gameStateEngine['turnTimer']).toBeUndefined();
    });
  });
});