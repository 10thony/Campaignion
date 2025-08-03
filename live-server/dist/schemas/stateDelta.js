"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchDeltaSchema = exports.TypedStateDeltaSchema = exports.ChatDeltaSchema = exports.InitiativeDeltaSchema = exports.MapDeltaSchema = exports.TurnDeltaSchema = exports.ParticipantDeltaSchema = exports.StateDeltaSchema = void 0;
const zod_1 = require("zod");
const gameState_1 = require("./gameState");
exports.StateDeltaSchema = zod_1.z.object({
    type: zod_1.z.enum(['participant', 'turn', 'map', 'initiative', 'chat']),
    changes: zod_1.z.record(zod_1.z.any()),
    timestamp: zod_1.z.number(),
});
exports.ParticipantDeltaSchema = zod_1.z.object({
    type: zod_1.z.literal('participant'),
    changes: zod_1.z.object({
        entityId: zod_1.z.string(),
        updates: zod_1.z.object({
            currentHP: zod_1.z.number().optional(),
            maxHP: zod_1.z.number().optional(),
            position: gameState_1.PositionSchema.optional(),
            conditions: zod_1.z.array(zod_1.z.any()).optional(),
            inventory: zod_1.z.any().optional(),
            availableActions: zod_1.z.array(zod_1.z.any()).optional(),
            turnStatus: zod_1.z.enum(['waiting', 'active', 'completed', 'skipped']).optional(),
        }),
    }),
    timestamp: zod_1.z.number(),
});
exports.TurnDeltaSchema = zod_1.z.object({
    type: zod_1.z.literal('turn'),
    changes: zod_1.z.object({
        currentTurnIndex: zod_1.z.number().optional(),
        roundNumber: zod_1.z.number().optional(),
        turnStatus: zod_1.z.enum(['waiting', 'active', 'completed', 'skipped']).optional(),
        activeEntityId: zod_1.z.string().optional(),
        timeRemaining: zod_1.z.number().optional(),
    }),
    timestamp: zod_1.z.number(),
});
exports.MapDeltaSchema = zod_1.z.object({
    type: zod_1.z.literal('map'),
    changes: zod_1.z.object({
        entityPositions: zod_1.z.record(gameState_1.PositionSchema).optional(),
        newObstacles: zod_1.z.array(gameState_1.PositionSchema).optional(),
        removedObstacles: zod_1.z.array(gameState_1.PositionSchema).optional(),
        terrainChanges: zod_1.z.array(zod_1.z.object({
            position: gameState_1.PositionSchema,
            type: zod_1.z.string(),
            properties: zod_1.z.record(zod_1.z.any()),
        })).optional(),
    }),
    timestamp: zod_1.z.number(),
});
exports.InitiativeDeltaSchema = zod_1.z.object({
    type: zod_1.z.literal('initiative'),
    changes: zod_1.z.object({
        order: zod_1.z.array(gameState_1.InitiativeEntrySchema).optional(),
        currentTurnIndex: zod_1.z.number().optional(),
        addedEntries: zod_1.z.array(gameState_1.InitiativeEntrySchema).optional(),
        removedEntries: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    timestamp: zod_1.z.number(),
});
exports.ChatDeltaSchema = zod_1.z.object({
    type: zod_1.z.literal('chat'),
    changes: zod_1.z.object({
        newMessage: gameState_1.ChatMessageSchema.optional(),
        deletedMessageId: zod_1.z.string().optional(),
        editedMessage: zod_1.z.object({
            id: zod_1.z.string(),
            content: zod_1.z.string(),
        }).optional(),
    }),
    timestamp: zod_1.z.number(),
});
exports.TypedStateDeltaSchema = zod_1.z.discriminatedUnion('type', [
    exports.ParticipantDeltaSchema,
    exports.TurnDeltaSchema,
    exports.MapDeltaSchema,
    exports.InitiativeDeltaSchema,
    exports.ChatDeltaSchema,
]);
exports.BatchDeltaSchema = zod_1.z.object({
    deltas: zod_1.z.array(exports.TypedStateDeltaSchema),
    timestamp: zod_1.z.number(),
    batchId: zod_1.z.string(),
});
//# sourceMappingURL=stateDelta.js.map