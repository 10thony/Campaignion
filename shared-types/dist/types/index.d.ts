/**
 * Main types export file
 * Re-exports all shared types for easy consumption
 */
export * from './core';
export * from './events';
export * from './api';
export * from './router';
export type { LiveInteractionRouter, TestModeRouter, AppRouterInterface, } from './router-interface';
import type { Position, ChatMessage, TurnAction, ChatType, ActionType, EntityType, GameStatus } from './core';
export type { EntityType, TurnStatus, GameStatus, RoomStatus, ChatType, ActionType, TurnRecordStatus, StateDeltaType } from './core';
export declare function isPlayerCharacter(entityType: EntityType): entityType is 'playerCharacter';
export declare function isNPC(entityType: EntityType): entityType is 'npc';
export declare function isMonster(entityType: EntityType): entityType is 'monster';
export declare function isActiveGame(status: GameStatus): status is 'active';
export declare function isPausedGame(status: GameStatus): status is 'paused';
export declare function isCompletedGame(status: GameStatus): status is 'completed';
export declare function createPosition(x: number, y: number): Position;
export declare function isValidPosition(pos: any): pos is Position;
export declare function createChatMessage(id: string, userId: string, content: string, type: ChatType, entityId?: string, recipients?: string[]): ChatMessage;
export declare function createTurnAction(type: ActionType, entityId: string, options?: Partial<Omit<TurnAction, 'type' | 'entityId'>>): TurnAction;
//# sourceMappingURL=index.d.ts.map