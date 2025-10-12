/**
 * Live System API - Consolidated Convex Functions
 * This file provides a unified API for all live D&D interaction functionality
 * Replaces the tRPC server with native Convex functions
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Re-export all live system functions for easy frontend integration

// Room Management Functions
export { 
  createLiveRoom,
  joinLiveRoom,
  leaveLiveRoom,
  pauseLiveRoom,
  resumeLiveRoom,
  getLiveRoomState,
  getSystemHealth,
  updateRoomSettings
} from "./liveRoomManager";

// Turn Management and Combat Functions
export {
  rollInitiative,
  startTurn,
  submitTurnAction,
  skipTurn,
  endCombat
} from "./liveTurnManager";

// Chat System Functions
export {
  sendChatMessage,
  getChatHistory,
  subscribeChatUpdates,
  sendDiceRoll,
  sendSystemMessage,
  editChatMessage
} from "./liveChatSystem";

// Map System Functions
export {
  updateEntityPosition,
  addMapObstacle,
  removeMapObstacle,
  updateMapTerrain,
  getMapState,
  getMovementOptions,
  measureDistance,
  getEntitiesInRange
} from "./liveMapSystem";

// Event System Functions
export {
  broadcastGameEvent,
  getRecentEvents,
  getEventStatistics,
  logSystemMessage,
  getSystemLogs,
  cleanupOldData,
  getSystemHealthMetrics
} from "./liveEventSystem";

// Enhanced Interaction Functions
export {
  getAllInteractionsWithLiveStatus,
  getAllInteractionsWithEnhancedLiveStatus,
  getInteractionWithLiveStatus,
  updateInteractionStatus
} from "./interactions";

/**
 * Comprehensive live system health check
 * Combines room health, system metrics, and error monitoring
 */
export const getComprehensiveSystemHealth = query({
  args: {},
  handler: async (ctx) => {
    // Get system health metrics
    const healthMetrics = await ctx.runQuery("liveEventSystem:getSystemHealthMetrics");
    
    // Get basic system health
    const basicHealth = await ctx.runQuery("liveRoomManager:getSystemHealth");
    
    // Combine results
    return {
      ...basicHealth,
      metrics: healthMetrics.metrics,
      health: healthMetrics.health,
      detailedStatus: {
        liveRooms: {
          active: healthMetrics.metrics.activeRooms,
          total: healthMetrics.metrics.totalRooms,
          participants: healthMetrics.metrics.totalParticipants
        },
        events: {
          recentActivity: healthMetrics.metrics.eventsLastHour,
          eventsPerMinute: healthMetrics.metrics.systemLoad.eventsPerMinute,
          errorRate: healthMetrics.metrics.errorsLast24Hours
        },
        performance: {
          averageEventsPerRoom: healthMetrics.metrics.averageEventsPerRoom,
          activeRoomRatio: healthMetrics.metrics.systemLoad.activeRoomRatio
        }
      }
    };
  },
});

/**
 * Complete room state with all related data
 * Provides everything needed for a full real-time UI update
 */
export const getCompleteRoomState = query({
  args: {
    interactionId: v.id("interactions")
  },
  handler: async (ctx, args) => {
    // Get room state
    const roomState = await ctx.runQuery("liveRoomManager:getLiveRoomState", {
      interactionId: args.interactionId
    });

    if (!roomState) {
      return null;
    }

    // Get map state
    const mapState = await ctx.runQuery("liveMapSystem:getMapState", {
      interactionId: args.interactionId
    });

    // Get recent chat
    const chatUpdates = await ctx.runQuery("liveChatSystem:subscribeChatUpdates", {
      interactionId: args.interactionId
    });

    // Get recent events
    const recentEvents = await ctx.runQuery("liveEventSystem:getRecentEvents", {
      interactionId: args.interactionId,
      limit: 20
    });

    return {
      room: roomState,
      map: mapState,
      chat: chatUpdates,
      events: recentEvents,
      timestamp: Date.now()
    };
  },
});

