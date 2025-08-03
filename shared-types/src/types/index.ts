/**
 * Main types export file
 * Re-exports all shared types for easy consumption
 */

// Core types
export * from './core';

// Event types
export * from './events';

// API types
export * from './api';

// Router types
export * from './router';

// Router interface definitions (only export the interface types, not duplicates)
export type {
  LiveInteractionRouter,
  TestModeRouter,
  AppRouterInterface,
} from './router-interface';

// Import types for utility functions
import type { 
  Position, 
  ChatMessage, 
  TurnAction, 
  ChatType, 
  ActionType,
  EntityType,
  GameStatus
} from './core';

// Utility types (re-exported from core)
export type {
  EntityType,
  TurnStatus,
  GameStatus,
  RoomStatus,
  ChatType,
  ActionType,
  TurnRecordStatus,
  StateDeltaType
} from './core';

// Type guards
export function isPlayerCharacter(entityType: EntityType): entityType is 'playerCharacter' {
  return entityType === 'playerCharacter';
}

export function isNPC(entityType: EntityType): entityType is 'npc' {
  return entityType === 'npc';
}

export function isMonster(entityType: EntityType): entityType is 'monster' {
  return entityType === 'monster';
}

export function isActiveGame(status: GameStatus): status is 'active' {
  return status === 'active';
}

export function isPausedGame(status: GameStatus): status is 'paused' {
  return status === 'paused';
}

export function isCompletedGame(status: GameStatus): status is 'completed' {
  return status === 'completed';
}

// Utility functions
export function createPosition(x: number, y: number): Position {
  return { x, y };
}

export function isValidPosition(pos: any): pos is Position {
  return typeof pos === 'object' && 
         pos !== null && 
         typeof pos.x === 'number' && 
         typeof pos.y === 'number';
}

export function createChatMessage(
  id: string,
  userId: string,
  content: string,
  type: ChatType,
  entityId?: string,
  recipients?: string[]
): ChatMessage {
  return {
    id,
    userId,
    entityId,
    content,
    type,
    recipients,
    timestamp: Date.now(),
  };
}

export function createTurnAction(
  type: ActionType,
  entityId: string,
  options: Partial<Omit<TurnAction, 'type' | 'entityId'>> = {}
): TurnAction {
  return {
    type,
    entityId,
    ...options,
  };
}