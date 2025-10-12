import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, getCurrentUserId } from "./clerkService";

// Helper function to check campaign permissions
async function getCampaignAuth(ctx: any, campaignId: string) {
  const user = await getCurrentUser(ctx);
  const clerkId = await getCurrentUserId(ctx);

  const campaign = await ctx.db.get(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const isAdmin = user.role === "admin";
  const isDM = campaign.dmId === clerkId;
  const isPlayer = campaign.players ? campaign.players.includes(clerkId) : false;

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
    try {
      const user = await getCurrentUser(ctx);
      const clerkId = await getCurrentUserId(ctx);
      
      // Get campaigns where user is DM
      const dmCampaigns = await ctx.db
        .query("campaigns")
        .filter((q) => q.eq(q.field("dmId"), clerkId))
        .collect();
      
      // Get campaigns where user is a player (check both players array and participantUserIds)
      const playerCampaigns = await ctx.db
        .query("campaigns")
        .filter((q) => 
          q.or(
            q.neq(q.field("players"), undefined),
            q.neq(q.field("participantUserIds"), undefined)
          )
        )
        .collect();
      
      // Filter player campaigns to only include those where the user is in the players array or participantUserIds
      const userPlayerCampaigns = playerCampaigns.filter(campaign => 
        (campaign.players && campaign.players.includes(clerkId)) ||
        (campaign.participantUserIds && campaign.participantUserIds.includes(user._id))
      );
      
      // Combine and deduplicate
      const allCampaigns = [...dmCampaigns, ...userPlayerCampaigns];
      const uniqueCampaigns = allCampaigns.filter((campaign, index, self) => 
        index === self.findIndex(c => c._id === campaign._id)
      );
      
      return uniqueCampaigns;
    } catch (error) {
      // Return empty array if not authenticated
      return [];
    }
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
    const user = await getCurrentUser(ctx);
    const clerkId = await getCurrentUserId(ctx);

    const campaignId = await ctx.db.insert("campaigns", {
      ...args,
      creatorId: user._id,
      dmId: clerkId,
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
    const updatedPlayers = currentPlayers.filter((id: string) => id !== args.playerClerkId);

    await ctx.db.patch(args.campaignId, {
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  },
}); 