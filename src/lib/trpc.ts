import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

// Import shared types for data structures
import type {
  GameState,
  ChatMessage,
  TurnAction,
  ValidationResult,
  GameEvent,
  ConnectionStatus,
} from '@campaignion/shared-types';

// For now, use a generic router type until the live server is properly connected
// The actual AppRouter type will be imported from the live server when it's available
// This is a placeholder that matches the expected tRPC router structure
export type AppRouter = any;

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Create query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Helper function to get auth token
const getAuthToken = async () => {
  // This will be called from within React components where useAuth is available
  // For now, we'll get it from localStorage as a fallback
  const token = localStorage.getItem('clerk-token');
  return token ? `Bearer ${token}` : '';
};

// Create tRPC client factory function
export const createTRPCClient = (getToken: () => Promise<string>) => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:3001/trpc',
        headers: async () => ({
          authorization: await getToken(),
        }),
      }),
    ],
  });
};

// Default client for backwards compatibility
export const trpcClient = createTRPCClient(getAuthToken);

// Type helpers - use shared types for better type safety
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Re-export shared router input/output types for convenience
export type {
  // Router interface types
  LiveInteractionRouter,
  TestModeRouter,
  AppRouterInterface,

  // Input types
  JoinRoomInput,
  LeaveRoomInput,
  PauseInteractionInput,
  ResumeInteractionInput,
  SkipTurnInput,
  BacktrackTurnInput,
  GetRoomStateInput,
  SendChatMessageInput,
  GetChatHistoryInput,
  RoomUpdatesInput,
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

  // Core types
  GameState,
  ChatMessage,
  TurnAction,
  ValidationResult,
  GameEvent,
  ConnectionStatus,
} from '@campaignion/shared-types';