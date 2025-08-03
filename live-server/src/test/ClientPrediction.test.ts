import { describe, it, expect, beforeEach } from 'vitest';
import { ClientPrediction, PredictionResult } from '../services/ClientPrediction';
import type { GameState, TurnAction, ParticipantState, Position } from '@campaignion/shared-types';

describe('ClientPrediction', () => {
  let clientPrediction: ClientPrediction;
  let mockGameState: GameState;
  let mockParticipant: ParticipantState;

  beforeEach(() => {
    clientPrediction = new ClientPrediction();

    mockParticipant = {
      entityId: 'player1',
      entityType: 'playerCharacter',
      userId: 'user1',
      currentHP: 50,
      maxHP: 100,
      position: { x: 5, y: 5 },
      conditions: [],
      inventory: {
        items: [
          { id: 'item1', itemId: 'healing-potion', quantity: 2, properties: {} },
          { id: 'item2', itemId: 'sword', quantity: 1, properties: {} }
        ],
        equippedItems: { weapon: 'sword' },
        capacity: 20
      },
      availableActions: [],
      turnStatus: 'active'
    };

    mockGameState = {
      interactionId: 'interaction1',
      status: 'active',
      initiativeOrder: [
        { entityId: 'player1', entityType: 'playerCharacter', initiative: 15, userId: 'user1' },
        { entityId: 'monster1', entityType: 'monster', initiative: 10 }
      ],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: new Map([['player1', mockParticipant]]),
      mapState: {
        width: 20,
        height: 20,
        entities: new Map([
          ['player1', { entityId: 'player1', position: { x: 5, y: 5 } }]
        ]),
        obstacles: [{ x: 10, y: 10 }],
        terrain: []
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date()
    };
  });

  describe('predictAction', () => {
    it('should successfully predict a valid move action', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const result = clientPrediction.predictAction(mockGameState, moveAction);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.rollbackData).toBeDefined();
      
      // Check that position was updated in predicted state
      const participants = result.predictedState.participants instanceof Map ? 
        result.predictedState.participants : new Map(Object.entries(result.predictedState.participants));
      const updatedParticipant = participants.get('player1');
      expect(updatedParticipant?.position).toEqual({ x: 6, y: 5 });
    });

    it('should reject move action to out-of-bounds position', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 25, y: 25 } // Out of bounds
      };

      const result = clientPrediction.predictAction(mockGameState, moveAction);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Target position is out of bounds');
    });

    it('should reject move action to blocked position', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 10, y: 10 } // Blocked by obstacle
      };

      const result = clientPrediction.predictAction(mockGameState, moveAction);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Target position is blocked');
    });

    it('should reject move action that is too far', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 15, y: 15 } // Too far from current position
      };

      const result = clientPrediction.predictAction(mockGameState, moveAction);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Target position is too far');
    });

    it('should reject action when not player\'s turn', () => {
      // Set current turn to monster
      mockGameState.currentTurnIndex = 1;

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const result = clientPrediction.predictAction(mockGameState, moveAction);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Not your turn');
    });

    it('should reject action when game is not active', () => {
      mockGameState.status = 'paused';

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const result = clientPrediction.predictAction(mockGameState, moveAction);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Game is not active');
    });

    it('should successfully predict attack action', () => {
      // Add target to game state
      const targetParticipant: ParticipantState = {
        entityId: 'monster1',
        entityType: 'monster',
        currentHP: 30,
        maxHP: 30,
        position: { x: 6, y: 5 }, // Adjacent to player
        conditions: [],
        inventory: { items: [], equippedItems: {}, capacity: 0 },
        availableActions: [],
        turnStatus: 'waiting'
      };

      mockGameState.participants.set('monster1', targetParticipant);
      mockGameState.mapState.entities.set('monster1', { 
        entityId: 'monster1', 
        position: { x: 6, y: 5 } 
      });

      const attackAction: TurnAction = {
        type: 'attack',
        entityId: 'player1',
        target: 'monster1'
      };

      const result = clientPrediction.predictAction(mockGameState, attackAction);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Check that target HP was reduced
      const participants = result.predictedState.participants instanceof Map ? 
        result.predictedState.participants : new Map(Object.entries(result.predictedState.participants));
      const updatedTarget = participants.get('monster1');
      expect(updatedTarget?.currentHP).toBeLessThan(30);
    });

    it('should reject attack action without target', () => {
      const attackAction: TurnAction = {
        type: 'attack',
        entityId: 'player1'
      };

      const result = clientPrediction.predictAction(mockGameState, attackAction);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Attack action requires target');
    });

    it('should successfully predict item usage', () => {
      const itemAction: TurnAction = {
        type: 'useItem',
        entityId: 'player1',
        itemId: 'healing-potion'
      };

      const result = clientPrediction.predictAction(mockGameState, itemAction);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Check that item was consumed and HP was increased
      const participants = result.predictedState.participants instanceof Map ? 
        result.predictedState.participants : new Map(Object.entries(result.predictedState.participants));
      const updatedParticipant = participants.get('player1');
      expect(updatedParticipant?.currentHP).toBeGreaterThan(50);
      
      // Check that item quantity was reduced
      const healingPotion = updatedParticipant?.inventory.items.find(item => item.itemId === 'healing-potion');
      expect(healingPotion?.quantity).toBe(1);
    });

    it('should reject item usage for non-existent item', () => {
      const itemAction: TurnAction = {
        type: 'useItem',
        entityId: 'player1',
        itemId: 'non-existent-item'
      };

      const result = clientPrediction.predictAction(mockGameState, itemAction);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Item not found in inventory');
    });

    it('should successfully predict end turn action', () => {
      const endAction: TurnAction = {
        type: 'end',
        entityId: 'player1'
      };

      const result = clientPrediction.predictAction(mockGameState, endAction);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Check that turn was advanced
      expect(result.predictedState.currentTurnIndex).toBe(1);
      expect(result.predictedState.turnHistory).toHaveLength(1);
      
      const participants = result.predictedState.participants instanceof Map ? 
        result.predictedState.participants : new Map(Object.entries(result.predictedState.participants));
      const updatedParticipant = participants.get('player1');
      expect(updatedParticipant?.turnStatus).toBe('completed');
    });
  });

  describe('reconcileWithServer', () => {
    it('should return server state when states are equivalent', () => {
      const predictedState = { ...mockGameState };
      const serverState = { ...mockGameState };

      const result = clientPrediction.reconcileWithServer(predictedState, serverState);

      expect(result).toEqual(serverState);
    });

    it('should reconcile when states differ', () => {
      const predictedState = { ...mockGameState };
      const serverState = { 
        ...mockGameState, 
        currentTurnIndex: 1,
        roundNumber: 2
      };

      const result = clientPrediction.reconcileWithServer(predictedState, serverState);

      // Should use server state as authoritative
      expect(result.currentTurnIndex).toBe(1);
      expect(result.roundNumber).toBe(2);
    });

    it('should remove prediction from history when prediction ID provided', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const predictionResult = clientPrediction.predictAction(mockGameState, moveAction);
      expect(clientPrediction.getPendingPredictions()).toHaveLength(1);

      const reconciledState = clientPrediction.reconcileWithServer(
        predictionResult.predictedState,
        mockGameState,
        predictionResult.rollbackData?.predictionId
      );

      expect(clientPrediction.getPendingPredictions()).toHaveLength(0);
    });
  });

  describe('rollbackPrediction', () => {
    it('should rollback to original state when matching prediction found', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      // Make prediction
      const predictionResult = clientPrediction.predictAction(mockGameState, moveAction);
      expect(predictionResult.success).toBe(true);

      // Rollback
      const rolledBackState = clientPrediction.rollbackPrediction(
        predictionResult.predictedState,
        moveAction
      );

      // Should match original state
      const participants = rolledBackState.participants instanceof Map ? 
        rolledBackState.participants : new Map(Object.entries(rolledBackState.participants));
      const participant = participants.get('player1');
      expect(participant?.position).toEqual({ x: 5, y: 5 }); // Original position
    });

    it('should return current state when no matching prediction found', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const differentAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 7, y: 5 }
      };

      // Make prediction with one action
      const predictionResult = clientPrediction.predictAction(mockGameState, moveAction);

      // Try to rollback with different action
      const rolledBackState = clientPrediction.rollbackPrediction(
        predictionResult.predictedState,
        differentAction
      );

      // Should return the predicted state unchanged
      expect(rolledBackState).toEqual(predictionResult.predictedState);
    });
  });

  describe('rollbackPredictionById', () => {
    it('should rollback prediction by ID', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const predictionResult = clientPrediction.predictAction(mockGameState, moveAction);
      const predictionId = predictionResult.rollbackData?.predictionId;

      expect(predictionId).toBeDefined();
      expect(clientPrediction.getPendingPredictions()).toHaveLength(1);

      const rolledBackState = clientPrediction.rollbackPredictionById(predictionId!);

      expect(rolledBackState).toBeDefined();
      expect(clientPrediction.getPendingPredictions()).toHaveLength(0);
      
      const participants = rolledBackState!.participants instanceof Map ? 
        rolledBackState!.participants : new Map(Object.entries(rolledBackState!.participants));
      const participant = participants.get('player1');
      expect(participant?.position).toEqual({ x: 5, y: 5 }); // Original position
    });

    it('should return null for non-existent prediction ID', () => {
      const result = clientPrediction.rollbackPredictionById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('prediction history management', () => {
    it('should track pending predictions', () => {
      expect(clientPrediction.getPendingPredictions()).toHaveLength(0);

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      clientPrediction.predictAction(mockGameState, moveAction);
      expect(clientPrediction.getPendingPredictions()).toHaveLength(1);

      const attackAction: TurnAction = {
        type: 'attack',
        entityId: 'player1',
        target: 'monster1'
      };

      // Add target for valid attack
      mockGameState.participants.set('monster1', {
        entityId: 'monster1',
        entityType: 'monster',
        currentHP: 30,
        maxHP: 30,
        position: { x: 6, y: 5 },
        conditions: [],
        inventory: { items: [], equippedItems: {}, capacity: 0 },
        availableActions: [],
        turnStatus: 'waiting'
      });

      clientPrediction.predictAction(mockGameState, attackAction);
      expect(clientPrediction.getPendingPredictions()).toHaveLength(2);
    });

    it('should clear all prediction history', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      clientPrediction.predictAction(mockGameState, moveAction);
      expect(clientPrediction.getPendingPredictions()).toHaveLength(1);

      clientPrediction.clearPredictionHistory();
      expect(clientPrediction.getPendingPredictions()).toHaveLength(0);
    });

    it('should clean up old predictions when limit exceeded', () => {
      // Create 15 predictions to exceed the limit of 10
      for (let i = 0; i < 15; i++) {
        const moveAction: TurnAction = {
          type: 'move',
          entityId: 'player1',
          position: { x: 6 + (i % 5), y: 5 }
        };
        clientPrediction.predictAction(mockGameState, moveAction);
      }

      // Should only keep the most recent 10
      expect(clientPrediction.getPendingPredictions()).toHaveLength(10);
    });
  });

  describe('error handling', () => {
    it('should handle prediction errors gracefully', () => {
      // Create an invalid game state that might cause errors
      const invalidGameState = {
        ...mockGameState,
        participants: null as any
      };

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const result = clientPrediction.predictAction(invalidGameState, moveAction);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.predictedState).toEqual(invalidGameState);
    });

    it('should handle reconciliation errors gracefully', () => {
      const invalidPredictedState = null as any;
      const serverState = mockGameState;

      const result = clientPrediction.reconcileWithServer(invalidPredictedState, serverState);

      // Should fall back to server state
      expect(result).toEqual(serverState);
    });

    it('should handle rollback errors gracefully', () => {
      const invalidGameState = null as any;
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const result = clientPrediction.rollbackPrediction(invalidGameState, moveAction);

      // Should return the invalid state as-is
      expect(result).toEqual(invalidGameState);
    });
  });

  describe('action validation edge cases', () => {
    it('should handle Map vs Object participants correctly', () => {
      // Test with participants as Object instead of Map
      const gameStateWithObjectParticipants = {
        ...mockGameState,
        participants: { 'player1': mockParticipant } as any
      };

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const result = clientPrediction.predictAction(gameStateWithObjectParticipants, moveAction);

      expect(result.success).toBe(true);
    });

    it('should handle Map vs Object entities correctly', () => {
      // Test with entities as Object instead of Map
      const gameStateWithObjectEntities = {
        ...mockGameState,
        mapState: {
          ...mockGameState.mapState,
          entities: { 'player1': { entityId: 'player1', position: { x: 5, y: 5 } } } as any
        }
      };

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const result = clientPrediction.predictAction(gameStateWithObjectEntities, moveAction);

      expect(result.success).toBe(true);
    });
  });
});