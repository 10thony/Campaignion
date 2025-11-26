import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";
import { Id, Doc } from "./_generated/dataModel";

// Type definitions for ability scores
type AbilityScores = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

type AbilityModifiers = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

// Helper function to calculate ability modifiers
function calculateAbilityModifiers(abilityScores: AbilityScores): AbilityModifiers {
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

// Helper function to calculate initiative modifier for monsters
// Monsters typically only use Dexterity modifier, but can have bonuses from features
function calculateMonsterInitiativeModifier(abilityModifiers: { dexterity: number }): number {
  // For monsters, initiative is typically just Dexterity modifier
  // Future: could check for monster-specific features that affect initiative
  return abilityModifiers.dexterity;
}

// Helper function to roll initiative (d20 + modifier)
function rollInitiative(modifier: number): number {
  const roll = Math.floor(Math.random() * 20) + 1;
  return roll + modifier;
}

export const getMonsters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("monsters").collect();
  },
});

// Public function for MAUI native apps - returns all monsters without authentication
export const getAllMonsters = query({
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

export const getMonsterWithActions = query({
  args: { monsterId: v.id("monsters") },
  handler: async (ctx, args): Promise<({
    resolvedActions: Doc<"actions">[];
    resolvedReactions: Doc<"actions">[];
    resolvedLegendaryActions: Doc<"actions">[];
    resolvedLairActions: Doc<"actions">[];
  } & Doc<"monsters">) | null> => {
    const monster = await ctx.db.get(args.monsterId);
    if (!monster) return null;

    // Helper to resolve action IDs to action objects
    const resolveActions = async (actionIds: Id<"actions">[] | undefined): Promise<Doc<"actions">[]> => {
      if (!actionIds || actionIds.length === 0) return [];
      const resolved: Doc<"actions">[] = [];
      for (const actionId of actionIds) {
        const action = await ctx.db.get(actionId);
        if (action) {
          resolved.push(action);
        }
      }
      return resolved;
    };

    // Resolve all action types
    const resolvedActions = await resolveActions(monster.actions);
    const resolvedReactions = await resolveActions(monster.reactions);
    const resolvedLegendaryActions = await resolveActions(monster.legendaryActions);
    const resolvedLairActions = await resolveActions(monster.lairActions);

    return {
      ...monster,
      resolvedActions,
      resolvedReactions,
      resolvedLegendaryActions,
      resolvedLairActions
    };
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
    initiative: v.optional(v.number()),
    // Actions fields (references to actions table)
    actions: v.optional(v.array(v.id("actions"))),
    reactions: v.optional(v.array(v.id("actions"))),
    legendaryActions: v.optional(v.array(v.id("actions"))),
    lairActions: v.optional(v.array(v.id("actions"))),
    // Inventory and equipment support
    inventory: v.optional(v.object({
      capacity: v.number(),
      items: v.array(v.object({
        itemId: v.id("items"),
        quantity: v.number(),
      })),
    })),
    equipment: v.optional(v.object({
      headgear: v.optional(v.id("items")),
      armwear: v.optional(v.id("items")),
      chestwear: v.optional(v.id("items")),
      legwear: v.optional(v.id("items")),
      footwear: v.optional(v.id("items")),
      mainHand: v.optional(v.id("items")),
      offHand: v.optional(v.id("items")),
      accessories: v.array(v.id("items")),
    })),
    equipmentBonuses: v.optional(v.object({
      armorClass: v.number(),
      abilityScores: v.object({
        strength: v.number(),
        dexterity: v.number(),
        constitution: v.number(),
        intelligence: v.number(),
        wisdom: v.number(),
        charisma: v.number(),
      }),
    })),
  },
  handler: async (ctx, args): Promise<Id<"monsters">> => {
    const user = await getCurrentUser(ctx);

    // Calculate ability modifiers server-side
    const abilityModifiers = calculateAbilityModifiers(args.abilityScores);
    
    // Calculate XP from CR if not provided
    const experiencePoints = getChallengeRatingXP(args.challengeRating);
    
    // Set challengeRatingValue if not provided
    const challengeRatingValue = args.challengeRatingValue || parseFloat(args.challengeRating.replace("/", "."));

    // Calculate equipment bonuses if equipment is provided
    let equipmentBonuses: {
      armorClass: number;
      abilityScores: AbilityScores;
    } = args.equipmentBonuses || {
      armorClass: 0,
      abilityScores: {
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0
      }
    };

    // If equipment is provided, calculate bonuses from equipped items
    if (args.equipment) {
      // Type definition for equipment
      type Equipment = {
        headgear?: Id<"items">;
        armwear?: Id<"items">;
        chestwear?: Id<"items">;
        legwear?: Id<"items">;
        footwear?: Id<"items">;
        mainHand?: Id<"items">;
        offHand?: Id<"items">;
        accessories: Id<"items">[];
      };

      type EquipmentBonuses = {
        armorClass: number;
        abilityScores: AbilityScores;
      };

      // Import calculateEquipmentBonuses helper (inline for now)
      const calculateEquipmentBonuses = async (equipment: Equipment): Promise<EquipmentBonuses> => {
        const bonuses: EquipmentBonuses = {
          armorClass: 0,
          abilityScores: {
            strength: 0,
            dexterity: 0,
            constitution: 0,
            intelligence: 0,
            wisdom: 0,
            charisma: 0,
          },
        };

        const equippedItemIds: Id<"items">[] = [
          equipment.headgear,
          equipment.armwear,
          equipment.chestwear,
          equipment.legwear,
          equipment.footwear,
          equipment.mainHand,
          equipment.offHand,
          ...(equipment.accessories || [])
        ].filter((id): id is Id<"items"> => id !== undefined);

        const items = await Promise.all(
          equippedItemIds.map(itemId => ctx.db.get(itemId))
        );

        for (const item of items) {
          if (!item) continue;
          if (item.armorClass) {
            bonuses.armorClass += item.armorClass;
          }
          if (item.abilityModifiers) {
            const abilityKeys: (keyof AbilityScores)[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
            abilityKeys.forEach(ability => {
              const modifier = item.abilityModifiers?.[ability] || 0;
              bonuses.abilityScores[ability] += modifier;
            });
          }
        }

        return bonuses;
      };
      
      equipmentBonuses = await calculateEquipmentBonuses(args.equipment);
    }

    // Calculate and roll initiative (including equipment bonuses to dexterity)
    const totalDexterity = args.abilityScores.dexterity + equipmentBonuses.abilityScores.dexterity;
    const effectiveAbilityModifiers = {
      ...abilityModifiers,
      dexterity: Math.floor((totalDexterity - 10) / 2)
    };
    const initiativeModifier = calculateMonsterInitiativeModifier(effectiveAbilityModifiers);
    const rolledInitiative = rollInitiative(initiativeModifier);

    const monsterId: Id<"monsters"> = await ctx.db.insert("monsters", {
      ...args,
      abilityModifiers,
      experiencePoints,
      challengeRatingValue,
      actions: args.actions || [], // Array of action IDs
      reactions: args.reactions || [],
      legendaryActions: args.legendaryActions || [],
      lairActions: args.lairActions || [],
      initiative: args.initiative ?? rolledInitiative, // Use provided initiative or auto-roll
      // Save inventory and equipment data
      inventory: args.inventory || { capacity: 150, items: [] },
      equipment: args.equipment || {
        headgear: undefined,
        armwear: undefined,
        chestwear: undefined,
        legwear: undefined,
        footwear: undefined,
        mainHand: undefined,
        offHand: undefined,
        accessories: []
      },
      equipmentBonuses: equipmentBonuses,
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
    source: v.optional(v.string()),
    size: v.optional(v.union(
      v.literal("Tiny"), v.literal("Small"), v.literal("Medium"),
      v.literal("Large"), v.literal("Huge"), v.literal("Gargantuan")
    )),
    type: v.optional(v.string()),
    alignment: v.optional(v.string()),
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
    hitDice: v.optional(v.object({
      count: v.number(),
      die: v.union(v.literal("d4"), v.literal("d6"), v.literal("d8"), v.literal("d10"), v.literal("d12")),
    })),
    speed: v.optional(v.object({
      walk: v.optional(v.string()),
      swim: v.optional(v.string()),
      fly: v.optional(v.string()),
      burrow: v.optional(v.string()),
      climb: v.optional(v.string()),
    })),
    senses: v.optional(v.object({
      passivePerception: v.number(),
      darkvision: v.optional(v.string()),
      blindsight: v.optional(v.string()),
      tremorsense: v.optional(v.string()),
      truesight: v.optional(v.string()),
    })),
    proficiencyBonus: v.optional(v.number()),
    challengeRatingValue: v.optional(v.number()),
    legendaryActionCount: v.optional(v.number()),
    lairActionCount: v.optional(v.number()),
    initiative: v.optional(v.number()),
    actions: v.optional(v.array(v.id("actions"))),
    traits: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
        })
      )
    ),
    reactions: v.optional(v.array(v.id("actions"))),
    legendaryActions: v.optional(v.array(v.id("actions"))),
    lairActions: v.optional(v.array(v.id("actions"))),
    // Inventory and equipment support
    inventory: v.optional(v.object({
      capacity: v.number(),
      items: v.array(v.object({
        itemId: v.id("items"),
        quantity: v.number(),
      })),
    })),
    equipment: v.optional(v.object({
      headgear: v.optional(v.id("items")),
      armwear: v.optional(v.id("items")),
      chestwear: v.optional(v.id("items")),
      legwear: v.optional(v.id("items")),
      footwear: v.optional(v.id("items")),
      mainHand: v.optional(v.id("items")),
      offHand: v.optional(v.id("items")),
      accessories: v.array(v.id("items")),
    })),
    equipmentBonuses: v.optional(v.object({
      armorClass: v.number(),
      abilityScores: v.object({
        strength: v.number(),
        dexterity: v.number(),
        constitution: v.number(),
        intelligence: v.number(),
        wisdom: v.number(),
        charisma: v.number(),
      }),
    })),
  },
  handler: async (ctx, args): Promise<void> => {
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
    const updatedData: Partial<Doc<"monsters">> & { updatedAt: number } = { ...updates, updatedAt: Date.now() };

    // Recalculate ability modifiers and initiative if ability scores or equipment changed
    if (updates.abilityScores || updates.equipment || updates.equipmentBonuses) {
      const newAbilityScores = updates.abilityScores || monster.abilityScores;
      const newEquipmentBonuses = updates.equipmentBonuses || monster.equipmentBonuses || {
        armorClass: 0,
        abilityScores: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0
        }
      };
      
      const abilityModifiers = calculateAbilityModifiers(newAbilityScores);
      updatedData.abilityModifiers = abilityModifiers;
      
      // Calculate initiative including equipment bonuses
      if (updates.initiative === undefined) {
        const totalDexterity = newAbilityScores.dexterity + newEquipmentBonuses.abilityScores.dexterity;
        const effectiveAbilityModifiers = {
          ...abilityModifiers,
          dexterity: Math.floor((totalDexterity - 10) / 2)
        };
        const initiativeModifier = calculateMonsterInitiativeModifier(effectiveAbilityModifiers);
        updatedData.initiative = rollInitiative(initiativeModifier);
      }
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
  handler: async (ctx, args): Promise<void> => {
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
  handler: async (ctx, args): Promise<Id<"monsters">> => {
    const user = await getCurrentUser(ctx);

    const originalMonster = await ctx.db.get(args.monsterId);
    if (!originalMonster) {
      throw new Error("Monster not found");
    }

    // Create a copy of the monster with the current user as the creator
    const { _id, ...monsterWithoutId } = originalMonster;
    const clonedMonsterData = {
      ...monsterWithoutId,
      name: `${originalMonster.name} (Copy)`,
      userId: user._id,
      createdAt: Date.now(),
      // Mark as cloned
      clonedFrom: args.monsterId,
      clonedAt: Date.now()
    };

    const clonedMonsterId: Id<"monsters"> = await ctx.db.insert("monsters", clonedMonsterData);

    return clonedMonsterId;
  },
}); 