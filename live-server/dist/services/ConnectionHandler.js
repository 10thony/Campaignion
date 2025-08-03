"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionHandler = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
class ConnectionHandler extends events_1.EventEmitter {
    connections = new Map();
    heartbeatTimers = new Map();
    reconnectTimers = new Map();
    dmGraceTimers = new Map();
    config;
    roomManager;
    eventBroadcaster;
    constructor(roomManager, eventBroadcaster, config = {}) {
        super();
        this.roomManager = roomManager;
        this.eventBroadcaster = eventBroadcaster;
        this.config = {
            heartbeatIntervalMs: config.heartbeatIntervalMs ?? 30000,
            connectionTimeoutMs: config.connectionTimeoutMs ?? 90000,
            maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
            dmDisconnectGraceMs: config.dmDisconnectGraceMs ?? 120000,
            stateRecoveryTimeoutMs: config.stateRecoveryTimeoutMs ?? 30000,
        };
        this.setupRoomManagerListeners();
        logger_1.logger.info('ConnectionHandler initialized', {
            config: this.config,
            timestamp: new Date().toISOString(),
        });
    }
    registerConnection(userId, connectionId, interactionId) {
        const existingConnection = this.connections.get(userId);
        if (existingConnection) {
            existingConnection.connectionId = connectionId;
            existingConnection.isConnected = true;
            existingConnection.lastSeen = new Date();
            existingConnection.reconnectAttempts = 0;
            existingConnection.disconnectReason = undefined;
            logger_1.logger.info('Connection updated for user', {
                userId,
                connectionId,
                interactionId,
                previousConnectionId: existingConnection.connectionId,
            });
            this.handleReconnection(userId, interactionId, connectionId);
        }
        else {
            const connection = {
                userId,
                connectionId,
                isConnected: true,
                lastSeen: new Date(),
                reconnectAttempts: 0,
            };
            this.connections.set(userId, connection);
            logger_1.logger.info('New connection registered', {
                userId,
                connectionId,
                interactionId,
            });
        }
        this.startHeartbeat(userId);
    }
    updateHeartbeat(userId) {
        const connection = this.connections.get(userId);
        if (connection && connection.isConnected) {
            connection.lastSeen = new Date();
            logger_1.logger.debug('Heartbeat updated', {
                userId,
                connectionId: connection.connectionId,
                lastSeen: connection.lastSeen,
            });
        }
    }
    handleDisconnect(userId, reason = 'Connection lost') {
        const connection = this.connections.get(userId);
        if (!connection || !connection.isConnected) {
            return;
        }
        connection.isConnected = false;
        connection.disconnectReason = reason;
        this.stopHeartbeat(userId);
        const room = this.findUserRoom(userId);
        if (!room) {
            logger_1.logger.warn('Disconnect handled for user not in any room', { userId, reason });
            return;
        }
        const participant = room.getParticipant(userId);
        if (!participant) {
            logger_1.logger.warn('Disconnect handled for user not found in room', {
                userId,
                roomId: room.id,
                reason
            });
            return;
        }
        room.updateParticipantConnection(userId, false);
        const isDM = this.isDMUser(userId, room.interactionId);
        if (isDM) {
            this.handleDMDisconnect(userId, room.interactionId, reason);
        }
        else {
            this.handlePlayerDisconnect(userId, room.interactionId, reason);
        }
        logger_1.logger.info('Connection disconnect handled', {
            userId,
            interactionId: room.interactionId,
            reason,
            isDM,
            participantType: participant.entityType,
        });
    }
    async handleReconnection(userId, interactionId, connectionId) {
        const connection = this.connections.get(userId);
        if (!connection) {
            logger_1.logger.warn('Reconnection attempted for unknown user', { userId, interactionId });
            return;
        }
        const room = this.roomManager.getRoomByInteractionId(interactionId);
        if (!room) {
            logger_1.logger.error('Reconnection attempted for non-existent room', { userId, interactionId });
            return;
        }
        this.clearReconnectTimer(userId);
        this.clearDMGraceTimer(interactionId);
        connection.isConnected = true;
        connection.connectionId = connectionId;
        connection.lastSeen = new Date();
        connection.reconnectAttempts = 0;
        connection.disconnectReason = undefined;
        room.updateParticipantConnection(userId, true, connectionId);
        const isDM = this.isDMUser(userId, interactionId);
        if (isDM) {
            if (room.status === 'paused') {
                await this.roomManager.resumeRoom(interactionId);
                await this.eventBroadcaster.broadcast(interactionId, {
                    type: 'DM_RECONNECTED',
                    userId,
                    interactionId,
                    connectionId,
                    timestamp: Date.now(),
                });
            }
            logger_1.logger.info('DM reconnected, interaction resumed', {
                userId,
                interactionId,
                connectionId,
            });
        }
        else {
            await this.eventBroadcaster.broadcast(interactionId, {
                type: 'PLAYER_RECONNECTED',
                userId,
                interactionId,
                connectionId,
                timestamp: Date.now(),
            });
            logger_1.logger.info('Player reconnected', {
                userId,
                interactionId,
                connectionId,
            });
        }
        this.emit('connectionEvent', {
            type: 'STATE_SYNC_REQUIRED',
            userId,
            interactionId,
        });
        await this.synchronizeUserState(userId, interactionId);
    }
    removeConnection(userId) {
        const connection = this.connections.get(userId);
        if (!connection) {
            return;
        }
        this.stopHeartbeat(userId);
        this.clearReconnectTimer(userId);
        this.connections.delete(userId);
        logger_1.logger.info('Connection removed', {
            userId,
            connectionId: connection.connectionId,
        });
    }
    getConnectionStatus(userId) {
        return this.connections.get(userId);
    }
    getAllConnectionStatuses() {
        return Array.from(this.connections.values());
    }
    isUserConnected(userId) {
        const connection = this.connections.get(userId);
        return connection?.isConnected ?? false;
    }
    async handleStateCorruption(interactionId, errorDetails) {
        logger_1.logger.error('State corruption detected, initiating recovery', {
            interactionId,
            errorDetails,
        });
        try {
            const room = this.roomManager.getRoomByInteractionId(interactionId);
            if (!room) {
                throw new Error('Room not found for state recovery');
            }
            await this.roomManager.pauseRoom(interactionId, 'State corruption recovery');
            this.emit('connectionEvent', {
                type: 'ERROR_RECOVERY_INITIATED',
                interactionId,
                errorType: 'state_corruption',
            });
            await this.eventBroadcaster.broadcast(interactionId, {
                type: 'ERROR',
                error: {
                    code: 'STATE_CORRUPTION',
                    message: 'Game state corruption detected. Recovery in progress.',
                    details: { recoveryId: `recovery_${Date.now()}` },
                },
                timestamp: Date.now(),
                interactionId,
            });
            logger_1.logger.info('State corruption recovery completed', {
                interactionId,
                recoveryTime: new Date().toISOString(),
            });
            setTimeout(async () => {
                try {
                    await this.roomManager.resumeRoom(interactionId);
                    await this.eventBroadcaster.broadcast(interactionId, {
                        type: 'INTERACTION_RESUMED',
                        timestamp: Date.now(),
                        interactionId,
                    });
                }
                catch (error) {
                    logger_1.logger.error('Failed to resume interaction after recovery', {
                        interactionId,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }, this.config.stateRecoveryTimeoutMs);
        }
        catch (error) {
            logger_1.logger.error('State corruption recovery failed', {
                interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
            await this.roomManager.completeRoom(interactionId, 'State corruption recovery failed');
        }
    }
    handleConcurrentActionConflict(interactionId, conflictingActions, resolution = 'first_wins') {
        logger_1.logger.warn('Concurrent action conflict detected', {
            interactionId,
            conflictCount: conflictingActions.length,
            resolution,
        });
        this.eventBroadcaster.broadcast(interactionId, {
            type: 'ERROR',
            error: {
                code: 'CONCURRENT_ACTION_CONFLICT',
                message: `Concurrent actions detected. Resolution: ${resolution}`,
                details: {
                    conflictingActions: conflictingActions.length,
                    resolution,
                },
            },
            timestamp: Date.now(),
            interactionId,
        });
    }
    cleanup() {
        logger_1.logger.info('Cleaning up ConnectionHandler resources');
        for (const timer of this.heartbeatTimers.values()) {
            clearInterval(timer);
        }
        this.heartbeatTimers.clear();
        for (const timer of this.reconnectTimers.values()) {
            clearTimeout(timer);
        }
        this.reconnectTimers.clear();
        for (const timer of this.dmGraceTimers.values()) {
            clearTimeout(timer);
        }
        this.dmGraceTimers.clear();
        this.connections.clear();
        this.removeAllListeners();
        logger_1.logger.info('ConnectionHandler cleanup completed');
    }
    setupRoomManagerListeners() {
        this.roomManager.on('participantJoined', ({ room, participant }) => {
            this.registerConnection(participant.userId, participant.connectionId, room.interactionId);
        });
        this.roomManager.on('participantLeft', ({ room, userId }) => {
            this.handleDisconnect(userId, 'Left room');
        });
    }
    startHeartbeat(userId) {
        this.stopHeartbeat(userId);
        const timer = setInterval(() => {
            this.checkConnectionHealth(userId);
        }, this.config.heartbeatIntervalMs);
        this.heartbeatTimers.set(userId, timer);
    }
    stopHeartbeat(userId) {
        const timer = this.heartbeatTimers.get(userId);
        if (timer) {
            clearInterval(timer);
            this.heartbeatTimers.delete(userId);
        }
    }
    checkConnectionHealth(userId) {
        const connection = this.connections.get(userId);
        if (!connection || !connection.isConnected) {
            return;
        }
        const now = Date.now();
        const lastSeen = connection.lastSeen.getTime();
        const timeSinceLastSeen = now - lastSeen;
        if (timeSinceLastSeen > this.config.connectionTimeoutMs) {
            logger_1.logger.warn('Connection timeout detected', {
                userId,
                connectionId: connection.connectionId,
                timeSinceLastSeen,
                timeoutMs: this.config.connectionTimeoutMs,
            });
            this.handleDisconnect(userId, 'Connection timeout');
        }
    }
    handlePlayerDisconnect(userId, interactionId, reason) {
        this.eventBroadcaster.broadcast(interactionId, {
            type: 'PLAYER_DISCONNECTED',
            userId,
            interactionId,
            reason,
            timestamp: Date.now(),
        });
        this.emit('connectionEvent', {
            type: 'PLAYER_DISCONNECTED',
            userId,
            interactionId,
            reason,
        });
        this.startReconnectTimer(userId, interactionId);
    }
    handleDMDisconnect(userId, interactionId, reason) {
        this.eventBroadcaster.broadcast(interactionId, {
            type: 'DM_DISCONNECTED',
            userId,
            interactionId,
            reason,
            timestamp: Date.now(),
        });
        this.emit('connectionEvent', {
            type: 'DM_DISCONNECTED',
            userId,
            interactionId,
            reason,
        });
        this.startDMGraceTimer(userId, interactionId);
    }
    startReconnectTimer(userId, interactionId) {
        const connection = this.connections.get(userId);
        if (!connection)
            return;
        const timer = setTimeout(() => {
            connection.reconnectAttempts++;
            if (connection.reconnectAttempts >= this.config.maxReconnectAttempts) {
                logger_1.logger.warn('Max reconnect attempts reached for user', {
                    userId,
                    interactionId,
                    attempts: connection.reconnectAttempts,
                });
                this.emit('connectionEvent', {
                    type: 'RECONNECT_FAILED',
                    userId,
                    interactionId,
                    attempts: connection.reconnectAttempts,
                });
                this.roomManager.leaveRoom(interactionId, userId);
                this.removeConnection(userId);
            }
            else {
                this.startReconnectTimer(userId, interactionId);
            }
        }, this.config.connectionTimeoutMs);
        this.reconnectTimers.set(userId, timer);
    }
    startDMGraceTimer(userId, interactionId) {
        const timer = setTimeout(async () => {
            logger_1.logger.warn('DM grace period expired, pausing interaction', {
                userId,
                interactionId,
                gracePeriodMs: this.config.dmDisconnectGraceMs,
            });
            await this.roomManager.pauseRoom(interactionId, 'DM disconnected');
            await this.eventBroadcaster.broadcast(interactionId, {
                type: 'INTERACTION_PAUSED',
                reason: 'DM disconnected - interaction paused until DM returns',
                timestamp: Date.now(),
                interactionId,
            });
        }, this.config.dmDisconnectGraceMs);
        this.dmGraceTimers.set(interactionId, timer);
    }
    clearReconnectTimer(userId) {
        const timer = this.reconnectTimers.get(userId);
        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(userId);
        }
    }
    clearDMGraceTimer(interactionId) {
        const timer = this.dmGraceTimers.get(interactionId);
        if (timer) {
            clearTimeout(timer);
            this.dmGraceTimers.delete(interactionId);
        }
    }
    findUserRoom(userId) {
        const rooms = this.roomManager.getAllRooms();
        return rooms.find(room => room.getParticipant(userId));
    }
    isDMUser(userId, interactionId) {
        const room = this.roomManager.getRoomByInteractionId(interactionId);
        if (!room)
            return false;
        const participant = room.getParticipant(userId);
        return participant?.entityType === 'npc' || participant?.entityType === 'monster';
    }
    async synchronizeUserState(userId, interactionId) {
        try {
            const room = this.roomManager.getRoomByInteractionId(interactionId);
            if (!room) {
                throw new Error('Room not found for state synchronization');
            }
            await this.eventBroadcaster.broadcastToUser(interactionId, userId, {
                type: 'STATE_DELTA',
                changes: {
                    fullSync: true,
                    gameState: room.gameState,
                },
                timestamp: Date.now(),
                interactionId,
            });
            logger_1.logger.info('User state synchronized', {
                userId,
                interactionId,
                gameStateTimestamp: room.gameState.timestamp,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to synchronize user state', {
                userId,
                interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}
exports.ConnectionHandler = ConnectionHandler;
//# sourceMappingURL=ConnectionHandler.js.map