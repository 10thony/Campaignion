/**
 * Main entry point for the shared types package
 * Provides a single import point for all shared types and schemas
 */

// Export all types
export * from './types';

// Export all schemas
export * from './schemas';

// Re-export commonly used types for convenience
export type {
  // Core types
  GameState,
  ParticipantState,
  TurnAction,
  ChatMessage,
  GameEvent,
  ValidationResult,
  
  // Router types (input/output definitions only)
  RouterInputs,
  RouterOutputs,
  LiveInteractionRouter,
  TestModeRouter,
  AppRouterInterface,
  
  // Router input types
  JoinRoomInput,
  LeaveRoomInput,
  PauseInteractionInput,
  ResumeInteractionInput,
  SkipTurnInput,
  BacktrackTurnInput,
  RoomUpdatesInput,
  GetRoomStateInput,
  SendChatMessageInput,
  GetChatHistoryInput,
  TestModeInput,
  
  // Router output types
  HealthOutput,
  JoinRoomOutput,
  LeaveRoomOutput,
  PauseInteractionOutput,
  ResumeInteractionOutput,
  TakeTurnOutput,
  SkipTurnOutput,
  BacktrackTurnOutput,
  GetRoomStateOutput,
  SendChatMessageOutput,
  GetChatHistoryOutput,
  TestModeOutput,
  
  // API types
  ConnectionStatus,
  ApiResponse,
  ApiError,
  AuthContext,
  UserPermissions,
  RoomStats,
  RoomMetadata,
  
  // Utility types
  EntityType,
  TurnStatus,
  GameStatus,
  RoomStatus,
  ChatType,
  ActionType,
} from './types';

// Re-export commonly used schemas for convenience
export {
  // Core schemas
  GameStateSchema,
  ParticipantStateSchema,
  TurnActionSchema,
  ChatMessageSchema,
  GameEventSchema,
  ValidationResultSchema,
  
  // Router schemas
  JoinRoomInputSchema,
  JoinRoomOutputSchema,
  TakeTurnOutputSchema,
  GetRoomStateOutputSchema,
  
  // API schemas
  ConnectionStatusSchema,
  ApiResponseSchema,
  ApiErrorSchema,
  AuthContextSchema,
  UserPermissionsSchema,
  
  // Validation utilities
  validateWithSchema,
  safeParse,
  validateArray,
} from './schemas';

// Router type export (placeholder - should be overridden by live server)
export type { AppRouter } from './router-type';

// Package metadata
export const PACKAGE_VERSION = '1.0.0';
export const PACKAGE_NAME = '@campaignion/shared-types';

// Type guards and utilities (re-exported from types)
export {
  isPlayerCharacter,
  isNPC,
  isMonster,
  isActiveGame,
  isPausedGame,
  isCompletedGame,
  createPosition,
  isValidPosition,
  createChatMessage,
  createTurnAction,
} from './types';

// Schema validation utilities (re-exported from schemas)
export {
  validateRouterInput,
  validateRouterOutput,
} from './schemas/router';

// API type guards (re-exported from types)
export {
  isApiError,
  isRateLimitError,
  isWebSocketMessage,
} from './types/api';