import { describe, it, expect } from 'vitest';
import {
  validateGameState,
  validateParticipantState,
  validateTurnAction,
  validateChatMessage,
  validateGameEvent,
  validateWithSchema,
  safeParse,
  validateArray,
} from '../validators';
import { TurnActionSchema } from '../gameState';

describe('Schema Validators', () => {
  describe('validateGameState', () => {
    it('should return valid result for correct game state', () => {
      const validGameState = {
        interactionId: 'interaction-1',
        status: 'active',
        initiativeOrder: [],
        currentTurnIndex: 0,
        roundNumber: 1,
        participants: {},
        mapState: {
          width: 20,
          height: 20,
          entities: {},
          obstacles: [],
          terrain: [],
        },
        turnHistory: [],
        chatLog: [],
        timestamp: new Date(),
      };

      const result = validateGameState(validGameState);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result with errors for incorrect game state', () => {
      const invalidGameState = {
        interactionId: 'interaction-1',
        // Missing required fields
      };

      const result = validateGameState(invalidGameState);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateParticipantState', () => {
    it('should return valid result for correct participant state', () => {
      const validParticipant = {
        entityId: 'entity-1',
        entityType: 'playerCharacter',
        currentHP: 25,
        maxHP: 30,
        position: { x: 5, y: 10 },
        conditions: [],
        inventory: {
          items: [],
          equippedItems: {},
          capacity: 20,
        },
        availableActions: [],
        turnStatus: 'waiting',
      };

      const result = validateParticipantState(validParticipant);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result when currentHP exceeds maxHP', () => {
      const invalidParticipant = {
        entityId: 'entity-1',
        entityType: 'playerCharacter',
        currentHP: 35,
        maxHP: 30,
        position: { x: 5, y: 10 },
        conditions: [],
        inventory: { items: [], equippedItems: {}, capacity: 20 },
        availableActions: [],
        turnStatus: 'waiting',
      };

      const result = validateParticipantState(invalidParticipant);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Current HP cannot exceed max HP'))).toBe(true);
    });
  });

  describe('validateTurnAction', () => {
    it('should return valid result for correct turn action', () => {
      const validAction = {
        type: 'move',
        entityId: 'entity-1',
        position: { x: 10, y: 15 },
      };

      const result = validateTurnAction(validAction);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for incorrect turn action', () => {
      const invalidAction = {
        type: 'invalid-type',
        entityId: 'entity-1',
      };

      const result = validateTurnAction(invalidAction);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateChatMessage', () => {
    it('should return valid result for correct chat message', () => {
      const validMessage = {
        id: 'msg-1',
        userId: 'user-1',
        content: 'Hello everyone!',
        type: 'party',
        timestamp: Date.now(),
      };

      const result = validateChatMessage(validMessage);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for empty content', () => {
      const invalidMessage = {
        id: 'msg-1',
        userId: 'user-1',
        content: '',
        type: 'party',
        timestamp: Date.now(),
      };

      const result = validateChatMessage(invalidMessage);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('String must contain at least 1 character'))).toBe(true);
    });
  });

  describe('validateGameEvent', () => {
    it('should return valid result for correct game event', () => {
      const validEvent = {
        type: 'PARTICIPANT_JOINED',
        userId: 'user-1',
        entityId: 'entity-1',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
      };

      const result = validateGameEvent(validEvent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for incorrect game event', () => {
      const invalidEvent = {
        type: 'UNKNOWN_EVENT',
        timestamp: Date.now(),
        interactionId: 'interaction-1',
      };

      const result = validateGameEvent(invalidEvent);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateWithSchema', () => {
    it('should validate data with provided schema', () => {
      const validAction = {
        type: 'attack',
        entityId: 'entity-1',
        target: 'entity-2',
      };

      const result = validateWithSchema(TurnActionSchema, validAction);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid data', () => {
      const invalidAction = {
        type: 'invalid',
        // Missing entityId
      };

      const result = validateWithSchema(TurnActionSchema, invalidAction);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('safeParse', () => {
    it('should return parsed data for valid input', () => {
      const validAction = {
        type: 'move',
        entityId: 'entity-1',
        position: { x: 10, y: 15 },
      };

      const result = safeParse(TurnActionSchema, validAction);
      expect(result).toEqual(validAction);
    });

    it('should return null for invalid input', () => {
      const invalidAction = {
        type: 'invalid',
      };

      const result = safeParse(TurnActionSchema, invalidAction);
      expect(result).toBeNull();
    });
  });

  describe('validateArray', () => {
    it('should validate array of valid items', () => {
      const validActions = [
        {
          type: 'move',
          entityId: 'entity-1',
          position: { x: 10, y: 15 },
        },
        {
          type: 'attack',
          entityId: 'entity-1',
          target: 'entity-2',
        },
      ];

      const result = validateArray(TurnActionSchema, validActions);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid items with item indices', () => {
      const mixedActions = [
        {
          type: 'move',
          entityId: 'entity-1',
          position: { x: 10, y: 15 },
        },
        {
          type: 'invalid',
          // Missing entityId
        },
      ];

      const result = validateArray(TurnActionSchema, mixedActions);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Item 1'))).toBe(true);
    });

    it('should handle empty array', () => {
      const result = validateArray(TurnActionSchema, []);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});