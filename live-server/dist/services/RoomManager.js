"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const InteractionRoom_1 = require("./InteractionRoom");
const logger_1 = require("../utils/logger");
const events_1 = require("events");
class RoomManager extends events_1.EventEmitter {
    rooms;
    cleanupInterval;
    config;
    managerLogger;
    constructor(config = {}) {
        super();
        this.rooms = new Map();
        this.config = {
            inactivityTimeoutMs: config.inactivityTimeoutMs || 30 * 60 * 1000,
            cleanupIntervalMs: config.cleanupIntervalMs || 5 * 60 * 1000,
            maxRooms: config.maxRooms || 100
        };
        this.managerLogger = logger_1.logger.child({ component: 'RoomManager' });
        this.startCleanupInterval();
        this.managerLogger.info('RoomManager initialized', this.config);
    }
    async createRoom(interactionId, initialGameState) {
        const existingRoom = this.findRoomByInteractionId(interactionId);
        if (existingRoom) {
            this.managerLogger.warn('Attempted to create room for existing interaction', {
                interactionId,
                existingRoomId: existingRoom.id
            });
            throw new Error(`Room already exists for interaction ${interactionId}`);
        }
        if (this.rooms.size >= this.config.maxRooms) {
            this.managerLogger.error('Maximum room limit reached', {
                currentRooms: this.rooms.size,
                maxRooms: this.config.maxRooms
            });
            throw new Error('Maximum room limit reached');
        }
        const room = new InteractionRoom_1.InteractionRoom(interactionId, initialGameState, this.config.inactivityTimeoutMs);
        this.setupRoomEventListeners(room);
        this.rooms.set(room.id, room);
        this.managerLogger.info('Room created', {
            roomId: room.id,
            interactionId,
            totalRooms: this.rooms.size
        });
        this.emit('roomCreated', room);
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }
    getRoomByInteractionId(interactionId) {
        return this.findRoomByInteractionId(interactionId);
    }
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    getActiveRooms() {
        return this.getAllRooms().filter(room => room.status === 'active');
    }
    async joinRoom(interactionId, participant) {
        const room = this.findRoomByInteractionId(interactionId);
        if (!room) {
            this.managerLogger.error('Attempted to join non-existent room', {
                interactionId,
                userId: participant.userId
            });
            throw new Error(`Room not found for interaction ${interactionId}`);
        }
        if (room.status === 'completed') {
            this.managerLogger.error('Attempted to join completed room', {
                interactionId,
                userId: participant.userId,
                roomStatus: room.status
            });
            throw new Error('Cannot join completed interaction');
        }
        const existingParticipant = room.getParticipant(participant.userId);
        if (existingParticipant) {
            room.updateParticipantConnection(participant.userId, true, participant.connectionId);
            this.managerLogger.info('Participant reconnected to room', {
                roomId: room.id,
                interactionId,
                userId: participant.userId
            });
        }
        else {
            room.addParticipant(participant);
            this.managerLogger.info('Participant joined room', {
                roomId: room.id,
                interactionId,
                userId: participant.userId,
                entityId: participant.entityId
            });
        }
        this.emit('participantJoined', { room, participant });
        return room;
    }
    async leaveRoom(interactionId, userId) {
        const room = this.findRoomByInteractionId(interactionId);
        if (!room) {
            this.managerLogger.warn('Attempted to leave non-existent room', {
                interactionId,
                userId
            });
            return false;
        }
        const participant = room.getParticipant(userId);
        if (!participant) {
            this.managerLogger.warn('Attempted to leave room as non-participant', {
                interactionId,
                userId,
                roomId: room.id
            });
            return false;
        }
        room.updateParticipantConnection(userId, false);
        this.managerLogger.info('Participant left room', {
            roomId: room.id,
            interactionId,
            userId,
            entityId: participant.entityId
        });
        this.emit('participantLeft', { room, userId, participant });
        return true;
    }
    async pauseRoom(interactionId, reason = 'Manual pause') {
        const room = this.findRoomByInteractionId(interactionId);
        if (!room) {
            this.managerLogger.error('Attempted to pause non-existent room', { interactionId });
            return false;
        }
        room.pause(reason);
        this.managerLogger.info('Room paused', {
            roomId: room.id,
            interactionId,
            reason
        });
        this.emit('roomPaused', { room, reason });
        return true;
    }
    async resumeRoom(interactionId) {
        const room = this.findRoomByInteractionId(interactionId);
        if (!room) {
            this.managerLogger.error('Attempted to resume non-existent room', { interactionId });
            return false;
        }
        room.resume();
        this.managerLogger.info('Room resumed', {
            roomId: room.id,
            interactionId
        });
        this.emit('roomResumed', { room });
        return true;
    }
    async completeRoom(interactionId, reason = 'Interaction completed') {
        const room = this.findRoomByInteractionId(interactionId);
        if (!room) {
            this.managerLogger.error('Attempted to complete non-existent room', { interactionId });
            return false;
        }
        room.complete(reason);
        this.managerLogger.info('Room completed', {
            roomId: room.id,
            interactionId,
            reason
        });
        this.emit('roomCompleted', { room, reason });
        return true;
    }
    async removeRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            this.managerLogger.warn('Attempted to remove non-existent room', { roomId });
            return false;
        }
        room.cleanup();
        this.rooms.delete(roomId);
        this.managerLogger.info('Room removed', {
            roomId,
            interactionId: room.interactionId,
            totalRooms: this.rooms.size
        });
        this.emit('roomRemoved', { roomId, interactionId: room.interactionId });
        return true;
    }
    async cleanupInactiveRooms() {
        const inactiveRooms = [];
        for (const room of this.rooms.values()) {
            if (room.isInactive() && room.status !== 'paused') {
                inactiveRooms.push(room);
            }
        }
        this.managerLogger.info('Starting cleanup of inactive rooms', {
            inactiveRoomCount: inactiveRooms.length,
            totalRooms: this.rooms.size
        });
        let cleanedCount = 0;
        for (const room of inactiveRooms) {
            try {
                this.emit('roomCleanup', { room, reason: 'inactivity' });
                await this.removeRoom(room.id);
                cleanedCount++;
            }
            catch (error) {
                this.managerLogger.error('Error cleaning up room', {
                    roomId: room.id,
                    interactionId: room.interactionId,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        if (cleanedCount > 0) {
            this.managerLogger.info('Inactive room cleanup completed', {
                cleanedCount,
                remainingRooms: this.rooms.size
            });
        }
        return cleanedCount;
    }
    getStats() {
        const rooms = this.getAllRooms();
        const activeRooms = rooms.filter(r => r.status === 'active');
        const pausedRooms = rooms.filter(r => r.status === 'paused');
        const completedRooms = rooms.filter(r => r.status === 'completed');
        const totalParticipants = rooms.reduce((sum, room) => sum + room.participants.size, 0);
        const connectedParticipants = rooms.reduce((sum, room) => sum + room.getAllParticipants().filter(p => p.isConnected).length, 0);
        return {
            totalRooms: this.rooms.size,
            activeRooms: activeRooms.length,
            pausedRooms: pausedRooms.length,
            completedRooms: completedRooms.length,
            totalParticipants,
            connectedParticipants,
            config: this.config
        };
    }
    shutdown() {
        this.managerLogger.info('Shutting down RoomManager');
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        for (const room of this.rooms.values()) {
            room.cleanup();
        }
        this.rooms.clear();
        this.removeAllListeners();
        this.managerLogger.info('RoomManager shutdown completed');
    }
    findRoomByInteractionId(interactionId) {
        for (const room of this.rooms.values()) {
            if (room.interactionId === interactionId) {
                return room;
            }
        }
        return null;
    }
    setupRoomEventListeners(room) {
        room.on('inactivityTimeout', () => {
            this.managerLogger.info('Room inactivity timeout', {
                roomId: room.id,
                interactionId: room.interactionId
            });
            this.emit('roomCleanup', { room, reason: 'inactivity' });
        });
        room.on('persistenceRequired', (trigger) => {
            this.managerLogger.debug('Room persistence required', {
                roomId: room.id,
                interactionId: room.interactionId,
                trigger
            });
            this.emit('persistenceRequired', { room, trigger });
        });
        room.on('participantJoined', (event) => {
            this.emit('roomEvent', { room, event });
        });
        room.on('participantLeft', (event) => {
            this.emit('roomEvent', { room, event });
        });
        room.on('turnCompleted', (event) => {
            this.emit('roomEvent', { room, event });
        });
        room.on('interactionPaused', (event) => {
            this.emit('roomEvent', { room, event });
        });
        room.on('interactionResumed', (event) => {
            this.emit('roomEvent', { room, event });
        });
        room.on('stateChanged', (gameState) => {
            this.emit('roomStateChanged', { room, gameState });
        });
    }
    startCleanupInterval() {
        this.cleanupInterval = setInterval(async () => {
            try {
                await this.cleanupInactiveRooms();
            }
            catch (error) {
                this.managerLogger.error('Error during scheduled cleanup', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }, this.config.cleanupIntervalMs);
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=RoomManager.js.map