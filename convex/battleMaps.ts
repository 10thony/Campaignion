import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./clerkService";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("battleMaps").collect();
  },
});

// Public function for MAUI native apps - returns all battle maps without authentication
export const getAllBattleMaps = query({
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
  handler: async (ctx, { name, cols, rows, cellSize, cells, clerkId }): Promise<import("./_generated/dataModel").Id<"battleMaps">> => {
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
  handler: async (ctx, args): Promise<void> => {
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
  handler: async (ctx, args): Promise<void> => {
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
  handler: async (ctx, args): Promise<void> => {
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
  handler: async (ctx, { id, clerkId }): Promise<void> => {
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
  handler: async (ctx, args): Promise<import("./_generated/dataModel").Id<"battleMapInstances">> => {
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

// Save a snapshot of the current battle map state
export const saveStateSnapshot = mutation({
  args: {
    instanceId: v.id("battleMapInstances"),
    description: v.string(),
    includeMapCells: v.optional(v.boolean()),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Battle map instance not found");
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

    if (user && instance.createdBy && instance.createdBy !== user._id) {
      throw new Error("Unauthorized: You don't own this battle map instance");
    }

    // Get current token positions
    const tokens = await ctx.db
      .query("battleTokens")
      .withIndex("by_map", (q) => q.eq("mapId", instance.mapId))
      .collect();

    const tokenPositions = tokens.map(token => ({
      tokenId: token._id,
      x: token.x,
      y: token.y,
    }));

    // Optionally get current map cell states
    let mapCells;
    if (args.includeMapCells) {
      const map = await ctx.db.get(instance.mapId);
      if (map && map.cells) {
        mapCells = map.cells.map(cell => ({
          x: cell.x,
          y: cell.y,
          state: cell.state,
          terrainType: cell.terrainType,
          customColor: cell.customColor,
        }));
      }
    }

    const snapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      description: args.description,
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

    await ctx.db.patch(args.instanceId, {
      stateSnapshots: updatedSnapshots,
      updatedAt: Date.now(),
    });

    return snapshot.id;
  },
});

// Restore battle map to a previous state
export const restoreStateSnapshot = mutation({
  args: {
    instanceId: v.id("battleMapInstances"),
    snapshotId: v.string(),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Battle map instance not found");
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

    if (user && instance.createdBy && instance.createdBy !== user._id) {
      throw new Error("Unauthorized: You don't own this battle map instance");
    }

    const snapshots = instance.stateSnapshots || [];
    const snapshot = snapshots.find(s => s.id === args.snapshotId);
    if (!snapshot) {
      throw new Error("Snapshot not found");
    }

    // Restore token positions
    for (const tokenPos of snapshot.tokenPositions) {
      await ctx.db.patch(tokenPos.tokenId, {
        x: tokenPos.x,
        y: tokenPos.y,
        updatedAt: Date.now(),
      });
    }

    // Restore initiative state and action history if available
    const updateData: any = {
      updatedAt: Date.now(),
    };
    
    if (snapshot.initiativeState) {
      updateData.initiativeState = snapshot.initiativeState;
    }
    
    if (snapshot.actionHistory) {
      updateData.actionHistory = snapshot.actionHistory;
    }

    // Restore map cells if available
    if (snapshot.mapCells) {
      const map = await ctx.db.get(instance.mapId);
      if (map && map.cells) {
        // Type guard for valid terrain types
        const isValidTerrainType = (type: string | undefined): type is "normal" | "difficult" | "hazardous" | "magical" | "water" | "ice" | "fire" | "acid" | "poison" | "unstable" => {
          return type === "normal" || type === "difficult" || type === "hazardous" || 
                 type === "magical" || type === "water" || type === "ice" || 
                 type === "fire" || type === "acid" || type === "poison" || type === "unstable";
        };

        const updatedCells = map.cells.map(cell => {
          const snapshotCell = snapshot.mapCells!.find(sc => sc.x === cell.x && sc.y === cell.y);
          if (snapshotCell) {
            const restoredTerrainType = snapshotCell.terrainType && isValidTerrainType(snapshotCell.terrainType)
              ? snapshotCell.terrainType
              : cell.terrainType;
            
            return {
              ...cell,
              state: snapshotCell.state || cell.state,
              terrainType: restoredTerrainType,
              customColor: snapshotCell.customColor || cell.customColor,
            };
          }
          return cell;
        });

        await ctx.db.patch(instance.mapId, {
          cells: updatedCells,
          updatedAt: Date.now(),
        });
      }
    }

    // Update instance with current positions, initiative state, and action history
    updateData.currentPositions = snapshot.tokenPositions;
    await ctx.db.patch(args.instanceId, updateData);

    return { success: true, restoredSnapshot: snapshot };
  },
});

// Clear all tokens from the battle map
export const clearBattleMap = mutation({
  args: {
    instanceId: v.id("battleMapInstances"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Battle map instance not found");
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

    if (user && instance.createdBy && instance.createdBy !== user._id) {
      throw new Error("Unauthorized: You don't own this battle map instance");
    }

    // Delete all tokens on this map
    const tokens = await ctx.db
      .query("battleTokens")
      .withIndex("by_map", (q) => q.eq("mapId", instance.mapId))
      .collect();

    for (const token of tokens) {
      await ctx.db.delete(token._id);
    }

    // Clear current positions and movement history
    await ctx.db.patch(args.instanceId, {
      currentPositions: [],
      movementHistory: [],
      updatedAt: Date.now(),
    });

    return { success: true, clearedTokens: tokens.length };
  },
});

// Get available snapshots for an instance
export const getStateSnapshots = query({
  args: { instanceId: v.id("battleMapInstances") },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Battle map instance not found");
    }

    return instance.stateSnapshots || [];
  },
});

// Get or create instance for a map
export const getOrCreateInstance = mutation({
  args: {
    mapId: v.id("battleMaps"),
    name: v.optional(v.string()),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First try to find existing instance
    let instance = await ctx.db
      .query("battleMapInstances")
      .withIndex("by_map", (q) => q.eq("mapId", args.mapId))
      .first();

    if (instance) {
      return instance._id;
    }

    // Create new instance if none exists
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
      name: args.name || `Instance ${new Date().toLocaleString()}`,
      currentPositions: [],
      movementHistory: [],
      stateSnapshots: [],
      createdBy: user._id,
      clerkId: user.clerkId || args.clerkId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get character and monster data for tokens (for initiative calculation)
export const getTokenEntities = query({
  args: {
    tokenIds: v.array(v.id("battleTokens")),
  },
  handler: async (ctx, args) => {
    const entities: Array<{
      tokenId: string;
      character?: any;
      monster?: any;
      token: any;
    }> = [];

    for (const tokenId of args.tokenIds) {
      const token = await ctx.db.get(tokenId);
      if (!token) continue;

      const result: {
        tokenId: string;
        character?: any;
        monster?: any;
        token: any;
      } = {
        tokenId: token._id,
        token: {
          _id: token._id,
          label: token.label,
          type: token.type,
          characterId: token.characterId,
          monsterId: token.monsterId,
          conditions: token.conditions,
        },
      };

      if (token.characterId) {
        const character = await ctx.db.get(token.characterId);
        if (character) {
          result.character = character;
        }
      }

      if (token.monsterId) {
        const monster = await ctx.db.get(token.monsterId);
        if (monster) {
          result.monster = monster;
        }
      }

      entities.push(result);
    }

    return entities;
  },
});

// Save initiative state to a battle map instance
export const saveInitiativeState = mutation({
  args: {
    instanceId: v.id("battleMapInstances"),
    initiativeState: v.object({
      initiativeOrder: v.array(
        v.object({
          tokenId: v.string(),
          label: v.string(),
          roll: v.number(),
          modifier: v.number(),
          total: v.number(),
          dexterityScore: v.number(),
          type: v.union(v.literal("pc"), v.literal("npc_friendly"), v.literal("npc_foe")),
          characterId: v.optional(v.id("characters")),
          monsterId: v.optional(v.id("monsters")),
        })
      ),
      currentTurnIndex: v.optional(v.union(v.number(), v.null())),
      isInCombat: v.boolean(),
      roundNumber: v.number(),
    }),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Battle map instance not found");
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

    if (user && instance.createdBy && instance.createdBy !== user._id) {
      throw new Error("Unauthorized: You don't own this battle map instance");
    }

    await ctx.db.patch(args.instanceId, {
      initiativeState: args.initiativeState,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Track a combat action (attack, move, spell, etc.)
export const trackAction = mutation({
  args: {
    instanceId: v.id("battleMapInstances"),
    action: v.object({
      roundNumber: v.number(),
      turnIndex: v.number(),
      tokenId: v.id("battleTokens"),
      tokenLabel: v.string(),
      actionType: v.union(
        v.literal("attack"),
        v.literal("move"),
        v.literal("spell"),
        v.literal("item"),
        v.literal("bonus_action"),
        v.literal("reaction"),
        v.literal("other")
      ),
      actionName: v.string(),
      targetTokenId: v.optional(v.id("battleTokens")),
      targetLabel: v.optional(v.string()),
      fromX: v.optional(v.number()),
      fromY: v.optional(v.number()),
      toX: v.optional(v.number()),
      toY: v.optional(v.number()),
      attackRoll: v.optional(v.number()),
      attackBonus: v.optional(v.number()),
      hit: v.optional(v.boolean()),
      damage: v.optional(v.number()),
      damageType: v.optional(v.string()),
      actionData: v.optional(v.any()),
    }),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Battle map instance not found");
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

    if (user && instance.createdBy && instance.createdBy !== user._id) {
      throw new Error("Unauthorized: You don't own this battle map instance");
    }

    const actionEntry = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...args.action,
      timestamp: Date.now(),
    };

    const currentActionHistory = instance.actionHistory || [];
    const updatedActionHistory = [...currentActionHistory, actionEntry];

    // Keep last 1000 actions to prevent unbounded growth
    const trimmedActionHistory = updatedActionHistory.slice(-1000);

    await ctx.db.patch(args.instanceId, {
      actionHistory: trimmedActionHistory,
      updatedAt: Date.now(),
    });

    return { success: true, actionId: actionEntry.id };
  },
});

// Get initiative state from a battle map instance
export const getInitiativeState = query({
  args: {
    instanceId: v.id("battleMapInstances"),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Battle map instance not found");
    }

    return instance.initiativeState || null;
  },
});

// Get action history from a battle map instance
export const getActionHistory = query({
  args: {
    instanceId: v.id("battleMapInstances"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Battle map instance not found");
    }

    const actionHistory = instance.actionHistory || [];
    
    if (args.limit) {
      return actionHistory.slice(-args.limit);
    }

    return actionHistory;
  },
});