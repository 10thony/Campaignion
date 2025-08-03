import { InteractionRoom as IInteractionRoom, Participant, GameState, TurnAction } from '../types';
import { EventEmitter } from 'events';
export declare class InteractionRoom extends EventEmitter implements IInteractionRoom {
    readonly id: string;
    readonly interactionId: string;
    participants: Map<string, Participant>;
    gameState: GameState;
    lastActivity: Date;
    status: 'active' | 'paused' | 'completed';
    private inactivityTimer?;
    private readonly inactivityTimeoutMs;
    private readonly roomLogger;
    constructor(interactionId: string, initialGameState: GameState, inactivityTimeoutMs?: number);
    addParticipant(participant: Participant): void;
    removeParticipant(userId: string): boolean;
    getParticipant(userId: string): Participant | undefined;
    getAllParticipants(): Participant[];
    updateParticipantConnection(userId: string, isConnected: boolean, connectionId?: string): boolean;
    updateGameState(newState: Partial<GameState>): void;
    processTurnAction(action: TurnAction): boolean;
    pause(reason?: string): void;
    resume(): void;
    complete(reason?: string): void;
    isInactive(): boolean;
    getStats(): {
        id: string;
        interactionId: string;
        status: "active" | "paused" | "completed";
        participantCount: number;
        connectedParticipants: number;
        lastActivity: Date;
        currentTurn: string | undefined;
        roundNumber: number;
        turnHistoryLength: number;
        chatMessageCount: number;
    };
    cleanup(): void;
    private updateActivity;
    private startInactivityTimer;
    private clearInactivityTimer;
}
//# sourceMappingURL=InteractionRoom.d.ts.map