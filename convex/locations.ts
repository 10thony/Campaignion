import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

// Queries
export const getLocations = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    try {
      // Ensure user is authenticated
      await getCurrentUser(ctx);
      
      if (args.campaignId) {
        return await ctx.db
          .query("locations")
          .filter((q) => q.eq(q.field("campaignId"), args.campaignId))
          .collect();
      }
      return await ctx.db.query("locations").collect();
    } catch (error) {
      // Return empty array if not authenticated
      return [];
    }
  },
});

export const getLocationById = query({
  args: { locationId: v.id("locations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.locationId);
  },
});

export const getMyLocations = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      
      return await ctx.db
        .query("locations")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
    } catch (error) {
      return [];
    }
  },
});

export const getGlobalLocations = query({
  args: {},
  handler: async (ctx) => {
    // Get locations that aren't tied to a specific campaign
    return await ctx.db
      .query("locations")
      .filter((q) => q.eq(q.field("campaignId"), undefined))
      .collect();
  },
});

// Mutations
export const createLocation = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("Town"),
      v.literal("City"),
      v.literal("Village"),
      v.literal("Dungeon"),
      v.literal("Castle"),
      v.literal("Forest"),
      v.literal("Mountain"),
      v.literal("Temple"),
      v.literal("Ruins"),
      v.literal("Camp"),
      v.literal("Other")
    ),
    campaignId: v.optional(v.id("campaigns")),
    notableCharacterIds: v.optional(v.array(v.id("characters"))),
    linkedLocations: v.optional(v.array(v.id("locations"))),
    population: v.optional(v.number()),
    government: v.optional(v.string()),
    defenses: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    mapId: v.optional(v.id("maps")),
    publicInformation: v.optional(v.string()),
    secrets: v.optional(v.string()),
    dmNotes: v.optional(v.string()),
    interactionsAtLocation: v.optional(v.array(v.id("interactions"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // If location is assigned to a campaign, check permissions
    if (args.campaignId) {
      const campaign = await ctx.db.get(args.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
      const isAdmin = user.role === "admin";

      if (!isDM && !isAdmin) {
        throw new Error("Only DMs and admins can create campaign-specific locations");
      }
    }

    const locationId = await ctx.db.insert("locations", {
      name: args.name,
      type: args.type,
      description: args.description,
      campaignId: args.campaignId,
      notableCharacterIds: args.notableCharacterIds || [],
      linkedLocations: args.linkedLocations || [],
      interactionsAtLocation: args.interactionsAtLocation || [],
      imageUrls: args.imageUrls || [],
      population: args.population,
      government: args.government,
      defenses: args.defenses,
      mapId: args.mapId,
      publicInformation: args.publicInformation,
      secrets: args.secrets,
      dmNotes: args.dmNotes,
      userId: user._id,
      createdAt: Date.now(),
    });

    return locationId;
  },
});

export const updateLocation = mutation({
  args: {
    id: v.id("locations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("Town"),
      v.literal("City"),
      v.literal("Village"),
      v.literal("Dungeon"),
      v.literal("Castle"),
      v.literal("Forest"),
      v.literal("Mountain"),
      v.literal("Temple"),
      v.literal("Ruins"),
      v.literal("Camp"),
      v.literal("Other")
    )),
    campaignId: v.optional(v.id("campaigns")),
    notableCharacterIds: v.optional(v.array(v.id("characters"))),
    linkedLocations: v.optional(v.array(v.id("locations"))),
    population: v.optional(v.number()),
    government: v.optional(v.string()),
    defenses: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    mapId: v.optional(v.id("maps")),
    publicInformation: v.optional(v.string()),
    secrets: v.optional(v.string()),
    dmNotes: v.optional(v.string()),
    interactionsAtLocation: v.optional(v.array(v.id("interactions"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;

    // Get existing location
    const existingLocation = await ctx.db.get(id);
    if (!existingLocation) {
      throw new Error("Location not found");
    }

    // Check campaign permissions if location is tied to a campaign
    if (existingLocation.campaignId || args.campaignId) {
      const campaignId = args.campaignId || existingLocation.campaignId;
      if (campaignId) {
        const campaign = await ctx.db.get(campaignId);
        if (!campaign) {
          throw new Error("Campaign not found");
        }

        const isDM = campaign.dmId === user.clerkId;
        const isAdmin = user.role === "admin";
        const isOwner = existingLocation.userId === user._id;

        if (!isDM && !isAdmin && !isOwner) {
          throw new Error("Insufficient permissions to update this location");
        }
      }
    } else {
      // For global locations, only owner or admin can edit
      const isAdmin = user.role === "admin";
      const isOwner = existingLocation.userId === user._id;

      if (!isAdmin && !isOwner) {
        throw new Error("Insufficient permissions to update this location");
      }
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

export const deleteLocation = mutation({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get existing location
    const existingLocation = await ctx.db.get(args.id);
    if (!existingLocation) {
      throw new Error("Location not found");
    }

    // Check campaign permissions if location is tied to a campaign
    if (existingLocation.campaignId) {
      const campaign = await ctx.db.get(existingLocation.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
      const isAdmin = user.role === "admin";
      const isOwner = existingLocation.userId === user._id;

      if (!isDM && !isAdmin && !isOwner) {
        throw new Error("Insufficient permissions to delete this location");
      }
    } else {
      // For global locations, only owner or admin can delete
      const isAdmin = user.role === "admin";
      const isOwner = existingLocation.userId === user._id;

      if (!isAdmin && !isOwner) {
        throw new Error("Insufficient permissions to delete this location");
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const addLocationConnection = mutation({
  args: {
    locationId: v.id("locations"),
    connectedLocationId: v.id("locations"),
    bidirectional: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get both locations
    const location = await ctx.db.get(args.locationId);
    const connectedLocation = await ctx.db.get(args.connectedLocationId);

    if (!location || !connectedLocation) {
      throw new Error("One or both locations not found");
    }

    // Check permissions for the primary location
    if (location.campaignId) {
      const campaign = await ctx.db.get(location.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
      const isAdmin = user.role === "admin";

      if (!isDM && !isAdmin) {
        throw new Error("Insufficient permissions to modify location connections");
      }
    }

    // Add connection to the primary location
    const currentConnections = location.linkedLocations || [];
    if (!currentConnections.includes(args.connectedLocationId)) {
      await ctx.db.patch(args.locationId, {
        linkedLocations: [...currentConnections, args.connectedLocationId],
        updatedAt: Date.now(),
      });
    }

    // Add bidirectional connection if requested
    if (args.bidirectional !== false) {
      const connectedCurrentConnections = connectedLocation.linkedLocations || [];
      if (!connectedCurrentConnections.includes(args.locationId)) {
        await ctx.db.patch(args.connectedLocationId, {
          linkedLocations: [...connectedCurrentConnections, args.locationId],
          updatedAt: Date.now(),
        });
      }
    }

    return args.locationId;
  },
});

export const removeLocationConnection = mutation({
  args: {
    locationId: v.id("locations"),
    connectedLocationId: v.id("locations"),
    bidirectional: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get both locations
    const location = await ctx.db.get(args.locationId);
    const connectedLocation = await ctx.db.get(args.connectedLocationId);

    if (!location || !connectedLocation) {
      throw new Error("One or both locations not found");
    }

    // Check permissions for the primary location
    if (location.campaignId) {
      const campaign = await ctx.db.get(location.campaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const isDM = campaign.dmId === user.clerkId;
      const isAdmin = user.role === "admin";

      if (!isDM && !isAdmin) {
        throw new Error("Insufficient permissions to modify location connections");
      }
    }

    // Remove connection from the primary location
    const currentConnections = location.linkedLocations || [];
    const filteredConnections = currentConnections.filter(id => id !== args.connectedLocationId);
    
    await ctx.db.patch(args.locationId, {
      linkedLocations: filteredConnections,
      updatedAt: Date.now(),
    });

    // Remove bidirectional connection if requested
    if (args.bidirectional !== false) {
      const connectedCurrentConnections = connectedLocation.linkedLocations || [];
      const connectedFilteredConnections = connectedCurrentConnections.filter(id => id !== args.locationId);
      
      await ctx.db.patch(args.connectedLocationId, {
        linkedLocations: connectedFilteredConnections,
        updatedAt: Date.now(),
      });
    }

    return args.locationId;
  },
});