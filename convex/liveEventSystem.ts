/**
 * Live Event System for Convex
 * Handles event broadcasting, logging, and real-time notifications for D&D sessions
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./clerkService";

/**
 * Broadcast a game event to all participants
 */
export const broadcastGameEvent = mutation({
  args: {
    interactionId: v.id("interactions"),
    eventType: v.union(
      v.literal("PARTICIPANT_JOINED"),
      v.literal("PARTICIPANT_LEFT"),
      v.literal("TURN_STARTED"),
      v.literal("TURN_ENDED"),
      v.literal("ACTION_PERFORMED"),
      v.literal("DAMAGE_DEALT"),
      v.literal("HEALING_APPLIED"),
      v.literal("STATUS_EFFECT_APPLIED"),
      v.literal("STATUS_EFFECT_REMOVED"),
      v.literal("INITIATIVE_ROLLED"),
      v.literal("ROUND_STARTED"),
      v.literal("COMBAT_STARTED"),
      v.literal("COMBAT_ENDED"),
      v.literal("ROOM_PAUSED"),
      v.literal("ROOM_RESUMED"),
      v.literal("ENTITY_MOVED"),
      v.literal("OBSTACLE_ADDED"),
      v.literal("CHAT_MESSAGE"),
      v.literal("DICE_ROLLED"),
      v.literal("CUSTOM_EVENT"),
      v.literal("ERROR")
    ),
    eventData: v.any(),
    severity: v.optional(v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error")
    )),
    targetEntityId: v.optional(v.string()),
    isSystemEvent: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Check if user is participant or DM
    const isParticipant = liveRoom.participants.some(p => p.userId === user._id);
    const isDM = liveRoom.dmUserId === user._id;

    if (!isParticipant && !isDM) {
      throw new Error("Not authorized to broadcast events");
    }

    const now = Date.now();

    // Create the event
    const eventId = await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: args.eventType,
      eventData: args.eventData,
      timestamp: now,
      userId: user._id,
      entityId: args.targetEntityId,
      isSystemEvent: args.isSystemEvent || false,
      severity: args.severity || "info"
    });

    // Update room's last activity
    await ctx.db.patch(liveRoom._id, {
      lastActivity: now
    });

    return {
      success: true,
      eventId,
      timestamp: now,
      eventType: args.eventType
    };
  },
});

/**
 * Get recent events for a room (real-time subscription)
 */
export const getRecentEvents = query({
  args: {
    interactionId: v.id("interactions"),
    limit: v.optional(v.number()),
    since: v.optional(v.number()), // timestamp
    eventTypes: v.optional(v.array(v.string())),
    severity: v.optional(v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error")
    ))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      return [];
    }

    // Check if user is participant
    const isParticipant = liveRoom.participants.some(p => p.userId === user._id);
    const isDM = liveRoom.dmUserId === user._id;

    if (!isParticipant && !isDM) {
      return [];
    }

    // Build query
    let query = ctx.db
      .query("liveGameEvents")
      .withIndex("by_room", q => q.eq("roomId", liveRoom.roomId));

    // Filter by timestamp if provided
    if (args.since) {
      query = query.filter(q => q.gt(q.field("timestamp"), args.since));
    }

    // Filter by severity if provided
    if (args.severity) {
      query = query.filter(q => q.eq(q.field("severity"), args.severity));
    }

    // Get events
    const events = await query
      .order("desc")
      .take(args.limit || 50);

    // Filter by event types if provided
    let filteredEvents = events;
    if (args.eventTypes && args.eventTypes.length > 0) {
      filteredEvents = events.filter(event => 
        args.eventTypes!.includes(event.eventType)
      );
    }

    // Filter sensitive events for non-DM users
    if (!isDM) {
      filteredEvents = filteredEvents.filter(event => {
        // Hide DM-only events
        if (event.eventType === "DM_NOTE" || event.eventType === "DM_PLANNING") {
          return false;
        }
        return true;
      });
    }

    // Reverse to get chronological order
    return filteredEvents.reverse();
  },
});

/**
 * Get event statistics for analytics
 */
export const getEventStatistics = query({
  args: {
    interactionId: v.id("interactions"),
    timeRange: v.optional(v.union(
      v.literal("last_hour"),
      v.literal("last_day"),
      v.literal("session")
    ))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      return null;
    }

    // Only DM can view statistics
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only DM can view event statistics");
    }

    const now = Date.now();
    let cutoffTime = liveRoom.createdAt; // Default to session start

    switch (args.timeRange) {
      case "last_hour":
        cutoffTime = now - (60 * 60 * 1000);
        break;
      case "last_day":
        cutoffTime = now - (24 * 60 * 60 * 1000);
        break;
      case "session":
      default:
        cutoffTime = liveRoom.createdAt;
        break;
    }

    // Get events in time range
    const events = await ctx.db
      .query("liveGameEvents")
      .withIndex("by_room", q => q.eq("roomId", liveRoom.roomId))
      .filter(q => q.gte(q.field("timestamp"), cutoffTime))
      .collect();

    // Calculate statistics
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};
    let systemEvents = 0;
    let userEvents = 0;

    events.forEach(event => {
      // Count by type
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      
      // Count by severity
      if (event.severity) {
        eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      }
      
      // Count by user
      if (event.userId) {
        eventsByUser[event.userId] = (eventsByUser[event.userId] || 0) + 1;
      }
      
      // Count system vs user events
      if (event.isSystemEvent) {
        systemEvents++;
      } else {
        userEvents++;
      }
    });

    return {
      totalEvents: events.length,
      timeRange: args.timeRange || "session",
      cutoffTime,
      eventsByType,
      eventsBySeverity,
      eventsByUser,
      systemEvents,
      userEvents,
      mostActiveUsers: Object.entries(eventsByUser)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, count }))
    };
  },
});

