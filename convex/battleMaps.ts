import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./clerkService";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("battleMaps").collect();
  },
});

export const getUserMaps = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      if (!user) {
        return [];
      }
      return await ctx.db
        .query("battleMaps")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();
    } catch (error) {
      console.error('getUserMaps error:', error);
      return [];
    }
  },
});

export const get = query({
  args: { id: v.id("battleMaps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Generate default cells for a new map
const generateDefaultCells = (cols: number, rows: number) => {
  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      cells.push({
        x,
        y,
        state: "inbounds" as const,
        terrainType: "normal" as const,
      });
    }
  }
  return cells;
};

export const create = mutation({
  args: {
    name: v.string(),
    cols: v.number(),
    rows: v.number(),
    cellSize: v.number(),
    cells: v.optional(v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        state: v.optional(v.union(v.literal("inbounds"), v.literal("outbounds"), v.literal("occupied"))),
        terrainType: v.optional(
          v.union(
            v.literal("normal"),
            v.literal("difficult"),
            v.literal("hazardous"),
            v.literal("magical"),
            v.literal("water"),
            v.literal("ice"),
            v.literal("fire"),
            v.literal("acid"),
            v.literal("poison"),
            v.literal("unstable")
          )
        ),
        customColor: v.optional(v.string()),
      })
    )),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, { name, cols, rows, cellSize, cells, clerkId }) => {
    // Validate map name
    if (!name || name.trim().length === 0) {
      throw new Error("Map name is required");
    }
    
    if (name.length > 100) {
      throw new Error("Map name cannot exceed 100 characters");
    }
    
    // Validate grid dimensions
    if (cols <= 0 || rows <= 0) {
      throw new Error("Columns and rows must be greater than 0");
    }
    
    if (cols > 50 || rows > 50) {
      throw new Error("Columns and rows cannot exceed 50 (maximum 2,500 cells)");
    }
    
    // Validate cell size
    if (cellSize < 20 || cellSize > 200) {
      throw new Error("Cell size must be between 20 and 200 pixels");
    }

    let user;
    
    if (clerkId) {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), clerkId))
        .first();
    } else {
      user = await getCurrentUser(ctx);
    }

    // Validate that user exists
    if (!user) {
      throw new Error("User not found. Please sign in and try again.");
    }

    const now = Date.now();
    return await ctx.db.insert("battleMaps", {
      name,
      cols,
      rows,
      cellSize,
      cells: cells || generateDefaultCells(cols, rows),
      createdBy: user._id,
      clerkId: user.clerkId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("battleMaps"),
    name: v.optional(v.string()),
    cols: v.optional(v.number()),
    rows: v.optional(v.number()),
    cellSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

// Update terrain on specific cells
export const updateCells = mutation({
  args: {
    mapId: v.id("battleMaps"),
    cells: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        state: v.optional(v.union(v.literal("inbounds"), v.literal("outbounds"), v.literal("occupied"))),
        terrainType: v.optional(
          v.union(
            v.literal("normal"),
            v.literal("difficult"),
            v.literal("hazardous"),
            v.literal("magical"),
            v.literal("water"),
            v.literal("ice"),
            v.literal("fire"),
            v.literal("acid"),
            v.literal("poison"),
            v.literal("unstable")
          )
        ),
        terrainEffect: v.optional(
          v.object({
            movementCostMultiplier: v.optional(v.number()),
            damage: v.optional(
              v.object({
                amount: v.number(),
                type: v.union(
                  v.literal("fire"),
                  v.literal("cold"),
                  v.literal("acid"),
                  v.literal("poison"),
                  v.literal("necrotic"),
                  v.literal("radiant")
                ),
                saveType: v.optional(v.string()),
                saveDC: v.optional(v.number())
              })
            ),
            abilityChecks: v.optional(
              v.array(
                v.object({
                  ability: v.string(),
                  dc: v.number(),
                  onFailure: v.string()
                })
              )
            ),
            specialEffects: v.optional(v.array(v.string()))
          })
        ),
        customColor: v.optional(v.string()),
      })
    ),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const map = await ctx.db.get(args.mapId);
    if (!map) {
      throw new Error("Map not found");
    }

    let user;
    if (args.clerkId) {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      user = await getCurrentUser(ctx);
    }

    if (user && map.createdBy && map.createdBy !== user._id) {
      throw new Error("Unauthorized: You don't own this map");
    }

    await ctx.db.patch(args.mapId, {
      cells: args.cells,
      updatedAt: Date.now(),
    });
  },
});

