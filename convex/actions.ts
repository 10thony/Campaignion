import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

export const getAllActions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("actions").collect();
  },
});

export const getActionById = query({
  args: { actionId: v.id("actions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.actionId);
  },
});

export const getActionsByCategory = query({
  args: { 
    category: v.union(
      v.literal("general"),
      v.literal("class_specific"),
      v.literal("race_specific"),
      v.literal("feat_specific")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actions")
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();
  },
});

export const getActionsByClass = query({
  args: { 
    className: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actions")
      .filter((q) => 
        q.or(
          q.eq(q.field("category"), "general"),
          q.eq(q.field("requiredClass"), args.className),
          q.eq(q.field("className"), args.className) // Legacy support
        )
      )
      .collect();
  },
});

export const getGeneralActions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("actions")
      .filter((q) => q.eq(q.field("category"), "general"))
      .collect();
  },
});

export const getClassSpecificActions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("actions")
      .filter((q) => q.eq(q.field("category"), "class_specific"))
      .collect();
  },
});

export const createAction = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    actionCost: v.union(
      v.literal("Action"),
      v.literal("Bonus Action"),
      v.literal("Reaction"),
      v.literal("No Action"),
      v.literal("Special")
    ),
    type: v.union(
      v.literal("MELEE_ATTACK"),
      v.literal("RANGED_ATTACK"),
      v.literal("SPELL"),
      v.literal("COMMONLY_AVAILABLE_UTILITY"),
      v.literal("CLASS_FEATURE"),
      v.literal("BONUS_ACTION"),
      v.literal("REACTION"),
      v.literal("OTHER")
    ),
    requiresConcentration: v.boolean(),
    sourceBook: v.string(),
    attackBonusAbilityScore: v.optional(v.string()),
    isProficient: v.optional(v.boolean()),
    damageRolls: v.optional(
      v.array(
        v.object({
          dice: v.object({
            count: v.number(),
            type: v.union(
              v.literal("D4"),
              v.literal("D6"),
              v.literal("D8"),
              v.literal("D10"),
              v.literal("D12"),
              v.literal("D20")
            ),
          }),
          modifier: v.number(),
          damageType: v.union(
            v.literal("BLUDGEONING"),
            v.literal("PIERCING"),
            v.literal("SLASHING"),
            v.literal("ACID"),
            v.literal("COLD"),
            v.literal("FIRE"),
            v.literal("FORCE"),
            v.literal("LIGHTNING"),
            v.literal("NECROTIC"),
            v.literal("POISON"),
            v.literal("PSYCHIC"),
            v.literal("RADIANT"),
            v.literal("THUNDER")
          ),
        })
      )
    ),
    spellLevel: v.optional(
      v.union(
        v.literal(0),
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
        v.literal(6),
        v.literal(7),
        v.literal(8),
        v.literal(9)
      )
    ),
    castingTime: v.optional(v.string()),
    range: v.optional(v.string()),
    components: v.optional(
      v.object({
        verbal: v.boolean(),
        somatic: v.boolean(),
        material: v.boolean(),
        materialComponent: v.optional(v.string()),
      })
    ),
    duration: v.optional(v.string()),
    savingThrow: v.optional(
      v.object({
        ability: v.string(),
        onSave: v.string(),
      })
    ),
    spellEffectDescription: v.optional(v.string()),
    
    // Action categorization and availability
    category: v.union(
      v.literal("general"),
      v.literal("class_specific"),
      v.literal("race_specific"),
      v.literal("feat_specific")
    ),
    requiredClass: v.optional(v.string()),
    requiredClasses: v.optional(v.array(v.string())),
    requiredLevel: v.optional(v.number()),
    requiredSubclass: v.optional(v.string()),
    
    // Legacy field for backward compatibility
    className: v.optional(v.string()),
    
    usesPer: v.optional(
      v.union(
        v.literal("Short Rest"),
        v.literal("Long Rest"),
        v.literal("Day"),
        v.literal("Special")
      )
    ),
    maxUses: v.optional(v.union(v.number(), v.string())),
    
    // Additional metadata
    isBaseAction: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    prerequisites: v.optional(v.array(v.string())),
    targetClass: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const actionId = await ctx.db.insert("actions", {
      ...args,
      createdAt: Date.now(),
    });

    return actionId;
  },
});

