/**
 * Live Map System for Convex
 * Handles real-time map interactions and position updates for D&D sessions
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./clerkService";

// Helper function to validate position
function isValidPosition(position: { x: number; y: number }, mapWidth: number, mapHeight: number): boolean {
  return position.x >= 0 && position.x < mapWidth && position.y >= 0 && position.y < mapHeight;
}

// Helper function to calculate distance
function calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}

// Helper function to check if position is occupied
function isPositionOccupied(position: { x: number; y: number }, entities: Record<string, { x: number; y: number }>): boolean {
  return Object.values(entities).some(entityPos => 
    entityPos.x === position.x && entityPos.y === position.y
  );
}

// Helper function to check if position has obstacles
function hasObstacle(position: { x: number; y: number }, obstacles: Array<{ x: number; y: number; width: number; height: number; type: string }>): boolean {
  return obstacles.some(obstacle => 
    position.x >= obstacle.x && 
    position.x < obstacle.x + obstacle.width &&
    position.y >= obstacle.y && 
    position.y < obstacle.y + obstacle.height
  );
}

/**
 * Update entity position on the map
 */
export const updateEntityPosition = mutation({
  args: {
    interactionId: v.id("interactions"),
    entityId: v.string(),
    newPosition: v.object({
      x: v.number(),
      y: v.number()
    }),
    validateMovement: v.optional(v.boolean()) // Whether to validate movement rules
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get live room
    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Check if user can move this entity
    const isUserEntity = liveRoom.participants.some(p => 
      p.userId === user._id && p.entityId === args.entityId
    );
    const isDM = liveRoom.dmUserId === user._id;

    if (!isUserEntity && !isDM) {
      throw new Error("Cannot move this entity");
    }

    // Validate position bounds
    if (!isValidPosition(args.newPosition, liveRoom.gameState.mapState.width, liveRoom.gameState.mapState.height)) {
      throw new Error("Position is outside map bounds");
    }

    // Validate movement if requested
    if (args.validateMovement) {
      // Check for obstacles
      if (hasObstacle(args.newPosition, liveRoom.gameState.mapState.obstacles)) {
        throw new Error("Position is blocked by an obstacle");
      }

      // Check if position is already occupied (except by the moving entity)
      const currentEntities = { ...liveRoom.gameState.mapState.entities };
      delete currentEntities[args.entityId]; // Remove current entity from check
      
      if (isPositionOccupied(args.newPosition, currentEntities)) {
        throw new Error("Position is already occupied");
      }

      // Validate movement distance (simplified - in full D&D would check movement speed)
      const currentPosition = liveRoom.gameState.mapState.entities[args.entityId];
      if (currentPosition) {
        const distance = calculateDistance(currentPosition, args.newPosition);
        if (distance > 6) { // Assuming 30ft movement = 6 squares
          throw new Error("Movement distance exceeds available movement");
        }
      }
    }

    // Update map state
    const updatedEntities = {
      ...liveRoom.gameState.mapState.entities,
      [args.entityId]: args.newPosition
    };

    const updatedMapState = {
      ...liveRoom.gameState.mapState,
      entities: updatedEntities
    };

    const updatedGameState = {
      ...liveRoom.gameState,
      mapState: updatedMapState
    };

    const now = Date.now();

    await ctx.db.patch(liveRoom._id, {
      gameState: updatedGameState,
      lastActivity: now
    });

    // Update participant state
    const participantState = await ctx.db
      .query("liveParticipantStates")
      .withIndex("by_entity", q => q.eq("entityId", args.entityId))
      .first();

    if (participantState) {
      await ctx.db.patch(participantState._id, {
        position: args.newPosition,
        lastActionTimestamp: now,
        updatedAt: now
      });
    }

    // Log movement event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "ENTITY_MOVED",
      eventData: {
        entityId: args.entityId,
        fromPosition: liveRoom.gameState.mapState.entities[args.entityId],
        toPosition: args.newPosition,
        userId: user._id
      },
      timestamp: now,
      userId: user._id,
      entityId: args.entityId,
      isSystemEvent: false,
      severity: "info"
    });

    return {
      success: true,
      entityId: args.entityId,
      newPosition: args.newPosition,
      mapState: updatedMapState
    };
  },
});

