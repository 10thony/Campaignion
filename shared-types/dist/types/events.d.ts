/**
 * Game event types for real-time communication
 * These types define all possible events that can occur during live interactions
 */
import type { TurnAction, ChatMessage, InitiativeEntry, StateDelta, GameError } from './core';
export type GameEvent = {
    type: 'PARTICIPANT_JOINED';
    userId: string;
    entityId: string;
    timestamp: number;
    interactionId: string;
} | {
    type: 'PARTICIPANT_LEFT';
    userId: string;
    timestamp: number;
    interactionId: string;
} | {
    type: 'TURN_STARTED';
    entityId: string;
    timeLimit: number;
    timestamp: number;
    interactionId: string;
} | {
    type: 'TURN_COMPLETED';
    entityId: string;
    actions: TurnAction[];
    timestamp: number;
    interactionId: string;
} | {
    type: 'TURN_SKIPPED';
    entityId: string;
    reason: string;
    timestamp: number;
    interactionId: string;
} | {
    type: 'TURN_BACKTRACKED';
    targetTurn: number;
    targetRound: number;
    removedTurns: number;
    dmUserId: string;
    timestamp: number;
    interactionId: string;
} | {
    type: 'STATE_DELTA';
    changes: StateDelta;
    timestamp: number;
    interactionId: string;
} | {
    type: 'CHAT_MESSAGE';
    message: ChatMessage;
    timestamp: number;
    interactionId: string;
} | {
    type: 'INITIATIVE_UPDATED';
    order: InitiativeEntry[];
    timestamp: number;
    interactionId: string;
} | {
    type: 'INTERACTION_PAUSED';
    reason: string;
    timestamp: number;
    interactionId: string;
} | {
    type: 'INTERACTION_RESUMED';
    timestamp: number;
    interactionId: string;
} | {
    type: 'PLAYER_DISCONNECTED';
    userId: string;
    interactionId: string;
    reason: string;
    timestamp: number;
} | {
    type: 'PLAYER_RECONNECTED';
    userId: string;
    interactionId: string;
    connectionId: string;
    timestamp: number;
} | {
    type: 'DM_DISCONNECTED';
    userId: string;
    interactionId: string;
    reason: string;
    timestamp: number;
} | {
    type: 'DM_RECONNECTED';
    userId: string;
    interactionId: string;
    connectionId: string;
    timestamp: number;
} | {
    type: 'ERROR';
    error: GameError;
    timestamp: number;
    interactionId: string;
};
export type ParticipantJoinedEvent = Extract<GameEvent, {
    type: 'PARTICIPANT_JOINED';
}>;
export type ParticipantLeftEvent = Extract<GameEvent, {
    type: 'PARTICIPANT_LEFT';
}>;
export type TurnStartedEvent = Extract<GameEvent, {
    type: 'TURN_STARTED';
}>;
export type TurnCompletedEvent = Extract<GameEvent, {
    type: 'TURN_COMPLETED';
}>;
export type TurnSkippedEvent = Extract<GameEvent, {
    type: 'TURN_SKIPPED';
}>;
export type TurnBacktrackedEvent = Extract<GameEvent, {
    type: 'TURN_BACKTRACKED';
}>;
export type StateDeltaEvent = Extract<GameEvent, {
    type: 'STATE_DELTA';
}>;
export type ChatMessageEvent = Extract<GameEvent, {
    type: 'CHAT_MESSAGE';
}>;
export type InitiativeUpdatedEvent = Extract<GameEvent, {
    type: 'INITIATIVE_UPDATED';
}>;
export type InteractionPausedEvent = Extract<GameEvent, {
    type: 'INTERACTION_PAUSED';
}>;
export type InteractionResumedEvent = Extract<GameEvent, {
    type: 'INTERACTION_RESUMED';
}>;
export type PlayerDisconnectedEvent = Extract<GameEvent, {
    type: 'PLAYER_DISCONNECTED';
}>;
export type PlayerReconnectedEvent = Extract<GameEvent, {
    type: 'PLAYER_RECONNECTED';
}>;
export type DmDisconnectedEvent = Extract<GameEvent, {
    type: 'DM_DISCONNECTED';
}>;
export type DmReconnectedEvent = Extract<GameEvent, {
    type: 'DM_RECONNECTED';
}>;
export type ErrorEvent = Extract<GameEvent, {
    type: 'ERROR';
}>;
export type GameEventHandler = (event: GameEvent) => void;
export interface EventSubscriptionOptions {
    interactionId: string;
    onEvent?: GameEventHandler;
    onError?: (error: Error) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}
//# sourceMappingURL=events.d.ts.map