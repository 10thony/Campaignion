import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("battleTokens", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const move = mutation({
  args: {
    id: v.id("battleTokens"),
    x: v.number(),
    y: v.number(),
    enforceSingleOccupancy: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, x, y, enforceSingleOccupancy }) => {
    const token = await ctx.db.get(id);
    if (!token) throw new Error("Token not found");

    const map = await ctx.db.get(token.mapId);
    if (!map) throw new Error("Map not found");
    if (x < 0 || y < 0 || x >= map.cols || y >= map.rows) {
      throw new Error("Out of bounds");
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

    await ctx.db.patch(id, { x, y, updatedAt: Date.now() });
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
  args: { id: v.id("battleTokens") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
