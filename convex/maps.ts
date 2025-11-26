import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

// Get all maps (will be filtered on client side)
export const getAllMaps = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await ctx.db
        .query("maps")
        .collect();
    } catch (error) {
      console.error('getAllMaps error:', error);
      return [];
    }
  },
});

// Get maps for the current user
export const getUserMaps = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      if (!user) {
        return [];
      }

      return await ctx.db
        .query("maps")
        .filter((q) => q.eq(q.field("createdBy"), user._id))
        .collect();
    } catch (error) {
      console.error('getUserMaps error:', error);
      return [];
    }
  },
});

// List maps (for dropdowns, filtering by clerkId if provided)
export const list = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db.query("maps");
      
      if (args.clerkId) {
        query = query.filter((q) => q.eq(q.field("clerkId"), args.clerkId));
      }
      
      return await query.collect();
    } catch (error) {
      console.error('list maps error:', error);
      return [];
    }
  },
});

// Get all map instances (will be filtered on client side)
export const getAllMapInstances = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await ctx.db
        .query("mapInstances")
        .collect();
    } catch (error) {
      console.error('getAllMapInstances error:', error);
      return [];
    }
  },
});

// Get a specific map by ID
export const getMap = query({
  args: { mapId: v.id("maps") },
  handler: async (ctx, args) => {
    const map = await ctx.db.get(args.mapId);
    if (!map) {
      throw new Error("Map not found");
    }

    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user owns this map or is admin
    if (map.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Unauthorized access to map");
    }

    return map;
  },
});

// Get a specific map instance
export const getMapInstance = query({
  args: { instanceId: v.id("mapInstances") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.instanceId);
  },
});

// Get map instance by interaction ID
export const getMapInstanceByInteraction = query({
  args: { 
    interactionId: v.id("interactions"),
    mapId: v.optional(v.id("maps"))
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("mapInstances")
      .filter((q) => q.eq(q.field("interactionId"), args.interactionId));
    
    if (args.mapId) {
      return await query.filter((q) => q.eq(q.field("mapId"), args.mapId)).first();
    }
    
    return await query.first();
  },
});

// Create a new map
export const createMap = mutation({
  args: {
    name: v.string(),
    width: v.number(),
    height: v.number(),
    mapType: v.optional(v.union(v.literal("battle"), v.literal("nonCombat"))),
    cells: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        state: v.union(v.literal("inbounds"), v.literal("outbounds"), v.literal("occupied")),
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
        portalLink: v.optional(
          v.object({
            targetMapId: v.id("maps"),
            targetX: v.number(),
            targetY: v.number(),
            label: v.optional(v.string()),
          })
        ),
      })
    ),
    clerkId: v.optional(v.string()), // Add optional clerkId prop
  },
  handler: async (ctx, args) => {
    let user;
    
    if (args.clerkId) {
      // Use provided clerkId to get user from database
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      // Fallback to backend authentication
      user = await getCurrentUser(ctx);
    }
    
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    return await ctx.db.insert("maps", {
      name: args.name,
      width: args.width,
      height: args.height,
      mapType: args.mapType || "battle", // Default to battle for backward compatibility
      cells: args.cells,
      createdBy: user._id,
      clerkId: args.clerkId || user.clerkId, // Store Clerk ID for direct filtering
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update map cells
export const updateMapCells = mutation({
  args: {
    mapId: v.id("maps"),
    cells: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        state: v.union(v.literal("inbounds"), v.literal("outbounds"), v.literal("occupied")),
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
        occupant: v.optional(
          v.object({
            id: v.string(),
            type: v.union(v.literal("character"), v.literal("monster")),
            color: v.string(),
            speed: v.number(),
            name: v.string(),
          })
        ),
        customColor: v.optional(v.string()),
        portalLink: v.optional(
          v.object({
            targetMapId: v.id("maps"),
            targetX: v.number(),
            targetY: v.number(),
            label: v.optional(v.string()),
          })
        ),
      })
    ),
    clerkId: v.optional(v.string()), // Add optional clerkId prop
  },
  handler: async (ctx, args) => {
    const map = await ctx.db.get(args.mapId);
    if (!map) {
      throw new Error("Map not found");
    }

    let user;
    
    if (args.clerkId) {
      // Use provided clerkId to get user from database
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      // Fallback to backend authentication
      user = await getCurrentUser(ctx);
    }
    
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user owns this map or is admin
    if (map.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Unauthorized access to map");
    }

    await ctx.db.patch(args.mapId, {
      cells: args.cells,
      updatedAt: Date.now(),
    });
  },
});

