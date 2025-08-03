import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Test mutation to verify live system schema works
export const testLiveSystemSchema = mutation({
  args: {
    testUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Create a test interaction with live system fields
    const interactionId = await ctx.db.insert("interactions", {
      name: "Test Live Interaction",
      description: "Testing live system schema extensions",
      creatorId: args.testUserId,
      dmUserId: args.testUserId,
      status: "idle",
      
      // Live system fields
      liveRoomId: "test-room-123",
      lastStateSnapshot: {
        testData: "This is a test state snapshot",
        participants: [],
        currentTurn: 0,
      },
      snapshotTimestamp: Date.now(),
      connectedParticipants: ["user1", "user2"],
      lastActivity: Date.now(),
      currentTurnTimeout: Date.now() + 90000, // 90 seconds from now
      turnTimeLimit: 90,
      chatEnabled: true,
      allowPrivateChat: true,
      
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Test live interaction logs
    const logId = await ctx.db.insert("liveInteractionLogs", {
      interactionId,
      eventType: "TEST_EVENT",
      eventData: {
        message: "Testing live interaction logs",
        testValue: 42,
      },
      userId: args.testUserId,
      entityId: "test-entity-1",
      timestamp: Date.now(),
      sessionId: "test-session-123",
    });
    
    // Test turn records
    const turnRecordId = await ctx.db.insert("turnRecords", {
      interactionId,
      entityId: "test-character-1",
      entityType: "playerCharacter",
      turnNumber: 1,
      roundNumber: 1,
      actions: [
        {
          type: "move",
          from: { x: 0, y: 0 },
          to: { x: 1, y: 1 },
        },
        {
          type: "attack",
          target: "monster-1",
          weapon: "sword",
        },
      ],
      startTime: Date.now() - 30000,
      endTime: Date.now(),
      status: "completed",
      userId: args.testUserId,
    });
    
    return {
      success: true,
      interactionId,
      logId,
      turnRecordId,
      message: "Live system schema test completed successfully!",
    };
  },
});