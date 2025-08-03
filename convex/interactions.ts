import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

// Query to get interaction with live status
export const getInteractionWithLiveStatus = query({
  args: {
    interactionId: v.id("interactions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) {
      throw new Error("Interaction not found");
    }

    // Get participant count from connected participants
    const participantCount = interaction.connectedParticipants?.length || 0;

    // Get current turn info if available
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
  },
});

// Mutation to update interaction status (for DM controls)
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) {
      throw new Error("Interaction not found");
    }

    // Check if user is the DM for this interaction
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user || interaction.dmUserId !== user._id) {
      throw new Error("Only the DM can change interaction status");
    }

    // Update the interaction status
    await ctx.db.patch(args.interactionId, {
      status: args.status,
      updatedAt: Date.now(),
      lastActivity: Date.now(),
    });

    return {
      success: true,
      status: args.status,
      reason: args.reason,
    };
  },
});

// Query to get all interactions with live status for real-time updates
export const getAllInteractionsWithLiveStatus = query({
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