/**
 * Quick join room with automatic setup
 * Simplifies the join process for frontend integration
 */
export const quickJoinRoom = mutation({
  args: {
    interactionId: v.id("interactions"),
    entityId: v.string(),
    entityType: v.union(v.literal("playerCharacter"), v.literal("npc"), v.literal("monster"))
  },
  handler: async (ctx, args) => {
    // Check if room exists, create if needed (for DM)
    const existingRoom = await ctx.runQuery("liveRoomManager:getLiveRoomState", {
      interactionId: args.interactionId
    });

    if (!existingRoom) {
      // Try to create room (will only work if user is DM)
      try {
        await ctx.runMutation("liveRoomManager:createLiveRoom", {
          interactionId: args.interactionId
        });
      } catch (error) {
        // If creation fails, room might not exist or user isn't DM
        throw new Error("Live room not available. Please ask the DM to start the session.");
      }
    }

    // Join the room
    const joinResult = await ctx.runMutation("liveRoomManager:joinLiveRoom", args);

    // Get complete room state after joining
    const completeState = await ctx.runQuery("liveSystemAPI:getCompleteRoomState", {
      interactionId: args.interactionId
    });

    return {
      ...joinResult,
      completeState
    };
  },
});

/**
 * Batch update for multiple game state changes
 * Useful for complex actions that affect multiple systems
 */
