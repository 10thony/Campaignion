import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./clerkService";

export const listByMap = query({
  args: { mapId: v.id("battleMaps") },
  handler: async (ctx, { mapId }) => {
    return await ctx.db
      .query("battleTokens")
      .withIndex("by_map", (q) => q.eq("mapId", mapId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("battleTokens") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    mapId: v.id("battleMaps"),
    x: v.number(),
    y: v.number(),
    label: v.string(),
    type: v.union(
      v.literal("pc"),
      v.literal("npc_friendly"),
      v.literal("npc_foe")
    ),
    color: v.string(),
    size: v.number(),
    characterId: v.optional(v.id("characters")),
    monsterId: v.optional(v.id("monsters")),
    speed: v.optional(v.number()),
    hp: v.optional(v.number()),
    maxHp: v.optional(v.number()),
    conditions: v.optional(v.array(v.string())),
    autoSaveSnapshot: v.optional(v.boolean()),
  },
  handler: async (ctx, { autoSaveSnapshot = true, ...args }) => {
    const now = Date.now();
    const tokenId = await ctx.db.insert("battleTokens", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-save snapshot if enabled
    if (autoSaveSnapshot) {
      try {
        await autoSaveBattleMapSnapshot(ctx, args.mapId, `Token created: ${args.label}`);
      } catch (error) {
        console.warn("Failed to auto-save snapshot:", error);
      }
    }

    return tokenId;
  },
});

export const move = mutation({
  args: {
    id: v.id("battleTokens"),
    x: v.number(),
    y: v.number(),
    enforceSingleOccupancy: v.optional(v.boolean()),
    autoSaveSnapshot: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, x, y, enforceSingleOccupancy, autoSaveSnapshot = true }) => {
    const token = await ctx.db.get(id);
    if (!token) throw new Error("Token not found");

    const map = await ctx.db.get(token.mapId);
    if (!map) throw new Error("Map not found");
    if (x < 0 || y < 0 || x >= map.cols || y >= map.rows) {
      throw new Error("Out of bounds");
    }

    // Check initiative restrictions - only allow movement if it's the current turn's token
    const instance = await ctx.db
      .query("battleMapInstances")
      .withIndex("by_map", (q) => q.eq("mapId", token.mapId))
      .first();
    
    if (instance?.initiativeState?.isInCombat && instance.initiativeState.currentTurnIndex !== null && instance.initiativeState.currentTurnIndex !== undefined) {
      const currentEntry = instance.initiativeState.initiativeOrder[instance.initiativeState.currentTurnIndex];
      if (currentEntry && currentEntry.tokenId !== id) {
        throw new Error(`It's ${currentEntry.label}'s turn. Only the current turn's token can move during combat.`);
      }
    }

    if (enforceSingleOccupancy) {
      const others = await ctx.db
        .query("battleTokens")
        .withIndex("by_map", (q) => q.eq("mapId", token.mapId))
        .collect();
      const occupied = others.find(
        (t) => t._id !== id && t.x === x && t.y === y
      );
      if (occupied) throw new Error("Tile occupied");
    }

    // Store old position for snapshot
    const oldX = token.x;
    const oldY = token.y;

    await ctx.db.patch(id, { x, y, updatedAt: Date.now() });

    // Auto-save snapshot if enabled and position actually changed
    if (autoSaveSnapshot && (oldX !== x || oldY !== y)) {
      try {
        await autoSaveBattleMapSnapshot(ctx, token.mapId, `Token moved: ${token.label}`);
      } catch (error) {
        console.warn("Failed to auto-save snapshot:", error);
        // Don't fail the move operation if snapshot fails
      }
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("battleTokens"),
    label: v.optional(v.string()),
    type: v.optional(
      v.union(v.literal("pc"), v.literal("npc_friendly"), v.literal("npc_foe"))
    ),
    color: v.optional(v.string()),
    size: v.optional(v.number()),
    characterId: v.optional(v.id("characters")),
    monsterId: v.optional(v.id("monsters")),
    speed: v.optional(v.number()),
    hp: v.optional(v.number()),
    maxHp: v.optional(v.number()),
    conditions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { id, ...patch }) => {
    await ctx.db.patch(id, { ...patch, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { 
    id: v.id("battleTokens"),
    autoSaveSnapshot: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, autoSaveSnapshot = true }) => {
    const token = await ctx.db.get(id);
    if (!token) return;

    // Auto-save snapshot before deletion if enabled
    if (autoSaveSnapshot) {
      try {
        await autoSaveBattleMapSnapshot(ctx, token.mapId, `Token removed: ${token.label}`);
      } catch (error) {
        console.warn("Failed to auto-save snapshot:", error);
      }
    }

    await ctx.db.delete(id);
  },
});

// Helper function to automatically save battle map snapshots
async function autoSaveBattleMapSnapshot(ctx: any, mapId: string, description: string) {
  try {
    // Get or create a battle map instance for this map
    let instance = await ctx.db
      .query("battleMapInstances")
      .withIndex("by_map", (q) => q.eq("mapId", mapId))
      .first();

    if (!instance) {
      // Create a new instance if none exists
      const user = await getCurrentUser(ctx);
      if (!user) return; // Skip auto-save if no user

      const instanceId = await ctx.db.insert("battleMapInstances", {
        mapId: mapId as any,
        name: `Auto Instance ${new Date().toLocaleString()}`,
        currentPositions: [],
        movementHistory: [],
        stateSnapshots: [],
        createdBy: user._id,
        clerkId: user.clerkId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      instance = await ctx.db.get(instanceId);
    }

    if (!instance) return;

    // Get current token positions
    const tokens = await ctx.db
      .query("battleTokens")
      .withIndex("by_map", (q) => q.eq("mapId", mapId))
      .collect();

    const tokenPositions = tokens.map(token => ({
      tokenId: token._id,
      x: token.x,
      y: token.y,
    }));

    // Get current map cell states
    const map = await ctx.db.get(mapId);
    let mapCells;
    if (map && map.cells) {
      mapCells = map.cells.map(cell => ({
        x: cell.x,
        y: cell.y,
        state: cell.state,
        terrainType: cell.terrainType,
        customColor: cell.customColor,
      }));
    }

    const snapshot = {
      id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      description,
      tokenPositions,
      mapCells,
      // Include initiative state if it exists
      initiativeState: instance.initiativeState || undefined,
      // Include action history up to this point
      actionHistory: instance.actionHistory || undefined,
    };

    // Add snapshot to the instance (keep last 10 snapshots)
    const currentSnapshots = instance.stateSnapshots || [];
    const updatedSnapshots = [snapshot, ...currentSnapshots].slice(0, 10);

    await ctx.db.patch(instance._id, {
      stateSnapshots: updatedSnapshots,
      currentPositions: tokenPositions,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.warn("Auto-save snapshot failed:", error);
  }
}
