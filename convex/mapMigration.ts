import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Map Migration Utility
 * Converts legacy maps to new battle maps system
 */

// Get all legacy maps that haven't been migrated yet
export const getLegacyMaps = query({
  args: {},
  handler: async (ctx) => {
    const allMaps = await ctx.db.query("maps").collect();
    return allMaps.map(m => ({
      _id: m._id,
      name: m.name,
      width: m.width,
      height: m.height,
      cellCount: m.cells.length,
      createdAt: m.createdAt,
    }));
  },
});

// Migrate a single legacy map to battle map
export const migrateSingleMap = mutation({
  args: {
    legacyMapId: v.id("maps"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the legacy map
    const legacyMap = await ctx.db.get(args.legacyMapId);
    if (!legacyMap) {
      throw new Error("Legacy map not found");
    }

    // Convert legacy map to battle map format
    const battleMapCells = legacyMap.cells.map(cell => ({
      x: cell.x,
      y: cell.y,
      state: cell.state || "inbounds" as const,
      terrainType: mapTerrainType(cell.terrainType),
      terrainEffect: cell.terrainEffect,
      customColor: cell.customColor,
    }));

    // Calculate appropriate cell size based on dimensions
    const cellSize = calculateOptimalCellSize(legacyMap.width, legacyMap.height);

    // Create battle map
    const now = Date.now();
    const battleMapId = await ctx.db.insert("battleMaps", {
      name: `${legacyMap.name} (Migrated)`,
      cols: legacyMap.width,
      rows: legacyMap.height,
      cellSize,
      cells: battleMapCells,
      createdBy: legacyMap.createdBy,
      clerkId: legacyMap.clerkId || args.clerkId,
      createdAt: now,
      updatedAt: now,
    });

    // Get all map instances for this legacy map
    const instances = await ctx.db
      .query("mapInstances")
      .filter((q) => q.eq(q.field("mapId"), args.legacyMapId))
      .collect();

    // Migrate map instances and their tokens
    for (const instance of instances) {
      const battleInstanceId = await ctx.db.insert("battleMapInstances", {
        mapId: battleMapId,
        name: instance.name,
        campaignId: instance.campaignId,
        interactionId: instance.interactionId,
        currentPositions: [], // We'll create tokens separately
        movementHistory: [],
        createdBy: instance.createdBy,
        clerkId: instance.clerkId,
        createdAt: now,
        updatedAt: now,
      });

      // Migrate entity positions to battle tokens
      for (const position of instance.currentPositions) {
        const tokenType = 
          position.entityType === "playerCharacter" ? "pc" :
          position.entityType === "npc" ? "npc_friendly" :
          "npc_foe";

        await ctx.db.insert("battleTokens", {
          mapId: battleMapId,
          x: position.x,
          y: position.y,
          label: position.name,
          type: tokenType,
          color: position.color,
          size: 1,
          speed: position.speed,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return {
      battleMapId,
      migratedInstances: instances.length,
      message: `Successfully migrated map "${legacyMap.name}" with ${instances.length} instances`,
    };
  },
});

// Migrate all legacy maps at once
export const migrateAllMaps = mutation({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allMaps = await ctx.db.query("maps").collect();
    const results = [];

    for (const legacyMap of allMaps) {
      try {
        const result = await migrateSingleMap(ctx as any, {
          legacyMapId: legacyMap._id,
          clerkId: args.clerkId,
        });
        results.push({
          mapId: legacyMap._id,
          name: legacyMap.name,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          mapId: legacyMap._id,
          name: legacyMap.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      total: allMaps.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  },
});

// Get migration status
export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const legacyMapsCount = await ctx.db.query("maps").collect().then(m => m.length);
    const battleMapsCount = await ctx.db.query("battleMaps").collect().then(m => m.length);
    const legacyInstancesCount = await ctx.db.query("mapInstances").collect().then(i => i.length);
    const battleInstancesCount = await ctx.db.query("battleMapInstances").collect().then(i => i.length);

    return {
      legacyMaps: legacyMapsCount,
      battleMaps: battleMapsCount,
      legacyInstances: legacyInstancesCount,
      battleInstances: battleInstancesCount,
      migrationRecommended: legacyMapsCount > 0,
    };
  },
});

// Helper functions

function mapTerrainType(legacyTerrain: string | undefined): any {
  if (!legacyTerrain) return "normal";
  
  // Map legacy terrain types to battle map terrain types
  const mapping: Record<string, string> = {
    "normal": "normal",
    "difficult": "difficult",
    "soft": "difficult",
    "rough": "difficult",
    "intense": "hazardous",
    "brutal": "hazardous",
    "deadly": "hazardous",
    "hazardous": "hazardous",
    "magical": "magical",
    "water": "water",
    "ice": "ice",
    "fire": "fire",
    "acid": "acid",
    "poison": "poison",
    "unstable": "unstable",
  };

  return mapping[legacyTerrain] || "normal";
}

function calculateOptimalCellSize(width: number, height: number): number {
  // Calculate optimal cell size for display
  // Aim for reasonable total dimensions (800-1600px)
  const targetPixels = 1200;
  const maxDimension = Math.max(width, height);
  const calculatedSize = Math.floor(targetPixels / maxDimension);
  
  // Clamp between 20 and 60 pixels
  return Math.max(20, Math.min(60, calculatedSize));
}

// Rollback migration (delete migrated battle maps)
export const rollbackMigration = mutation({
  args: {
    battleMapId: v.id("battleMaps"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const battleMap = await ctx.db.get(args.battleMapId);
    if (!battleMap) {
      throw new Error("Battle map not found");
    }

    // Delete all tokens on this map
    const tokens = await ctx.db
      .query("battleTokens")
      .withIndex("by_map", (q) => q.eq("mapId", args.battleMapId))
      .collect();
    for (const token of tokens) {
      await ctx.db.delete(token._id);
    }

    // Delete all instances
    const instances = await ctx.db
      .query("battleMapInstances")
      .withIndex("by_map", (q) => q.eq("mapId", args.battleMapId))
      .collect();
    for (const instance of instances) {
      await ctx.db.delete(instance._id);
    }

    // Delete the battle map
    await ctx.db.delete(args.battleMapId);

    return {
      success: true,
      deletedTokens: tokens.length,
      deletedInstances: instances.length,
      message: `Rolled back migration for "${battleMap.name}"`,
    };
  },
});

