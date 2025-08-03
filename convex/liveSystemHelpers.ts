import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to batch multiple state operations
export const batchStateOperations = mutation({
  args: {
    interactionId: v.id("interactions"),
    operations: v.array(
      v.object({
        type: v.union(
          v.literal("saveSnapshot"),
          v.literal("logEvent"),
          v.literal("recordTurn"),
          v.literal("updateParticipants")
        ),
        data: v.any(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { interactionId, operations } = args;
    const results = [];
    
    for (const operation of operations) {
      switch (operation.type) {
        case "saveSnapshot":
          await ctx.db.patch(interactionId, {
            lastStateSnapshot: operation.data.stateSnapshot,
            snapshotTimestamp: Date.now(),
            lastActivity: Date.now(),
            updatedAt: Date.now(),
          });
          results.push({ type: "saveSnapshot", success: true });
          break;
          
        case "logEvent":
          const logEntry = await ctx.db.insert("liveInteractionLogs", {
            interactionId,
            eventType: operation.data.eventType,
            eventData: operation.data.eventData,
            userId: operation.data.userId,
            entityId: operation.data.entityId,
            timestamp: Date.now(),
            sessionId: operation.data.sessionId,
          });
          results.push({ type: "logEvent", success: true, id: logEntry });
          break;
          
        case "recordTurn":
          const turnRecord = await ctx.db.insert("turnRecords", {
            interactionId,
            entityId: operation.data.entityId,
            entityType: operation.data.entityType,
            turnNumber: operation.data.turnNumber,
            roundNumber: operation.data.roundNumber,
            actions: operation.data.actions,
            startTime: operation.data.startTime,
            endTime: operation.data.endTime,
            status: operation.data.status,
            userId: operation.data.userId,
          });
          results.push({ type: "recordTurn", success: true, id: turnRecord });
          break;
          
        case "updateParticipants":
          await ctx.db.patch(interactionId, {
            connectedParticipants: operation.data.participants,
            lastActivity: Date.now(),
            updatedAt: Date.now(),
          });
          results.push({ type: "updateParticipants", success: true });
          break;
      }
    }
    
    return { success: true, results };
  },
});

// Query to get comprehensive interaction state for live system
export const getInteractionLiveState = query({
  args: {
    interactionId: v.id("interactions"),
  },
  handler: async (ctx, args) => {
    const interaction = await ctx.db.get(args.interactionId);
    
    if (!interaction) {
      return null;
    }
    
    // Get recent logs
    const recentLogs = await ctx.db
      .query("liveInteractionLogs")
      .filter((q) => q.eq(q.field("interactionId"), args.interactionId))
      .order("desc")
      .take(50);
    
    // Get current round turn records
    const currentRoundTurns = await ctx.db
      .query("turnRecords")
      .filter((q) => q.eq(q.field("interactionId"), args.interactionId))
      .order("desc")
      .take(20);
    
    return {
      interaction: {
        _id: interaction._id,
        name: interaction.name,
        status: interaction.status,
        liveRoomId: interaction.liveRoomId,
        lastStateSnapshot: interaction.lastStateSnapshot,
        snapshotTimestamp: interaction.snapshotTimestamp,
        connectedParticipants: interaction.connectedParticipants || [],
        lastActivity: interaction.lastActivity,
        currentTurnTimeout: interaction.currentTurnTimeout,
        turnTimeLimit: interaction.turnTimeLimit,
        chatEnabled: interaction.chatEnabled,
        allowPrivateChat: interaction.allowPrivateChat,
        dmUserId: interaction.dmUserId,
        participantPlayerCharacterIds: interaction.participantPlayerCharacterIds || [],
        participantNpcIds: interaction.participantNpcIds || [],
        participantMonsterIds: interaction.participantMonsterIds || [],
        initiativeOrder: interaction.initiativeOrder || [],
        currentInitiativeIndex: interaction.currentInitiativeIndex,
      },
      recentLogs,
      currentRoundTurns,
    };
  },
});

// Mutation to initialize interaction for live play
export const initializeForLivePlay = mutation({
  args: {
    interactionId: v.id("interactions"),
    liveRoomId: v.string(),
    initialState: v.any(),
    turnTimeLimit: v.optional(v.number()),
    chatEnabled: v.optional(v.boolean()),
    allowPrivateChat: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const {
      interactionId,
      liveRoomId,
      initialState,
      turnTimeLimit = 90,
      chatEnabled = true,
      allowPrivateChat = true,
    } = args;
    
    // Update interaction for live play
    await ctx.db.patch(interactionId, {
      status: "live",
      liveRoomId,
      lastStateSnapshot: initialState,
      snapshotTimestamp: Date.now(),
      connectedParticipants: [],
      lastActivity: Date.now(),
      turnTimeLimit,
      chatEnabled,
      allowPrivateChat,
      updatedAt: Date.now(),
    });
    
    // Log initialization
    await ctx.db.insert("liveInteractionLogs", {
      interactionId,
      eventType: "INTERACTION_INITIALIZED",
      eventData: {
        liveRoomId,
        turnTimeLimit,
        chatEnabled,
        allowPrivateChat,
      },
      timestamp: Date.now(),
      sessionId: `init_${liveRoomId}`,
    });
    
    return { success: true, liveRoomId };
  },
});

// Mutation to finalize live interaction
export const finalizeLiveInteraction = mutation({
  args: {
    interactionId: v.id("interactions"),
    finalState: v.any(),
    completionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const { interactionId, finalState, completionReason } = args;
    
    // Update interaction to completed status
    await ctx.db.patch(interactionId, {
      status: "completed",
      liveRoomId: undefined,
      lastStateSnapshot: finalState,
      snapshotTimestamp: Date.now(),
      connectedParticipants: [],
      currentTurnTimeout: undefined,
      lastActivity: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Log completion
    await ctx.db.insert("liveInteractionLogs", {
      interactionId,
      eventType: "INTERACTION_COMPLETED",
      eventData: {
        completionReason,
        finalStateTimestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: `completion_${Date.now()}`,
    });
    
    return { success: true };
  },
});