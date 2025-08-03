"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateEngine = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
class GameStateEngine extends events_1.EventEmitter {
    gameState;
    turnTimer;
    config;
    engineLogger;
    turnQueues;
    actionIdCounter;
    constructor(initialState, config = {}) {
        super();
        this.gameState = { ...initialState };
        this.config = {
            turnTimeoutMs: config.turnTimeoutMs || 90 * 1000,
            autoAdvanceTurns: config.autoAdvanceTurns ?? true,
            enableActionValidation: config.enableActionValidation ?? true,
            enableTurnQueue: config.enableTurnQueue ?? true
        };
        this.turnQueues = new Map();
        this.actionIdCounter = 0;
        this.engineLogger = logger_1.logger.child({
            component: 'GameStateEngine',
            interactionId: this.gameState.interactionId
        });
        this.engineLogger.info('GameStateEngine initialized', {
            status: this.gameState.status,
            participantCount: Object.keys(this.gameState.participants).length,
            config: this.config
        });
        if (this.gameState.status === 'active' && this.config.autoAdvanceTurns) {
            this.startTurnTimer();
        }
    }
    getGameState() {
        return JSON.parse(JSON.stringify(this.gameState));
    }
    updateGameState(updates) {
        const previousState = { ...this.gameState };
        this.gameState = {
            ...this.gameState,
            ...updates,
            timestamp: new Date()
        };
        const delta = this.calculateStateDelta(previousState, this.gameState);
        if (delta) {
            this.emit('stateDelta', delta);
        }
        this.emit('stateChanged', this.gameState);
        this.engineLogger.debug('Game state updated', {
            updates: Object.keys(updates),
            status: this.gameState.status,
            currentTurn: this.getCurrentTurnEntity()?.entityId
        });
    }
    async queueTurnAction(action) {
        if (!this.config.enableTurnQueue) {
            const result = await this.processTurnAction(action);
            return result.valid ? 'immediate-success' : 'immediate-failure';
        }
        const actionId = this.generateActionId();
        const queuedAction = {
            id: actionId,
            action,
            queuedAt: new Date(),
            status: 'pending'
        };
        let turnQueue = this.turnQueues.get(action.entityId);
        if (!turnQueue) {
            turnQueue = {
                entityId: action.entityId,
                actions: [],
                isProcessing: false
            };
            this.turnQueues.set(action.entityId, turnQueue);
        }
        turnQueue.actions.push(queuedAction);
        this.engineLogger.debug('Action queued', {
            actionId,
            entityId: action.entityId,
            actionType: action.type,
            queueLength: turnQueue.actions.length
        });
        if (!turnQueue.isProcessing) {
            this.processActionQueue(action.entityId);
        }
        return actionId;
    }
    async processTurnAction(action) {
        try {
            const validation = await this.validateTurnAction(action);
            if (!validation.valid) {
                this.engineLogger.warn('Invalid turn action', {
                    entityId: action.entityId,
                    actionType: action.type,
                    errors: validation.errors
                });
                return validation;
            }
            const success = await this.executeTurnAction(action);
            if (!success) {
                return {
                    valid: false,
                    errors: ['Internal error processing action']
                };
            }
            this.recordTurnAction(action);
            if (action.type === 'end' || this.shouldAdvanceTurn(action)) {
                this.advanceTurn();
            }
            this.engineLogger.info('Turn action processed successfully', {
                entityId: action.entityId,
                actionType: action.type,
                turnNumber: this.gameState.currentTurnIndex,
                roundNumber: this.gameState.roundNumber
            });
            this.emit('turnCompleted', {
                type: 'TURN_COMPLETED',
                entityId: action.entityId,
                actions: [action]
            });
            return { valid: true, errors: [] };
        }
        catch (error) {
            this.engineLogger.error('Error processing turn action', {
                error: error instanceof Error ? error.message : String(error),
                action
            });
            return {
                valid: false,
                errors: ['Internal error processing action']
            };
        }
    }
    skipTurn(reason = 'Manual skip') {
        const currentEntity = this.getCurrentTurnEntity();
        if (!currentEntity) {
            this.engineLogger.warn('Attempted to skip turn with no current entity');
            return false;
        }
        const turnRecord = {
            entityId: currentEntity.entityId,
            turnNumber: this.gameState.currentTurnIndex,
            roundNumber: this.gameState.roundNumber,
            actions: [],
            startTime: new Date(),
            endTime: new Date(),
            status: 'skipped'
        };
        this.gameState.turnHistory.push(turnRecord);
        this.engineLogger.info('Turn skipped', {
            entityId: currentEntity.entityId,
            reason,
            turnNumber: this.gameState.currentTurnIndex,
            roundNumber: this.gameState.roundNumber
        });
        this.emit('turnSkipped', {
            type: 'TURN_SKIPPED',
            entityId: currentEntity.entityId,
            reason
        });
        this.advanceTurn();
        return true;
    }
    advanceTurn() {
        const previousTurnIndex = this.gameState.currentTurnIndex;
        const previousRound = this.gameState.roundNumber;
        this.clearTurnTimer();
        this.gameState.currentTurnIndex++;
        if (this.gameState.currentTurnIndex >= this.gameState.initiativeOrder.length) {
            this.gameState.currentTurnIndex = 0;
            this.gameState.roundNumber++;
            this.engineLogger.info('New round started', {
                roundNumber: this.gameState.roundNumber,
                previousRound
            });
            this.emit('newRound', {
                roundNumber: this.gameState.roundNumber,
                previousRound
            });
        }
        const currentEntity = this.getCurrentTurnEntity();
        if (currentEntity) {
            this.updateParticipantTurnStatus(currentEntity.entityId, 'active');
            this.engineLogger.info('Turn advanced', {
                previousTurnIndex,
                currentTurnIndex: this.gameState.currentTurnIndex,
                currentEntityId: currentEntity.entityId,
                roundNumber: this.gameState.roundNumber
            });
            this.emit('turnStarted', {
                type: 'TURN_STARTED',
                entityId: currentEntity.entityId,
                timeLimit: this.config.turnTimeoutMs
            });
            if (this.config.autoAdvanceTurns && this.gameState.status === 'active') {
                this.startTurnTimer();
            }
        }
        this.updateGameState({
            currentTurnIndex: this.gameState.currentTurnIndex,
            roundNumber: this.gameState.roundNumber
        });
    }
    updateInitiativeOrder(newOrder) {
        const previousOrder = [...this.gameState.initiativeOrder];
        this.gameState.initiativeOrder = [...newOrder];
        if (this.gameState.currentTurnIndex >= newOrder.length) {
            this.gameState.currentTurnIndex = 0;
        }
        this.engineLogger.info('Initiative order updated', {
            previousCount: previousOrder.length,
            newCount: newOrder.length,
            currentTurnIndex: this.gameState.currentTurnIndex
        });
        this.emit('initiativeUpdated', {
            type: 'INITIATIVE_UPDATED',
            order: newOrder
        });
        this.updateGameState({
            initiativeOrder: this.gameState.initiativeOrder,
            currentTurnIndex: this.gameState.currentTurnIndex
        });
    }
    pause(reason = 'Manual pause') {
        if (this.gameState.status === 'paused') {
            this.engineLogger.warn('Attempted to pause already paused game');
            return;
        }
        this.clearTurnTimer();
        this.updateGameState({ status: 'paused' });
        this.engineLogger.info('Game paused', { reason });
        this.emit('gamePaused', {
            type: 'INTERACTION_PAUSED',
            reason
        });
    }
    resume() {
        if (this.gameState.status !== 'paused') {
            this.engineLogger.warn('Attempted to resume non-paused game', {
                status: this.gameState.status
            });
            return;
        }
        this.updateGameState({ status: 'active' });
        if (this.config.autoAdvanceTurns && this.getCurrentTurnEntity()) {
            this.startTurnTimer();
        }
        this.engineLogger.info('Game resumed');
        this.emit('gameResumed', {
            type: 'INTERACTION_RESUMED'
        });
    }
    complete(reason = 'Game completed') {
        this.clearTurnTimer();
        this.updateGameState({ status: 'completed' });
        this.engineLogger.info('Game completed', { reason });
        this.emit('gameCompleted', { reason });
    }
    getCurrentTurnEntity() {
        if (this.gameState.currentTurnIndex >= this.gameState.initiativeOrder.length) {
            return null;
        }
        return this.gameState.initiativeOrder[this.gameState.currentTurnIndex] || null;
    }
    getParticipant(entityId) {
        if (this.gameState.participants instanceof Map) {
            return this.gameState.participants.get(entityId) || null;
        }
        else {
            return this.gameState.participants[entityId] || null;
        }
    }
    updateParticipant(entityId, updates) {
        const participant = this.getParticipant(entityId);
        if (!participant) {
            this.engineLogger.warn('Attempted to update non-existent participant', { entityId });
            return false;
        }
        const updatedParticipant = {
            ...participant,
            ...updates
        };
        if (this.gameState.participants instanceof Map) {
            this.gameState.participants.set(entityId, updatedParticipant);
        }
        else {
            this.gameState.participants[entityId] = updatedParticipant;
        }
        this.engineLogger.debug('Participant updated', {
            entityId,
            updates: Object.keys(updates)
        });
        this.updateGameState({ participants: this.gameState.participants });
        return true;
    }
    getTurnQueue(entityId) {
        return this.turnQueues.get(entityId) || null;
    }
    getPendingActions(entityId) {
        const queue = this.turnQueues.get(entityId);
        return queue ? queue.actions.filter(a => a.status === 'pending') : [];
    }
    getCompletedActions(entityId) {
        const queue = this.turnQueues.get(entityId);
        return queue ? queue.actions.filter(a => a.status === 'completed') : [];
    }
    cancelQueuedAction(entityId, actionId) {
        const queue = this.turnQueues.get(entityId);
        if (!queue)
            return false;
        const actionIndex = queue.actions.findIndex(a => a.id === actionId && a.status === 'pending');
        if (actionIndex === -1)
            return false;
        queue.actions.splice(actionIndex, 1);
        this.engineLogger.info('Queued action cancelled', {
            entityId,
            actionId
        });
        return true;
    }
    clearActionQueue(entityId) {
        const queue = this.turnQueues.get(entityId);
        if (!queue)
            return false;
        const pendingCount = queue.actions.filter(a => a.status === 'pending').length;
        queue.actions = queue.actions.filter(a => a.status !== 'pending');
        this.engineLogger.info('Action queue cleared', {
            entityId,
            clearedCount: pendingCount
        });
        return pendingCount > 0;
    }
    backtrackToTurn(turnNumber, roundNumber, dmUserId) {
        const targetTurnIndex = this.gameState.turnHistory.findIndex(turn => turn.turnNumber === turnNumber && turn.roundNumber === roundNumber);
        if (targetTurnIndex === -1) {
            this.engineLogger.warn('Backtrack failed: turn not found', {
                targetTurn: turnNumber,
                targetRound: roundNumber,
                dmUserId
            });
            return false;
        }
        const removedTurns = this.gameState.turnHistory.splice(targetTurnIndex + 1);
        this.gameState.currentTurnIndex = turnNumber;
        this.gameState.roundNumber = roundNumber;
        this.turnQueues.clear();
        if (this.gameState.participants instanceof Map) {
            for (const [, participant] of this.gameState.participants) {
                participant.turnStatus = 'waiting';
            }
        }
        else {
            Object.values(this.gameState.participants).forEach(participant => {
                participant.turnStatus = 'waiting';
            });
        }
        const currentEntity = this.getCurrentTurnEntity();
        if (currentEntity) {
            this.updateParticipantTurnStatus(currentEntity.entityId, 'active');
        }
        this.engineLogger.info('Turn backtracked', {
            targetTurn: turnNumber,
            targetRound: roundNumber,
            removedTurns: removedTurns.length,
            dmUserId
        });
        this.emit('turnBacktracked', {
            type: 'TURN_BACKTRACKED',
            targetTurn: turnNumber,
            targetRound: roundNumber,
            removedTurns: removedTurns.length,
            dmUserId
        });
        if (this.config.autoAdvanceTurns && this.gameState.status === 'active') {
            this.startTurnTimer();
        }
        this.updateGameState({
            currentTurnIndex: this.gameState.currentTurnIndex,
            roundNumber: this.gameState.roundNumber,
            turnHistory: this.gameState.turnHistory
        });
        return true;
    }
    redoTurn(entityId, actions, dmUserId) {
        const currentEntity = this.getCurrentTurnEntity();
        if (!currentEntity || currentEntity.entityId !== entityId) {
            this.engineLogger.warn('Redo failed: not entity\'s turn', {
                entityId,
                currentEntity: currentEntity?.entityId,
                dmUserId
            });
            return Promise.resolve(false);
        }
        return this.processRedoActions(entityId, actions, dmUserId);
    }
    cleanup() {
        this.clearTurnTimer();
        this.turnQueues.clear();
        this.removeAllListeners();
        this.engineLogger.info('GameStateEngine cleanup completed');
    }
    async validateTurnAction(action) {
        if (!this.config.enableActionValidation) {
            return { valid: true, errors: [] };
        }
        const errors = [];
        const currentEntity = this.getCurrentTurnEntity();
        if (!currentEntity || currentEntity.entityId !== action.entityId) {
            errors.push('Not your turn');
        }
        if (this.gameState.status !== 'active') {
            errors.push('Game is not active');
        }
        const participant = this.getParticipant(action.entityId);
        if (!participant) {
            errors.push('Participant not found');
            return { valid: false, errors };
        }
        switch (action.type) {
            case 'move':
                errors.push(...this.validateMoveAction(action, participant));
                break;
            case 'attack':
                errors.push(...this.validateAttackAction(action, participant));
                break;
            case 'useItem':
                errors.push(...this.validateItemAction(action, participant));
                break;
            case 'cast':
                errors.push(...this.validateSpellAction(action, participant));
                break;
            case 'interact':
                errors.push(...this.validateInteractAction(action, participant));
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
    async executeTurnAction(action) {
        try {
            const participant = this.getParticipant(action.entityId);
            if (!participant) {
                return false;
            }
            switch (action.type) {
                case 'move':
                    return this.executeMoveAction(action, participant);
                case 'attack':
                    return this.executeAttackAction(action, participant);
                case 'useItem':
                    return this.executeItemAction(action, participant);
                case 'cast':
                    return this.executeSpellAction(action, participant);
                case 'interact':
                    return this.executeInteractAction(action, participant);
                case 'end':
                    return true;
                default:
                    return false;
            }
        }
        catch (error) {
            this.engineLogger.error('Error executing action', {
                error: error instanceof Error ? error.message : String(error),
                action
            });
            return false;
        }
    }
    validateMoveAction(action, participant) {
        const errors = [];
        if (!action.position) {
            errors.push('Move action requires target position');
            return errors;
        }
        const mapState = this.gameState.mapState;
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
        const isOccupied = entities.some(entity => entity.position.x === action.position.x && entity.position.y === action.position.y &&
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
    validateAttackAction(action, participant) {
        const errors = [];
        if (!action.target) {
            errors.push('Attack action requires target');
            return errors;
        }
        const target = this.getParticipant(action.target);
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
    validateItemAction(action, participant) {
        const errors = [];
        if (!action.itemId) {
            errors.push('Item action requires item ID');
            return errors;
        }
        const hasItem = participant.inventory.items.some(item => item.itemId === action.itemId && item.quantity > 0);
        if (!hasItem) {
            errors.push('Item not available');
        }
        return errors;
    }
    validateSpellAction(action, participant) {
        const errors = [];
        if (!action.spellId) {
            errors.push('Spell action requires spell ID');
            return errors;
        }
        return errors;
    }
    validateInteractAction(action, participant) {
        const errors = [];
        return errors;
    }
    executeMoveAction(action, participant) {
        if (!action.position)
            return false;
        participant.position = { ...action.position };
        if (this.gameState.mapState.entities instanceof Map) {
            const entityPosition = this.gameState.mapState.entities.get(action.entityId);
            if (entityPosition) {
                entityPosition.position = { ...action.position };
                this.gameState.mapState.entities.set(action.entityId, entityPosition);
            }
        }
        else {
            const entityPosition = this.gameState.mapState.entities[action.entityId];
            if (entityPosition) {
                entityPosition.position = { ...action.position };
            }
        }
        this.updateParticipant(action.entityId, { position: participant.position });
        return true;
    }
    executeAttackAction(action, participant) {
        if (!action.target)
            return false;
        const target = this.getParticipant(action.target);
        if (!target)
            return false;
        const damage = 1;
        const newHP = Math.max(0, target.currentHP - damage);
        this.updateParticipant(action.target, { currentHP: newHP });
        this.engineLogger.info('Attack executed', {
            attacker: action.entityId,
            target: action.target,
            damage,
            targetHP: newHP
        });
        return true;
    }
    executeItemAction(action, participant) {
        if (!action.itemId)
            return false;
        const itemIndex = participant.inventory.items.findIndex(item => item.itemId === action.itemId && item.quantity > 0);
        if (itemIndex === -1)
            return false;
        const item = participant.inventory.items[itemIndex];
        if (!item)
            return false;
        item.quantity--;
        if (item.quantity === 0) {
            participant.inventory.items.splice(itemIndex, 1);
        }
        if (action.itemId === 'healing_potion') {
            const newHP = Math.min(participant.maxHP, participant.currentHP + 5);
            participant.currentHP = newHP;
        }
        this.updateParticipant(action.entityId, {
            inventory: participant.inventory,
            currentHP: participant.currentHP
        });
        return true;
    }
    executeSpellAction(action, participant) {
        if (!action.spellId)
            return false;
        return true;
    }
    executeInteractAction(action, participant) {
        return true;
    }
    recordTurnAction(action) {
        const turnRecord = {
            entityId: action.entityId,
            turnNumber: this.gameState.currentTurnIndex,
            roundNumber: this.gameState.roundNumber,
            actions: [action],
            startTime: new Date(),
            endTime: new Date(),
            status: 'completed'
        };
        this.gameState.turnHistory.push(turnRecord);
    }
    shouldAdvanceTurn(action) {
        return ['attack', 'useItem', 'cast'].includes(action.type);
    }
    updateParticipantTurnStatus(entityId, status) {
        if (this.gameState.participants instanceof Map) {
            for (const [, participant] of this.gameState.participants) {
                participant.turnStatus = 'waiting';
            }
        }
        else {
            Object.values(this.gameState.participants).forEach(participant => {
                participant.turnStatus = 'waiting';
            });
        }
        const participant = this.getParticipant(entityId);
        if (participant) {
            participant.turnStatus = status;
            this.updateParticipant(entityId, { turnStatus: status });
        }
    }
    startTurnTimer() {
        this.clearTurnTimer();
        this.turnTimer = setTimeout(() => {
            this.engineLogger.info('Turn timeout reached');
            this.skipTurn('timeout');
        }, this.config.turnTimeoutMs);
    }
    clearTurnTimer() {
        if (this.turnTimer) {
            clearTimeout(this.turnTimer);
            this.turnTimer = undefined;
        }
    }
    generateActionId() {
        return `action-${++this.actionIdCounter}-${Date.now()}`;
    }
    async processActionQueue(entityId) {
        const queue = this.turnQueues.get(entityId);
        if (!queue || queue.isProcessing)
            return;
        queue.isProcessing = true;
        try {
            setTimeout(async () => {
                try {
                    while (queue.actions.length > 0) {
                        const queuedAction = queue.actions.find(a => a.status === 'pending');
                        if (!queuedAction)
                            break;
                        queuedAction.status = 'processing';
                        try {
                            const result = await this.processTurnAction(queuedAction.action);
                            queuedAction.result = result;
                            queuedAction.status = result.valid ? 'completed' : 'failed';
                            this.engineLogger.debug('Queued action processed', {
                                actionId: queuedAction.id,
                                entityId,
                                success: result.valid,
                                errors: result.errors
                            });
                            this.emit('queuedActionCompleted', {
                                actionId: queuedAction.id,
                                entityId,
                                action: queuedAction.action,
                                result
                            });
                            if (!result.valid || queuedAction.action.type === 'end') {
                                break;
                            }
                        }
                        catch (error) {
                            queuedAction.status = 'failed';
                            queuedAction.result = {
                                valid: false,
                                errors: ['Queue processing error']
                            };
                            this.engineLogger.error('Error processing queued action', {
                                actionId: queuedAction.id,
                                entityId,
                                error: error instanceof Error ? error.message : String(error)
                            });
                            break;
                        }
                    }
                }
                finally {
                    queue.isProcessing = false;
                }
            }, 10);
        }
        catch (error) {
            queue.isProcessing = false;
            throw error;
        }
    }
    async processRedoActions(entityId, actions, dmUserId) {
        try {
            const results = [];
            for (const action of actions) {
                if (action.entityId !== entityId) {
                    this.engineLogger.warn('Redo action entity mismatch', {
                        expectedEntityId: entityId,
                        actionEntityId: action.entityId,
                        dmUserId
                    });
                    return false;
                }
                const result = await this.processTurnAction(action);
                results.push(result);
                if (!result.valid) {
                    this.engineLogger.warn('Redo action failed', {
                        entityId,
                        actionType: action.type,
                        errors: result.errors,
                        dmUserId
                    });
                    return false;
                }
            }
            this.engineLogger.info('Turn redo completed', {
                entityId,
                actionCount: actions.length,
                dmUserId
            });
            this.emit('turnRedoCompleted', {
                entityId,
                actions,
                results,
                dmUserId
            });
            return true;
        }
        catch (error) {
            this.engineLogger.error('Error processing redo actions', {
                entityId,
                dmUserId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    calculateStateDelta(previousState, currentState) {
        const changes = {};
        if (previousState.status !== currentState.status) {
            changes['status'] = currentState.status;
        }
        if (previousState.currentTurnIndex !== currentState.currentTurnIndex) {
            changes['currentTurnIndex'] = currentState.currentTurnIndex;
        }
        if (previousState.roundNumber !== currentState.roundNumber) {
            changes['roundNumber'] = currentState.roundNumber;
        }
        const participantChanges = {};
        const currentParticipants = currentState.participants instanceof Map ?
            Object.fromEntries(currentState.participants) :
            currentState.participants;
        const previousParticipants = previousState.participants instanceof Map ?
            Object.fromEntries(previousState.participants) :
            previousState.participants;
        for (const [entityId, participant] of Object.entries(currentParticipants)) {
            const prevParticipant = previousParticipants[entityId];
            if (!prevParticipant || JSON.stringify(prevParticipant) !== JSON.stringify(participant)) {
                participantChanges[entityId] = participant;
            }
        }
        if (Object.keys(participantChanges).length > 0) {
            changes['participants'] = participantChanges;
        }
        if (JSON.stringify(previousState.initiativeOrder) !== JSON.stringify(currentState.initiativeOrder)) {
            changes['initiativeOrder'] = currentState.initiativeOrder;
        }
        if (JSON.stringify(previousState.mapState) !== JSON.stringify(currentState.mapState)) {
            changes['mapState'] = currentState.mapState;
        }
        if (currentState.turnHistory.length > previousState.turnHistory.length) {
            changes['newTurnRecords'] = currentState.turnHistory.slice(previousState.turnHistory.length);
        }
        if (currentState.chatLog.length > previousState.chatLog.length) {
            changes['newChatMessages'] = currentState.chatLog.slice(previousState.chatLog.length);
        }
        if (Object.keys(changes).length > 0) {
            return {
                type: 'participant',
                changes,
                timestamp: Date.now()
            };
        }
        return null;
    }
}
exports.GameStateEngine = GameStateEngine;
//# sourceMappingURL=GameStateEngine.js.map