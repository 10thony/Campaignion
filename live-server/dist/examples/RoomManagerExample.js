"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveInteractionService = void 0;
exports.exampleUsage = exampleUsage;
const RoomManager_1 = require("../services/RoomManager");
const StatePersistence_1 = require("../services/StatePersistence");
const logger_1 = require("../utils/logger");
const ROOM_MANAGER_CONFIG = {
    inactivityTimeoutMs: 30 * 60 * 1000,
    cleanupIntervalMs: 5 * 60 * 1000,
    maxRooms: 50
};
const PERSISTENCE_CONFIG = {
    convexUrl: process.env['CONVEX_URL'] || 'https://your-convex-url.convex.cloud',
    retryAttempts: 3,
    retryDelayMs: 1000
};
class LiveInteractionService {
    roomManager;
    persistence;
    constructor() {
        this.roomManager = new RoomManager_1.RoomManager(ROOM_MANAGER_CONFIG);
        this.persistence = new StatePersistence_1.StatePersistence(PERSISTENCE_CONFIG);
        this.setupEventHandlers();
        logger_1.logger.info('LiveInteractionService initialized');
    }
    async startLiveInteraction(interactionId, initialGameState) {
        try {
            const room = await this.roomManager.createRoom(interactionId, initialGameState);
            await this.persistence.updateInteractionStatus(interactionId, 'live', {
                liveRoomId: room.id,
                connectedParticipants: [],
                lastActivity: Date.now()
            });
            logger_1.logger.info('Live interaction started', {
                interactionId,
                roomId: room.id
            });
            return room.id;
        }
        catch (error) {
            logger_1.logger.error('Failed to start live interaction', {
                interactionId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async joinInteraction(interactionId, participant) {
        try {
            const room = await this.roomManager.joinRoom(interactionId, participant);
            await this.persistence.saveEventLog(interactionId, 'PARTICIPANT_JOINED', {
                userId: participant.userId,
                entityId: participant.entityId,
                entityType: participant.entityType,
                connectionId: participant.connectionId
            }, participant.userId, participant.entityId);
            const connectedParticipants = room.getAllParticipants()
                .filter(p => p.isConnected)
                .map(p => p.userId);
            await this.persistence.updateInteractionStatus(interactionId, 'live', {
                liveRoomId: room.id,
                connectedParticipants,
                lastActivity: Date.now()
            });
            logger_1.logger.info('Participant joined interaction', {
                interactionId,
                userId: participant.userId,
                entityId: participant.entityId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to join interaction', {
                interactionId,
                userId: participant.userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async leaveInteraction(interactionId, userId) {
        try {
            const success = await this.roomManager.leaveRoom(interactionId, userId);
            if (success) {
                await this.persistence.saveEventLog(interactionId, 'PARTICIPANT_LEFT', { userId }, userId);
                logger_1.logger.info('Participant left interaction', {
                    interactionId,
                    userId
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to leave interaction', {
                interactionId,
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async processTurnAction(interactionId, action) {
        try {
            const room = this.roomManager.getRoomByInteractionId(interactionId);
            if (!room) {
                throw new Error(`Room not found for interaction ${interactionId}`);
            }
            const success = room.processTurnAction(action);
            if (success) {
                const turnRecord = {
                    entityId: action.entityId,
                    entityType: room.gameState.participants.get(action.entityId)?.entityType || 'playerCharacter',
                    turnNumber: room.gameState.currentTurnIndex,
                    roundNumber: room.gameState.roundNumber,
                    actions: [action],
                    startTime: Date.now(),
                    endTime: Date.now(),
                    status: 'completed',
                };
                const userId = room.gameState.participants.get(action.entityId)?.userId;
                if (userId) {
                    turnRecord.userId = userId;
                }
                await this.persistence.saveTurnRecord(interactionId, turnRecord);
                await this.persistence.saveEventLog(interactionId, 'TURN_ACTION', action, room.gameState.participants.get(action.entityId)?.userId, action.entityId);
                logger_1.logger.info('Turn action processed', {
                    interactionId,
                    entityId: action.entityId,
                    actionType: action.type
                });
            }
            return success;
        }
        catch (error) {
            logger_1.logger.error('Failed to process turn action', {
                interactionId,
                action,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async pauseInteraction(interactionId, reason = 'Manual pause') {
        try {
            const success = await this.roomManager.pauseRoom(interactionId, reason);
            if (success) {
                await this.persistence.updateInteractionStatus(interactionId, 'paused');
                logger_1.logger.info('Interaction paused', {
                    interactionId,
                    reason
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to pause interaction', {
                interactionId,
                reason,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async resumeInteraction(interactionId) {
        try {
            const success = await this.roomManager.resumeRoom(interactionId);
            if (success) {
                await this.persistence.updateInteractionStatus(interactionId, 'live');
                logger_1.logger.info('Interaction resumed', { interactionId });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to resume interaction', {
                interactionId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    async completeInteraction(interactionId, reason = 'Session completed') {
        try {
            const success = await this.roomManager.completeRoom(interactionId, reason);
            if (success) {
                await this.persistence.updateInteractionStatus(interactionId, 'completed');
                logger_1.logger.info('Interaction completed', {
                    interactionId,
                    reason
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to complete interaction', {
                interactionId,
                reason,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    getStats() {
        return this.roomManager.getStats();
    }
    getRoom(interactionId) {
        return this.roomManager.getRoomByInteractionId(interactionId);
    }
    shutdown() {
        this.roomManager.shutdown();
        logger_1.logger.info('LiveInteractionService shutdown completed');
    }
    setupEventHandlers() {
        this.roomManager.on('persistenceRequired', async ({ room, trigger }) => {
            try {
                if (this.persistence.shouldPersist(trigger)) {
                    await this.persistence.saveSnapshot(room, trigger);
                    logger_1.logger.debug('State snapshot saved', {
                        interactionId: room.interactionId,
                        trigger
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to save state snapshot', {
                    interactionId: room.interactionId,
                    trigger,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        this.roomManager.on('roomCleanup', async ({ room, reason }) => {
            try {
                await this.persistence.saveSnapshot(room, 'cleanup');
                await this.persistence.updateInteractionStatus(room.interactionId, 'idle');
                logger_1.logger.info('Room cleaned up', {
                    interactionId: room.interactionId,
                    reason
                });
            }
            catch (error) {
                logger_1.logger.error('Error during room cleanup', {
                    interactionId: room.interactionId,
                    reason,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        this.roomManager.on('roomEvent', async ({ room, event }) => {
            try {
                await this.persistence.saveEventLog(room.interactionId, event.type, event, 'userId' in event ? event.userId : undefined, 'entityId' in event ? event.entityId : undefined);
            }
            catch (error) {
                logger_1.logger.error('Failed to log room event', {
                    interactionId: room.interactionId,
                    eventType: event.type,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        this.roomManager.on('participantJoined', ({ room, participant }) => {
            logger_1.logger.info('Participant joined room', {
                interactionId: room.interactionId,
                userId: participant.userId,
                entityId: participant.entityId
            });
        });
        this.roomManager.on('participantLeft', ({ room, userId }) => {
            logger_1.logger.info('Participant left room', {
                interactionId: room.interactionId,
                userId
            });
        });
    }
}
exports.LiveInteractionService = LiveInteractionService;
async function exampleUsage() {
    const service = new LiveInteractionService();
    try {
        const gameState = {
            interactionId: 'example-interaction-1',
            status: 'active',
            initiativeOrder: [
                { entityId: 'player1', entityType: 'playerCharacter', initiative: 15, userId: 'user1' },
                { entityId: 'goblin1', entityType: 'monster', initiative: 12 }
            ],
            currentTurnIndex: 0,
            roundNumber: 1,
            participants: new Map(),
            mapState: {
                width: 20,
                height: 20,
                entities: new Map(),
                obstacles: [],
                terrain: []
            },
            turnHistory: [],
            chatLog: [],
            timestamp: new Date()
        };
        const roomId = await service.startLiveInteraction('example-interaction-1', gameState);
        console.log('Live interaction started with room ID:', roomId);
        await service.joinInteraction('example-interaction-1', {
            userId: 'user1',
            entityId: 'player1',
            entityType: 'playerCharacter',
            connectionId: 'conn1',
            isConnected: true,
            lastActivity: new Date()
        });
        await service.processTurnAction('example-interaction-1', {
            type: 'move',
            entityId: 'player1',
            position: { x: 5, y: 5 }
        });
        const stats = service.getStats();
        console.log('Service stats:', stats);
        await service.completeInteraction('example-interaction-1', 'Example completed');
    }
    catch (error) {
        console.error('Example failed:', error);
    }
    finally {
        service.shutdown();
    }
}
//# sourceMappingURL=RoomManagerExample.js.map