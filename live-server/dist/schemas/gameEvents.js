"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEventSchema = exports.ErrorEventSchema = exports.DmReconnectedEventSchema = exports.DmDisconnectedEventSchema = exports.PlayerReconnectedEventSchema = exports.PlayerDisconnectedEventSchema = exports.InteractionResumedEventSchema = exports.InteractionPausedEventSchema = exports.InitiativeUpdatedEventSchema = exports.ChatMessageEventSchema = exports.StateDeltaEventSchema = exports.TurnBacktrackedEventSchema = exports.TurnSkippedEventSchema = exports.TurnCompletedEventSchema = exports.TurnStartedEventSchema = exports.ParticipantLeftEventSchema = exports.ParticipantJoinedEventSchema = exports.StateDeltaSchema = exports.ValidationResultSchema = exports.GameErrorSchema = void 0;
const zod_1 = require("zod");
const gameState_1 = require("./gameState");
exports.GameErrorSchema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string(),
    details: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.ValidationResultSchema = zod_1.z.object({
    valid: zod_1.z.boolean(),
    errors: zod_1.z.array(zod_1.z.string()),
    warnings: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.StateDeltaSchema = zod_1.z.object({
    type: zod_1.z.enum(['participant', 'turn', 'map', 'initiative', 'chat']),
    changes: zod_1.z.record(zod_1.z.any()),
    timestamp: zod_1.z.number(),
});
const BaseEventSchema = zod_1.z.object({
    timestamp: zod_1.z.number(),
    interactionId: zod_1.z.string(),
});
exports.ParticipantJoinedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('PARTICIPANT_JOINED'),
    userId: zod_1.z.string(),
    entityId: zod_1.z.string(),
});
exports.ParticipantLeftEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('PARTICIPANT_LEFT'),
    userId: zod_1.z.string(),
});
exports.TurnStartedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('TURN_STARTED'),
    entityId: zod_1.z.string(),
    timeLimit: zod_1.z.number().min(0),
});
exports.TurnCompletedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('TURN_COMPLETED'),
    entityId: zod_1.z.string(),
    actions: zod_1.z.array(gameState_1.TurnActionSchema),
});
exports.TurnSkippedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('TURN_SKIPPED'),
    entityId: zod_1.z.string(),
    reason: zod_1.z.string(),
});
exports.TurnBacktrackedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('TURN_BACKTRACKED'),
    targetTurn: zod_1.z.number(),
    targetRound: zod_1.z.number(),
    removedTurns: zod_1.z.number(),
    dmUserId: zod_1.z.string(),
});
exports.StateDeltaEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('STATE_DELTA'),
    changes: exports.StateDeltaSchema,
});
exports.ChatMessageEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('CHAT_MESSAGE'),
    message: gameState_1.ChatMessageSchema,
});
exports.InitiativeUpdatedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('INITIATIVE_UPDATED'),
    order: zod_1.z.array(gameState_1.InitiativeEntrySchema),
});
exports.InteractionPausedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('INTERACTION_PAUSED'),
    reason: zod_1.z.string(),
});
exports.InteractionResumedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('INTERACTION_RESUMED'),
});
exports.PlayerDisconnectedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('PLAYER_DISCONNECTED'),
    userId: zod_1.z.string(),
    interactionId: zod_1.z.string(),
    reason: zod_1.z.string(),
});
exports.PlayerReconnectedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('PLAYER_RECONNECTED'),
    userId: zod_1.z.string(),
    interactionId: zod_1.z.string(),
    connectionId: zod_1.z.string(),
});
exports.DmDisconnectedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('DM_DISCONNECTED'),
    userId: zod_1.z.string(),
    interactionId: zod_1.z.string(),
    reason: zod_1.z.string(),
});
exports.DmReconnectedEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('DM_RECONNECTED'),
    userId: zod_1.z.string(),
    interactionId: zod_1.z.string(),
    connectionId: zod_1.z.string(),
});
exports.ErrorEventSchema = BaseEventSchema.extend({
    type: zod_1.z.literal('ERROR'),
    error: exports.GameErrorSchema,
});
exports.GameEventSchema = zod_1.z.discriminatedUnion('type', [
    exports.ParticipantJoinedEventSchema,
    exports.ParticipantLeftEventSchema,
    exports.TurnStartedEventSchema,
    exports.TurnCompletedEventSchema,
    exports.TurnSkippedEventSchema,
    exports.TurnBacktrackedEventSchema,
    exports.StateDeltaEventSchema,
    exports.ChatMessageEventSchema,
    exports.InitiativeUpdatedEventSchema,
    exports.InteractionPausedEventSchema,
    exports.InteractionResumedEventSchema,
    exports.PlayerDisconnectedEventSchema,
    exports.PlayerReconnectedEventSchema,
    exports.DmDisconnectedEventSchema,
    exports.DmReconnectedEventSchema,
    exports.ErrorEventSchema,
]);
//# sourceMappingURL=gameEvents.js.map