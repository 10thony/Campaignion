/**
 * Live Room Manager for Convex
 * Handles real-time D&D interaction rooms with full game state management
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./clerkService";

// Helper function to generate unique room IDs
function generateRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to create initial game state
function createInitialGameState(interactionId: string) {
  return {
    status: "waiting" as const,
    initiativeOrder: [],
    currentTurnIndex: 0,
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
}

/**
 * Create a new live room for an interaction
 */
export const createLiveRoom = mutation({
  args: {
    interactionId: v.id("interactions"),
    initialGameState: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if room already exists
    const existingRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (existingRoom) {
      throw new Error(`Live room already exists for interaction ${args.interactionId}`);
    }

    // Get interaction details
    const interaction = await ctx.db.get(args.interactionId);
    if (!interaction) {
      throw new Error("Interaction not found");
    }

    // Verify user is DM
    if (interaction.dmUserId !== user._id) {
      throw new Error("Only the DM can create live rooms");
    }

    const roomId = generateRoomId();
    const gameState = args.initialGameState || createInitialGameState(args.interactionId);
    const now = Date.now();

    // Create the live room
    const liveRoomId = await ctx.db.insert("liveRooms", {
      interactionId: args.interactionId,
      roomId,
      status: "waiting",
      gameState,
      participants: [],
      dmUserId: user._id,
      createdAt: now,
      lastActivity: now,
      settings: {
        allowPrivateChat: true,
        turnTimeLimit: 300, // 5 minutes default
        autoSkipInactivePlayers: false,
        enableDiceRolling: true
      }
    });

    // Log room creation event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId,
      eventType: "ROOM_CREATED",
      eventData: {
        roomId,
        dmUserId: user._id,
        settings: {
          allowPrivateChat: true,
          turnTimeLimit: 300,
          autoSkipInactivePlayers: false,
          enableDiceRolling: true
        }
      },
      timestamp: now,
      userId: user._id,
      isSystemEvent: true,
      severity: "info"
    });

    return {
      success: true,
      roomId,
      liveRoomId,
      gameState
    };
  },
});

/**
 * Join a live room
 */
export const joinLiveRoom = mutation({
  args: {
    interactionId: v.id("interactions"),
    entityId: v.string(),
    entityType: v.union(v.literal("playerCharacter"), v.literal("npc"), v.literal("monster"))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get the live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Check if user is already in the room
    const existingParticipant = liveRoom.participants.find(p => p.userId === user._id);
    if (existingParticipant) {
      // Update connection status
      const updatedParticipants = liveRoom.participants.map(p => 
        p.userId === user._id 
          ? { ...p, isConnected: true, lastActivity: Date.now() }
          : p
      );

      await ctx.db.patch(liveRoom._id, {
        participants: updatedParticipants,
        lastActivity: Date.now()
      });

      return {
        success: true,
        roomId: liveRoom.roomId,
        gameState: liveRoom.gameState,
        participantCount: updatedParticipants.filter(p => p.isConnected).length,
        isReconnection: true
      };
    }

    // Get character data for quick access
    let characterData = null;
    if (args.entityType === "playerCharacter") {
      characterData = await ctx.db.get(args.entityId as any);
    } else if (args.entityType === "monster") {
      characterData = await ctx.db.get(args.entityId as any);
    }

    // Add new participant
    const newParticipant = {
      userId: user._id,
      entityId: args.entityId,
      entityType: args.entityType,
      connectionId: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isConnected: true,
      lastActivity: Date.now(),
      characterData: characterData ? {
        name: characterData.name,
        level: characterData.level || 1,
        class: characterData.class || "Unknown",
        maxHP: characterData.hitPoints || 1,
        currentHP: characterData.hitPoints || 1,
        armorClass: characterData.armorClass || 10
      } : null
    };

    const updatedParticipants = [...liveRoom.participants, newParticipant];
    const now = Date.now();

    await ctx.db.patch(liveRoom._id, {
      participants: updatedParticipants,
      lastActivity: now
    });

    // Create participant state record
    await ctx.db.insert("liveParticipantStates", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      userId: user._id,
      entityId: args.entityId,
      entityType: args.entityType,
      currentHP: characterData?.hitPoints || 1,
      maxHP: characterData?.hitPoints || 1,
      armorClass: characterData?.armorClass || 10,
      position: { x: 0, y: 0 }, // Default starting position
      statusEffects: [],
      conditions: [],
      resources: {
        spellSlots: characterData?.spellSlots || [],
        features: []
      },
      isOnline: true,
      updatedAt: now
    });

    // Log participant joined event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "PARTICIPANT_JOINED",
      eventData: {
        userId: user._id,
        entityId: args.entityId,
        entityType: args.entityType,
        characterName: characterData?.name || "Unknown"
      },
      timestamp: now,
      userId: user._id,
      entityId: args.entityId,
      isSystemEvent: false,
      severity: "info"
    });

    return {
      success: true,
      roomId: liveRoom.roomId,
      gameState: liveRoom.gameState,
      participantCount: updatedParticipants.filter(p => p.isConnected).length,
      participant: newParticipant
    };
  },
});

/**
 * Leave a live room
 */
