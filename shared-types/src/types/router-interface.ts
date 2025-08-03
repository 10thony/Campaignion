/**
 * tRPC Router interface definitions for type safety
 * This file defines the contract between client and server without importing the actual router
 */

import type {
  GameState,
  ChatMessage,
  TurnAction,
  ValidationResult,
} from './core';
import type { GameEvent } from './events';

// Input types for tRPC procedures
export interface JoinRoomInput {
  interactionId: string;
  entityId: string;
  entityType: 'playerCharacter' | 'npc' | 'monster';
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
  type: 'party' | 'dm' | 'private';
  recipients?: string[];
  entityId?: string;
}

export interface GetChatHistoryInput {
  interactionId: string;
  channelType?: 'party' | 'dm' | 'private' | 'system';
  limit?: number;
}

// Output types for tRPC procedures
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

// Test Mode types (simplified for now)
export interface TestModeInput {
  [key: string]: any;
}

export interface TestModeOutput {
  [key: string]: any;
}

// Router interface definition for type safety
export interface LiveInteractionRouter {
  health: {
    input: never;
    output: HealthOutput;
  };
  joinRoom: {
    input: JoinRoomInput;
    output: JoinRoomOutput;
  };
  leaveRoom: {
    input: LeaveRoomInput;
    output: LeaveRoomOutput;
  };
  pauseInteraction: {
    input: PauseInteractionInput;
    output: PauseInteractionOutput;
  };
  resumeInteraction: {
    input: ResumeInteractionInput;
    output: ResumeInteractionOutput;
  };
  takeTurn: {
    input: TurnAction;
    output: TakeTurnOutput;
  };
  skipTurn: {
    input: SkipTurnInput;
    output: SkipTurnOutput;
  };
  backtrackTurn: {
    input: BacktrackTurnInput;
    output: BacktrackTurnOutput;
  };
  roomUpdates: {
    input: RoomUpdatesInput;
    output: GameEvent;
  };
  getRoomState: {
    input: GetRoomStateInput;
    output: GetRoomStateOutput;
  };
  sendChatMessage: {
    input: SendChatMessageInput;
    output: SendChatMessageOutput;
  };
  getChatHistory: {
    input: GetChatHistoryInput;
    output: GetChatHistoryOutput;
  };
}

export interface TestModeRouter {
  createTestInteraction: {
    input: TestModeInput;
    output: TestModeOutput;
  };
  simulateActions: {
    input: TestModeInput;
    output: TestModeOutput;
  };
  getTestStats: {
    input: never;
    output: TestModeOutput;
  };
}

// Main app router interface
export interface AppRouterInterface {
  interaction: LiveInteractionRouter;
  testMode: TestModeRouter;
}

// Helper types for extracting inputs and outputs
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