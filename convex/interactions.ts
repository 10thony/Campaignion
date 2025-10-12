import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./clerkService";

// Query to get all interactions for a user
export const getUserInteractions = query({
  args: {
    userId: v.optional(v.id("users")),
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db.query("interactions");
    
    // If userId is provided, filter by creator or DM
    if (args.userId) {
      query = query.filter((q) => 
        q.or(
          q.eq(q.field("creatorId"), args.userId),
          q.eq(q.field("dmUserId"), args.userId)
        )
      );
    }
    
    // If campaignId is provided, filter by campaign
    if (args.campaignId) {
      query = query.filter((q) => q.eq(q.field("campaignId"), args.campaignId));
    }

    const interactions = await query
      .order("desc")
      .collect();

    return interactions;
  },
});

// Query to get interaction with enhanced live status
export const getInteractionWithLiveStatus = query({
  args: {
    interactionId: v.id("interactions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) {
      throw new Error("Interaction not found");
    }

    // Get live room data if it exists
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    let liveStatus;
    if (liveRoom) {
      // Get participant count from live room
      const participantCount = liveRoom.participants.filter(p => p.isConnected).length;
      
      // Get current turn info
      let currentTurn: string | null = null;
      if (liveRoom.gameState.initiativeOrder.length > 0 && liveRoom.gameState.currentTurnIndex >= 0) {
        const currentEntry = liveRoom.gameState.initiativeOrder[liveRoom.gameState.currentTurnIndex];
        if (currentEntry) {
          currentTurn = currentEntry.entityId;
        }
      }

      liveStatus = {
        status: liveRoom.status,
        participantCount,
        currentTurn,
        lastActivity: new Date(liveRoom.lastActivity),
        roomId: liveRoom.roomId,
        roundNumber: liveRoom.gameState.roundNumber,
        isLiveRoomActive: true
      };
    } else {
      // Fallback to interaction data
      const participantCount = interaction.connectedParticipants?.length || 0;
      let currentTurn: string | null = null;
      if (interaction.initiativeOrder && interaction.currentInitiativeIndex !== undefined) {
        const currentEntry = interaction.initiativeOrder[interaction.currentInitiativeIndex];
        if (currentEntry) {
          currentTurn = currentEntry.entityId;
        }
      }

      liveStatus = {
        status: interaction.status || 'idle',
        participantCount,
        currentTurn,
        lastActivity: interaction.lastActivity ? new Date(interaction.lastActivity) : new Date(interaction.updatedAt || interaction.createdAt),
        isLiveRoomActive: false
      };
    }

    return {
      ...interaction,
      liveStatus
    };
  },
});

// Query to get all interactions with live status (for InteractionsPage)
export const getAllInteractionsWithLiveStatus = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    // Check authentication first
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user with improved error handling
    let user;
    try {
      user = await getCurrentUser(ctx);
    } catch (error) {
      console.error("Failed to get current user:", error);
      // Return empty array instead of throwing - allows graceful degradation
      return [];
    }
    
    if (!user) {
      // Return empty array if user still not found
      return [];
    }

    // Get all interactions the user has access to
    let query = ctx.db.query("interactions");
    
    // Filter by campaign if specified
    if (args.campaignId) {
      query = query.filter((q) => q.eq(q.field("campaignId"), args.campaignId));
    }

    const interactions = await query
      .order("desc")
      .collect();

    // Filter to interactions user can access (DM, creator, or participant)
    const accessibleInteractions = interactions.filter(interaction => 
      interaction.dmUserId === user._id || 
      interaction.creatorId === user._id ||
      interaction.participantPlayerCharacterIds?.some(id => {
        // Check if user owns any of the participant characters
        // This would need to be expanded with proper character ownership checking
        return true; // Simplified for now
      })
    );

    // Enrich with live status
    const interactionsWithLiveStatus = await Promise.all(
      accessibleInteractions.map(async (interaction) => {
        // Get live room data if it exists
        const liveRoom = await ctx.db
          .query("liveRooms")
          .withIndex("by_interaction", q => q.eq("interactionId", interaction._id))
          .first();

        let liveStatus;
        if (liveRoom) {
          // Get participant count from live room
          const participantCount = liveRoom.participants.filter(p => p.isConnected).length;
          
          // Get current turn info
          let currentTurn: string | null = null;
          if (liveRoom.gameState.initiativeOrder.length > 0 && liveRoom.gameState.currentTurnIndex >= 0) {
            const currentEntry = liveRoom.gameState.initiativeOrder[liveRoom.gameState.currentTurnIndex];
            if (currentEntry) {
              currentTurn = currentEntry.entityId;
            }
          }

          liveStatus = {
            status: liveRoom.status,
            participantCount,
            currentTurn,
            lastActivity: new Date(liveRoom.lastActivity),
            roomId: liveRoom.roomId,
            roundNumber: liveRoom.gameState.roundNumber,
            isLiveRoomActive: true
          };
        } else {
          // Fallback to interaction data
          const participantCount = interaction.connectedParticipants?.length || 0;
          let currentTurn: string | null = null;
          if (interaction.initiativeOrder && interaction.currentInitiativeIndex !== undefined) {
            const currentEntry = interaction.initiativeOrder[interaction.currentInitiativeIndex];
            if (currentEntry) {
              currentTurn = currentEntry.entityId;
            }
          }

          liveStatus = {
            status: interaction.status || 'idle',
            participantCount,
            currentTurn,
            lastActivity: interaction.lastActivity ? new Date(interaction.lastActivity) : new Date(interaction.updatedAt || interaction.createdAt),
            isLiveRoomActive: false
          };
        }

        return {
          ...interaction,
          liveStatus
        };
      })
    );

    return interactionsWithLiveStatus;
  },
});

