"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionRoom = void 0;
const logger_1 = require("../utils/logger");
const utils_1 = require("../utils");
const events_1 = require("events");
class InteractionRoom extends events_1.EventEmitter {
    id;
    interactionId;
    participants;
    gameState;
    lastActivity;
    status;
    inactivityTimer;
    inactivityTimeoutMs;
    roomLogger;
    constructor(interactionId, initialGameState, inactivityTimeoutMs = 30 * 60 * 1000) {
        super();
        this.id = (0, utils_1.generateId)();
        this.interactionId = interactionId;
        this.participants = new Map();
        this.gameState = initialGameState;
        this.lastActivity = new Date();
        this.status = 'active';
        this.inactivityTimeoutMs = inactivityTimeoutMs;
        this.roomLogger = logger_1.logger.child({
            roomId: this.id,
            interactionId: this.interactionId
        });
        this.startInactivityTimer();
        this.roomLogger.info('InteractionRoom created', {
            inactivityTimeoutMs: this.inactivityTimeoutMs
        });
    }
    addParticipant(participant) {
        this.participants.set(participant.userId, participant);
        this.updateActivity();
        this.roomLogger.info('Participant added to room', {
            userId: participant.userId,
            entityId: participant.entityId,
            entityType: participant.entityType,
            participantCount: this.participants.size
        });
        this.emit('participantJoined', {
            type: 'PARTICIPANT_JOINED',
            userId: participant.userId,
            entityId: participant.entityId
        });
    }
    removeParticipant(userId) {
        const participant = this.participants.get(userId);
        if (!participant) {
            this.roomLogger.warn('Attempted to remove non-existent participant', { userId });
            return false;
        }
        this.participants.delete(userId);
        this.updateActivity();
        this.roomLogger.info('Participant removed from room', {
            userId,
            entityId: participant.entityId,
            participantCount: this.participants.size
        });
        this.emit('participantLeft', {
            type: 'PARTICIPANT_LEFT',
            userId
        });
        if (this.participants.size === 0) {
            this.roomLogger.info('Room is now empty, starting cleanup timer');
            this.startInactivityTimer();
        }
        return true;
    }
    getParticipant(userId) {
        return this.participants.get(userId);
    }
    getAllParticipants() {
        return Array.from(this.participants.values());
    }
    updateParticipantConnection(userId, isConnected, connectionId) {
        const participant = this.participants.get(userId);
        if (!participant) {
            this.roomLogger.warn('Attempted to update connection for non-existent participant', { userId });
            return false;
        }
        participant.isConnected = isConnected;
        participant.lastActivity = new Date();
        if (connectionId) {
            participant.connectionId = connectionId;
        }
        this.updateActivity();
        this.roomLogger.info('Participant connection updated', {
            userId,
            isConnected,
            connectionId: connectionId || participant.connectionId
        });
        return true;
    }
    updateGameState(newState) {
        this.gameState = {
            ...this.gameState,
            ...newState,
            timestamp: new Date()
        };
        this.updateActivity();
        this.roomLogger.debug('Game state updated', {
            status: this.gameState.status,
            currentTurnIndex: this.gameState.currentTurnIndex,
            roundNumber: this.gameState.roundNumber
        });
        this.emit('stateChanged', this.gameState);
    }
    processTurnAction(action) {
        try {
            const currentTurnEntity = this.gameState.initiativeOrder[this.gameState.currentTurnIndex];
            if (!currentTurnEntity || currentTurnEntity.entityId !== action.entityId) {
                this.roomLogger.warn('Invalid turn action - not current turn', {
                    actionEntityId: action.entityId,
                    currentTurnEntityId: currentTurnEntity?.entityId,
                    currentTurnIndex: this.gameState.currentTurnIndex
                });
                return false;
            }
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
            this.updateActivity();
            this.roomLogger.info('Turn action processed', {
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
            return true;
        }
        catch (error) {
            this.roomLogger.error('Error processing turn action', {
                error: error instanceof Error ? error.message : String(error),
                action
            });
            return false;
        }
    }
    pause(reason = 'Manual pause') {
        if (this.status === 'paused') {
            this.roomLogger.warn('Attempted to pause already paused room');
            return;
        }
        this.status = 'paused';
        this.updateGameState({ status: 'paused' });
        this.clearInactivityTimer();
        this.roomLogger.info('Room paused', { reason });
        this.emit('interactionPaused', {
            type: 'INTERACTION_PAUSED',
            reason
        });
        this.emit('persistenceRequired', 'pause');
    }
    resume() {
        if (this.status !== 'paused') {
            this.roomLogger.warn('Attempted to resume non-paused room', { status: this.status });
            return;
        }
        this.status = 'active';
        this.updateGameState({ status: 'active' });
        this.startInactivityTimer();
        this.roomLogger.info('Room resumed');
        this.emit('interactionResumed', {
            type: 'INTERACTION_RESUMED'
        });
    }
    complete(reason = 'Interaction completed') {
        this.status = 'completed';
        this.updateGameState({ status: 'completed' });
        this.clearInactivityTimer();
        this.roomLogger.info('Room completed', { reason });
        this.emit('persistenceRequired', 'complete');
        this.emit('interactionCompleted', reason);
    }
    isInactive() {
        const now = Date.now();
        const lastActivityTime = this.lastActivity.getTime();
        return (now - lastActivityTime) > this.inactivityTimeoutMs;
    }
    getStats() {
        return {
            id: this.id,
            interactionId: this.interactionId,
            status: this.status,
            participantCount: this.participants.size,
            connectedParticipants: this.getAllParticipants().filter(p => p.isConnected).length,
            lastActivity: this.lastActivity,
            currentTurn: this.gameState.initiativeOrder[this.gameState.currentTurnIndex]?.entityId,
            roundNumber: this.gameState.roundNumber,
            turnHistoryLength: this.gameState.turnHistory.length,
            chatMessageCount: this.gameState.chatLog.length
        };
    }
    cleanup() {
        this.clearInactivityTimer();
        this.removeAllListeners();
        this.participants.clear();
        this.roomLogger.info('Room cleanup completed');
    }
    updateActivity() {
        this.lastActivity = new Date();
        if (this.status === 'active') {
            this.startInactivityTimer();
        }
    }
    startInactivityTimer() {
        this.clearInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
            this.roomLogger.info('Room inactivity timeout reached');
            this.emit('inactivityTimeout');
            this.emit('persistenceRequired', 'inactivity');
        }, this.inactivityTimeoutMs);
    }
    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = undefined;
        }
    }
}
exports.InteractionRoom = InteractionRoom;
//# sourceMappingURL=InteractionRoom.js.map