import { GameState, Participant, TurnAction } from '../types';
export declare class LiveInteractionService {
    private roomManager;
    private persistence;
    constructor();
    startLiveInteraction(interactionId: string, initialGameState: GameState): Promise<string>;
    joinInteraction(interactionId: string, participant: Participant): Promise<void>;
    leaveInteraction(interactionId: string, userId: string): Promise<void>;
    processTurnAction(interactionId: string, action: TurnAction): Promise<boolean>;
    pauseInteraction(interactionId: string, reason?: string): Promise<void>;
    resumeInteraction(interactionId: string): Promise<void>;
    completeInteraction(interactionId: string, reason?: string): Promise<void>;
    getStats(): {
        totalRooms: number;
        activeRooms: number;
        pausedRooms: number;
        completedRooms: number;
        totalParticipants: number;
        connectedParticipants: number;
        config: Required<import("../services/RoomManager").RoomManagerConfig>;
    };
    getRoom(interactionId: string): import("../services").InteractionRoom | null;
    shutdown(): void;
    private setupEventHandlers;
}
export declare function exampleUsage(): Promise<void>;
//# sourceMappingURL=RoomManagerExample.d.ts.map