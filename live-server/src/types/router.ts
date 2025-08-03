/**
 * Router type exports for shared types package
 * This file exports the actual tRPC router type for client consumption
 */

import type { appRouter } from '../routers';

// Export the actual router type for use by clients
export type AppRouter = typeof appRouter;

// Re-export shared router types for convenience
export type {
  LiveInteractionRouter,
  TestModeRouter,
  AppRouterInterface,
  RouterInputs as SharedRouterInputs,
  RouterOutputs as SharedRouterOutputs,
  JoinRoomInput,
  JoinRoomOutput,
  LeaveRoomInput,
  LeaveRoomOutput,
  PauseInteractionInput,
  PauseInteractionOutput,
  ResumeInteractionInput,
  ResumeInteractionOutput,
  TakeTurnOutput,
  SkipTurnInput,
  SkipTurnOutput,
  BacktrackTurnInput,
  BacktrackTurnOutput,
  GetRoomStateInput,
  GetRoomStateOutput,
  SendChatMessageInput,
  SendChatMessageOutput,
  GetChatHistoryInput,
  GetChatHistoryOutput,
  RoomUpdatesInput,
  HealthOutput,
  TestModeInput,
  TestModeOutput,
} from '@campaignion/shared-types';