// Delete a map
export const deleteMap = mutation({
  args: { 
    mapId: v.id("maps"),
    clerkId: v.optional(v.string()), // Add optional clerkId prop
  },
  handler: async (ctx, args) => {
    const map = await ctx.db.get(args.mapId);
    if (!map) {
      throw new Error("Map not found");
    }

    let user;
    
    if (args.clerkId) {
      // Use provided clerkId to get user from database
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      // Fallback to backend authentication
      user = await getCurrentUser(ctx);
    }
    
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user owns this map or is admin
    if (map.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Unauthorized access to map");
    }

    await ctx.db.delete(args.mapId);
  },
});

// Create a map instance
export const createMapInstance = mutation({
  args: {
    mapId: v.id("maps"),
    name: v.string(),
    campaignId: v.optional(v.id("campaigns")),
    interactionId: v.optional(v.id("interactions")),
    clerkId: v.optional(v.string()), // Add optional clerkId prop
  },
  handler: async (ctx, args) => {
    let user;
    
    if (args.clerkId) {
      // Use provided clerkId to get user from database
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      // Fallback to backend authentication
      user = await getCurrentUser(ctx);
    }
    
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    return await ctx.db.insert("mapInstances", {
      mapId: args.mapId,
      campaignId: args.campaignId,
      interactionId: args.interactionId,
      name: args.name,
      currentPositions: [],
      movementHistory: [],
      createdBy: user._id,
      clerkId: args.clerkId || user.clerkId, // Store Clerk ID for direct filtering
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update map instance positions
export const updateMapInstancePositions = mutation({
  args: {
    instanceId: v.id("mapInstances"),
    positions: v.array(
      v.object({
        entityId: v.string(),
        entityType: v.union(v.literal("playerCharacter"), v.literal("npc"), v.literal("monster")),
        x: v.number(),
        y: v.number(),
        speed: v.number(),
        name: v.string(),
        color: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Map instance not found");
    }

    await ctx.db.patch(args.instanceId, {
      currentPositions: args.positions,
      updatedAt: Date.now(),
    });
  },
});

// Add movement to history
export const addMovementToHistory = mutation({
  args: {
    instanceId: v.id("mapInstances"),
    movement: v.object({
      entityId: v.string(),
      entityType: v.union(v.literal("playerCharacter"), v.literal("npc"), v.literal("monster")),
      fromX: v.number(),
      fromY: v.number(),
      toX: v.number(),
      toY: v.number(),
      timestamp: v.number(),
      distance: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Map instance not found");
    }

    const newMovementHistory = [...instance.movementHistory, args.movement];
    
    await ctx.db.patch(args.instanceId, {
      movementHistory: newMovementHistory,
      updatedAt: Date.now(),
    });
  },
});

// Delete map instance
export const deleteMapInstance = mutation({
  args: { instanceId: v.id("mapInstances") },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Map instance not found");
    }

    await ctx.db.delete(args.instanceId);
  },
});

// Move entity on map instance
export const moveEntity = mutation({
  args: {
    instanceId: v.id("mapInstances"),
    entityId: v.string(),
    toX: v.number(),
    toY: v.number(),
    clerkId: v.optional(v.string()), // Add optional clerkId prop
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Map instance not found");
    }

    let user;
    
    if (args.clerkId) {
      // Use provided clerkId to get user from database
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      // Fallback to backend authentication
      user = await getCurrentUser(ctx);
    }
    
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user owns this instance or is admin
    if (instance.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Unauthorized access to map instance");
    }

    // Find the entity in current positions
    const entityIndex = instance.currentPositions.findIndex(
      pos => pos.entityId === args.entityId
    );

    if (entityIndex === -1) {
      throw new Error("Entity not found on map");
    }

    const entity = instance.currentPositions[entityIndex];
    const fromX = entity.x;
    const fromY = entity.y;
    
    // Calculate distance
    const distance = Math.sqrt(Math.pow(args.toX - fromX, 2) + Math.pow(args.toY - fromY, 2));

    // Update entity position
    const newPositions = [...instance.currentPositions];
    newPositions[entityIndex] = {
      ...entity,
      x: args.toX,
      y: args.toY,
    };

    // Add to movement history
    const newMovement = {
      entityId: args.entityId,
      entityType: entity.entityType,
      fromX,
      fromY,
      toX: args.toX,
      toY: args.toY,
      timestamp: Date.now(),
      distance,
    };

    await ctx.db.patch(args.instanceId, {
      currentPositions: newPositions,
      movementHistory: [...instance.movementHistory, newMovement],
      updatedAt: Date.now(),
    });
  },
});

// Reset map instance (remove all entities)
export const resetMapInstance = mutation({
  args: { 
    instanceId: v.id("mapInstances"),
    clerkId: v.optional(v.string()), // Add optional clerkId prop
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Map instance not found");
    }

    let user;
    
    if (args.clerkId) {
      // Use provided clerkId to get user from database
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      // Fallback to backend authentication
      user = await getCurrentUser(ctx);
    }
    
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user owns this instance or is admin
    if (instance.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Unauthorized access to map instance");
    }

    await ctx.db.patch(args.instanceId, {
      currentPositions: [],
      movementHistory: [],
      updatedAt: Date.now(),
    });
  },
});

// Undo last move
export const undoLastMove = mutation({
  args: { 
    instanceId: v.id("mapInstances"),
    clerkId: v.optional(v.string()), // Add optional clerkId prop
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Map instance not found");
    }

    let user;
    
    if (args.clerkId) {
      // Use provided clerkId to get user from database
      user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
        .first();
    } else {
      // Fallback to backend authentication
      user = await getCurrentUser(ctx);
    }
    
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user owns this instance or is admin
    if (instance.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Unauthorized access to map instance");
    }

    if (instance.movementHistory.length === 0) {
      throw new Error("No moves to undo");
    }

    // Get the last movement
    const lastMove = instance.movementHistory[instance.movementHistory.length - 1];
    
    // Find the entity in current positions
    const entityIndex = instance.currentPositions.findIndex(
      pos => pos.entityId === lastMove.entityId
    );

    if (entityIndex === -1) {
      throw new Error("Entity not found on map");
    }

    // Restore previous position
    const newPositions = [...instance.currentPositions];
    newPositions[entityIndex] = {
      ...newPositions[entityIndex],
      x: lastMove.fromX,
      y: lastMove.fromY,
    };

    // Remove last movement from history
    const newMovementHistory = instance.movementHistory.slice(0, -1);

    await ctx.db.patch(args.instanceId, {
      currentPositions: newPositions,
      movementHistory: newMovementHistory,
      updatedAt: Date.now(),
    });
  },
});

// Set or update a portal link on a cell
export const setCellPortalLink = mutation({
  args: {
    mapId: v.id("maps"),
    x: v.number(),
    y: v.number(),
    portalLink: v.optional(
      v.object({
        targetMapId: v.id("maps"),
        targetX: v.number(),
        targetY: v.number(),
        label: v.optional(v.string()),
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
    
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user owns this map or is admin/DM
    if (map.createdBy !== user._id && user.role !== "admin" && user.role !== "dm") {
      throw new Error("Unauthorized access to map");
    }

    // Verify target map exists if portal link is provided
    if (args.portalLink) {
      const targetMap = await ctx.db.get(args.portalLink.targetMapId);
      if (!targetMap) {
        throw new Error("Target map not found");
      }
    }

    // Update the cell with the portal link
    const cells = map.cells.map(cell => {
      if (cell.x === args.x && cell.y === args.y) {
        return {
          ...cell,
          portalLink: args.portalLink || undefined,
        };
      }
      return cell;
    });

    await ctx.db.patch(args.mapId, {
      cells,
      updatedAt: Date.now(),
    });
  },
});

// Navigate to a linked map (used when clicking on a portal link)
export const navigateToLinkedMap = mutation({
  args: {
    instanceId: v.id("mapInstances"),
    targetMapId: v.id("maps"),
    targetX: v.number(),
    targetY: v.number(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throw new Error("Map instance not found");
    }

    // Find the entity in current positions
    const entityIndex = instance.currentPositions.findIndex(
      pos => pos.entityId === args.entityId
    );

    if (entityIndex === -1) {
      throw new Error("Entity not found in map instance");
    }

    // Check if target map exists
    const targetMap = await ctx.db.get(args.targetMapId);
    if (!targetMap) {
      throw new Error("Target map not found");
    }

    // Verify target coordinates are valid
    if (args.targetX < 0 || args.targetX >= targetMap.width || 
        args.targetY < 0 || args.targetY >= targetMap.height) {
      throw new Error("Invalid target coordinates");
    }

    // Find or create a map instance for the target map
    let targetInstance = await ctx.db
      .query("mapInstances")
      .filter((q) => 
        q.and(
          q.eq(q.field("mapId"), args.targetMapId),
          q.eq(q.field("interactionId"), instance.interactionId || null)
        )
      )
      .first();

    if (!targetInstance) {
      // Create a new instance for the target map
      targetInstance = await ctx.db.insert("mapInstances", {
        mapId: args.targetMapId,
        campaignId: instance.campaignId,
        interactionId: instance.interactionId,
        name: `${targetMap.name} - Session`,
        currentPositions: [],
        movementHistory: [],
        createdBy: instance.createdBy,
        clerkId: instance.clerkId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Move entity to the new map instance
    const entity = instance.currentPositions[entityIndex];
    const newPositions = instance.currentPositions.filter((_, i) => i !== entityIndex);
    
    // Add entity to target instance
    const targetPositions = [...targetInstance.currentPositions];
    targetPositions.push({
      ...entity,
      x: args.targetX,
      y: args.targetY,
    });

    // Update both instances
    await ctx.db.patch(args.instanceId, {
      currentPositions: newPositions,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(targetInstance._id, {
      currentPositions: targetPositions,
      updatedAt: Date.now(),
    });

    return targetInstance._id;
  },
}); 