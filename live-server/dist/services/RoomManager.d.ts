import { InteractionRoom } from './InteractionRoom';
import { Participant, GameState } from '../types';
import { EventEmitter } from 'events';
export interface RoomManagerConfig {
    inactivityTimeoutMs?: number;
    cleanupIntervalMs?: number;
    maxRooms?: number;
}
export declare class RoomManager extends EventEmitter {
    private rooms;
    private cleanupInterval?;
    private readonly config;
    private readonly managerLogger;
    constructor(config?: RoomManagerConfig);
    createRoom(interactionId: string, initialGameState: GameState): Promise<InteractionRoom>;
    getRoom(roomId: string): InteractionRoom | null;
    getRoomByInteractionId(interactionId: string): InteractionRoom | null;
    getAllRooms(): InteractionRoom[];
    getActiveRooms(): InteractionRoom[];
    joinRoom(interactionId: string, participant: Participant): Promise<InteractionRoom>;
    leaveRoom(interactionId: string, userId: string): Promise<boolean>;
    pauseRoom(interactionId: string, reason?: string): Promise<boolean>;
    resumeRoom(interactionId: string): Promise<boolean>;
    completeRoom(interactionId: string, reason?: string): Promise<boolean>;
    removeRoom(roomId: string): Promise<boolean>;
    cleanupInactiveRooms(): Promise<number>;
    getStats(): {
        totalRooms: number;
        activeRooms: number;
        pausedRooms: number;
        completedRooms: number;
        totalParticipants: number;
        connectedParticipants: number;
        config: Required<RoomManagerConfig>;
    };
    shutdown(): void;
    private findRoomByInteractionId;
    private setupRoomEventListeners;
    private startCleanupInterval;
}
//# sourceMappingURL=RoomManager.d.ts.map