export const leaveLiveRoom = mutation({
  args: {
    interactionId: v.id("interactions")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get the live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Update participant connection status
    const updatedParticipants = liveRoom.participants.map(p => 
      p.userId === user._id 
        ? { ...p, isConnected: false, lastActivity: Date.now() }
        : p
    );

    const now = Date.now();

    await ctx.db.patch(liveRoom._id, {
      participants: updatedParticipants,
      lastActivity: now
    });

    // Update participant state
    const participantState = await ctx.db
      .query("liveParticipantStates")
      .withIndex("by_room", q => q.eq("roomId", liveRoom.roomId))
      .filter(q => q.eq(q.field("userId"), user._id))
      .first();

    if (participantState) {
      await ctx.db.patch(participantState._id, {
        isOnline: false,
        updatedAt: now
      });
    }

    // Log participant left event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "PARTICIPANT_LEFT",
      eventData: {
        userId: user._id
      },
      timestamp: now,
      userId: user._id,
      isSystemEvent: false,
      severity: "info"
    });

    return {
      success: true,
      message: "Left room successfully"
    };
  },
});

/**
 * Pause a live room (DM only)
 */
export const pauseLiveRoom = mutation({
  args: {
    interactionId: v.id("interactions"),
    reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Verify user is DM
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only the DM can pause the room");
    }

    const now = Date.now();

    await ctx.db.patch(liveRoom._id, {
      status: "paused",
      lastActivity: now
    });

    // Update interaction status
    await ctx.db.patch(args.interactionId, {
      status: "paused",
      updatedAt: now
    });

    // Log pause event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "ROOM_PAUSED",
      eventData: {
        reason: args.reason || "DM paused the session",
        dmUserId: user._id
      },
      timestamp: now,
      userId: user._id,
      isSystemEvent: true,
      severity: "info"
    });

    return {
      success: true,
      message: "Room paused successfully",
      reason: args.reason || "DM paused the session"
    };
  },
});

/**
 * Resume a paused live room (DM only)
 */
export const resumeLiveRoom = mutation({
  args: {
    interactionId: v.id("interactions")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Verify user is DM
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only the DM can resume the room");
    }

    const now = Date.now();

    await ctx.db.patch(liveRoom._id, {
      status: "active",
      lastActivity: now
    });

    // Update interaction status
    await ctx.db.patch(args.interactionId, {
      status: "live",
      updatedAt: now
    });

    // Log resume event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "ROOM_RESUMED",
      eventData: {
        dmUserId: user._id
      },
      timestamp: now,
      userId: user._id,
      isSystemEvent: true,
      severity: "info"
    });

    return {
      success: true,
      message: "Room resumed successfully"
    };
  },
});

/**
 * Get live room state (real-time subscription)
 */
export const getLiveRoomState = query({
  args: {
    interactionId: v.id("interactions")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      return null;
    }

    // Get participant states
    const participantStates = await ctx.db
      .query("liveParticipantStates")
      .withIndex("by_room", q => q.eq("roomId", liveRoom.roomId))
      .collect();

    // Get recent events
    const recentEvents = await ctx.db
      .query("liveGameEvents")
      .withIndex("by_room", q => q.eq("roomId", liveRoom.roomId))
      .order("desc")
      .take(50);

    return {
      roomId: liveRoom.roomId,
      status: liveRoom.status,
      gameState: liveRoom.gameState,
      participants: liveRoom.participants,
      participantStates,
      dmUserId: liveRoom.dmUserId,
      settings: liveRoom.settings,
      participantCount: liveRoom.participants.filter(p => p.isConnected).length,
      lastActivity: liveRoom.lastActivity,
      recentEvents: recentEvents.slice(0, 10) // Return latest 10 events
    };
  },
});

/**
 * Get system health status
 */
export const getSystemHealth = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Count active rooms
    const activeRooms = await ctx.db
      .query("liveRooms")
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    // Count total participants
    const totalParticipants = activeRooms.reduce((sum, room) => 
      sum + room.participants.filter(p => p.isConnected).length, 0
    );

    // Count recent events
    const recentEvents = await ctx.db
      .query("liveGameEvents")
      .withIndex("by_timestamp", q => q.gte("timestamp", oneHourAgo))
      .collect();

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "convex-live-interaction-system",
      stats: {
        activeRooms: activeRooms.length,
        totalParticipants,
        uptime: Date.now(), // Using current timestamp as uptime reference
        eventsLastHour: recentEvents.length
      }
    };
  },
});

/**
 * Update room settings (DM only)
 */
export const updateRoomSettings = mutation({
  args: {
    interactionId: v.id("interactions"),
    settings: v.object({
      allowPrivateChat: v.optional(v.boolean()),
      turnTimeLimit: v.optional(v.number()),
      autoSkipInactivePlayers: v.optional(v.boolean()),
      enableDiceRolling: v.optional(v.boolean())
    })
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Verify user is DM
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only the DM can update room settings");
    }

    const updatedSettings = {
      ...liveRoom.settings,
      ...args.settings
    };

    await ctx.db.patch(liveRoom._id, {
      settings: updatedSettings,
      lastActivity: Date.now()
    });

    return {
      success: true,
      settings: updatedSettings
    };
  },
});