// Mutation to update interaction status (for DM controls) - Enhanced for live system
export const updateInteractionStatus = mutation({
  args: {
    interactionId: v.id("interactions"),
    status: v.union(
      v.literal("idle"),
      v.literal("live"),
      v.literal("paused"),
      v.literal("completed")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) {
      throw new Error("Interaction not found");
    }

    // Check if user is the DM for this interaction
    if (interaction.dmUserId !== user._id) {
      throw new Error("Only the DM can change interaction status");
    }

    const now = Date.now();

    // Update the interaction status
    await ctx.db.patch(args.interactionId, {
      status: args.status,
      updatedAt: now,
      lastActivity: now,
    });

    // Also update live room status if it exists
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (liveRoom) {
      let newRoomStatus: "waiting" | "active" | "paused" | "completed";
      
      switch (args.status) {
        case "live":
          newRoomStatus = "active";
          break;
        case "paused":
          newRoomStatus = "paused";
          break;
        case "completed":
          newRoomStatus = "completed";
          break;
        default:
          newRoomStatus = "waiting";
      }

      await ctx.db.patch(liveRoom._id, {
        status: newRoomStatus,
        lastActivity: now
      });

      // Log the status change event
      await ctx.db.insert("liveGameEvents", {
        interactionId: args.interactionId,
        roomId: liveRoom.roomId,
        eventType: args.status === "live" ? "ROOM_RESUMED" : 
                  args.status === "paused" ? "ROOM_PAUSED" : 
                  "ROOM_STATUS_CHANGED",
        eventData: {
          newStatus: args.status,
          reason: args.reason,
          dmUserId: user._id
        },
        timestamp: now,
        userId: user._id,
        isSystemEvent: true,
        severity: "info"
      });
    }

    return {
      success: true,
      status: args.status,
      reason: args.reason,
    };
  },
});

// Query to get interactions for a specific campaign
export const getInteractions = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }

      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), identity.subject))
        .first();

      if (!user) {
        throw new Error("User not found");
      }

      let query = ctx.db.query("interactions");
      
      // Filter by campaign if provided
      if (args.campaignId) {
        query = query.filter((q) => q.eq(q.field("campaignId"), args.campaignId));
      }

      // Get interactions where user is creator or DM
      const interactions = await query
        .filter((q) => 
          q.or(
            q.eq(q.field("creatorId"), user._id),
            q.eq(q.field("dmUserId"), user._id)
          )
        )
        .order("desc")
        .collect();

      return interactions;
    } catch (error) {
      // Return empty array if not authenticated or other error
      return [];
    }
  },
});

// Query to get all interactions with enhanced live status for real-time updates
export const getAllInteractionsWithEnhancedLiveStatus = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    let query = ctx.db.query("interactions");
    
    // Filter by campaign if provided
    if (args.campaignId) {
      query = query.filter((q) => q.eq(q.field("campaignId"), args.campaignId));
    }

    // Get interactions where user is creator or DM
    const interactions = await query
      .filter((q) => 
        q.or(
          q.eq(q.field("creatorId"), user._id),
          q.eq(q.field("dmUserId"), user._id)
        )
      )
      .order("desc")
      .collect();

    // Add live status information to each interaction
    return interactions.map(interaction => {
      const participantCount = interaction.connectedParticipants?.length || 0;
      
      let currentTurn: string | null = null;
      if (interaction.initiativeOrder && interaction.currentInitiativeIndex !== undefined) {
        const currentEntry = interaction.initiativeOrder[interaction.currentInitiativeIndex];
        if (currentEntry) {
          currentTurn = currentEntry.entityId;
        }
      }

      return {
        ...interaction,
        liveStatus: {
          status: interaction.status || 'idle',
          participantCount,
          currentTurn,
          lastActivity: interaction.lastActivity ? new Date(interaction.lastActivity) : new Date(interaction.updatedAt || interaction.createdAt),
        }
      };
    });
  },
});