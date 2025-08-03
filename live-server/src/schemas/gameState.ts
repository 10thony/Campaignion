import { z } from 'zod';

// Position schema
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Status Effect schema
export const StatusEffectSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(),
  effects: z.record(z.any()),
});

// Inventory Item schema
export const InventoryItemSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  quantity: z.number().min(0),
  properties: z.record(z.any()),
});

// Inventory State schema
export const InventoryStateSchema = z.object({
  items: z.array(InventoryItemSchema),
  equippedItems: z.record(z.string()),
  capacity: z.number().min(0),
});

// Action Requirement schema
export const ActionRequirementSchema = z.object({
  type: z.string(),
  value: z.any(),
  met: z.boolean(),
});

// Action schema
export const ActionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['move', 'attack', 'useItem', 'cast', 'interact']),
  available: z.boolean(),
  requirements: z.array(ActionRequirementSchema),
});

// Participant State schema
export const ParticipantStateSchema = z.object({
  entityId: z.string(),
  entityType: z.enum(['playerCharacter', 'npc', 'monster']),
  userId: z.string().optional(),
  currentHP: z.number().min(0),
  maxHP: z.number().min(1),
  position: PositionSchema,
  conditions: z.array(StatusEffectSchema),
  inventory: InventoryStateSchema,
  availableActions: z.array(ActionSchema),
  turnStatus: z.enum(['waiting', 'active', 'completed', 'skipped']),
}).refine((data) => data.currentHP <= data.maxHP, {
  message: "Current HP cannot exceed max HP",
  path: ["currentHP"],
});

// Initiative Entry schema
export const InitiativeEntrySchema = z.object({
  entityId: z.string(),
  entityType: z.enum(['playerCharacter', 'npc', 'monster']),
  initiative: z.number(),
  userId: z.string().optional(),
});

// Entity Position schema
export const EntityPositionSchema = z.object({
  entityId: z.string(),
  position: PositionSchema,
  facing: z.number().optional(),
});

// Terrain Tile schema
export const TerrainTileSchema = z.object({
  position: PositionSchema,
  type: z.string(),
  properties: z.record(z.any()),
});

// Map State schema
export const MapStateSchema = z.object({
  width: z.number().min(1),
  height: z.number().min(1),
  entities: z.record(EntityPositionSchema),
  obstacles: z.array(PositionSchema),
  terrain: z.array(TerrainTileSchema),
});

// Turn Action schema
export const TurnActionSchema = z.object({
  type: z.enum(['move', 'attack', 'useItem', 'cast', 'interact', 'end']),
  entityId: z.string(),
  target: z.string().optional(),
  position: PositionSchema.optional(),
  itemId: z.string().optional(),
  spellId: z.string().optional(),
  actionId: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

// Turn Record schema
export const TurnRecordSchema = z.object({
  entityId: z.string(),
  turnNumber: z.number().min(1),
  roundNumber: z.number().min(1),
  actions: z.array(TurnActionSchema),
  startTime: z.date(),
  endTime: z.date().optional(),
  status: z.enum(['completed', 'skipped', 'timeout']),
});

// Chat Message schema
export const ChatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  entityId: z.string().optional(),
  content: z.string().min(1).max(1000),
  type: z.enum(['party', 'dm', 'private', 'system']),
  recipients: z.array(z.string()).optional(),
  timestamp: z.number(),
});

// Game State schema
export const GameStateSchema = z.object({
  interactionId: z.string(),
  status: z.enum(['waiting', 'active', 'paused', 'completed']),
  initiativeOrder: z.array(InitiativeEntrySchema),
  currentTurnIndex: z.number().min(0),
  roundNumber: z.number().min(1),
  participants: z.record(ParticipantStateSchema),
  mapState: MapStateSchema,
  turnHistory: z.array(TurnRecordSchema),
  chatLog: z.array(ChatMessageSchema),
  timestamp: z.date(),
}).refine((data) => {
  // Validate that currentTurnIndex is within bounds of initiativeOrder
  return data.currentTurnIndex < data.initiativeOrder.length || data.initiativeOrder.length === 0;
}, {
  message: "Current turn index must be within initiative order bounds",
  path: ["currentTurnIndex"],
});

// Export type inference helpers
export type Position = z.infer<typeof PositionSchema>;
export type StatusEffect = z.infer<typeof StatusEffectSchema>;
export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type InventoryState = z.infer<typeof InventoryStateSchema>;
export type ActionRequirement = z.infer<typeof ActionRequirementSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type ParticipantState = z.infer<typeof ParticipantStateSchema>;
export type InitiativeEntry = z.infer<typeof InitiativeEntrySchema>;
export type EntityPosition = z.infer<typeof EntityPositionSchema>;
export type TerrainTile = z.infer<typeof TerrainTileSchema>;
export type MapState = z.infer<typeof MapStateSchema>;
export type TurnAction = z.infer<typeof TurnActionSchema>;
export type TurnRecord = z.infer<typeof TurnRecordSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type GameState = z.infer<typeof GameStateSchema>;