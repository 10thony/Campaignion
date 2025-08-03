"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientPrediction = void 0;
class ClientPrediction {
    predictAction(gameState, action) {
        return gameState;
    }
    reconcileWithServer(predictedState, serverState) {
        return serverState;
    }
    rollbackPrediction(gameState, action) {
        return gameState;
    }
}
exports.ClientPrediction = ClientPrediction;
//# sourceMappingURL=ClientPrediction.js.map