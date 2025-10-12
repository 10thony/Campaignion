import type { GameState, TurnAction } from '@campaignion/shared-types';
export interface PredictionResult {
    success: boolean;
    predictedState: GameState;
    errors: string[];
    rollbackData?: PredictionRollbackData;
}
export interface PredictionRollbackData {
    originalState: GameState;
    action: TurnAction;
    timestamp: number;
    predictionId: string;
}
export interface PredictionContext {
    userId: string;
    entityId: string;
    timestamp: number;
}
export declare class ClientPrediction {
    private predictionHistory;
    private predictionIdCounter;
    predictAction(gameState: GameState, action: TurnAction, context?: PredictionContext): PredictionResult;
    reconcileWithServer(predictedState: GameState, serverState: GameState, predictionId?: string): GameState;
    rollbackPrediction(gameState: GameState, action: TurnAction): GameState;
    rollbackPredictionById(predictionId: string): GameState | null;
    getPendingPredictions(): PredictionRollbackData[];
    clearPredictionHistory(): void;
    private validateActionClientSide;
    private applyPredictedAction;
    private validateMoveActionClientSide;
    private validateAttackActionClientSide;
    private validateItemActionClientSide;
    private validateSpellActionClientSide;
    private validateInteractActionClientSide;
    private applyMoveAction;
    private applyAttackAction;
    private applyItemAction;
    private applySpellAction;
    private applyInteractAction;
    private applyEndTurnAction;
    private performReconciliation;
    private statesAreEquivalent;
    private actionsAreEqual;
    private deepCloneGameState;
    private cleanupOldPredictions;
}
//# sourceMappingURL=ClientPrediction.d.ts.map