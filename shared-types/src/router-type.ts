/**
 * Router type export for client consumption
 * This file is designed to be re-exported by the live server with the actual router type
 */

// This is a placeholder that will be replaced by the actual router type from the live server
// The live server should re-export this with the actual AppRouter type
export type AppRouter = any;

// Re-export shared router interface types for convenience
export type {
  LiveInteractionRouter,
  TestModeRouter,
  AppRouterInterface,
  RouterInputs,
  RouterOutputs,
  
  // Input types
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
  
  // Output types
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
} from './types/router-interface';