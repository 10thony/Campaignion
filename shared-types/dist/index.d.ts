/**
 * Main entry point for the shared types package
 * Provides a single import point for all shared types and schemas
 */
export * from './types';
export * from './schemas';
export type { GameState, ParticipantState, TurnAction, ChatMessage, GameEvent, ValidationResult, RouterInputs, RouterOutputs, LiveInteractionRouter, TestModeRouter, AppRouterInterface, JoinRoomInput, LeaveRoomInput, PauseInteractionInput, ResumeInteractionInput, SkipTurnInput, BacktrackTurnInput, RoomUpdatesInput, GetRoomStateInput, SendChatMessageInput, GetChatHistoryInput, TestModeInput, HealthOutput, JoinRoomOutput, LeaveRoomOutput, PauseInteractionOutput, ResumeInteractionOutput, TakeTurnOutput, SkipTurnOutput, BacktrackTurnOutput, GetRoomStateOutput, SendChatMessageOutput, GetChatHistoryOutput, TestModeOutput, ConnectionStatus, ApiResponse, ApiError, AuthContext, UserPermissions, RoomStats, RoomMetadata, EntityType, TurnStatus, GameStatus, RoomStatus, ChatType, ActionType, } from './types';
export { GameStateSchema, ParticipantStateSchema, TurnActionSchema, ChatMessageSchema, GameEventSchema, ValidationResultSchema, JoinRoomInputSchema, JoinRoomOutputSchema, TakeTurnOutputSchema, GetRoomStateOutputSchema, ConnectionStatusSchema, ApiResponseSchema, ApiErrorSchema, AuthContextSchema, UserPermissionsSchema, validateWithSchema, safeParse, validateArray, } from './schemas';
export type { AppRouter } from './router-type';
export declare const PACKAGE_VERSION = "1.0.0";
export declare const PACKAGE_NAME = "@campaignion/shared-types";
export { isPlayerCharacter, isNPC, isMonster, isActiveGame, isPausedGame, isCompletedGame, createPosition, isValidPosition, createChatMessage, createTurnAction, } from './types';
export { validateRouterInput, validateRouterOutput, } from './schemas/router';
export { isApiError, isRateLimitError, isWebSocketMessage, } from './types/api';
//# sourceMappingURL=index.d.ts.map