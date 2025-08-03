import { z } from 'zod';
import { observable } from '@trpc/server/observable';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../utils/trpc';
import { protectedProcedure, dmOnlyProcedure } from '../middleware/auth';
import { logger } from '../utils/logger';
import { RoomManager } from '../services/RoomManager';
import { EventBroadcaster } from '../services/EventBroadcaster';
import { ChatService } from '../services/ChatService';
import { TurnActionSchema, GameEventSchema } from '../schemas';
import { GameState, Participant, GameEvent, TurnAction } from '../types';

// Global instances - in a production environment, these would be managed by a service container
const roomManager = new RoomManager();
const eventBroadcaster = new EventBroadcaster();
const chatService = new ChatService(eventBroadcaster);

/**
 * Interaction router for live D&D sessions
 * Provides real-time interaction management with room operations, game actions, and subscriptions
 */
export const interactionRouter = router({
  /**
   * Health check for the interaction system
   */
  health: publicProcedure
    .query(() => {
      const stats = roomManager.getStats();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'live-interaction-system',
        stats,
      };
    }),

  // Room Management Procedures

  /**
   * Join a live interaction room
   */
  joinRoom: protectedProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
      entityId: z.string().min(1, 'Entity ID is required'),
      entityType: z.enum(['playerCharacter', 'npc', 'monster']),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('User attempting to join room', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          entityId: input.entityId,
        });

        // Check if room exists, if not create it with basic game state
        let room = roomManager.getRoomByInteractionId(input.interactionId);
        
        if (!room) {
          // Create initial game state for new room
          const initialGameState: GameState = {
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
          logger.info('Created new room for interaction', {
            roomId: room.id,
            interactionId: input.interactionId,
          });
        }

        // Create participant
        const participant: Participant = {
          userId: ctx.user.userId,
          entityId: input.entityId,
          entityType: input.entityType,
          connectionId: ctx.connectionId || 'unknown',
          isConnected: true,
          lastActivity: new Date(),
        };

        // Join the room
        await roomManager.joinRoom(input.interactionId, participant);

        // Get updated room state
        const gameState = room.gameState;

        logger.info('User successfully joined room', {
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

      } catch (error) {
        logger.error('Failed to join room', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to join room',
        });
      }
    }),

  /**
   * Leave a live interaction room
   */
  leaveRoom: protectedProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('User leaving room', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
        });

        const success = await roomManager.leaveRoom(input.interactionId, ctx.user.userId);

        if (!success) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Room not found or user not in room',
          });
        }

        logger.info('User successfully left room', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
        });

        return {
          success: true,
          message: 'Successfully left room',
        };

      } catch (error) {
        logger.error('Failed to leave room', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to leave room',
        });
      }
    }),

  /**
   * DM-only procedure to pause an interaction
   */
  pauseInteraction: dmOnlyProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
      reason: z.string().optional().default('Manual pause'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('DM pausing interaction', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          reason: input.reason,
        });

        const success = await roomManager.pauseRoom(input.interactionId, input.reason);

        if (!success) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Interaction not found',
          });
        }

        // Broadcast pause event
        await eventBroadcaster.broadcast(input.interactionId, {
          type: 'INTERACTION_PAUSED',
          timestamp: Date.now(),
          interactionId: input.interactionId,
          reason: input.reason,
        });

        logger.info('Interaction successfully paused', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          reason: input.reason,
        });

        return {
          success: true,
          message: 'Interaction paused successfully',
          reason: input.reason,
        };

      } catch (error) {
        logger.error('Failed to pause interaction', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to pause interaction',
        });
      }
    }),

  /**
   * DM-only procedure to resume an interaction
   */
  resumeInteraction: dmOnlyProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('DM resuming interaction', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
        });

        const success = await roomManager.resumeRoom(input.interactionId);

        if (!success) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Interaction not found',
          });
        }

        // Broadcast resume event
        await eventBroadcaster.broadcast(input.interactionId, {
          type: 'INTERACTION_RESUMED',
          timestamp: Date.now(),
          interactionId: input.interactionId,
        });

        logger.info('Interaction successfully resumed', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
        });

        return {
          success: true,
          message: 'Interaction resumed successfully',
        };

      } catch (error) {
        logger.error('Failed to resume interaction', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resume interaction',
        });
      }
    }),

  // Game Action Procedures

  /**
   * Take a turn action in the game
   */
  takeTurn: protectedProcedure
    .input(TurnActionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('User taking turn action', {
          userId: ctx.user.userId,
          entityId: input.entityId,
          actionType: input.type,
        });

        // Find the room by checking all rooms for the entity
        const room = roomManager.getAllRooms().find(r => 
          r.gameState.participants.has(input.entityId)
        );

        if (!room) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Room not found for entity',
          });
        }

        // Verify user owns the entity
        const participant = room.getParticipant(ctx.user.userId);
        if (!participant || participant.entityId !== input.entityId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only control your own entities',
          });
        }

        // Process the turn action through the room
        const success = room.processTurnAction(input as TurnAction);

        if (!success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid turn action',
          });
        }

        // Broadcast the action result
        await eventBroadcaster.broadcast(room.interactionId, {
          type: 'TURN_COMPLETED',
          entityId: input.entityId,
          actions: [input as any],
          timestamp: Date.now(),
          interactionId: room.interactionId,
        } as any);

        logger.info('Turn action completed successfully', {
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

      } catch (error) {
        logger.error('Failed to process turn action', {
          userId: ctx.user.userId,
          entityId: input.entityId,
          actionType: input.type,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process turn action',
        });
      }
    }),

  /**
   * Skip the current turn
   */
  skipTurn: protectedProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
      reason: z.string().optional().default('Manual skip'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('User skipping turn', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          reason: input.reason,
        });

        const room = roomManager.getRoomByInteractionId(input.interactionId);
        if (!room) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Room not found',
          });
        }

        // Verify it's the user's turn
        const currentEntity = room.gameState.initiativeOrder[room.gameState.currentTurnIndex];
        
        if (!currentEntity) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No active turn to skip',
          });
        }

        const participant = room.getParticipant(ctx.user.userId);
        if (!participant || participant.entityId !== currentEntity.entityId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only skip your own turn',
          });
        }

        // Skip the turn by advancing to next turn
        const nextTurnIndex = (room.gameState.currentTurnIndex + 1) % room.gameState.initiativeOrder.length;
        const nextRound = nextTurnIndex === 0 ? room.gameState.roundNumber + 1 : room.gameState.roundNumber;
        
        room.updateGameState({
          currentTurnIndex: nextTurnIndex,
          roundNumber: nextRound,
        });

        // Broadcast skip event
        await eventBroadcaster.broadcast(input.interactionId, {
          type: 'TURN_SKIPPED',
          entityId: currentEntity.entityId,
          reason: input.reason,
          timestamp: Date.now(),
          interactionId: input.interactionId,
        });

        logger.info('Turn skipped successfully', {
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

      } catch (error) {
        logger.error('Failed to skip turn', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to skip turn',
        });
      }
    }),

  /**
   * DM-only procedure to backtrack a turn
   */
  backtrackTurn: dmOnlyProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
      turnNumber: z.number().min(0, 'Turn number must be non-negative'),
      reason: z.string().optional().default('DM correction'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('DM backtracking turn', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          turnNumber: input.turnNumber,
          reason: input.reason,
        });

        const room = roomManager.getRoomByInteractionId(input.interactionId);
        if (!room) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Room not found',
          });
        }

        // For now, this is a placeholder implementation
        // In a full implementation, this would restore game state to a previous turn
        logger.warn('Turn backtracking not fully implemented', {
          interactionId: input.interactionId,
          turnNumber: input.turnNumber,
        });

        // Broadcast backtrack event
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

      } catch (error) {
        logger.error('Failed to backtrack turn', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          turnNumber: input.turnNumber,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to backtrack turn',
        });
      }
    }),

  // Real-time Subscription Endpoints

  /**
   * Real-time subscription for room updates
   */
  roomUpdates: protectedProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
    }))
    .subscription(({ input, ctx }) => {
      logger.info('User subscribing to room updates', {
        userId: ctx.user.userId,
        interactionId: input.interactionId,
      });

      return observable<GameEvent>((emit) => {
        // Subscribe to all event types for this room
        const subscriptionId = eventBroadcaster.subscribe(
          input.interactionId,
          ['*'], // Subscribe to all event types
          (event: GameEvent) => {
            try {
              // Validate the event before emitting
              const validatedEvent = GameEventSchema.parse(event);
              emit.next(validatedEvent);
            } catch (error) {
              logger.error('Invalid event in subscription', {
                userId: ctx.user.userId,
                interactionId: input.interactionId,
                error: error instanceof Error ? error.message : String(error),
              });
              emit.error(new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Invalid event data',
              }));
            }
          },
          ctx.user.userId
        );

        logger.debug('Room subscription established', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          subscriptionId,
        });

        // Send initial connection event
        emit.next({
          type: 'PARTICIPANT_JOINED',
          userId: ctx.user.userId,
          entityId: 'unknown', // This would be determined from room state
        });

        // Cleanup function
        return () => {
          logger.debug('Room subscription cleanup', {
            userId: ctx.user.userId,
            interactionId: input.interactionId,
            subscriptionId,
          });
          
          eventBroadcaster.unsubscribe(subscriptionId);
        };
      });
    }),

  /**
   * Get current room state
   */
  getRoomState: protectedProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.debug('User requesting room state', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
        });

        const room = roomManager.getRoomByInteractionId(input.interactionId);
        if (!room) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Room not found',
          });
        }

        // Verify user is in the room
        const participant = room.getParticipant(ctx.user.userId);
        if (!participant) {
          throw new TRPCError({
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

      } catch (error) {
        logger.error('Failed to get room state', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get room state',
        });
      }
    }),

  // Chat System Endpoints

  /**
   * Send a chat message
   */
  sendChatMessage: protectedProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
      content: z.string().min(1, 'Message content is required').max(1000, 'Message too long'),
      type: z.enum(['party', 'dm', 'private']),
      recipients: z.array(z.string()).optional(),
      entityId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('User sending chat message', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          type: input.type,
          contentLength: input.content.length,
          recipientCount: input.recipients?.length || 0,
        });

        const room = roomManager.getRoomByInteractionId(input.interactionId);
        if (!room) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Room not found',
          });
        }

        // Verify user is in the room
        const participant = room.getParticipant(ctx.user.userId);
        if (!participant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this room',
          });
        }

        // Validate chat permissions
        const permissionCheck = chatService.validateChatPermissions(
          ctx.user.userId,
          input.type,
          room.participants,
          input.recipients
        );

        if (!permissionCheck.allowed) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: permissionCheck.reason || 'Chat permission denied',
          });
        }

        // Send the message
        const chatMessage = await chatService.sendMessage(
          input.interactionId,
          ctx.user.userId,
          input.content,
          input.type,
          input.recipients,
          input.entityId || participant.entityId
        );

        // Add message to room's game state
        chatService.addMessageToHistory(room.gameState, chatMessage);

        logger.info('Chat message sent successfully', {
          messageId: chatMessage.id,
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          type: input.type,
        });

        return {
          success: true,
          message: chatMessage,
        };

      } catch (error) {
        logger.error('Failed to send chat message', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          type: input.type,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send chat message',
        });
      }
    }),

  /**
   * Get chat history for an interaction
   */
  getChatHistory: protectedProcedure
    .input(z.object({
      interactionId: z.string().min(1, 'Interaction ID is required'),
      channelType: z.enum(['party', 'dm', 'private', 'system']).optional(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input, ctx }) => {
      try {
        logger.debug('User requesting chat history', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          channelType: input.channelType,
          limit: input.limit,
        });

        const room = roomManager.getRoomByInteractionId(input.interactionId);
        if (!room) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Room not found',
          });
        }

        // Verify user is in the room
        const participant = room.getParticipant(ctx.user.userId);
        if (!participant) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a participant in this room',
          });
        }

        // Get chat history
        const messages = chatService.getChatHistory(
          room.gameState,
          ctx.user.userId,
          input.channelType,
          input.limit
        );

        return {
          success: true,
          messages,
          totalCount: room.gameState.chatLog.length,
        };

      } catch (error) {
        logger.error('Failed to get chat history', {
          userId: ctx.user.userId,
          interactionId: input.interactionId,
          channelType: input.channelType,
          error: error instanceof Error ? error.message : String(error),
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get chat history',
        });
      }
    }),
});