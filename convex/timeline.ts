import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

// Queries
export const getTimelineEvents = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    if (args.campaignId) {
      return await ctx.db
        .query("timelineEvents")
        .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("timelineEvents").order("desc").collect();
  },
});

export const getTimelineEventsByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    try {
      // Ensure user is authenticated
      await getCurrentUser(ctx);
      
      return await ctx.db
        .query("timelineEvents")
        .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
        .order("asc")
        .collect();
    } catch (error) {
      // Return empty array if not authenticated
      return [];
    }
  },
});

export const getTimelineEventById = query({
  args: { eventId: v.id("timelineEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const getMyTimelineEvents = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      
      return await ctx.db
        .query("timelineEvents")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .order("desc")
        .collect();
    } catch (error) {
      return [];
    }
  },
});

// Mutations
export const createTimelineEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    date: v.number(),
    campaignId: v.id("campaigns"),
    type: v.optional(v.union(
      v.literal("Battle"),
      v.literal("Alliance"),
      v.literal("Discovery"),
      v.literal("Disaster"),
      v.literal("Political"),
      v.literal("Cultural"),
      v.literal("Custom")
    )),
    status: v.optional(v.union(
      v.literal("idle"),
      v.literal("in_progress"),
      v.literal("completed")
    )),
    relatedLocationIds: v.optional(v.array(v.id("locations"))),
    relatedNpcIds: v.optional(v.array(v.id("characters"))),
    relatedFactionIds: v.optional(v.array(v.id("factions"))),
    relatedQuestIds: v.optional(v.array(v.id("quests"))),
    primaryQuestId: v.optional(v.id("quests")),
    eventConsequences: v.optional(v.array(v.string())),
    participantOutcomes: v.optional(v.array(v.object({
      characterId: v.string(),
      outcome: v.string(),
      impact: v.union(v.literal("Positive"), v.literal("Negative"), v.literal("Neutral"))
    }))),
    isPublic: v.optional(v.boolean()),
    dmNotes: v.optional(v.string()),
    playerVisibleNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Check campaign permissions
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const isDM = campaign.dmId === user.clerkId;
    const isAdmin = user.role === "admin";

    if (!isDM && !isAdmin) {
      throw new Error("Only DMs and admins can create timeline events");
    }

    const eventId = await ctx.db.insert("timelineEvents", {
      title: args.title,
      description: args.description,
      date: args.date,
      campaignId: args.campaignId,
      type: args.type || "Custom",
      status: args.status || "idle",
      relatedLocationIds: args.relatedLocationIds,
      relatedNpcIds: args.relatedNpcIds,
      relatedFactionIds: args.relatedFactionIds,
      relatedQuestIds: args.relatedQuestIds,
      primaryQuestId: args.primaryQuestId,
      userId: user._id,
      createdAt: Date.now(),
    });

    return eventId;
  },
});

export const updateTimelineEvent = mutation({
  args: {
    id: v.id("timelineEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("Battle"),
      v.literal("Alliance"),
      v.literal("Discovery"),
      v.literal("Disaster"),
      v.literal("Political"),
      v.literal("Cultural"),
      v.literal("Custom")
    )),
    status: v.optional(v.union(
      v.literal("idle"),
      v.literal("in_progress"),
      v.literal("completed")
    )),
    relatedLocationIds: v.optional(v.array(v.id("locations"))),
    relatedNpcIds: v.optional(v.array(v.id("characters"))),
    relatedFactionIds: v.optional(v.array(v.id("factions"))),
    relatedQuestIds: v.optional(v.array(v.id("quests"))),
    primaryQuestId: v.optional(v.id("quests")),
    isPublic: v.optional(v.boolean()),
    dmNotes: v.optional(v.string()),
    playerVisibleNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;

    // Get existing event
    const existingEvent = await ctx.db.get(id);
    if (!existingEvent) {
      throw new Error("Timeline event not found");
    }

    // Check campaign permissions
    const campaign = await ctx.db.get(existingEvent.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const isDM = campaign.dmId === user.clerkId;
    const isAdmin = user.role === "admin";
    const isOwner = existingEvent.userId === user._id;

    if (!isDM && !isAdmin && !isOwner) {
      throw new Error("Insufficient permissions to update this timeline event");
    }

    // Filter out undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdateData,
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const deleteTimelineEvent = mutation({
  args: { id: v.id("timelineEvents") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get existing event
    const existingEvent = await ctx.db.get(args.id);
    if (!existingEvent) {
      throw new Error("Timeline event not found");
    }

    // Check campaign permissions
    const campaign = await ctx.db.get(existingEvent.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const isDM = campaign.dmId === user.clerkId;
    const isAdmin = user.role === "admin";
    const isOwner = existingEvent.userId === user._id;

    if (!isDM && !isAdmin && !isOwner) {
      throw new Error("Insufficient permissions to delete this timeline event");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});