/**
 * Log system message (for debugging and monitoring)
 */
export const logSystemMessage = mutation({
  args: {
    interactionId: v.optional(v.id("interactions")),
    level: v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warn"),
      v.literal("error")
    ),
    component: v.string(),
    message: v.string(),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    // Note: This can be called without authentication for system logging

    let roomId: string | undefined;
    
    // Get room ID if interaction is provided
    if (args.interactionId) {
      const liveRoom = await ctx.db
        .query("liveRooms")
        .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
        .first();
      
      if (liveRoom) {
        roomId = liveRoom.roomId;
      }
    }

    // Create log entry
    const logId = await ctx.db.insert("liveSystemLogs", {
      level: args.level,
      component: args.component,
      message: args.message,
      metadata: args.metadata,
      interactionId: args.interactionId,
      roomId,
      userId: user?._id,
      timestamp: Date.now()
    });

    return {
      success: true,
      logId
    };
  },
});

/**
 * Get system logs (admin/DM only)
 */
export const getSystemLogs = query({
  args: {
    interactionId: v.optional(v.id("interactions")),
    level: v.optional(v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warn"),
      v.literal("error")
    )),
    component: v.optional(v.string()),
    limit: v.optional(v.number()),
    since: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if user is DM for the interaction (if specified)
    if (args.interactionId) {
      const liveRoom = await ctx.db
        .query("liveRooms")
        .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
        .first();

      if (liveRoom && liveRoom.dmUserId !== user._id) {
        throw new Error("Only DM can view logs");
      }
    }

    // Build query
    let query = ctx.db.query("liveSystemLogs");

    // Filter by interaction if provided
    if (args.interactionId) {
      query = query.filter(q => q.eq(q.field("interactionId"), args.interactionId));
    }

    // Filter by level if provided
    if (args.level) {
      query = query.filter(q => q.eq(q.field("level"), args.level));
    }

    // Filter by component if provided
    if (args.component) {
      query = query.filter(q => q.eq(q.field("component"), args.component));
    }

    // Filter by timestamp if provided
    if (args.since) {
      query = query.filter(q => q.gt(q.field("timestamp"), args.since));
    }

    // Get logs
    const logs = await query
      .order("desc")
      .take(args.limit || 100);

    return logs.reverse(); // Return in chronological order
  },
});

/**
 * Clear old events and logs (cleanup function)
 */
export const cleanupOldData = mutation({
  args: {
    olderThanDays: v.optional(v.number()) // Default 30 days
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // This would typically be restricted to admin users
    // For now, any authenticated user can trigger cleanup
    
    const daysOld = args.olderThanDays || 30;
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    // Clean up old events
    const oldEvents = await ctx.db
      .query("liveGameEvents")
      .withIndex("by_timestamp", q => q.lt("timestamp", cutoffTime))
      .collect();

    // Clean up old logs
    const oldLogs = await ctx.db
      .query("liveSystemLogs")
      .withIndex("by_timestamp", q => q.lt("timestamp", cutoffTime))
      .collect();

    // Delete old events
    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }

    // Delete old logs
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }

    // Log cleanup action
    await ctx.db.insert("liveSystemLogs", {
      level: "info",
      component: "cleanup",
      message: `Cleanup completed: removed ${oldEvents.length} events and ${oldLogs.length} logs older than ${daysOld} days`,
      metadata: {
        eventsRemoved: oldEvents.length,
        logsRemoved: oldLogs.length,
        cutoffTime,
        daysOld
      },
      userId: user._id,
      timestamp: Date.now()
    });

    return {
      success: true,
      eventsRemoved: oldEvents.length,
      logsRemoved: oldLogs.length,
      cutoffTime
    };
  },
});

/**
 * Get live system health and metrics
 */
export const getSystemHealthMetrics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Count active rooms
    const activeRooms = await ctx.db
      .query("liveRooms")
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();

    // Count total rooms
    const totalRooms = await ctx.db
      .query("liveRooms")
      .collect();

    // Count recent events
    const recentEvents = await ctx.db
      .query("liveGameEvents")
      .withIndex("by_timestamp", q => q.gte("timestamp", oneHourAgo))
      .collect();

    // Count error events in last 24 hours
    const errorEvents = await ctx.db
      .query("liveGameEvents")
      .withIndex("by_timestamp", q => q.gte("timestamp", oneDayAgo))
      .filter(q => q.eq(q.field("eventType"), "ERROR"))
      .collect();

    // Count total participants across all active rooms
    const totalParticipants = activeRooms.reduce((sum, room) => 
      sum + room.participants.filter(p => p.isConnected).length, 0
    );

    // Calculate average events per room
    const averageEventsPerRoom = activeRooms.length > 0 
      ? recentEvents.length / activeRooms.length 
      : 0;

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "convex-live-interaction-system",
      metrics: {
        activeRooms: activeRooms.length,
        totalRooms: totalRooms.length,
        totalParticipants,
        eventsLastHour: recentEvents.length,
        errorsLast24Hours: errorEvents.length,
        averageEventsPerRoom: Math.round(averageEventsPerRoom * 10) / 10,
        uptime: now, // Using timestamp as uptime reference
        systemLoad: {
          eventsPerMinute: Math.round(recentEvents.length / 60 * 10) / 10,
          activeRoomRatio: totalRooms.length > 0 ? activeRooms.length / totalRooms.length : 0
        }
      },
      health: {
        database: "healthy",
        realTimeUpdates: "healthy",
        eventProcessing: errorEvents.length < 10 ? "healthy" : "degraded"
      }
    };
  },
});