/**
 * Add obstacle to the map (DM only)
 */
export const addMapObstacle = mutation({
  args: {
    interactionId: v.id("interactions"),
    obstacle: v.object({
      x: v.number(),
      y: v.number(),
      width: v.number(),
      height: v.number(),
      type: v.string()
    })
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Only DM can add obstacles
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only DM can add obstacles");
    }

    // Add obstacle to map state
    const updatedObstacles = [...liveRoom.gameState.mapState.obstacles, args.obstacle];
    const updatedMapState = {
      ...liveRoom.gameState.mapState,
      obstacles: updatedObstacles
    };

    const updatedGameState = {
      ...liveRoom.gameState,
      mapState: updatedMapState
    };

    const now = Date.now();

    await ctx.db.patch(liveRoom._id, {
      gameState: updatedGameState,
      lastActivity: now
    });

    // Log obstacle added event
    await ctx.db.insert("liveGameEvents", {
      interactionId: args.interactionId,
      roomId: liveRoom.roomId,
      eventType: "OBSTACLE_ADDED",
      eventData: {
        obstacle: args.obstacle,
        dmUserId: user._id
      },
      timestamp: now,
      userId: user._id,
      isSystemEvent: true,
      severity: "info"
    });

    return {
      success: true,
      obstacle: args.obstacle,
      mapState: updatedMapState
    };
  },
});

/**
 * Remove obstacle from the map (DM only)
 */
export const removeMapObstacle = mutation({
  args: {
    interactionId: v.id("interactions"),
    obstacleIndex: v.number()
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Only DM can remove obstacles
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only DM can remove obstacles");
    }

    if (args.obstacleIndex < 0 || args.obstacleIndex >= liveRoom.gameState.mapState.obstacles.length) {
      throw new Error("Invalid obstacle index");
    }

    // Remove obstacle from map state
    const updatedObstacles = liveRoom.gameState.mapState.obstacles.filter((_, index) => index !== args.obstacleIndex);
    const updatedMapState = {
      ...liveRoom.gameState.mapState,
      obstacles: updatedObstacles
    };

    const updatedGameState = {
      ...liveRoom.gameState,
      mapState: updatedMapState
    };

    const now = Date.now();

    await ctx.db.patch(liveRoom._id, {
      gameState: updatedGameState,
      lastActivity: now
    });

    return {
      success: true,
      mapState: updatedMapState
    };
  },
});

/**
 * Update terrain on the map (DM only)
 */
export const updateMapTerrain = mutation({
  args: {
    interactionId: v.id("interactions"),
    terrain: v.array(v.object({
      x: v.number(),
      y: v.number(),
      terrainType: v.string(),
      effects: v.optional(v.array(v.string()))
    }))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Only DM can update terrain
    if (liveRoom.dmUserId !== user._id) {
      throw new Error("Only DM can update terrain");
    }

    // Update terrain in map state
    const updatedMapState = {
      ...liveRoom.gameState.mapState,
      terrain: args.terrain
    };

    const updatedGameState = {
      ...liveRoom.gameState,
      mapState: updatedMapState
    };

    const now = Date.now();

    await ctx.db.patch(liveRoom._id, {
      gameState: updatedGameState,
      lastActivity: now
    });

    return {
      success: true,
      mapState: updatedMapState
    };
  },
});

/**
 * Get current map state
 */
export const getMapState = query({
  args: {
    interactionId: v.id("interactions")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      return null;
    }

    // Check if user is participant
    const isParticipant = liveRoom.participants.some(p => p.userId === user._id);
    const isDM = liveRoom.dmUserId === user._id;

    if (!isParticipant && !isDM) {
      throw new Error("Not a participant in this room");
    }

    // Get participant states for additional position info
    const participantStates = await ctx.db
      .query("liveParticipantStates")
      .withIndex("by_room", q => q.eq("roomId", liveRoom.roomId))
      .collect();

    return {
      mapState: liveRoom.gameState.mapState,
      participantStates: participantStates,
      lastActivity: liveRoom.lastActivity
    };
  },
});

/**
 * Calculate movement options for an entity
 */
