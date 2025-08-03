"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactionRouter = void 0;
const zod_1 = require("zod");
const observable_1 = require("@trpc/server/observable");
const server_1 = require("@trpc/server");
const trpc_1 = require("../utils/trpc");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const RoomManager_1 = require("../services/RoomManager");
const EventBroadcaster_1 = require("../services/EventBroadcaster");
const ChatService_1 = require("../services/ChatService");
const schemas_1 = require("../schemas");
const roomManager = new RoomManager_1.RoomManager();
const eventBroadcaster = new EventBroadcaster_1.EventBroadcaster();
const chatService = new ChatService_1.ChatService(eventBroadcaster);
exports.interactionRouter = (0, trpc_1.router)({
    health: trpc_1.publicProcedure
        .query(() => {
        const stats = roomManager.getStats();
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'live-interaction-system',
            stats,
        };
    }),
    joinRoom: auth_1.protectedProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
        entityId: zod_1.z.string().min(1, 'Entity ID is required'),
        entityType: zod_1.z.enum(['playerCharacter', 'npc', 'monster']),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('User attempting to join room', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                entityId: input.entityId,
            });
            let room = roomManager.getRoomByInteractionId(input.interactionId);
            if (!room) {
                const initialGameState = {
                    interactionId: input.interactionId,
                    status: 'waiting',
                    initiativeOrder: [],
                    currentTurnIndex: 0,
                    roundNumber: 1,
                    participants: new Map(),
                    mapState: {
                        width: 20,
                        height: 20,
                        entities: new Map(),
                        obstacles: [],
                        terrain: [],
                    },
                    turnHistory: [],
                    chatLog: [],
                    timestamp: new Date(),
                };
                room = await roomManager.createRoom(input.interactionId, initialGameState);
                logger_1.logger.info('Created new room for interaction', {
                    roomId: room.id,
                    interactionId: input.interactionId,
                });
            }
            const participant = {
                userId: ctx.user.userId,
                entityId: input.entityId,
                entityType: input.entityType,
                connectionId: ctx.connectionId || 'unknown',
                isConnected: true,
                lastActivity: new Date(),
            };
            await roomManager.joinRoom(input.interactionId, participant);
            const gameState = room.gameState;
            logger_1.logger.info('User successfully joined room', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                entityId: input.entityId,
                roomId: room.id,
            });
            return {
                success: true,
                roomId: room.id,
                gameState,
                participantCount: room.participants.size,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to join room', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to join room',
            });
        }
    }),
    leaveRoom: auth_1.protectedProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('User leaving room', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
            });
            const success = await roomManager.leaveRoom(input.interactionId, ctx.user.userId);
            if (!success) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found or user not in room',
                });
            }
            logger_1.logger.info('User successfully left room', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
            });
            return {
                success: true,
                message: 'Successfully left room',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to leave room', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to leave room',
            });
        }
    }),
    pauseInteraction: auth_1.dmOnlyProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
        reason: zod_1.z.string().optional().default('Manual pause'),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('DM pausing interaction', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                reason: input.reason,
            });
            const success = await roomManager.pauseRoom(input.interactionId, input.reason);
            if (!success) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Interaction not found',
                });
            }
            await eventBroadcaster.broadcast(input.interactionId, {
                type: 'INTERACTION_PAUSED',
                timestamp: Date.now(),
                interactionId: input.interactionId,
                reason: input.reason,
            });
            logger_1.logger.info('Interaction successfully paused', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                reason: input.reason,
            });
            return {
                success: true,
                message: 'Interaction paused successfully',
                reason: input.reason,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to pause interaction', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to pause interaction',
            });
        }
    }),
    resumeInteraction: auth_1.dmOnlyProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('DM resuming interaction', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
            });
            const success = await roomManager.resumeRoom(input.interactionId);
            if (!success) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Interaction not found',
                });
            }
            await eventBroadcaster.broadcast(input.interactionId, {
                type: 'INTERACTION_RESUMED',
                timestamp: Date.now(),
                interactionId: input.interactionId,
            });
            logger_1.logger.info('Interaction successfully resumed', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
            });
            return {
                success: true,
                message: 'Interaction resumed successfully',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to resume interaction', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to resume interaction',
            });
        }
    }),
    takeTurn: auth_1.protectedProcedure
        .input(schemas_1.TurnActionSchema)
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('User taking turn action', {
                userId: ctx.user.userId,
                entityId: input.entityId,
                actionType: input.type,
            });
            const room = roomManager.getAllRooms().find(r => r.gameState.participants.has(input.entityId));
            if (!room) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found for entity',
                });
            }
            const participant = room.getParticipant(ctx.user.userId);
            if (!participant || participant.entityId !== input.entityId) {
                throw new server_1.TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You can only control your own entities',
                });
            }
            const success = room.processTurnAction(input);
            if (!success) {
                throw new server_1.TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid turn action',
                });
            }
            await eventBroadcaster.broadcast(room.interactionId, {
                type: 'TURN_COMPLETED',
                entityId: input.entityId,
                actions: [input],
                timestamp: Date.now(),
                interactionId: room.interactionId,
            });
            logger_1.logger.info('Turn action completed successfully', {
                userId: ctx.user.userId,
                entityId: input.entityId,
                actionType: input.type,
                roomId: room.id,
            });
            return {
                success: true,
                result: { valid: true, errors: [] },
                gameState: room.gameState,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to process turn action', {
                userId: ctx.user.userId,
                entityId: input.entityId,
                actionType: input.type,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to process turn action',
            });
        }
    }),
    skipTurn: auth_1.protectedProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
        reason: zod_1.z.string().optional().default('Manual skip'),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('User skipping turn', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                reason: input.reason,
            });
            const room = roomManager.getRoomByInteractionId(input.interactionId);
            if (!room) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found',
                });
            }
            const currentEntity = room.gameState.initiativeOrder[room.gameState.currentTurnIndex];
            if (!currentEntity) {
                throw new server_1.TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'No active turn to skip',
                });
            }
            const participant = room.getParticipant(ctx.user.userId);
            if (!participant || participant.entityId !== currentEntity.entityId) {
                throw new server_1.TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You can only skip your own turn',
                });
            }
            const nextTurnIndex = (room.gameState.currentTurnIndex + 1) % room.gameState.initiativeOrder.length;
            const nextRound = nextTurnIndex === 0 ? room.gameState.roundNumber + 1 : room.gameState.roundNumber;
            room.updateGameState({
                currentTurnIndex: nextTurnIndex,
                roundNumber: nextRound,
            });
            await eventBroadcaster.broadcast(input.interactionId, {
                type: 'TURN_SKIPPED',
                entityId: currentEntity.entityId,
                reason: input.reason,
                timestamp: Date.now(),
                interactionId: input.interactionId,
            });
            logger_1.logger.info('Turn skipped successfully', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                entityId: currentEntity.entityId,
                reason: input.reason,
            });
            return {
                success: true,
                message: 'Turn skipped successfully',
                gameState: room.gameState,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to skip turn', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to skip turn',
            });
        }
    }),
    backtrackTurn: auth_1.dmOnlyProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
        turnNumber: zod_1.z.number().min(0, 'Turn number must be non-negative'),
        reason: zod_1.z.string().optional().default('DM correction'),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('DM backtracking turn', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                turnNumber: input.turnNumber,
                reason: input.reason,
            });
            const room = roomManager.getRoomByInteractionId(input.interactionId);
            if (!room) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found',
                });
            }
            logger_1.logger.warn('Turn backtracking not fully implemented', {
                interactionId: input.interactionId,
                turnNumber: input.turnNumber,
            });
            await eventBroadcaster.broadcast(input.interactionId, {
                type: 'TURN_SKIPPED',
                entityId: 'system',
                reason: `DM backtracked to turn ${input.turnNumber}: ${input.reason}`,
                timestamp: Date.now(),
                interactionId: input.interactionId,
            });
            return {
                success: true,
                message: 'Turn backtrack initiated (placeholder implementation)',
                turnNumber: input.turnNumber,
                reason: input.reason,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to backtrack turn', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                turnNumber: input.turnNumber,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to backtrack turn',
            });
        }
    }),
    roomUpdates: auth_1.protectedProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
    }))
        .subscription(({ input, ctx }) => {
        logger_1.logger.info('User subscribing to room updates', {
            userId: ctx.user.userId,
            interactionId: input.interactionId,
        });
        return (0, observable_1.observable)((emit) => {
            const subscriptionId = eventBroadcaster.subscribe(input.interactionId, ['*'], (event) => {
                try {
                    const validatedEvent = schemas_1.GameEventSchema.parse(event);
                    emit.next(validatedEvent);
                }
                catch (error) {
                    logger_1.logger.error('Invalid event in subscription', {
                        userId: ctx.user.userId,
                        interactionId: input.interactionId,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    emit.error(new server_1.TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Invalid event data',
                    }));
                }
            }, ctx.user.userId);
            logger_1.logger.debug('Room subscription established', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                subscriptionId,
            });
            emit.next({
                type: 'PARTICIPANT_JOINED',
                userId: ctx.user.userId,
                entityId: 'unknown',
            });
            return () => {
                logger_1.logger.debug('Room subscription cleanup', {
                    userId: ctx.user.userId,
                    interactionId: input.interactionId,
                    subscriptionId,
                });
                eventBroadcaster.unsubscribe(subscriptionId);
            };
        });
    }),
    getRoomState: auth_1.protectedProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
    }))
        .query(async ({ input, ctx }) => {
        try {
            logger_1.logger.debug('User requesting room state', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
            });
            const room = roomManager.getRoomByInteractionId(input.interactionId);
            if (!room) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found',
                });
            }
            const participant = room.getParticipant(ctx.user.userId);
            if (!participant) {
                throw new server_1.TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You are not a participant in this room',
                });
            }
            const gameState = room.gameState;
            return {
                success: true,
                gameState,
                roomId: room.id,
                participantCount: room.participants.size,
                status: room.status,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get room state', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to get room state',
            });
        }
    }),
    sendChatMessage: auth_1.protectedProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
        content: zod_1.z.string().min(1, 'Message content is required').max(1000, 'Message too long'),
        type: zod_1.z.enum(['party', 'dm', 'private']),
        recipients: zod_1.z.array(zod_1.z.string()).optional(),
        entityId: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            logger_1.logger.info('User sending chat message', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                type: input.type,
                contentLength: input.content.length,
                recipientCount: input.recipients?.length || 0,
            });
            const room = roomManager.getRoomByInteractionId(input.interactionId);
            if (!room) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found',
                });
            }
            const participant = room.getParticipant(ctx.user.userId);
            if (!participant) {
                throw new server_1.TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You are not a participant in this room',
                });
            }
            const permissionCheck = chatService.validateChatPermissions(ctx.user.userId, input.type, room.participants, input.recipients);
            if (!permissionCheck.allowed) {
                throw new server_1.TRPCError({
                    code: 'FORBIDDEN',
                    message: permissionCheck.reason || 'Chat permission denied',
                });
            }
            const chatMessage = await chatService.sendMessage(input.interactionId, ctx.user.userId, input.content, input.type, input.recipients, input.entityId || participant.entityId);
            chatService.addMessageToHistory(room.gameState, chatMessage);
            logger_1.logger.info('Chat message sent successfully', {
                messageId: chatMessage.id,
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                type: input.type,
            });
            return {
                success: true,
                message: chatMessage,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to send chat message', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                type: input.type,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Failed to send chat message',
            });
        }
    }),
    getChatHistory: auth_1.protectedProcedure
        .input(zod_1.z.object({
        interactionId: zod_1.z.string().min(1, 'Interaction ID is required'),
        channelType: zod_1.z.enum(['party', 'dm', 'private', 'system']).optional(),
        limit: zod_1.z.number().min(1).max(100).optional().default(50),
    }))
        .query(async ({ input, ctx }) => {
        try {
            logger_1.logger.debug('User requesting chat history', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                channelType: input.channelType,
                limit: input.limit,
            });
            const room = roomManager.getRoomByInteractionId(input.interactionId);
            if (!room) {
                throw new server_1.TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Room not found',
                });
            }
            const participant = room.getParticipant(ctx.user.userId);
            if (!participant) {
                throw new server_1.TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You are not a participant in this room',
                });
            }
            const messages = chatService.getChatHistory(room.gameState, ctx.user.userId, input.channelType, input.limit);
            return {
                success: true,
                messages,
                totalCount: room.gameState.chatLog.length,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get chat history', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                channelType: input.channelType,
                error: error instanceof Error ? error.message : String(error),
            });
            if (error instanceof server_1.TRPCError) {
                throw error;
            }
            throw new server_1.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to get chat history',
            });
        }
    }),
});
//# sourceMappingURL=interaction.js.map