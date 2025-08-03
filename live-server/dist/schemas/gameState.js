"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateSchema = exports.ChatMessageSchema = exports.TurnRecordSchema = exports.TurnActionSchema = exports.MapStateSchema = exports.TerrainTileSchema = exports.EntityPositionSchema = exports.InitiativeEntrySchema = exports.ParticipantStateSchema = exports.ActionSchema = exports.ActionRequirementSchema = exports.InventoryStateSchema = exports.InventoryItemSchema = exports.StatusEffectSchema = exports.PositionSchema = void 0;
const zod_1 = require("zod");
exports.PositionSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number(),
});
exports.StatusEffectSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    duration: zod_1.z.number(),
    effects: zod_1.z.record(zod_1.z.any()),
});
exports.InventoryItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    itemId: zod_1.z.string(),
    quantity: zod_1.z.number().min(0),
    properties: zod_1.z.record(zod_1.z.any()),
});
exports.InventoryStateSchema = zod_1.z.object({
    items: zod_1.z.array(exports.InventoryItemSchema),
    equippedItems: zod_1.z.record(zod_1.z.string()),
    capacity: zod_1.z.number().min(0),
});
exports.ActionRequirementSchema = zod_1.z.object({
    type: zod_1.z.string(),
    value: zod_1.z.any(),
    met: zod_1.z.boolean(),
});
exports.ActionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.enum(['move', 'attack', 'useItem', 'cast', 'interact']),
    available: zod_1.z.boolean(),
    requirements: zod_1.z.array(exports.ActionRequirementSchema),
});
exports.ParticipantStateSchema = zod_1.z.object({
    entityId: zod_1.z.string(),
    entityType: zod_1.z.enum(['playerCharacter', 'npc', 'monster']),
    userId: zod_1.z.string().optional(),
    currentHP: zod_1.z.number().min(0),
    maxHP: zod_1.z.number().min(1),
    position: exports.PositionSchema,
    conditions: zod_1.z.array(exports.StatusEffectSchema),
    inventory: exports.InventoryStateSchema,
    availableActions: zod_1.z.array(exports.ActionSchema),
    turnStatus: zod_1.z.enum(['waiting', 'active', 'completed', 'skipped']),
}).refine((data) => data.currentHP <= data.maxHP, {
    message: "Current HP cannot exceed max HP",
    path: ["currentHP"],
});
exports.InitiativeEntrySchema = zod_1.z.object({
    entityId: zod_1.z.string(),
    entityType: zod_1.z.enum(['playerCharacter', 'npc', 'monster']),
    initiative: zod_1.z.number(),
    userId: zod_1.z.string().optional(),
});
exports.EntityPositionSchema = zod_1.z.object({
    entityId: zod_1.z.string(),
    position: exports.PositionSchema,
    facing: zod_1.z.number().optional(),
});
exports.TerrainTileSchema = zod_1.z.object({
    position: exports.PositionSchema,
    type: zod_1.z.string(),
    properties: zod_1.z.record(zod_1.z.any()),
});
exports.MapStateSchema = zod_1.z.object({
    width: zod_1.z.number().min(1),
    height: zod_1.z.number().min(1),
    entities: zod_1.z.record(exports.EntityPositionSchema),
    obstacles: zod_1.z.array(exports.PositionSchema),
    terrain: zod_1.z.array(exports.TerrainTileSchema),
});
exports.TurnActionSchema = zod_1.z.object({
    type: zod_1.z.enum(['move', 'attack', 'useItem', 'cast', 'interact', 'end']),
    entityId: zod_1.z.string(),
    target: zod_1.z.string().optional(),
    position: exports.PositionSchema.optional(),
    itemId: zod_1.z.string().optional(),
    spellId: zod_1.z.string().optional(),
    actionId: zod_1.z.string().optional(),
    parameters: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.TurnRecordSchema = zod_1.z.object({
    entityId: zod_1.z.string(),
    turnNumber: zod_1.z.number().min(1),
    roundNumber: zod_1.z.number().min(1),
    actions: zod_1.z.array(exports.TurnActionSchema),
    startTime: zod_1.z.date(),
    endTime: zod_1.z.date().optional(),
    status: zod_1.z.enum(['completed', 'skipped', 'timeout']),
});
exports.ChatMessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    entityId: zod_1.z.string().optional(),
    content: zod_1.z.string().min(1).max(1000),
    type: zod_1.z.enum(['party', 'dm', 'private', 'system']),
    recipients: zod_1.z.array(zod_1.z.string()).optional(),
    timestamp: zod_1.z.number(),
});
exports.GameStateSchema = zod_1.z.object({
    interactionId: zod_1.z.string(),
    status: zod_1.z.enum(['waiting', 'active', 'paused', 'completed']),
    initiativeOrder: zod_1.z.array(exports.InitiativeEntrySchema),
    currentTurnIndex: zod_1.z.number().min(0),
    roundNumber: zod_1.z.number().min(1),
    participants: zod_1.z.record(exports.ParticipantStateSchema),
    mapState: exports.MapStateSchema,
    turnHistory: zod_1.z.array(exports.TurnRecordSchema),
    chatLog: zod_1.z.array(exports.ChatMessageSchema),
    timestamp: zod_1.z.date(),
}).refine((data) => {
    return data.currentTurnIndex < data.initiativeOrder.length || data.initiativeOrder.length === 0;
}, {
    message: "Current turn index must be within initiative order bounds",
    path: ["currentTurnIndex"],
});
//# sourceMappingURL=gameState.js.map