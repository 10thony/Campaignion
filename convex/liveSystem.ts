import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to save state snapshot
export const saveStateSnapshot = mutation({
  args: {
    interactionId: v.id("interactions"),
    stateSnapshot: v.any(),
    connectedParticipants: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { interactionId, stateSnapshot, connectedParticipants } = args;
    
    // Update the interaction with the new state snapshot
    await ctx.db.patch(interactionId, {
      lastStateSnapshot: stateSnapshot,
      snapshotTimestamp: Date.now(),
      connectedParticipants: connectedParticipants || [],
      lastActivity: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, timestamp: Date.now() };
  },
});

// Mutation to load state snapshot
export const loadStateSnapshot = query({
  args: {
    interactionId: v.id("interactions"),
  },
  handler: async (ctx, args) => {
    const interaction = await ctx.db.get(args.interactionId);
    
    if (!interaction) {
      return null;
    }
    
    return {
      stateSnapshot: interaction.lastStateSnapshot,
      timestamp: interaction.snapshotTimestamp,
      connectedParticipants: interaction.connectedParticipants || [],
      lastActivity: interaction.lastActivity,
    };
  },
});

// Mutation to update live room status
export const updateLiveRoomStatus = mutation({
  args: {
    interactionId: v.id("interactions"),
    liveRoomId: v.optional(v.string()),
    status: v.union(
      v.literal("idle"),
      v.literal("live"),
      v.literal("paused"),
      v.literal("completed")
    ),
    connectedParticipants: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { interactionId, liveRoomId, status, connectedParticipants } = args;
    
    await ctx.db.patch(interactionId, {
      liveRoomId,
      status,
      connectedParticipants: connectedParticipants || [],
      lastActivity: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Mutation to log live interaction events
export const logInteractionEvent = mutation({
  args: {
    interactionId: v.id("interactions"),
    eventType: v.string(),
    eventData: v.any(),
    userId: v.optional(v.id("users")),
    entityId: v.optional(v.string()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const logEntry = await ctx.db.insert("liveInteractionLogs", {
      interactionId: args.interactionId,
      eventType: args.eventType,
      eventData: args.eventData,
      userId: args.userId,
      entityId: args.entityId,
      timestamp: Date.now(),
      sessionId: args.sessionId,
    });
    
    return logEntry;
  },
});

// Mutation to record turn data
export const recordTurn = mutation({
  args: {
    interactionId: v.id("interactions"),
    entityId: v.string(),
    entityType: v.union(
      v.literal("playerCharacter"),
      v.literal("npc"),
      v.literal("monster")
    ),
    turnNumber: v.number(),
    roundNumber: v.number(),
    actions: v.array(v.any()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.union(
      v.literal("completed"),
      v.literal("skipped"),
      v.literal("timeout")
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const turnRecord = await ctx.db.insert("turnRecords", {
      interactionId: args.interactionId,
      entityId: args.entityId,
      entityType: args.entityType,
      turnNumber: args.turnNumber,
      roundNumber: args.roundNumber,
      actions: args.actions,
      startTime: args.startTime,
      endTime: args.endTime,
      status: args.status,
      userId: args.userId,
    });
    
    return turnRecord;
  },
});

// Query to get interaction logs
export const getInteractionLogs = query({
  args: {
    interactionId: v.id("interactions"),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("liveInteractionLogs")
      .filter((q) => q.eq(q.field("interactionId"), args.interactionId));
    
    if (args.sessionId) {
      query = query.filter((q) => q.eq(q.field("sessionId"), args.sessionId));
    }
    
    const logs = await query
      .order("desc")
      .collect();
    
    return logs;
  },
});

// Query to get turn records
export const getTurnRecords = query({
  args: {
    interactionId: v.id("interactions"),
    roundNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("turnRecords")
      .filter((q) => q.eq(q.field("interactionId"), args.interactionId));
    
    if (args.roundNumber !== undefined) {
      query = query.filter((q) => q.eq(q.field("roundNumber"), args.roundNumber));
    }
    
    const records = await query
      .order("asc")
      .collect();
    
    return records;
  },
});

// Mutation to update turn timeout settings
export const updateTurnSettings = mutation({
  args: {
    interactionId: v.id("interactions"),
    turnTimeLimit: v.optional(v.number()),
    chatEnabled: v.optional(v.boolean()),
    allowPrivateChat: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { interactionId, turnTimeLimit, chatEnabled, allowPrivateChat } = args;
    
    const updateData: any = {
      updatedAt: Date.now(),
    };
    
    if (turnTimeLimit !== undefined) {
      updateData.turnTimeLimit = turnTimeLimit;
    }
    
    if (chatEnabled !== undefined) {
      updateData.chatEnabled = chatEnabled;
    }
    
    if (allowPrivateChat !== undefined) {
      updateData.allowPrivateChat = allowPrivateChat;
    }
    
    await ctx.db.patch(interactionId, updateData);
    
    return { success: true };
  },
});

// Query to get live interaction status
export const getLiveInteractionStatus = query({
  args: {
    interactionId: v.id("interactions"),
  },
  handler: async (ctx, args) => {
    const interaction = await ctx.db.get(args.interactionId);
    
    if (!interaction) {
      return null;
    }
    
    return {
      status: interaction.status,
      liveRoomId: interaction.liveRoomId,
      connectedParticipants: interaction.connectedParticipants || [],
      lastActivity: interaction.lastActivity,
      turnTimeLimit: interaction.turnTimeLimit,
      chatEnabled: interaction.chatEnabled,
      allowPrivateChat: interaction.allowPrivateChat,
    };
  },
});

// Mutation to update connected participants
export const updateConnectedParticipants = mutation({
  args: {
    interactionId: v.id("interactions"),
    participantId: v.string(),
    action: v.union(v.literal("join"), v.literal("leave")),
  },
  handler: async (ctx, args) => {
    const { interactionId, participantId, action } = args;
    
    const interaction = await ctx.db.get(interactionId);
    if (!interaction) {
      throw new Error("Interaction not found");
    }
    
    const currentParticipants = interaction.connectedParticipants || [];
    let updatedParticipants: string[];
    
    if (action === "join") {
      updatedParticipants = currentParticipants.includes(participantId)
        ? currentParticipants
        : [...currentParticipants, participantId];
    } else {
      updatedParticipants = currentParticipants.filter(id => id !== participantId);
    }
    
    await ctx.db.patch(interactionId, {
      connectedParticipants: updatedParticipants,
      lastActivity: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { 
      success: true, 
      connectedParticipants: updatedParticipants 
    };
  },
});

// Mutation to set current turn timeout
export const setCurrentTurnTimeout = mutation({
  args: {
    interactionId: v.id("interactions"),
    timeoutTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { interactionId, timeoutTimestamp } = args;
    
    await ctx.db.patch(interactionId, {
      currentTurnTimeout: timeoutTimestamp,
      lastActivity: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Query to get all live interactions
export const getAllLiveInteractions = query({
  args: {},
  handler: async (ctx) => {
    const liveInteractions = await ctx.db
      .query("interactions")
      .filter((q) => q.eq(q.field("status"), "live"))
      .collect();
    
    return liveInteractions.map(interaction => ({
      _id: interaction._id,
      name: interaction.name,
      liveRoomId: interaction.liveRoomId,
      connectedParticipants: interaction.connectedParticipants || [],
      lastActivity: interaction.lastActivity,
      dmUserId: interaction.dmUserId,
    }));
  },
});

// Mutation to cleanup inactive rooms
export const cleanupInactiveRoom = mutation({
  args: {
    interactionId: v.id("interactions"),
    finalStateSnapshot: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { interactionId, finalStateSnapshot } = args;
    
    const updateData: any = {
      liveRoomId: undefined,
      connectedParticipants: [],
      currentTurnTimeout: undefined,
      lastActivity: Date.now(),
      updatedAt: Date.now(),
    };
    
    if (finalStateSnapshot) {
      updateData.lastStateSnapshot = finalStateSnapshot;
      updateData.snapshotTimestamp = Date.now();
    }
    
    await ctx.db.patch(interactionId, updateData);
    
    // Log the cleanup event
    await ctx.db.insert("liveInteractionLogs", {
      interactionId,
      eventType: "ROOM_CLEANUP",
      eventData: { reason: "inactivity_timeout" },
      timestamp: Date.now(),
      sessionId: `cleanup_${Date.now()}`,
    });
    
    return { success: true };
  },
});