import { z } from 'zod';
import { ParticipantStateSchema, InitiativeEntrySchema, ChatMessageSchema, PositionSchema } from './gameState';

// Base State Delta schema
export const StateDeltaSchema = z.object({
  type: z.enum(['participant', 'turn', 'map', 'initiative', 'chat']),
  changes: z.record(z.any()),
  timestamp: z.number(),
});

// Participant Delta schema - for participant state changes
export const ParticipantDeltaSchema = z.object({
  type: z.literal('participant'),
  changes: z.object({
    entityId: z.string(),
    updates: z.object({
      currentHP: z.number().optional(),
      maxHP: z.number().optional(),
      position: PositionSchema.optional(),
      conditions: z.array(z.any()).optional(),
      inventory: z.any().optional(),
      availableActions: z.array(z.any()).optional(),
      turnStatus: z.enum(['waiting', 'active', 'completed', 'skipped']).optional(),
    }),
  }),
  timestamp: z.number(),
});

// Turn Delta schema - for turn progression changes
export const TurnDeltaSchema = z.object({
  type: z.literal('turn'),
  changes: z.object({
    currentTurnIndex: z.number().optional(),
    roundNumber: z.number().optional(),
    turnStatus: z.enum(['waiting', 'active', 'completed', 'skipped']).optional(),
    activeEntityId: z.string().optional(),
    timeRemaining: z.number().optional(),
  }),
  timestamp: z.number(),
});

// Map Delta schema - for map state changes
export const MapDeltaSchema = z.object({
  type: z.literal('map'),
  changes: z.object({
    entityPositions: z.record(PositionSchema).optional(),
    newObstacles: z.array(PositionSchema).optional(),
    removedObstacles: z.array(PositionSchema).optional(),
    terrainChanges: z.array(z.object({
      position: PositionSchema,
      type: z.string(),
      properties: z.record(z.any()),
    })).optional(),
  }),
  timestamp: z.number(),
});

// Initiative Delta schema - for initiative order changes
export const InitiativeDeltaSchema = z.object({
  type: z.literal('initiative'),
  changes: z.object({
    order: z.array(InitiativeEntrySchema).optional(),
    currentTurnIndex: z.number().optional(),
    addedEntries: z.array(InitiativeEntrySchema).optional(),
    removedEntries: z.array(z.string()).optional(), // entity IDs
  }),
  timestamp: z.number(),
});

// Chat Delta schema - for chat message changes
export const ChatDeltaSchema = z.object({
  type: z.literal('chat'),
  changes: z.object({
    newMessage: ChatMessageSchema.optional(),
    deletedMessageId: z.string().optional(),
    editedMessage: z.object({
      id: z.string(),
      content: z.string(),
    }).optional(),
  }),
  timestamp: z.number(),
});

// Union type for all delta types
export const TypedStateDeltaSchema = z.discriminatedUnion('type', [
  ParticipantDeltaSchema,
  TurnDeltaSchema,
  MapDeltaSchema,
  InitiativeDeltaSchema,
  ChatDeltaSchema,
]);

// Batch Delta schema - for multiple changes at once
export const BatchDeltaSchema = z.object({
  deltas: z.array(TypedStateDeltaSchema),
  timestamp: z.number(),
  batchId: z.string(),
});

// Export type inference helpers
export type StateDelta = z.infer<typeof StateDeltaSchema>;
export type ParticipantDelta = z.infer<typeof ParticipantDeltaSchema>;
export type TurnDelta = z.infer<typeof TurnDeltaSchema>;
export type MapDelta = z.infer<typeof MapDeltaSchema>;
export type InitiativeDelta = z.infer<typeof InitiativeDeltaSchema>;
export type ChatDelta = z.infer<typeof ChatDeltaSchema>;
export type TypedStateDelta = z.infer<typeof TypedStateDeltaSchema>;
export type BatchDelta = z.infer<typeof BatchDeltaSchema>;