export const getMovementOptions = query({
  args: {
    interactionId: v.id("interactions"),
    entityId: v.string(),
    movementSpeed: v.optional(v.number()) // In squares (default 6 for 30ft)
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    // Check if user can get movement options for this entity
    const isUserEntity = liveRoom.participants.some(p => 
      p.userId === user._id && p.entityId === args.entityId
    );
    const isDM = liveRoom.dmUserId === user._id;

    if (!isUserEntity && !isDM) {
      throw new Error("Cannot get movement options for this entity");
    }

    const currentPosition = liveRoom.gameState.mapState.entities[args.entityId];
    if (!currentPosition) {
      throw new Error("Entity position not found");
    }

    const movementSpeed = args.movementSpeed || 6; // Default 30ft = 6 squares
    const validPositions = [];

    // Calculate all positions within movement range
    for (let x = Math.max(0, currentPosition.x - movementSpeed); 
         x <= Math.min(liveRoom.gameState.mapState.width - 1, currentPosition.x + movementSpeed); 
         x++) {
      for (let y = Math.max(0, currentPosition.y - movementSpeed); 
           y <= Math.min(liveRoom.gameState.mapState.height - 1, currentPosition.y + movementSpeed); 
           y++) {
        
        const position = { x, y };
        const distance = calculateDistance(currentPosition, position);
        
        if (distance <= movementSpeed) {
          // Check if position is valid
          const isBlocked = hasObstacle(position, liveRoom.gameState.mapState.obstacles);
          const currentEntities = { ...liveRoom.gameState.mapState.entities };
          delete currentEntities[args.entityId]; // Remove current entity
          const isOccupied = isPositionOccupied(position, currentEntities);
          
          validPositions.push({
            x,
            y,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            isBlocked,
            isOccupied,
            isValid: !isBlocked && !isOccupied
          });
        }
      }
    }

    return {
      currentPosition,
      movementSpeed,
      validPositions: validPositions.filter(pos => pos.isValid),
      allPositions: validPositions // Include blocked/occupied for visualization
    };
  },
});

/**
 * Measure distance between two points
 */
export const measureDistance = query({
  args: {
    from: v.object({ x: v.number(), y: v.number() }),
    to: v.object({ x: v.number(), y: v.number() }),
    unit: v.optional(v.union(v.literal("squares"), v.literal("feet")))
  },
  handler: async (ctx, args) => {
    const distance = calculateDistance(args.from, args.to);
    
    if (args.unit === "feet") {
      return {
        distance: Math.round(distance * 5 * 10) / 10, // 1 square = 5 feet
        unit: "feet"
      };
    }
    
    return {
      distance: Math.round(distance * 10) / 10,
      unit: "squares"
    };
  },
});

/**
 * Get entities within range of a position
 */
export const getEntitiesInRange = query({
  args: {
    interactionId: v.id("interactions"),
    centerPosition: v.object({ x: v.number(), y: v.number() }),
    range: v.number(), // In squares
    entityTypes: v.optional(v.array(v.union(
      v.literal("playerCharacter"),
      v.literal("npc"),
      v.literal("monster")
    )))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const liveRoom = await ctx.db
      .query("liveRooms")
      .withIndex("by_interaction", q => q.eq("interactionId", args.interactionId))
      .first();

    if (!liveRoom) {
      throw new Error("Live room not found");
    }

    const entitiesInRange = [];

    // Check each entity
    for (const [entityId, position] of Object.entries(liveRoom.gameState.mapState.entities)) {
      const distance = calculateDistance(args.centerPosition, position);
      
      if (distance <= args.range) {
        // Get participant info
        const participant = liveRoom.participants.find(p => p.entityId === entityId);
        
        if (!participant) continue;
        
        // Filter by entity type if specified
        if (args.entityTypes && !args.entityTypes.includes(participant.entityType)) {
          continue;
        }

        entitiesInRange.push({
          entityId,
          position,
          distance: Math.round(distance * 10) / 10,
          entityType: participant.entityType,
          characterData: participant.characterData
        });
      }
    }

    // Sort by distance
    entitiesInRange.sort((a, b) => a.distance - b.distance);

    return {
      centerPosition: args.centerPosition,
      range: args.range,
      entitiesInRange
    };
  },
});