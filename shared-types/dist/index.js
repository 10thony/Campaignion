/**
 * Main entry point for the shared types package
 * Provides a single import point for all shared types and schemas
 */
// Export all types
export * from './types';
// Export all schemas
export * from './schemas';
// Re-export commonly used schemas for convenience
export { 
// Core schemas
GameStateSchema, ParticipantStateSchema, TurnActionSchema, ChatMessageSchema, GameEventSchema, ValidationResultSchema, 
// Router schemas
JoinRoomInputSchema, JoinRoomOutputSchema, TakeTurnOutputSchema, GetRoomStateOutputSchema, 
// API schemas
ConnectionStatusSchema, ApiResponseSchema, ApiErrorSchema, AuthContextSchema, UserPermissionsSchema, 
// Validation utilities
validateWithSchema, safeParse, validateArray, } from './schemas';
// Package metadata
export const PACKAGE_VERSION = '1.0.0';
export const PACKAGE_NAME = '@campaignion/shared-types';
// Type guards and utilities (re-exported from types)
export { isPlayerCharacter, isNPC, isMonster, isActiveGame, isPausedGame, isCompletedGame, createPosition, isValidPosition, createChatMessage, createTurnAction, } from './types';
// Schema validation utilities (re-exported from schemas)
export { validateRouterInput, validateRouterOutput, } from './schemas/router';
// API type guards (re-exported from types)
export { isApiError, isRateLimitError, isWebSocketMessage, } from './types/api';
