import { EventEmitter } from 'events';
import { GameState, TurnAction, ParticipantState, InitiativeEntry, ValidationResult, MapState } from '../types';
export interface GameStateEngineConfig {
    turnTimeoutMs?: number;
    autoAdvanceTurns?: boolean;
    enableActionValidation?: boolean;
    enableTurnQueue?: boolean;
}
export interface ActionValidationContext {
    gameState: GameState;
    participant: ParticipantState;
    mapState: MapState;
}
export interface QueuedAction {
    id: string;
    action: TurnAction;
    queuedAt: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: ValidationResult;
}
export interface TurnQueue {
    entityId: string;
    actions: QueuedAction[];
    isProcessing: boolean;
}
export declare class GameStateEngine extends EventEmitter {
    private gameState;
    private turnTimer?;
    private readonly config;
    private readonly engineLogger;
    private turnQueues;
    private actionIdCounter;
    constructor(initialState: GameState, config?: GameStateEngineConfig);
    getGameState(): GameState;
    updateGameState(updates: Partial<GameState>): void;
    queueTurnAction(action: TurnAction): Promise<string>;
    processTurnAction(action: TurnAction): Promise<ValidationResult>;
    skipTurn(reason?: string): boolean;
    advanceTurn(): void;
    updateInitiativeOrder(newOrder: InitiativeEntry[]): void;
    pause(reason?: string): void;
    resume(): void;
    complete(reason?: string): void;
    getCurrentTurnEntity(): InitiativeEntry | null;
    getParticipant(entityId: string): ParticipantState | null;
    updateParticipant(entityId: string, updates: Partial<ParticipantState>): boolean;
    getTurnQueue(entityId: string): TurnQueue | null;
    getPendingActions(entityId: string): QueuedAction[];
    getCompletedActions(entityId: string): QueuedAction[];
    cancelQueuedAction(entityId: string, actionId: string): boolean;
    clearActionQueue(entityId: string): boolean;
    backtrackToTurn(turnNumber: number, roundNumber: number, dmUserId: string): boolean;
    redoTurn(entityId: string, actions: TurnAction[], dmUserId: string): Promise<boolean>;
    cleanup(): void;
    private validateTurnAction;
    private executeTurnAction;
    private validateMoveAction;
    private validateAttackAction;
    private validateItemAction;
    private validateSpellAction;
    private validateInteractAction;
    private executeMoveAction;
    private executeAttackAction;
    private executeItemAction;
    private executeSpellAction;
    private executeInteractAction;
    private recordTurnAction;
    private shouldAdvanceTurn;
    private updateParticipantTurnStatus;
    private startTurnTimer;
    private clearTurnTimer;
    private generateActionId;
    private processActionQueue;
    private processRedoActions;
    private calculateStateDelta;
}
//# sourceMappingURL=GameStateEngine.d.ts.map