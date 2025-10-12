import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

// Queries
export const getFactions = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    if (args.campaignId) {
      return await ctx.db
        .query("factions")
        .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
        .collect();
    }
    return await ctx.db.query("factions").collect();
  },
});

export const getFactionById = query({
  args: { factionId: v.id("factions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.factionId);
  },
});

export const getMyFactions = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      
      return await ctx.db
        .query("factions")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
    } catch (error) {
      return [];
    }
  },
});

// Mutations
export const createFaction = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    campaignId: v.id("campaigns"),
    goals: v.optional(v.array(v.string())),
    leaderNpcIds: v.optional(v.array(v.id("characters"))),
    alliedFactionIds: v.optional(v.array(v.id("factions"))),
    enemyFactionIds: v.optional(v.array(v.id("factions"))),
    reputation: v.optional(v.array(v.object({
      playerCharacterId: v.string(),
      score: v.number()
    }))),
    factionType: v.optional(v.union(
      v.literal("Government"),
      v.literal("Religious"),
      v.literal("Mercantile"),
      v.literal("Criminal"),
      v.literal("Military"),
      v.literal("Scholarly"),
      v.literal("Other")
    )),
    influence: v.optional(v.union(
      v.literal("Local"),
      v.literal("Regional"),
      v.literal("National"),
      v.literal("International")
    )),
    resources: v.optional(v.union(
      v.literal("Poor"),
      v.literal("Modest"),
      v.literal("Wealthy"),
      v.literal("Rich"),
      v.literal("Aristocratic")
    )),
    publicInformation: v.optional(v.string()),
    factionSecrets: v.optional(v.string()),
    dmNotes: v.optional(v.string()),
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
      throw new Error("Only DMs and admins can create factions");
    }

    const factionId = await ctx.db.insert("factions", {
      name: args.name,
      description: args.description,
      campaignId: args.campaignId,
      goals: args.goals,
      leaderNpcIds: args.leaderNpcIds,
      alliedFactionIds: args.alliedFactionIds,
      enemyFactionIds: args.enemyFactionIds,
      reputation: args.reputation,
      userId: user._id,
      createdAt: Date.now(),
    });

    return factionId;
  },
});

export const updateFaction = mutation({
  args: {
    id: v.id("factions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    leaderNpcIds: v.optional(v.array(v.id("characters"))),
    alliedFactionIds: v.optional(v.array(v.id("factions"))),
    enemyFactionIds: v.optional(v.array(v.id("factions"))),
    reputation: v.optional(v.array(v.object({
      playerCharacterId: v.string(),
      score: v.number()
    }))),
    factionType: v.optional(v.union(
      v.literal("Government"),
      v.literal("Religious"),
      v.literal("Mercantile"),
      v.literal("Criminal"),
      v.literal("Military"),
      v.literal("Scholarly"),
      v.literal("Other")
    )),
    influence: v.optional(v.union(
      v.literal("Local"),
      v.literal("Regional"),
      v.literal("National"),
      v.literal("International")
    )),
    resources: v.optional(v.union(
      v.literal("Poor"),
      v.literal("Modest"),
      v.literal("Wealthy"),
      v.literal("Rich"),
      v.literal("Aristocratic")
    )),
    publicInformation: v.optional(v.string()),
    factionSecrets: v.optional(v.string()),
    dmNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;

    // Get existing faction
    const existingFaction = await ctx.db.get(id);
    if (!existingFaction) {
      throw new Error("Faction not found");
    }

    // Check campaign permissions
    const campaign = await ctx.db.get(existingFaction.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const isDM = campaign.dmId === user.clerkId;
    const isAdmin = user.role === "admin";
    const isOwner = existingFaction.userId === user._id;

    if (!isDM && !isAdmin && !isOwner) {
      throw new Error("Insufficient permissions to update this faction");
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

export const deleteFaction = mutation({
  args: { id: v.id("factions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get existing faction
    const existingFaction = await ctx.db.get(args.id);
    if (!existingFaction) {
      throw new Error("Faction not found");
    }

    // Check campaign permissions
    const campaign = await ctx.db.get(existingFaction.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const isDM = campaign.dmId === user.clerkId;
    const isAdmin = user.role === "admin";
    const isOwner = existingFaction.userId === user._id;

    if (!isDM && !isAdmin && !isOwner) {
      throw new Error("Insufficient permissions to delete this faction");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const updateFactionReputation = mutation({
  args: {
    factionId: v.id("factions"),
    playerCharacterId: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get existing faction
    const faction = await ctx.db.get(args.factionId);
    if (!faction) {
      throw new Error("Faction not found");
    }

    // Check campaign permissions
    const campaign = await ctx.db.get(faction.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const isDM = campaign.dmId === user.clerkId;
    const isAdmin = user.role === "admin";

    if (!isDM && !isAdmin) {
      throw new Error("Only DMs and admins can update faction reputation");
    }

    // Validate score range
    if (args.score < -100 || args.score > 100) {
      throw new Error("Reputation score must be between -100 and 100");
    }

    // Update or add reputation entry
    const currentReputation = faction.reputation || [];
    const existingIndex = currentReputation.findIndex(
      r => r.playerCharacterId === args.playerCharacterId
    );

    let newReputation;
    if (existingIndex >= 0) {
      // Update existing entry
      newReputation = [...currentReputation];
      newReputation[existingIndex].score = args.score;
    } else {
      // Add new entry
      newReputation = [...currentReputation, {
        playerCharacterId: args.playerCharacterId,
        score: args.score,
      }];
    }

    await ctx.db.patch(args.factionId, {
      reputation: newReputation,
      updatedAt: Date.now(),
    });

    return args.factionId;
  },
});