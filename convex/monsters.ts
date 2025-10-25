import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

// Helper function to calculate ability modifiers
function calculateAbilityModifiers(abilityScores: any) {
  return {
    strength: Math.floor((abilityScores.strength - 10) / 2),
    dexterity: Math.floor((abilityScores.dexterity - 10) / 2),
    constitution: Math.floor((abilityScores.constitution - 10) / 2),
    intelligence: Math.floor((abilityScores.intelligence - 10) / 2),
    wisdom: Math.floor((abilityScores.wisdom - 10) / 2),
    charisma: Math.floor((abilityScores.charisma - 10) / 2),
  };
}

// Helper function to get XP from Challenge Rating
function getChallengeRatingXP(cr: string): number {
  const crXpMap: Record<string, number> = {
    "0": 10, "1/8": 25, "1/4": 50, "1/2": 100,
    "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
    "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
    "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
    "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
    "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000,
    "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000,
  };
  return crXpMap[cr] || 0;
}

export const getMonsters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("monsters").collect();
  },
});

export const getMonsterById = query({
  args: { monsterId: v.id("monsters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.monsterId);
  },
});

export const getMonstersByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      return [];
    }

    if (!campaign.monsterIds) {
      return [];
    }

    const monsters = await Promise.all(
      campaign.monsterIds.map(id => ctx.db.get(id))
    );

    return monsters.filter(monster => monster !== null);
  },
});

export const createMonster = mutation({
  args: {
    name: v.string(),
    source: v.optional(v.string()),
    size: v.union(
      v.literal("Tiny"), v.literal("Small"), v.literal("Medium"),
      v.literal("Large"), v.literal("Huge"), v.literal("Gargantuan")
    ),
    type: v.string(),
    alignment: v.string(),
    armorClass: v.number(),
    hitPoints: v.number(),
    hitDice: v.object({
      count: v.number(),
      die: v.union(v.literal("d4"), v.literal("d6"), v.literal("d8"), v.literal("d10"), v.literal("d12")),
    }),
    speed: v.object({
      walk: v.optional(v.string()),
      swim: v.optional(v.string()),
      fly: v.optional(v.string()),
      burrow: v.optional(v.string()),
      climb: v.optional(v.string()),
    }),
    abilityScores: v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    }),
    challengeRating: v.string(),
    proficiencyBonus: v.number(),
    senses: v.object({
      passivePerception: v.number(),
      darkvision: v.optional(v.string()),
      blindsight: v.optional(v.string()),
      tremorsense: v.optional(v.string()),
      truesight: v.optional(v.string()),
    }),
    // Enhanced fields from BaseSystemPrompt
    challengeRatingValue: v.optional(v.number()),
    legendaryActionCount: v.optional(v.number()),
    lairActionCount: v.optional(v.number()),
    // Actions field for inline monster actions
    actions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Calculate ability modifiers server-side
    const abilityModifiers = calculateAbilityModifiers(args.abilityScores);
    
    // Calculate XP from CR if not provided
    const experiencePoints = getChallengeRatingXP(args.challengeRating);
    
    // Set challengeRatingValue if not provided
    const challengeRatingValue = args.challengeRatingValue || parseFloat(args.challengeRating.replace("/", "."));

    const monsterId = await ctx.db.insert("monsters", {
      ...args,
      abilityModifiers,
      experiencePoints,
      challengeRatingValue,
      actions: args.actions || [],
      userId: user._id,
      createdAt: Date.now(),
    });

    return monsterId;
  },
});

export const updateMonster = mutation({
  args: {
    monsterId: v.id("monsters"),
    name: v.optional(v.string()),
    abilityScores: v.optional(v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    })),
    challengeRating: v.optional(v.string()),
    hitPoints: v.optional(v.number()),
    armorClass: v.optional(v.number()),
    challengeRatingValue: v.optional(v.number()),
    legendaryActionCount: v.optional(v.number()),
    lairActionCount: v.optional(v.number()),
    actions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const monster = await ctx.db.get(args.monsterId);
    if (!monster) {
      throw new Error("Monster not found");
    }

    // Check permissions: own monster, admin, or campaign DM
    if (monster.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to edit this monster");
    }

    const { monsterId, ...updates } = args;
    const updatedData: any = { ...updates, updatedAt: Date.now() };

    // Recalculate ability modifiers if ability scores changed
    if (updates.abilityScores) {
      updatedData.abilityModifiers = calculateAbilityModifiers(updates.abilityScores);
    }

    // Recalculate XP if CR changed
    if (updates.challengeRating) {
      updatedData.experiencePoints = getChallengeRatingXP(updates.challengeRating);
      if (!updates.challengeRatingValue) {
        updatedData.challengeRatingValue = parseFloat(updates.challengeRating.replace("/", "."));
      }
    }

    await ctx.db.patch(monsterId, updatedData);
  },
});

export const deleteMonster = mutation({
  args: { monsterId: v.id("monsters") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const monster = await ctx.db.get(args.monsterId);
    if (!monster) {
      throw new Error("Monster not found");
    }

    // Check permissions
    if (monster.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to delete this monster");
    }

    await ctx.db.delete(args.monsterId);
  },
});

export const cloneMonster = mutation({
  args: { monsterId: v.id("monsters") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const originalMonster = await ctx.db.get(args.monsterId);
    if (!originalMonster) {
      throw new Error("Monster not found");
    }

    // Create a copy of the monster with the current user as the creator
    const clonedMonsterData = {
      ...originalMonster,
      name: `${originalMonster.name} (Copy)`,
      userId: user._id,
      createdAt: Date.now(),
      // Mark as cloned
      clonedFrom: args.monsterId,
      clonedAt: Date.now()
    };

    // Remove the _id field so a new one is generated
    delete clonedMonsterData._id;

    const clonedMonsterId = await ctx.db.insert("monsters", clonedMonsterData);

    return clonedMonsterId;
  },
}); 