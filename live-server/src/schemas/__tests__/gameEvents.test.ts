import { describe, it, expect } from 'vitest';
import {
  GameErrorSchema,
  ParticipantJoinedEventSchema,
  ParticipantLeftEventSchema,
  TurnStartedEventSchema,
  TurnCompletedEventSchema,
  TurnSkippedEventSchema,
  StateDeltaEventSchema,
  ChatMessageEventSchema,
  InitiativeUpdatedEventSchema,
  InteractionPausedEventSchema,
  InteractionResumedEventSchema,
  ErrorEventSchema,
  GameEventSchema,
  ValidationResultSchema,
} from '../gameEvents';

describe('GameEvents Schemas', () => {
  const baseEventProps = {
    timestamp: Date.now(),
    interactionId: 'interaction-1',
  };

  describe('GameErrorSchema', () => {
    it('should validate basic game error', () => {
      const validError = {
        code: 'INVALID_ACTION',
        message: 'Action is not valid for current state',
      };
      expect(GameErrorSchema.parse(validError)).toEqual(validError);
    });

    it('should validate game error with details', () => {
      const errorWithDetails = {
        code: 'VALIDATION_FAILED',
        message: 'Input validation failed',
        details: { field: 'entityId', reason: 'required' },
      };
      expect(GameErrorSchema.parse(errorWithDetails)).toEqual(errorWithDetails);
    });
  });

  describe('ParticipantJoinedEventSchema', () => {
    it('should validate participant joined event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'PARTICIPANT_JOINED' as const,
        userId: 'user-1',
        entityId: 'entity-1',
      };
      expect(ParticipantJoinedEventSchema.parse(validEvent)).toEqual(validEvent);
    });

    it('should reject wrong event type', () => {
      expect(() => ParticipantJoinedEventSchema.parse({
        ...baseEventProps,
        type: 'PARTICIPANT_LEFT',
        userId: 'user-1',
        entityId: 'entity-1',
      })).toThrow();
    });
  });

  describe('ParticipantLeftEventSchema', () => {
    it('should validate participant left event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'PARTICIPANT_LEFT' as const,
        userId: 'user-1',
      };
      expect(ParticipantLeftEventSchema.parse(validEvent)).toEqual(validEvent);
    });
  });

  describe('TurnStartedEventSchema', () => {
    it('should validate turn started event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'TURN_STARTED' as const,
        entityId: 'entity-1',
        timeLimit: 90,
      };
      expect(TurnStartedEventSchema.parse(validEvent)).toEqual(validEvent);
    });

    it('should reject negative time limit', () => {
      expect(() => TurnStartedEventSchema.parse({
        ...baseEventProps,
        type: 'TURN_STARTED',
        entityId: 'entity-1',
        timeLimit: -10,
      })).toThrow();
    });
  });

  describe('TurnCompletedEventSchema', () => {
    it('should validate turn completed event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'TURN_COMPLETED' as const,
        entityId: 'entity-1',
        actions: [{
          type: 'move' as const,
          entityId: 'entity-1',
          position: { x: 10, y: 15 },
        }],
      };
      expect(TurnCompletedEventSchema.parse(validEvent)).toEqual(validEvent);
    });

    it('should validate turn completed with multiple actions', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'TURN_COMPLETED' as const,
        entityId: 'entity-1',
        actions: [
          {
            type: 'move' as const,
            entityId: 'entity-1',
            position: { x: 10, y: 15 },
          },
          {
            type: 'attack' as const,
            entityId: 'entity-1',
            target: 'entity-2',
          },
        ],
      };
      expect(TurnCompletedEventSchema.parse(validEvent)).toEqual(validEvent);
    });
  });

  describe('TurnSkippedEventSchema', () => {
    it('should validate turn skipped event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'TURN_SKIPPED' as const,
        entityId: 'entity-1',
        reason: 'Player disconnected',
      };
      expect(TurnSkippedEventSchema.parse(validEvent)).toEqual(validEvent);
    });
  });

  describe('StateDeltaEventSchema', () => {
    it('should validate state delta event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'STATE_DELTA' as const,
        changes: {
          type: 'participant' as const,
          changes: {
            'entity-1': { currentHP: 20 },
          },
          timestamp: Date.now(),
        },
      };
      expect(StateDeltaEventSchema.parse(validEvent)).toEqual(validEvent);
    });
  });

  describe('ChatMessageEventSchema', () => {
    it('should validate chat message event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'CHAT_MESSAGE' as const,
        message: {
          id: 'msg-1',
          userId: 'user-1',
          content: 'Hello everyone!',
          type: 'party' as const,
          timestamp: Date.now(),
        },
      };
      expect(ChatMessageEventSchema.parse(validEvent)).toEqual(validEvent);
    });
  });

  describe('InitiativeUpdatedEventSchema', () => {
    it('should validate initiative updated event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'INITIATIVE_UPDATED' as const,
        order: [
          {
            entityId: 'entity-1',
            entityType: 'playerCharacter' as const,
            initiative: 18,
            userId: 'user-1',
          },
          {
            entityId: 'entity-2',
            entityType: 'monster' as const,
            initiative: 12,
          },
        ],
      };
      expect(InitiativeUpdatedEventSchema.parse(validEvent)).toEqual(validEvent);
    });
  });

  describe('InteractionPausedEventSchema', () => {
    it('should validate interaction paused event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'INTERACTION_PAUSED' as const,
        reason: 'DM requested pause',
      };
      expect(InteractionPausedEventSchema.parse(validEvent)).toEqual(validEvent);
    });
  });

  describe('InteractionResumedEventSchema', () => {
    it('should validate interaction resumed event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'INTERACTION_RESUMED' as const,
      };
      expect(InteractionResumedEventSchema.parse(validEvent)).toEqual(validEvent);
    });
  });

  describe('ErrorEventSchema', () => {
    it('should validate error event', () => {
      const validEvent = {
        ...baseEventProps,
        type: 'ERROR' as const,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Connection lost',
          details: { retryAfter: 5000 },
        },
      };
      expect(ErrorEventSchema.parse(validEvent)).toEqual(validEvent);
    });
  });

  describe('GameEventSchema', () => {
    it('should validate different event types', () => {
      const participantJoined = {
        ...baseEventProps,
        type: 'PARTICIPANT_JOINED' as const,
        userId: 'user-1',
        entityId: 'entity-1',
      };

      const turnStarted = {
        ...baseEventProps,
        type: 'TURN_STARTED' as const,
        entityId: 'entity-1',
        timeLimit: 90,
      };

      const chatMessage = {
        ...baseEventProps,
        type: 'CHAT_MESSAGE' as const,
        message: {
          id: 'msg-1',
          userId: 'user-1',
          content: 'Test message',
          type: 'party' as const,
          timestamp: Date.now(),
        },
      };

      expect(GameEventSchema.parse(participantJoined)).toEqual(participantJoined);
      expect(GameEventSchema.parse(turnStarted)).toEqual(turnStarted);
      expect(GameEventSchema.parse(chatMessage)).toEqual(chatMessage);
    });

    it('should reject invalid event structure', () => {
      expect(() => GameEventSchema.parse({
        ...baseEventProps,
        type: 'PARTICIPANT_JOINED',
        // Missing required userId and entityId
      })).toThrow();
    });

    it('should reject unknown event type', () => {
      expect(() => GameEventSchema.parse({
        ...baseEventProps,
        type: 'UNKNOWN_EVENT',
        data: {},
      })).toThrow();
    });
  });

  describe('ValidationResultSchema', () => {
    it('should validate successful validation result', () => {
      const validResult = {
        valid: true,
        errors: [],
      };
      expect(ValidationResultSchema.parse(validResult)).toEqual(validResult);
    });

    it('should validate failed validation result', () => {
      const invalidResult = {
        valid: false,
        errors: ['Field is required', 'Invalid format'],
        warnings: ['Deprecated field used'],
      };
      expect(ValidationResultSchema.parse(invalidResult)).toEqual(invalidResult);
    });

    it('should validate result without warnings', () => {
      const resultWithoutWarnings = {
        valid: false,
        errors: ['Validation failed'],
      };
      expect(ValidationResultSchema.parse(resultWithoutWarnings)).toEqual(resultWithoutWarnings);
    });
  });
});