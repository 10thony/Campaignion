"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientPrediction = void 0;
class ClientPrediction {
    predictionHistory = new Map();
    predictionIdCounter = 0;
    predictAction(gameState, action, context) {
        try {
            const predictionId = `pred_${++this.predictionIdCounter}_${Date.now()}`;
            const originalState = this.deepCloneGameState(gameState);
            const predictedState = this.deepCloneGameState(gameState);
            const validation = this.validateActionClientSide(action, predictedState);
            if (!validation.valid) {
                return {
                    success: false,
                    predictedState: originalState,
                    errors: validation.errors
                };
            }
            const success = this.applyPredictedAction(predictedState, action);
            if (!success) {
                return {
                    success: false,
                    predictedState: originalState,
                    errors: ['Failed to apply predicted action']
                };
            }
            const rollbackData = {
                originalState,
                action,
                timestamp: Date.now(),
                predictionId
            };
            this.predictionHistory.set(predictionId, rollbackData);
            this.cleanupOldPredictions();
            return {
                success: true,
                predictedState,
                errors: [],
                rollbackData
            };
        }
        catch (error) {
            return {
                success: false,
                predictedState: gameState,
                errors: [`Prediction error: ${error instanceof Error ? error.message : String(error)}`]
            };
        }
    }
    reconcileWithServer(predictedState, serverState, predictionId) {
        try {
            if (predictionId) {
                this.predictionHistory.delete(predictionId);
            }
            if (this.statesAreEquivalent(predictedState, serverState)) {
                return this.deepCloneGameState(serverState);
            }
            const reconciledState = this.performReconciliation(predictedState, serverState);
            return reconciledState;
        }
        catch (error) {
            console.error('Reconciliation error:', error);
            return this.deepCloneGameState(serverState);
        }
    }
    rollbackPrediction(gameState, action) {
        try {
            const matchingPrediction = Array.from(this.predictionHistory.values())
                .find(pred => this.actionsAreEqual(pred.action, action));
            if (matchingPrediction) {
                this.predictionHistory.delete(matchingPrediction.predictionId);
                return this.deepCloneGameState(matchingPrediction.originalState);
            }
            return gameState;
        }
        catch (error) {
            console.error('Rollback error:', error);
            return gameState;
        }
    }
    rollbackPredictionById(predictionId) {
        const rollbackData = this.predictionHistory.get(predictionId);
        if (!rollbackData) {
            return null;
        }
        this.predictionHistory.delete(predictionId);
        return this.deepCloneGameState(rollbackData.originalState);
    }
    getPendingPredictions() {
        return Array.from(this.predictionHistory.values());
    }
    clearPredictionHistory() {
        this.predictionHistory.clear();
    }
    validateActionClientSide(action, gameState) {
        const errors = [];
        if (gameState.status !== 'active') {
            errors.push('Game is not active');
        }
        const currentEntity = gameState.initiativeOrder[gameState.currentTurnIndex];
        if (!currentEntity || currentEntity.entityId !== action.entityId) {
            errors.push('Not your turn');
        }
        const participants = gameState.participants instanceof Map ?
            gameState.participants : new Map(Object.entries(gameState.participants));
        const participant = participants.get(action.entityId);
        if (!participant) {
            errors.push('Participant not found');
            return { valid: false, errors };
        }
        switch (action.type) {
            case 'move':
                errors.push(...this.validateMoveActionClientSide(action, participant, gameState));
                break;
            case 'attack':
                errors.push(...this.validateAttackActionClientSide(action, participant, gameState));
                break;
            case 'useItem':
                errors.push(...this.validateItemActionClientSide(action, participant));
                break;
            case 'cast':
                errors.push(...this.validateSpellActionClientSide(action, participant));
                break;
            case 'interact':
                errors.push(...this.validateInteractActionClientSide(action, participant));
                break;
            case 'end':
                break;
            default:
                errors.push('Unknown action type');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    applyPredictedAction(gameState, action) {
        try {
            const participants = gameState.participants instanceof Map ?
                gameState.participants : new Map(Object.entries(gameState.participants));
            const participant = participants.get(action.entityId);
            if (!participant) {
                return false;
            }
            switch (action.type) {
                case 'move':
                    return this.applyMoveAction(gameState, action, participant);
                case 'attack':
                    return this.applyAttackAction(gameState, action, participant);
                case 'useItem':
                    return this.applyItemAction(gameState, action, participant);
                case 'cast':
                    return this.applySpellAction(gameState, action, participant);
                case 'interact':
                    return this.applyInteractAction(gameState, action, participant);
                case 'end':
                    return this.applyEndTurnAction(gameState, action, participant);
                default:
                    return false;
            }
        }
        catch (error) {
            console.error('Error applying predicted action:', error);
            return false;
        }
    }
    validateMoveActionClientSide(action, participant, gameState) {
        const errors = [];
        if (!action.position) {
            errors.push('Move action requires target position');
            return errors;
        }
        const mapState = gameState.mapState;
        if (action.position.x < 0 || action.position.x >= mapState.width ||
            action.position.y < 0 || action.position.y >= mapState.height) {
            errors.push('Target position is out of bounds');
        }
        const isBlocked = mapState.obstacles.some(obstacle => obstacle.x === action.position.x && obstacle.y === action.position.y);
        if (isBlocked) {
            errors.push('Target position is blocked');
        }
        const entities = mapState.entities instanceof Map ?
            Array.from(mapState.entities.values()) :
            Object.values(mapState.entities);
        const isOccupied = entities.some(entity => entity.position.x === action.position.x &&
            entity.position.y === action.position.y &&
            entity.entityId !== action.entityId);
        if (isOccupied) {
            errors.push('Target position is occupied');
        }
        const currentPos = participant.position;
        const distance = Math.abs(action.position.x - currentPos.x) + Math.abs(action.position.y - currentPos.y);
        const maxMoveDistance = 5;
        if (distance > maxMoveDistance) {
            errors.push('Target position is too far');
        }
        return errors;
    }
    validateAttackActionClientSide(action, participant, gameState) {
        const errors = [];
        if (!action.target) {
            errors.push('Attack action requires target');
            return errors;
        }
        const participants = gameState.participants instanceof Map ?
            gameState.participants : new Map(Object.entries(gameState.participants));
        const target = participants.get(action.target);
        if (!target) {
            errors.push('Target not found');
            return errors;
        }
        const attackerPos = participant.position;
        const targetPos = target.position;
        const distance = Math.abs(attackerPos.x - targetPos.x) + Math.abs(attackerPos.y - targetPos.y);
        const maxAttackRange = 1;
        if (distance > maxAttackRange) {
            errors.push('Target is out of range');
        }
        return errors;
    }
    validateItemActionClientSide(action, participant) {
        const errors = [];
        if (!action.itemId) {
            errors.push('Item action requires item ID');
            return errors;
        }
        const hasItem = participant.inventory.items.some(item => item.itemId === action.itemId);
        if (!hasItem) {
            errors.push('Item not found in inventory');
        }
        return errors;
    }
    validateSpellActionClientSide(action, participant) {
        const errors = [];
        if (!action.spellId) {
            errors.push('Spell action requires spell ID');
            return errors;
        }
        return errors;
    }
    validateInteractActionClientSide(action, participant) {
        const errors = [];
        if (!action.target && !action.position) {
            errors.push('Interact action requires target or position');
        }
        return errors;
    }
    applyMoveAction(gameState, action, participant) {
        if (!action.position)
            return false;
        participant.position = { ...action.position };
        const entities = gameState.mapState.entities instanceof Map ?
            gameState.mapState.entities : new Map(Object.entries(gameState.mapState.entities));
        entities.set(action.entityId, {
            entityId: action.entityId,
            position: { ...action.position }
        });
        if (!(gameState.mapState.entities instanceof Map)) {
            gameState.mapState.entities = Object.fromEntries(entities);
        }
        return true;
    }
    applyAttackAction(gameState, action, participant) {
        if (!action.target)
            return false;
        const participants = gameState.participants instanceof Map ?
            gameState.participants : new Map(Object.entries(gameState.participants));
        const target = participants.get(action.target);
        if (!target)
            return false;
        const damage = 5;
        target.currentHP = Math.max(0, target.currentHP - damage);
        return true;
    }
    applyItemAction(gameState, action, participant) {
        if (!action.itemId)
            return false;
        const itemIndex = participant.inventory.items.findIndex(item => item.itemId === action.itemId);
        if (itemIndex === -1)
            return false;
        const item = participant.inventory.items[itemIndex];
        if (item.quantity > 1) {
            item.quantity--;
        }
        else {
            participant.inventory.items.splice(itemIndex, 1);
        }
        if (action.itemId === 'healing-potion') {
            participant.currentHP = Math.min(participant.maxHP, participant.currentHP + 10);
        }
        return true;
    }
    applySpellAction(gameState, action, participant) {
        if (!action.spellId)
            return false;
        return true;
    }
    applyInteractAction(gameState, action, participant) {
        return true;
    }
    applyEndTurnAction(gameState, action, participant) {
        participant.turnStatus = 'completed';
        const turnRecord = {
            entityId: action.entityId,
            turnNumber: gameState.currentTurnIndex,
            roundNumber: gameState.roundNumber,
            actions: [action],
            startTime: new Date(),
            endTime: new Date(),
            status: 'completed'
        };
        gameState.turnHistory.push(turnRecord);
        gameState.currentTurnIndex++;
        if (gameState.currentTurnIndex >= gameState.initiativeOrder.length) {
            gameState.currentTurnIndex = 0;
            gameState.roundNumber++;
        }
        return true;
    }
    performReconciliation(predictedState, serverState) {
        const reconciledState = this.deepCloneGameState(serverState);
        return reconciledState;
    }
    statesAreEquivalent(state1, state2) {
        try {
            if (!state1 || !state2)
                return false;
            if (state1.currentTurnIndex !== state2.currentTurnIndex)
                return false;
            if (state1.roundNumber !== state2.roundNumber)
                return false;
            if (state1.status !== state2.status)
                return false;
            if (!state1.participants || !state2.participants)
                return false;
            const participants1 = state1.participants instanceof Map ?
                state1.participants : new Map(Object.entries(state1.participants));
            const participants2 = state2.participants instanceof Map ?
                state2.participants : new Map(Object.entries(state2.participants));
            if (participants1.size !== participants2.size)
                return false;
            for (const [entityId, participant1] of participants1) {
                const participant2 = participants2.get(entityId);
                if (!participant2)
                    return false;
                if (participant1.currentHP !== participant2.currentHP)
                    return false;
                if (participant1.position.x !== participant2.position.x)
                    return false;
                if (participant1.position.y !== participant2.position.y)
                    return false;
                if (participant1.turnStatus !== participant2.turnStatus)
                    return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error comparing states:', error);
            return false;
        }
    }
    actionsAreEqual(action1, action2) {
        return (action1.type === action2.type &&
            action1.entityId === action2.entityId &&
            action1.target === action2.target &&
            action1.itemId === action2.itemId &&
            action1.spellId === action2.spellId &&
            action1.actionId === action2.actionId &&
            JSON.stringify(action1.position) === JSON.stringify(action2.position) &&
            JSON.stringify(action1.parameters) === JSON.stringify(action2.parameters));
    }
    deepCloneGameState(gameState) {
        const cloned = JSON.parse(JSON.stringify(gameState, (key, value) => {
            if (value instanceof Map) {
                return Object.fromEntries(value);
            }
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        }));
        if (!(cloned.participants instanceof Map) && typeof cloned.participants === 'object') {
            cloned.participants = new Map(Object.entries(cloned.participants));
        }
        if (!(cloned.mapState.entities instanceof Map) && typeof cloned.mapState.entities === 'object') {
            cloned.mapState.entities = new Map(Object.entries(cloned.mapState.entities));
        }
        if (typeof cloned.timestamp === 'string') {
            cloned.timestamp = new Date(cloned.timestamp);
        }
        cloned.turnHistory.forEach((turn) => {
            if (typeof turn.startTime === 'string') {
                turn.startTime = new Date(turn.startTime);
            }
            if (typeof turn.endTime === 'string') {
                turn.endTime = new Date(turn.endTime);
            }
        });
        return cloned;
    }
    cleanupOldPredictions() {
        const maxPredictions = 10;
        const predictions = Array.from(this.predictionHistory.entries());
        if (predictions.length > maxPredictions) {
            predictions.sort((a, b) => b[1].timestamp - a[1].timestamp);
            for (let i = maxPredictions; i < predictions.length; i++) {
                this.predictionHistory.delete(predictions[i][0]);
            }
        }
    }
}
exports.ClientPrediction = ClientPrediction;
//# sourceMappingURL=ClientPrediction.js.map