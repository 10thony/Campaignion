import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

export const getItems = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("items").collect();
  },
});

export const getItemById = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.itemId);
  },
});

export const getMyItems = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      
      return await ctx.db
        .query("items")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
    } catch (error) {
      // Return empty array if not authenticated
      return [];
    }
  },
});

export const createItem = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("Weapon"), v.literal("Armor"), v.literal("Potion"),
      v.literal("Scroll"), v.literal("Wondrous Item"), v.literal("Ring"),
      v.literal("Rod"), v.literal("Staff"), v.literal("Wand"),
      v.literal("Ammunition"), v.literal("Adventuring Gear"), v.literal("Tool"),
      v.literal("Mount"), v.literal("Vehicle"), v.literal("Treasure"), v.literal("Other")
    ),
    rarity: v.union(
      v.literal("Common"), v.literal("Uncommon"), v.literal("Rare"),
      v.literal("Very Rare"), v.literal("Legendary"), v.literal("Artifact"), v.literal("Unique")
    ),
    description: v.string(),
    effects: v.optional(v.string()),
    weight: v.optional(v.number()),
    cost: v.optional(v.number()),
    attunement: v.optional(v.boolean()),
    typeOfArmor: v.optional(v.union(
      v.literal("Light"), v.literal("Medium"), v.literal("Heavy"), v.literal("Shield")
    )),
    armorClass: v.optional(v.number()),
    abilityModifiers: v.optional(v.object({
      strength: v.optional(v.number()),
      dexterity: v.optional(v.number()),
      constitution: v.optional(v.number()),
      intelligence: v.optional(v.number()),
      wisdom: v.optional(v.number()),
      charisma: v.optional(v.number()),
    })),
    damageRolls: v.optional(v.array(v.object({
      dice: v.object({
        count: v.number(),
        type: v.union(
          v.literal("D4"), v.literal("D6"), v.literal("D8"),
          v.literal("D10"), v.literal("D12"), v.literal("D20")
        ),
      }),
      modifier: v.number(),
      damageType: v.union(
        v.literal("BLUDGEONING"), v.literal("PIERCING"), v.literal("SLASHING"),
        v.literal("ACID"), v.literal("COLD"), v.literal("FIRE"), v.literal("FORCE"),
        v.literal("LIGHTNING"), v.literal("NECROTIC"), v.literal("POISON"),
        v.literal("PSYCHIC"), v.literal("RADIANT"), v.literal("THUNDER")
      ),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const itemId = await ctx.db.insert("items", {
      ...args,
      userId: user._id,
    });

    return itemId;
  },
});

export const updateItem = mutation({
  args: {
    itemId: v.id("items"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    effects: v.optional(v.string()),
    weight: v.optional(v.number()),
    cost: v.optional(v.number()),
    attunement: v.optional(v.boolean()),
    armorClass: v.optional(v.number()),
    abilityModifiers: v.optional(v.object({
      strength: v.optional(v.number()),
      dexterity: v.optional(v.number()),
      constitution: v.optional(v.number()),
      intelligence: v.optional(v.number()),
      wisdom: v.optional(v.number()),
      charisma: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check permissions: own item, admin
    if (item.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to edit this item");
    }

    const { itemId, ...updates } = args;
    await ctx.db.patch(itemId, updates);
  },
});

export const deleteItem = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Check permissions
    if (item.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to delete this item");
    }

    await ctx.db.delete(args.itemId);
  },
});

export const getItemsByType = query({
  args: { 
    itemType: v.union(
      v.literal("Weapon"), v.literal("Armor"), v.literal("Potion"),
      v.literal("Scroll"), v.literal("Wondrous Item"), v.literal("Ring"),
      v.literal("Rod"), v.literal("Staff"), v.literal("Wand"),
      v.literal("Ammunition"), v.literal("Adventuring Gear"), v.literal("Tool"),
      v.literal("Mount"), v.literal("Vehicle"), v.literal("Treasure"), v.literal("Other")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("type"), args.itemType))
      .collect();
  },
});

export const getItemsByRarity = query({
  args: { 
    rarity: v.union(
      v.literal("Common"), v.literal("Uncommon"), v.literal("Rare"),
      v.literal("Very Rare"), v.literal("Legendary"), v.literal("Artifact"), v.literal("Unique")
    )
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("rarity"), args.rarity))
      .collect();
  },
}); 