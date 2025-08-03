import { describe, it, expect } from 'vitest';
import {
  StateDeltaSchema,
  ParticipantDeltaSchema,
  TurnDeltaSchema,
  MapDeltaSchema,
  InitiativeDeltaSchema,
  ChatDeltaSchema,
  TypedStateDeltaSchema,
  BatchDeltaSchema,
} from '../stateDelta';

describe('StateDelta Schemas', () => {
  describe('StateDeltaSchema', () => {
    it('should validate basic state delta', () => {
      const validDelta = {
        type: 'participant' as const,
        changes: { entityId: 'entity-1', hp: 25 },
        timestamp: Date.now(),
      };
      expect(StateDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });

    it('should reject invalid delta type', () => {
      expect(() => StateDeltaSchema.parse({
        type: 'invalid',
        changes: {},
        timestamp: Date.now(),
      })).toThrow();
    });
  });

  describe('ParticipantDeltaSchema', () => {
    it('should validate participant delta', () => {
      const validDelta = {
        type: 'participant' as const,
        changes: {
          entityId: 'entity-1',
          updates: {
            currentHP: 20,
            turnStatus: 'completed' as const,
          },
        },
        timestamp: Date.now(),
      };
      expect(ParticipantDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });

    it('should reject wrong type', () => {
      expect(() => ParticipantDeltaSchema.parse({
        type: 'turn',
        changes: { entityId: 'entity-1', updates: {} },
        timestamp: Date.now(),
      })).toThrow();
    });
  });

  describe('TurnDeltaSchema', () => {
    it('should validate turn delta', () => {
      const validDelta = {
        type: 'turn' as const,
        changes: {
          currentTurnIndex: 1,
          roundNumber: 2,
          activeEntityId: 'entity-2',
          timeRemaining: 60,
        },
        timestamp: Date.now(),
      };
      expect(TurnDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });

    it('should validate partial turn delta', () => {
      const partialDelta = {
        type: 'turn' as const,
        changes: {
          timeRemaining: 30,
        },
        timestamp: Date.now(),
      };
      expect(TurnDeltaSchema.parse(partialDelta)).toEqual(partialDelta);
    });
  });

  describe('MapDeltaSchema', () => {
    it('should validate map delta with entity positions', () => {
      const validDelta = {
        type: 'map' as const,
        changes: {
          entityPositions: {
            'entity-1': { x: 10, y: 15 },
            'entity-2': { x: 5, y: 8 },
          },
        },
        timestamp: Date.now(),
      };
      expect(MapDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });

    it('should validate map delta with obstacles', () => {
      const validDelta = {
        type: 'map' as const,
        changes: {
          newObstacles: [{ x: 12, y: 12 }],
          removedObstacles: [{ x: 8, y: 8 }],
        },
        timestamp: Date.now(),
      };
      expect(MapDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });

    it('should validate map delta with terrain changes', () => {
      const validDelta = {
        type: 'map' as const,
        changes: {
          terrainChanges: [{
            position: { x: 5, y: 5 },
            type: 'difficult',
            properties: { movementCost: 2 },
          }],
        },
        timestamp: Date.now(),
      };
      expect(MapDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });
  });

  describe('InitiativeDeltaSchema', () => {
    it('should validate initiative delta with new order', () => {
      const validDelta = {
        type: 'initiative' as const,
        changes: {
          order: [{
            entityId: 'entity-1',
            entityType: 'playerCharacter' as const,
            initiative: 18,
            userId: 'user-1',
          }],
          currentTurnIndex: 0,
        },
        timestamp: Date.now(),
      };
      expect(InitiativeDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });

    it('should validate initiative delta with added/removed entries', () => {
      const validDelta = {
        type: 'initiative' as const,
        changes: {
          addedEntries: [{
            entityId: 'entity-3',
            entityType: 'monster' as const,
            initiative: 12,
          }],
          removedEntries: ['entity-2'],
        },
        timestamp: Date.now(),
      };
      expect(InitiativeDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });
  });

  describe('ChatDeltaSchema', () => {
    it('should validate chat delta with new message', () => {
      const validDelta = {
        type: 'chat' as const,
        changes: {
          newMessage: {
            id: 'msg-1',
            userId: 'user-1',
            content: 'Hello!',
            type: 'party' as const,
            timestamp: Date.now(),
          },
        },
        timestamp: Date.now(),
      };
      expect(ChatDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });

    it('should validate chat delta with deleted message', () => {
      const validDelta = {
        type: 'chat' as const,
        changes: {
          deletedMessageId: 'msg-1',
        },
        timestamp: Date.now(),
      };
      expect(ChatDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });

    it('should validate chat delta with edited message', () => {
      const validDelta = {
        type: 'chat' as const,
        changes: {
          editedMessage: {
            id: 'msg-1',
            content: 'Updated content',
          },
        },
        timestamp: Date.now(),
      };
      expect(ChatDeltaSchema.parse(validDelta)).toEqual(validDelta);
    });
  });

  describe('TypedStateDeltaSchema', () => {
    it('should validate different delta types', () => {
      const participantDelta = {
        type: 'participant' as const,
        changes: { entityId: 'entity-1', updates: { currentHP: 20 } },
        timestamp: Date.now(),
      };

      const turnDelta = {
        type: 'turn' as const,
        changes: { currentTurnIndex: 1 },
        timestamp: Date.now(),
      };

      expect(TypedStateDeltaSchema.parse(participantDelta)).toEqual(participantDelta);
      expect(TypedStateDeltaSchema.parse(turnDelta)).toEqual(turnDelta);
    });

    it('should reject invalid discriminated union', () => {
      expect(() => TypedStateDeltaSchema.parse({
        type: 'participant',
        changes: { invalidField: 'value' }, // Wrong structure for participant
        timestamp: Date.now(),
      })).toThrow();
    });
  });

  describe('BatchDeltaSchema', () => {
    it('should validate batch delta', () => {
      const validBatch = {
        deltas: [
          {
            type: 'participant' as const,
            changes: { entityId: 'entity-1', updates: { currentHP: 20 } },
            timestamp: Date.now(),
          },
          {
            type: 'turn' as const,
            changes: { currentTurnIndex: 1 },
            timestamp: Date.now(),
          },
        ],
        timestamp: Date.now(),
        batchId: 'batch-1',
      };
      expect(BatchDeltaSchema.parse(validBatch)).toEqual(validBatch);
    });

    it('should validate empty batch', () => {
      const emptyBatch = {
        deltas: [],
        timestamp: Date.now(),
        batchId: 'batch-empty',
      };
      expect(BatchDeltaSchema.parse(emptyBatch)).toEqual(emptyBatch);
    });
  });
});