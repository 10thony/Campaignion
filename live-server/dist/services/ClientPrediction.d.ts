import type { GameState, TurnAction } from '@campaignion/shared-types';
export declare class ClientPrediction {
    predictAction(gameState: GameState, action: TurnAction): GameState;
    reconcileWithServer(predictedState: GameState, serverState: GameState): GameState;
    rollbackPrediction(gameState: GameState, action: TurnAction): GameState;
}
//# sourceMappingURL=ClientPrediction.d.ts.map