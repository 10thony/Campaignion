/**
 * Zod schemas for game events
 */

import { z } from 'zod';
import { TurnActionSchema, ChatMessageSchema, InitiativeEntrySchema, StateDeltaSchema, GameErrorSchema } from './core';

// Base event properties that all events should have
const BaseEventSchema = z.object({
  timestamp: z.number(),
  interactionId: z.string(),
});

// Game Event schemas
export const ParticipantJoinedEventSchema = BaseEventSchema.extend({
  type: z.literal('PARTICIPANT_JOINED'),
  userId: z.string(),
  entityId: z.string(),
});

export const ParticipantLeftEventSchema = BaseEventSchema.extend({
  type: z.literal('PARTICIPANT_LEFT'),
  userId: z.string(),
});

export const TurnStartedEventSchema = BaseEventSchema.extend({
  type: z.literal('TURN_STARTED'),
  entityId: z.string(),
  timeLimit: z.number().min(0),
});

export const TurnCompletedEventSchema = BaseEventSchema.extend({
  type: z.literal('TURN_COMPLETED'),
  entityId: z.string(),
  actions: z.array(TurnActionSchema),
});

export const TurnSkippedEventSchema = BaseEventSchema.extend({
  type: z.literal('TURN_SKIPPED'),
  entityId: z.string(),
  reason: z.string(),
});

export const TurnBacktrackedEventSchema = BaseEventSchema.extend({
  type: z.literal('TURN_BACKTRACKED'),
  targetTurn: z.number(),
  targetRound: z.number(),
  removedTurns: z.number(),
  dmUserId: z.string(),
});

export const StateDeltaEventSchema = BaseEventSchema.extend({
  type: z.literal('STATE_DELTA'),
  changes: StateDeltaSchema,
});

export const ChatMessageEventSchema = BaseEventSchema.extend({
  type: z.literal('CHAT_MESSAGE'),
  message: ChatMessageSchema,
});

export const InitiativeUpdatedEventSchema = BaseEventSchema.extend({
  type: z.literal('INITIATIVE_UPDATED'),
  order: z.array(InitiativeEntrySchema),
});

export const InteractionPausedEventSchema = BaseEventSchema.extend({
  type: z.literal('INTERACTION_PAUSED'),
  reason: z.string(),
});

export const InteractionResumedEventSchema = BaseEventSchema.extend({
  type: z.literal('INTERACTION_RESUMED'),
});

export const PlayerDisconnectedEventSchema = BaseEventSchema.extend({
  type: z.literal('PLAYER_DISCONNECTED'),
  userId: z.string(),
  interactionId: z.string(),
  reason: z.string(),
});

export const PlayerReconnectedEventSchema = BaseEventSchema.extend({
  type: z.literal('PLAYER_RECONNECTED'),
  userId: z.string(),
  interactionId: z.string(),
  connectionId: z.string(),
});

export const DmDisconnectedEventSchema = BaseEventSchema.extend({
  type: z.literal('DM_DISCONNECTED'),
  userId: z.string(),
  interactionId: z.string(),
  reason: z.string(),
});

export const DmReconnectedEventSchema = BaseEventSchema.extend({
  type: z.literal('DM_RECONNECTED'),
  userId: z.string(),
  interactionId: z.string(),
  connectionId: z.string(),
});

export const ErrorEventSchema = BaseEventSchema.extend({
  type: z.literal('ERROR'),
  error: GameErrorSchema,
});

// Union type for all game events
export const GameEventSchema = z.discriminatedUnion('type', [
  ParticipantJoinedEventSchema,
  ParticipantLeftEventSchema,
  TurnStartedEventSchema,
  TurnCompletedEventSchema,
  TurnSkippedEventSchema,
  TurnBacktrackedEventSchema,
  StateDeltaEventSchema,
  ChatMessageEventSchema,
  InitiativeUpdatedEventSchema,
  InteractionPausedEventSchema,
  InteractionResumedEventSchema,
  PlayerDisconnectedEventSchema,
  PlayerReconnectedEventSchema,
  DmDisconnectedEventSchema,
  DmReconnectedEventSchema,
  ErrorEventSchema,
]);

// Event subscription options schema
export const EventSubscriptionOptionsSchema = z.object({
  interactionId: z.string(),
  onEvent: z.function().optional(),
  onError: z.function().optional(),
  onConnect: z.function().optional(),
  onDisconnect: z.function().optional(),
});