import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper function to check campaign permissions
async function getCampaignAuth(ctx: any, campaignId: string) {
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

  const campaign = await ctx.db.get(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const isAdmin = user.role === "admin";
  const isDM = campaign.dmId === identity.subject;
  const isPlayer = campaign.players?.includes(identity.subject) || false;

  return {
    user,
    campaign,
    isAdmin,
    isDM,
    isPlayer,
    canEdit: isAdmin || isDM,
    canDelete: isAdmin || isDM,
  };
}

export const getCampaigns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("campaigns").collect();
  },
});

export const getCampaignById = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

export const getMyCampaigns = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("campaigns")
      .filter((q) => 
        q.or(
          q.eq(q.field("dmId"), identity.subject),
          q.eq(q.field("players"), identity.subject)
        )
      )
      .collect();
  },
});

export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    worldSetting: v.optional(v.string()),
    isPublic: v.boolean(),
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

    const campaignId = await ctx.db.insert("campaigns", {
      ...args,
      creatorId: user._id,
      dmId: identity.subject,
      startDate: Date.now(),
      createdAt: Date.now(),
    });

    return campaignId;
  },
});

export const updateCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    worldSetting: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const auth = await getCampaignAuth(ctx, args.campaignId);
    
    if (!auth.canEdit) {
      throw new Error("You don't have permission to edit this campaign");
    }

    const { campaignId, ...updates } = args;
    await ctx.db.patch(campaignId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteCampaign = mutation({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const auth = await getCampaignAuth(ctx, args.campaignId);
    
    if (!auth.canDelete) {
      throw new Error("You don't have permission to delete this campaign");
    }

    await ctx.db.delete(args.campaignId);
  },
});

export const addPlayerToCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
    playerClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await getCampaignAuth(ctx, args.campaignId);
    
    if (!auth.canEdit) {
      throw new Error("Only DMs and admins can add players");
    }

    const currentPlayers = auth.campaign.players || [];
    if (currentPlayers.includes(args.playerClerkId)) {
      throw new Error("Player is already in the campaign");
    }

    await ctx.db.patch(args.campaignId, {
      players: [...currentPlayers, args.playerClerkId],
      updatedAt: Date.now(),
    });
  },
});

export const removePlayerFromCampaign = mutation({
  args: {
    campaignId: v.id("campaigns"),
    playerClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await getCampaignAuth(ctx, args.campaignId);
    
    if (!auth.canEdit) {
      throw new Error("Only DMs and admins can remove players");
    }

    const currentPlayers = auth.campaign.players || [];
    const updatedPlayers = currentPlayers.filter(id => id !== args.playerClerkId);

    await ctx.db.patch(args.campaignId, {
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  },
}); 