/**
 * Zod schemas for tRPC router input/output validation
 * These schemas provide runtime validation for API calls
 */
import { z } from 'zod';
import { TurnActionSchema, GameStateSchema, ChatMessageSchema, ValidationResultSchema } from './core';
import { GameEventSchema } from './events';
// Input schemas
export const JoinRoomInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
    entityId: z.string().min(1, 'Entity ID is required'),
    entityType: z.enum(['playerCharacter', 'npc', 'monster']),
});
export const LeaveRoomInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
});
export const PauseInteractionInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
    reason: z.string().optional().default('Manual pause'),
});
export const ResumeInteractionInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
});
export const SkipTurnInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
    reason: z.string().optional().default('Manual skip'),
});
export const BacktrackTurnInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
    turnNumber: z.number().min(0, 'Turn number must be non-negative'),
    reason: z.string().optional().default('DM correction'),
});
export const RoomUpdatesInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
});
export const GetRoomStateInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
});
export const SendChatMessageInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
    content: z.string().min(1, 'Message content is required').max(1000, 'Message too long'),
    type: z.enum(['party', 'dm', 'private']),
    recipients: z.array(z.string()).optional(),
    entityId: z.string().optional(),
});
export const GetChatHistoryInputSchema = z.object({
    interactionId: z.string().min(1, 'Interaction ID is required'),
    channelType: z.enum(['party', 'dm', 'private', 'system']).optional(),
    limit: z.number().min(1).max(100).optional().default(50),
});
// Output schemas
export const HealthOutputSchema = z.object({
    status: z.string(),
    timestamp: z.string(),
    service: z.string(),
    stats: z.object({
        activeRooms: z.number(),
        totalParticipants: z.number(),
        uptime: z.number(),
    }),
});
export const JoinRoomOutputSchema = z.object({
    success: z.boolean(),
    roomId: z.string(),
    gameState: GameStateSchema,
    participantCount: z.number(),
});
export const LeaveRoomOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});
export const PauseInteractionOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    reason: z.string(),
});
export const ResumeInteractionOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});
export const TakeTurnOutputSchema = z.object({
    success: z.boolean(),
    result: ValidationResultSchema,
    gameState: GameStateSchema,
});
export const SkipTurnOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    gameState: GameStateSchema,
});
export const BacktrackTurnOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    turnNumber: z.number(),
    reason: z.string(),
});
export const GetRoomStateOutputSchema = z.object({
    success: z.boolean(),
    gameState: GameStateSchema,
    roomId: z.string(),
    participantCount: z.number(),
    status: z.string(),
});
export const SendChatMessageOutputSchema = z.object({
    success: z.boolean(),
    message: ChatMessageSchema,
});
export const GetChatHistoryOutputSchema = z.object({
    success: z.boolean(),
    messages: z.array(ChatMessageSchema),
    totalCount: z.number(),
});
// Test mode schemas (simplified)
export const TestModeInputSchema = z.record(z.any());
export const TestModeOutputSchema = z.record(z.any());
// Combined schemas for validation
export const RouterInputSchemas = {
    'interaction.health': z.void(),
    'interaction.joinRoom': JoinRoomInputSchema,
    'interaction.leaveRoom': LeaveRoomInputSchema,
    'interaction.pauseInteraction': PauseInteractionInputSchema,
    'interaction.resumeInteraction': ResumeInteractionInputSchema,
    'interaction.takeTurn': TurnActionSchema,
    'interaction.skipTurn': SkipTurnInputSchema,
    'interaction.backtrackTurn': BacktrackTurnInputSchema,
    'interaction.roomUpdates': RoomUpdatesInputSchema,
    'interaction.getRoomState': GetRoomStateInputSchema,
    'interaction.sendChatMessage': SendChatMessageInputSchema,
    'interaction.getChatHistory': GetChatHistoryInputSchema,
    'testMode.createTestInteraction': TestModeInputSchema,
    'testMode.simulateActions': TestModeInputSchema,
    'testMode.getTestStats': z.void(),
};
export const RouterOutputSchemas = {
    'interaction.health': HealthOutputSchema,
    'interaction.joinRoom': JoinRoomOutputSchema,
    'interaction.leaveRoom': LeaveRoomOutputSchema,
    'interaction.pauseInteraction': PauseInteractionOutputSchema,
    'interaction.resumeInteraction': ResumeInteractionOutputSchema,
    'interaction.takeTurn': TakeTurnOutputSchema,
    'interaction.skipTurn': SkipTurnOutputSchema,
    'interaction.backtrackTurn': BacktrackTurnOutputSchema,
    'interaction.roomUpdates': GameEventSchema,
    'interaction.getRoomState': GetRoomStateOutputSchema,
    'interaction.sendChatMessage': SendChatMessageOutputSchema,
    'interaction.getChatHistory': GetChatHistoryOutputSchema,
    'testMode.createTestInteraction': TestModeOutputSchema,
    'testMode.simulateActions': TestModeOutputSchema,
    'testMode.getTestStats': TestModeOutputSchema,
};
// Utility function to validate router inputs
export function validateRouterInput(procedure, input) {
    const schema = RouterInputSchemas[procedure];
    return schema.parse(input);
}
// Utility function to validate router outputs
export function validateRouterOutput(procedure, output) {
    const schema = RouterOutputSchemas[procedure];
    return schema.parse(output);
}
