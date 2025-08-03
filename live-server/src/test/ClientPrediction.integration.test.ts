import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ClientPrediction } from '../services/ClientPrediction';
import { GameStateEngine } from '../services/GameStateEngine';
import type { GameState, TurnAction, ParticipantState } from '@campaignion/shared-types';

describe('ClientPrediction Integration', () => {
  let clientPrediction: ClientPrediction;
  let gameStateEngine: GameStateEngine;
  let mockGameState: GameState;

  beforeEach(() => {
    clientPrediction = new ClientPrediction();

    const mockParticipant: ParticipantState = {
      entityId: 'player1',
      entityType: 'playerCharacter',
      userId: 'user1',
      currentHP: 50,
      maxHP: 100,
      position: { x: 5, y: 5 },
      conditions: [],
      inventory: {
        items: [
          { id: 'item1', itemId: 'healing-potion', quantity: 2, properties: {} }
        ],
        equippedItems: { weapon: 'sword' },
        capacity: 20
      },
      availableActions: [],
      turnStatus: 'active'
    };

    const targetParticipant: ParticipantState = {
      entityId: 'monster1',
      entityType: 'monster',
      currentHP: 30,
      maxHP: 30,
      position: { x: 8, y: 8 }, // Position away from player to avoid conflicts
      conditions: [],
      inventory: { items: [], equippedItems: {}, capacity: 0 },
      availableActions: [],
      turnStatus: 'waiting'
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
      participants: new Map([
        ['player1', mockParticipant],
        ['monster1', targetParticipant]
      ]),
      mapState: {
        width: 20,
        height: 20,
        entities: new Map([
          ['player1', { entityId: 'player1', position: { x: 5, y: 5 } }],
          ['monster1', { entityId: 'monster1', position: { x: 8, y: 8 } }]
        ]),
        obstacles: [{ x: 10, y: 10 }],
        terrain: []
      },
      turnHistory: [],
      chatLog: [],
      timestamp: new Date()
    };

    gameStateEngine = new GameStateEngine(mockGameState, {
      enableActionValidation: true,
      autoAdvanceTurns: false,
      enableTurnQueue: false
    });
  });

  afterEach(() => {
    gameStateEngine.cleanup();
  });

  describe('prediction vs server validation', () => {
    it('should predict valid move action that server would accept', async () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 6 }
      };

      // Client prediction
      const predictionResult = clientPrediction.predictAction(mockGameState, moveAction);
      expect(predictionResult.success).toBe(true);

      // Server validation
      const serverResult = await gameStateEngine.processTurnAction(moveAction);
      expect(serverResult.valid).toBe(true);

      // Both should agree on validity
      expect(predictionResult.success).toBe(serverResult.valid);
    });

    it('should predict invalid move action that server would reject', async () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 25, y: 25 } // Out of bounds
      };

      // Client prediction
      const predictionResult = clientPrediction.predictAction(mockGameState, moveAction);
      expect(predictionResult.success).toBe(false);
      expect(predictionResult.errors).toContain('Target position is out of bounds');

      // Server validation
      const serverResult = await gameStateEngine.processTurnAction(moveAction);
      expect(serverResult.valid).toBe(false);
      expect(serverResult.errors).toContain('Target position is out of bounds');

      // Both should agree on validity and error message
      expect(predictionResult.success).toBe(serverResult.valid);
      expect(predictionResult.errors[0]).toBe(serverResult.errors[0]);
    });

    it('should predict valid attack action that server would accept', async () => {
      // Move monster adjacent to player for valid attack
      const monster = mockGameState.participants.get('monster1');
      if (monster) {
        monster.position = { x: 6, y: 5 };
        mockGameState.mapState.entities.set('monster1', { 
          entityId: 'monster1', 
          position: { x: 6, y: 5 } 
        });
      }

      const attackAction: TurnAction = {
        type: 'attack',
        entityId: 'player1',
        target: 'monster1'
      };

      // Client prediction
      const predictionResult = clientPrediction.predictAction(mockGameState, attackAction);
      expect(predictionResult.success).toBe(true);

      // Server validation
      const serverResult = await gameStateEngine.processTurnAction(attackAction);
      expect(serverResult.valid).toBe(true);

      // Both should agree on validity
      expect(predictionResult.success).toBe(serverResult.valid);
    });

    it('should predict invalid attack action that server would reject', async () => {
      const attackAction: TurnAction = {
        type: 'attack',
        entityId: 'player1',
        target: 'non-existent-target'
      };

      // Client prediction
      const predictionResult = clientPrediction.predictAction(mockGameState, attackAction);
      expect(predictionResult.success).toBe(false);
      expect(predictionResult.errors).toContain('Target not found');

      // Server validation
      const serverResult = await gameStateEngine.processTurnAction(attackAction);
      expect(serverResult.valid).toBe(false);
      expect(serverResult.errors).toContain('Target not found');

      // Both should agree on validity and error message
      expect(predictionResult.success).toBe(serverResult.valid);
      expect(predictionResult.errors[0]).toBe(serverResult.errors[0]);
    });
  });

  describe('prediction and reconciliation workflow', () => {
    it('should handle successful prediction followed by server confirmation', async () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 6 }
      };

      // Step 1: Client makes prediction
      const predictionResult = clientPrediction.predictAction(mockGameState, moveAction);
      expect(predictionResult.success).toBe(true);

      // Step 2: Server processes action
      const serverResult = await gameStateEngine.processTurnAction(moveAction);
      expect(serverResult.valid).toBe(true);

      // Step 3: Create a mock server state that represents what the server would return
      const mockServerState = {
        ...mockGameState,
        participants: new Map([
          ['player1', { ...mockGameState.participants.get('player1')!, position: { x: 6, y: 6 } }],
          ['monster1', mockGameState.participants.get('monster1')!]
        ])
      };

      // Step 4: Reconcile with server state
      const reconciledState = clientPrediction.reconcileWithServer(
        predictionResult.predictedState,
        mockServerState,
        predictionResult.rollbackData?.predictionId
      );

      // Reconciled state should match server state
      expect(reconciledState.currentTurnIndex).toBe(mockServerState.currentTurnIndex);
      expect(reconciledState.roundNumber).toBe(mockServerState.roundNumber);
      
      // Check that the position was updated correctly
      const reconciledParticipants = reconciledState.participants instanceof Map ? 
        reconciledState.participants : new Map(Object.entries(reconciledState.participants));
      const reconciledPlayer = reconciledParticipants.get('player1');
      
      expect(reconciledPlayer?.position).toEqual({ x: 6, y: 6 });
    });

    it('should handle failed prediction followed by server rejection', async () => {
      const invalidMoveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 25, y: 25 } // Out of bounds
      };

      // Step 1: Client makes prediction (should fail)
      const predictionResult = clientPrediction.predictAction(mockGameState, invalidMoveAction);
      expect(predictionResult.success).toBe(false);

      // Step 2: Server processes action (should also fail)
      const serverResult = await gameStateEngine.processTurnAction(invalidMoveAction);
      expect(serverResult.valid).toBe(false);

      // Step 3: Reconcile with server state (original state since action failed)
      const reconciledState = clientPrediction.reconcileWithServer(
        mockGameState, // Use original state since prediction failed
        mockGameState  // Server state should be unchanged
      );

      // State should remain unchanged
      const reconciledParticipants = reconciledState.participants instanceof Map ? 
        reconciledState.participants : new Map(Object.entries(reconciledState.participants));
      const reconciledPlayer = reconciledParticipants.get('player1');
      
      // Should use server state position (original position since action failed)
      expect(reconciledPlayer?.position).toEqual({ x: 5, y: 5 });
    });

    it('should handle prediction rollback when server state differs', async () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 6 }
      };

      // Step 1: Client makes prediction
      const predictionResult = clientPrediction.predictAction(mockGameState, moveAction);
      expect(predictionResult.success).toBe(true);

      // Step 2: Create a mock server state with different outcome
      const mockServerState = {
        ...mockGameState,
        participants: new Map([
          ['player1', { ...mockGameState.participants.get('player1')!, position: { x: 7, y: 7 } }],
          ['monster1', mockGameState.participants.get('monster1')!]
        ])
      };

      // Step 3: Reconcile with server state
      const reconciledState = clientPrediction.reconcileWithServer(
        predictionResult.predictedState,
        mockServerState,
        predictionResult.rollbackData?.predictionId
      );

      // Should use server state as authoritative
      const reconciledParticipants = reconciledState.participants instanceof Map ? 
        reconciledState.participants : new Map(Object.entries(reconciledState.participants));
      const reconciledPlayer = reconciledParticipants.get('player1');
      
      // Should use the modified server state position
      expect(reconciledPlayer?.position).toEqual({ x: 7, y: 7 });
    });
  });

  describe('multiple predictions and rollbacks', () => {
    it('should handle multiple predictions and selective rollbacks', () => {
      const moveAction1: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const moveAction2: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 7, y: 5 }
      };

      // Make first prediction
      const prediction1 = clientPrediction.predictAction(mockGameState, moveAction1);
      expect(prediction1.success).toBe(true);

      // Make second prediction on top of first
      const prediction2 = clientPrediction.predictAction(prediction1.predictedState, moveAction2);
      expect(prediction2.success).toBe(true);

      // Should have 2 pending predictions
      expect(clientPrediction.getPendingPredictions()).toHaveLength(2);

      // Rollback first prediction
      const rolledBackState = clientPrediction.rollbackPredictionById(
        prediction1.rollbackData!.predictionId
      );

      expect(rolledBackState).toBeDefined();
      expect(clientPrediction.getPendingPredictions()).toHaveLength(1);

      // Remaining prediction should be the second one
      const remainingPredictions = clientPrediction.getPendingPredictions();
      expect(remainingPredictions[0].predictionId).toBe(prediction2.rollbackData!.predictionId);
    });

    it('should handle prediction chain rollback', () => {
      const actions: TurnAction[] = [
        { type: 'move', entityId: 'player1', position: { x: 6, y: 5 } },
        { type: 'move', entityId: 'player1', position: { x: 7, y: 5 } },
        { type: 'move', entityId: 'player1', position: { x: 8, y: 5 } }
      ];

      let currentState = mockGameState;
      const predictions = [];

      // Make chain of predictions
      for (const action of actions) {
        const prediction = clientPrediction.predictAction(currentState, action);
        expect(prediction.success).toBe(true);
        predictions.push(prediction);
        currentState = prediction.predictedState;
      }

      expect(clientPrediction.getPendingPredictions()).toHaveLength(3);

      // Rollback middle prediction
      const rolledBackState = clientPrediction.rollbackPredictionById(
        predictions[1].rollbackData!.predictionId
      );

      expect(rolledBackState).toBeDefined();
      expect(clientPrediction.getPendingPredictions()).toHaveLength(2);

      // Should still have first and third predictions
      const remainingPredictions = clientPrediction.getPendingPredictions();
      const remainingIds = remainingPredictions.map(p => p.predictionId);
      expect(remainingIds).toContain(predictions[0].rollbackData!.predictionId);
      expect(remainingIds).toContain(predictions[2].rollbackData!.predictionId);
      expect(remainingIds).not.toContain(predictions[1].rollbackData!.predictionId);
    });
  });

  describe('performance and memory management', () => {
    it('should clean up old predictions automatically', () => {
      // Create more than the limit (10) predictions
      for (let i = 0; i < 15; i++) {
        const moveAction: TurnAction = {
          type: 'move',
          entityId: 'player1',
          position: { x: 5 + (i % 5), y: 5 }
        };
        clientPrediction.predictAction(mockGameState, moveAction);
      }

      // Should only keep the most recent 10
      expect(clientPrediction.getPendingPredictions()).toHaveLength(10);
    });

    it('should handle rapid prediction and rollback cycles', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      // Rapid prediction/rollback cycles
      for (let i = 0; i < 100; i++) {
        const prediction = clientPrediction.predictAction(mockGameState, moveAction);
        expect(prediction.success).toBe(true);
        
        const rolledBack = clientPrediction.rollbackPrediction(
          prediction.predictedState,
          moveAction
        );
        expect(rolledBack).toEqual(mockGameState);
      }

      // Should not accumulate predictions
      expect(clientPrediction.getPendingPredictions()).toHaveLength(0);
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle corrupted game state gracefully', () => {
      const corruptedState = {
        ...mockGameState,
        participants: null as any
      };

      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const result = clientPrediction.predictAction(corruptedState, moveAction);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle prediction on non-existent entity', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'non-existent-player',
        position: { x: 6, y: 5 }
      };

      const result = clientPrediction.predictAction(mockGameState, moveAction);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Participant not found');
    });

    it('should handle reconciliation with malformed server state', () => {
      const moveAction: TurnAction = {
        type: 'move',
        entityId: 'player1',
        position: { x: 6, y: 5 }
      };

      const prediction = clientPrediction.predictAction(mockGameState, moveAction);
      expect(prediction.success).toBe(true);

      const malformedServerState = {
        ...mockGameState,
        participants: undefined as any
      };

      // Should fall back to server state even if malformed
      const result = clientPrediction.reconcileWithServer(
        prediction.predictedState,
        malformedServerState
      );

      expect(result).toEqual(malformedServerState);
    });
  });
});