export const updateAction = mutation({
  args: {
    actionId: v.id("actions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    actionCost: v.optional(v.union(
      v.literal("Action"),
      v.literal("Bonus Action"),
      v.literal("Reaction"),
      v.literal("No Action"),
      v.literal("Special")
    )),
    type: v.optional(v.union(
      v.literal("MELEE_ATTACK"),
      v.literal("RANGED_ATTACK"),
      v.literal("SPELL"),
      v.literal("COMMONLY_AVAILABLE_UTILITY"),
      v.literal("CLASS_FEATURE"),
      v.literal("BONUS_ACTION"),
      v.literal("REACTION"),
      v.literal("OTHER")
    )),
    requiresConcentration: v.optional(v.boolean()),
    sourceBook: v.optional(v.string()),
    attackBonusAbilityScore: v.optional(v.string()),
    isProficient: v.optional(v.boolean()),
    damageRolls: v.optional(
      v.array(
        v.object({
          dice: v.object({
            count: v.number(),
            type: v.union(
              v.literal("D4"),
              v.literal("D6"),
              v.literal("D8"),
              v.literal("D10"),
              v.literal("D12"),
              v.literal("D20")
            ),
          }),
          modifier: v.number(),
          damageType: v.union(
            v.literal("BLUDGEONING"),
            v.literal("PIERCING"),
            v.literal("SLASHING"),
            v.literal("ACID"),
            v.literal("COLD"),
            v.literal("FIRE"),
            v.literal("FORCE"),
            v.literal("LIGHTNING"),
            v.literal("NECROTIC"),
            v.literal("POISON"),
            v.literal("PSYCHIC"),
            v.literal("RADIANT"),
            v.literal("THUNDER")
          ),
        })
      )
    ),
    spellLevel: v.optional(
      v.union(
        v.literal(0),
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
        v.literal(6),
        v.literal(7),
        v.literal(8),
        v.literal(9)
      )
    ),
    castingTime: v.optional(v.string()),
    range: v.optional(v.string()),
    components: v.optional(
      v.object({
        verbal: v.boolean(),
        somatic: v.boolean(),
        material: v.boolean(),
        materialComponent: v.optional(v.string()),
      })
    ),
    duration: v.optional(v.string()),
    savingThrow: v.optional(
      v.object({
        ability: v.string(),
        onSave: v.string(),
      })
    ),
    spellEffectDescription: v.optional(v.string()),
    
    // Action categorization and availability
    category: v.optional(v.union(
      v.literal("general"),
      v.literal("class_specific"),
      v.literal("race_specific"),
      v.literal("feat_specific")
    )),
    requiredClass: v.optional(v.string()),
    requiredClasses: v.optional(v.array(v.string())),
    requiredLevel: v.optional(v.number()),
    requiredSubclass: v.optional(v.string()),
    
    // Legacy field for backward compatibility
    className: v.optional(v.string()),
    
    usesPer: v.optional(
      v.union(
        v.literal("Short Rest"),
        v.literal("Long Rest"),
        v.literal("Day"),
        v.literal("Special")
      )
    ),
    maxUses: v.optional(v.union(v.number(), v.string())),
    
    // Additional metadata
    isBaseAction: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    prerequisites: v.optional(v.array(v.string())),
    targetClass: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const { actionId, ...updates } = args;
    
    await ctx.db.patch(actionId, updates);
  },
});

export const deleteAction = mutation({
  args: { actionId: v.id("actions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    await ctx.db.delete(args.actionId);
  },
});