// Update a single cell's terrain
export const updateCell = mutation({
  args: {
    mapId: v.id("battleMaps"),
    x: v.number(),
    y: v.number(),
    state: v.optional(v.union(v.literal("inbounds"), v.literal("outbounds"), v.literal("occupied"))),
    terrainType: v.optional(
      v.union(
        v.literal("normal"),
        v.literal("difficult"),
        v.literal("hazardous"),
        v.literal("magical"),
        v.literal("water"),
        v.literal("ice"),
        v.literal("fire"),
        v.literal("acid"),
        v.literal("poison"),
        v.literal("unstable")
      )
    ),
    customColor: v.optional(v.string()),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const map = await ctx.db.get(args.mapId);
    if (!map) {
      throw new Error("Map not found");
    }

    let user;
    if (args.clerkId) {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      user = await getCurrentUser(ctx);
    }

    if (user && map.createdBy && map.createdBy !== user._id) {
      throw new Error("Unauthorized: You don't own this map");
    }

    const cells = map.cells || generateDefaultCells(map.cols, map.rows);
    const cellIndex = cells.findIndex(c => c.x === args.x && c.y === args.y);
    
    if (cellIndex === -1) {
      throw new Error(`Cell at position (${args.x}, ${args.y}) not found on this map. Map has ${map.cols}x${map.rows} cells.`);
    }
    
    cells[cellIndex] = {
      ...cells[cellIndex],
      ...(args.state && { state: args.state }),
      ...(args.terrainType && { terrainType: args.terrainType }),
      ...(args.customColor !== undefined && { customColor: args.customColor }),
    };

    await ctx.db.patch(args.mapId, {
      cells,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { 
    id: v.id("battleMaps"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, { id, clerkId }) => {
    const map = await ctx.db.get(id);
    if (!map) {
      throw new Error("Map not found");
    }

    let user;
    if (clerkId) {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), clerkId))
        .first();
    } else {
      user = await getCurrentUser(ctx);
    }

    if (user && map.createdBy && map.createdBy !== user._id) {
      throw new Error("Unauthorized: You don't own this map");
    }

    // delete tokens on this map
    const tokens = await ctx.db
      .query("battleTokens")
      .withIndex("by_map", (q) => q.eq("mapId", id))
      .collect();
    for (const t of tokens) {
      await ctx.db.delete(t._id);
    }
    
    // delete map instances
    const instances = await ctx.db
      .query("battleMapInstances")
      .withIndex("by_map", (q) => q.eq("mapId", id))
      .collect();
    for (const inst of instances) {
      await ctx.db.delete(inst._id);
    }
    
    await ctx.db.delete(id);
  },
});

// Map Instance functions
export const createInstance = mutation({
  args: {
    mapId: v.id("battleMaps"),
    name: v.string(),
    campaignId: v.optional(v.id("campaigns")),
    interactionId: v.optional(v.id("interactions")),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user;
    if (args.clerkId) {
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      user = await getCurrentUser(ctx);
    }
    
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    return await ctx.db.insert("battleMapInstances", {
      mapId: args.mapId,
      name: args.name,
      campaignId: args.campaignId,
      interactionId: args.interactionId,
      currentPositions: [],
      movementHistory: [],
      createdBy: user._id,
      clerkId: user.clerkId || args.clerkId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getInstance = query({
  args: { instanceId: v.id("battleMapInstances") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.instanceId);
  },
});

export const getInstancesByMap = query({
  args: { mapId: v.id("battleMaps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("battleMapInstances")
      .withIndex("by_map", (q) => q.eq("mapId", args.mapId))
      .collect();
  },
});
