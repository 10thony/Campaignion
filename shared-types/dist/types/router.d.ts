/**
 * tRPC Router type definitions for shared use between client and server
 * These types define the contract for the Live Interaction System API
 */
import type { GameState, ChatMessage, TurnAction, ValidationResult, EntityType, ChatType } from './core';
import type { GameEvent } from './events';
export interface JoinRoomInput {
    interactionId: string;
    entityId: string;
    entityType: EntityType;
}
export interface LeaveRoomInput {
    interactionId: string;
}
export interface PauseInteractionInput {
    interactionId: string;
    reason?: string;
}
export interface ResumeInteractionInput {
    interactionId: string;
}
export interface SkipTurnInput {
    interactionId: string;
    reason?: string;
}
export interface BacktrackTurnInput {
    interactionId: string;
    turnNumber: number;
    reason?: string;
}
export interface RoomUpdatesInput {
    interactionId: string;
}
export interface GetRoomStateInput {
    interactionId: string;
}
export interface SendChatMessageInput {
    interactionId: string;
    content: string;
    type: ChatType;
    recipients?: string[];
    entityId?: string;
}
export interface GetChatHistoryInput {
    interactionId: string;
    channelType?: ChatType | 'system';
    limit?: number;
}
export interface HealthOutput {
    status: string;
    timestamp: string;
    service: string;
    stats: {
        activeRooms: number;
        totalParticipants: number;
        uptime: number;
    };
}
export interface JoinRoomOutput {
    success: boolean;
    roomId: string;
    gameState: GameState;
    participantCount: number;
}
export interface LeaveRoomOutput {
    success: boolean;
    message: string;
}
export interface PauseInteractionOutput {
    success: boolean;
    message: string;
    reason: string;
}
export interface ResumeInteractionOutput {
    success: boolean;
    message: string;
}
export interface TakeTurnOutput {
    success: boolean;
    result: ValidationResult;
    gameState: GameState;
}
export interface SkipTurnOutput {
    success: boolean;
    message: string;
    gameState: GameState;
}
export interface BacktrackTurnOutput {
    success: boolean;
    message: string;
    turnNumber: number;
    reason: string;
}
export interface GetRoomStateOutput {
    success: boolean;
    gameState: GameState;
    roomId: string;
    participantCount: number;
    status: string;
}
export interface SendChatMessageOutput {
    success: boolean;
    message: ChatMessage;
}
export interface GetChatHistoryOutput {
    success: boolean;
    messages: ChatMessage[];
    totalCount: number;
}
export interface TestModeInput {
    [key: string]: any;
}
export interface TestModeOutput {
    [key: string]: any;
}
export interface AppRouterPlaceholder {
}
export type RouterInputs = {
    'interaction.health': never;
    'interaction.joinRoom': JoinRoomInput;
    'interaction.leaveRoom': LeaveRoomInput;
    'interaction.pauseInteraction': PauseInteractionInput;
    'interaction.resumeInteraction': ResumeInteractionInput;
    'interaction.takeTurn': TurnAction;
    'interaction.skipTurn': SkipTurnInput;
    'interaction.backtrackTurn': BacktrackTurnInput;
    'interaction.roomUpdates': RoomUpdatesInput;
    'interaction.getRoomState': GetRoomStateInput;
    'interaction.sendChatMessage': SendChatMessageInput;
    'interaction.getChatHistory': GetChatHistoryInput;
    'testMode.createTestInteraction': TestModeInput;
    'testMode.simulateActions': TestModeInput;
    'testMode.getTestStats': never;
};
export type RouterOutputs = {
    'interaction.health': HealthOutput;
    'interaction.joinRoom': JoinRoomOutput;
    'interaction.leaveRoom': LeaveRoomOutput;
    'interaction.pauseInteraction': PauseInteractionOutput;
    'interaction.resumeInteraction': ResumeInteractionOutput;
    'interaction.takeTurn': TakeTurnOutput;
    'interaction.skipTurn': SkipTurnOutput;
    'interaction.backtrackTurn': BacktrackTurnOutput;
    'interaction.roomUpdates': GameEvent;
    'interaction.getRoomState': GetRoomStateOutput;
    'interaction.sendChatMessage': SendChatMessageOutput;
    'interaction.getChatHistory': GetChatHistoryOutput;
    'testMode.createTestInteraction': TestModeOutput;
    'testMode.simulateActions': TestModeOutput;
    'testMode.getTestStats': TestModeOutput;
};
//# sourceMappingURL=router.d.ts.map