export const batchGameStateUpdate = mutation({
  args: {
    interactionId: v.id("interactions"),
    updates: v.array(v.object({
      type: v.union(
        v.literal("move"),
        v.literal("attack"),
        v.literal("chat"),
        v.literal("status_effect"),
        v.literal("hp_change"),
        v.literal("resource_change")
      ),
      data: v.any()
    }))
  },
  handler: async (ctx, args) => {
    const results = [];

    // Process each update in sequence
    for (const update of args.updates) {
      try {
        let result;
        
        switch (update.type) {
          case "move":
            result = await ctx.runMutation("liveMapSystem:updateEntityPosition", {
              interactionId: args.interactionId,
              ...update.data
            });
            break;
            
          case "chat":
            result = await ctx.runMutation("liveChatSystem:sendChatMessage", {
              interactionId: args.interactionId,
              ...update.data
            });
            break;
            
          case "attack":
            result = await ctx.runMutation("liveTurnManager:submitTurnAction", {
              interactionId: args.interactionId,
              actionType: "attack",
              actionData: update.data
            });
            break;
            
          default:
            // Log other update types for future implementation
            await ctx.runMutation("liveEventSystem:logSystemMessage", {
              interactionId: args.interactionId,
              level: "info",
              component: "batchUpdate",
              message: `Unhandled update type: ${update.type}`,
              metadata: update.data
            });
            result = { success: false, message: "Update type not implemented" };
        }
        
        results.push({
          type: update.type,
          success: true,
          result
        });
        
      } catch (error) {
        results.push({
          type: update.type,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return {
      success: true,
      results,
      totalUpdates: args.updates.length,
      successfulUpdates: results.filter(r => r.success).length
    };
  },
});

/**
 * Emergency room reset (DM only)
 * Resets room state in case of critical issues
 */
export const emergencyRoomReset = mutation({
  args: {
    interactionId: v.id("interactions"),
    reason: v.string()
  },
  handler: async (ctx, args) => {
    // This would only be available to DMs and would reset the room to a safe state
    // Implementation would depend on specific reset requirements
    
    // Log the reset
    await ctx.runMutation("liveEventSystem:logSystemMessage", {
      interactionId: args.interactionId,
      level: "warn",
      component: "emergency",
      message: `Emergency room reset triggered: ${args.reason}`,
      metadata: { reason: args.reason, timestamp: Date.now() }
    });

    // Pause the room
    await ctx.runMutation("liveRoomManager:pauseLiveRoom", {
      interactionId: args.interactionId,
      reason: `Emergency reset: ${args.reason}`
    });

    return {
      success: true,
      message: "Room has been paused for emergency reset",
      reason: args.reason
    };
  },
});

/**
 * Get simplified room info for dashboard/listing
 * Optimized for performance when showing multiple rooms
 */
export const getRoomSummary = query({
  args: {
    interactionId: v.id("interactions")
  },
  handler: async (ctx, args) => {
    const roomState = await ctx.runQuery("liveRoomManager:getLiveRoomState", {
      interactionId: args.interactionId
    });

    if (!roomState) {
      return null;
    }

    return {
      roomId: roomState.roomId,
      status: roomState.status,
      participantCount: roomState.participantCount,
      lastActivity: roomState.lastActivity,
      currentTurn: roomState.gameState.initiativeOrder[roomState.gameState.currentTurnIndex]?.entityId,
      roundNumber: roomState.gameState.roundNumber,
      isDMPresent: roomState.participants.some(p => p.userId === roomState.dmUserId && p.isConnected)
    };
  },
});

/**
 * Migration helper: Convert old interaction data to new live system
 * Helps transition existing interactions to use the new live system
 */
export const migrateInteractionToLiveSystem = mutation({
  args: {
    interactionId: v.id("interactions")
  },
  handler: async (ctx, args) => {
    // Get the existing interaction
    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) {
      throw new Error("Interaction not found");
    }

    // Check if already migrated
    const existingRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (existingRoom) {
      return {
        success: true,
        message: "Already migrated",
        roomId: existingRoom.roomId
      };
    }

    // Create initial game state from interaction data
    const initialGameState = {
      status: "waiting" as const,
      initiativeOrder: interaction.initiativeOrder || [],
      currentTurnIndex: interaction.currentInitiativeIndex || 0,
      roundNumber: 1,
      mapState: {
        width: 20,
        height: 20,
        entities: {},
        obstacles: [],
        terrain: []
      },
      turnHistory: [],
      chatLog: [],
      timestamp: Date.now()
    };

    // Create the live room
    const result = await ctx.runMutation("liveRoomManager:createLiveRoom", {
      interactionId: args.interactionId,
      initialGameState
    });

    // Log migration
    await ctx.runMutation("liveEventSystem:logSystemMessage", {
      interactionId: args.interactionId,
      level: "info",
      component: "migration",
      message: "Interaction migrated to live system",
      metadata: {
        interactionId: args.interactionId,
        roomId: result.roomId,
        migratedData: {
          hadInitiativeOrder: (interaction.initiativeOrder?.length || 0) > 0,
          hadParticipants: (interaction.participantPlayerCharacterIds?.length || 0) > 0
        }
      }
    });

    return {
      success: true,
      message: "Migration completed",
      roomId: result.roomId,
      gameState: initialGameState
    };
  },
});

// Export type definitions for frontend TypeScript integration
export type LiveSystemAPI = {
  // Room management
  createLiveRoom: typeof createLiveRoom;
  joinLiveRoom: typeof joinLiveRoom;
  leaveLiveRoom: typeof leaveLiveRoom;
  quickJoinRoom: typeof quickJoinRoom;
  
  // Combat and turns
  rollInitiative: typeof rollInitiative;
  submitTurnAction: typeof submitTurnAction;
  
  // Chat
  sendChatMessage: typeof sendChatMessage;
  sendDiceRoll: typeof sendDiceRoll;
  
  // Map
  updateEntityPosition: typeof updateEntityPosition;
  getMovementOptions: typeof getMovementOptions;
  
  // Real-time subscriptions
  getCompleteRoomState: typeof getCompleteRoomState;
  subscribeChatUpdates: typeof subscribeChatUpdates;
  
  // System health
  getComprehensiveSystemHealth: typeof getComprehensiveSystemHealth;
};