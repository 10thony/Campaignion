import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const loadSampleCampaigns = mutation({
  args: {
    campaigns: v.array(v.object({
      name: v.string(),
      description: v.optional(v.string()),
      worldSetting: v.optional(v.string()),
      isPublic: v.boolean(),
    })),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from database using Clerk ID
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }

    const campaignIds = [];
    for (const campaign of args.campaigns) {
      const campaignData = {
        name: campaign.name,
        description: campaign.description,
        worldSetting: campaign.worldSetting,
        isPublic: campaign.isPublic,
        creatorId: user._id,
        dmId: args.clerkId,
        createdAt: Date.now(),
      };
      
      const id = await ctx.db.insert("campaigns", campaignData);
      campaignIds.push(id);
    }

    return { loaded: campaignIds.length };
  },
});

export const loadSampleCharacters = mutation({
  args: {
    playerCharacters: v.array(v.object({
      name: v.string(),
      race: v.string(),
      class: v.string(),
      level: v.number(),
      hitPoints: v.number(),
      armorClass: v.number(),
      characterType: v.string(),
      abilityModifiers: v.object({
        strength: v.number(),
        dexterity: v.number(),
        constitution: v.number(),
        intelligence: v.number(),
        wisdom: v.number(),
        charisma: v.number(),
      }),
      experiencePoints: v.optional(v.number()),
      proficiencyBonus: v.optional(v.number()),
    })),
    npcs: v.array(v.object({
      name: v.string(),
      race: v.string(),
      class: v.string(),
      level: v.number(),
      hitPoints: v.number(),
      armorClass: v.number(),
      characterType: v.string(),
      abilityModifiers: v.object({
        strength: v.number(),
        dexterity: v.number(),
        constitution: v.number(),
        intelligence: v.number(),
        wisdom: v.number(),
        charisma: v.number(),
      }),
    })),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from database using Clerk ID
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }

    const characterIds = [];
    
    // Insert player characters
    for (const character of args.playerCharacters) {
      const characterData = {
        name: character.name,
        race: character.race,
        class: character.class,
        level: character.level,
        hitPoints: character.hitPoints,
        armorClass: character.armorClass,
        characterType: character.characterType === "PlayerCharacter" ? "PlayerCharacter" as const : "NonPlayerCharacter" as const,
        background: "Sample Background",
        abilityScores: {
          strength: 10 + character.abilityModifiers.strength,
          dexterity: 10 + character.abilityModifiers.dexterity,
          constitution: 10 + character.abilityModifiers.constitution,
          intelligence: 10 + character.abilityModifiers.intelligence,
          wisdom: 10 + character.abilityModifiers.wisdom,
          charisma: 10 + character.abilityModifiers.charisma,
        },
        skills: [],
        savingThrows: [],
        proficiencies: [],
        experiencePoints: character.experiencePoints || 0,
        proficiencyBonus: character.proficiencyBonus || 2,
        speed: "30 ft.",
        actions: [],
        userId: user._id,
        createdAt: Date.now(),
      };
      
      const id = await ctx.db.insert("playerCharacters", characterData);
      characterIds.push(id);
    }
    
    // Insert NPCs
    for (const npc of args.npcs) {
      const npcData = {
        name: npc.name,
        race: npc.race,
        class: npc.class,
        level: npc.level,
        hitPoints: npc.hitPoints,
        armorClass: npc.armorClass,
        characterType: npc.characterType === "PlayerCharacter" ? "PlayerCharacter" as const : "NonPlayerCharacter" as const,
        background: "Sample NPC Background",
        abilityScores: {
          strength: 10 + npc.abilityModifiers.strength,
          dexterity: 10 + npc.abilityModifiers.dexterity,
          constitution: 10 + npc.abilityModifiers.constitution,
          intelligence: 10 + npc.abilityModifiers.intelligence,
          wisdom: 10 + npc.abilityModifiers.wisdom,
          charisma: 10 + npc.abilityModifiers.charisma,
        },
        skills: [],
        savingThrows: [],
        proficiencies: [],
        experiencePoints: 0,
        proficiencyBonus: 2,
        speed: "30 ft.",
        actions: [],
        userId: user._id,
        createdAt: Date.now(),
      };
      
      const id = await ctx.db.insert("playerCharacters", npcData);
      characterIds.push(id);
    }

    return { loaded: characterIds.length };
  },
});

export const loadSampleMonsters = mutation({
  args: {
    monsters: v.array(v.object({
      name: v.string(),
      size: v.string(),
      type: v.string(),
      challengeRating: v.string(),
      hitPoints: v.number(),
      armorClass: v.number(),
      speed: v.object({
        walk: v.optional(v.string()),
        fly: v.optional(v.string()),
      }),
      abilityModifiers: v.object({
        strength: v.number(),
        dexterity: v.number(),
        constitution: v.number(),
        intelligence: v.number(),
        wisdom: v.number(),
        charisma: v.number(),
      }),
    })),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from database using Clerk ID
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }
    
    const monsterIds = [];
    
    for (const monster of args.monsters) {
      const monsterData = {
        name: monster.name,
        type: monster.type,
        challengeRating: monster.challengeRating,
        hitPoints: monster.hitPoints,
        armorClass: monster.armorClass,
        size: monster.size === "Tiny" ? "Tiny" as const : 
              monster.size === "Small" ? "Small" as const : 
              monster.size === "Medium" ? "Medium" as const : 
              monster.size === "Large" ? "Large" as const : 
              monster.size === "Huge" ? "Huge" as const : "Gargantuan" as const,
        alignment: "Neutral",
        speed: monster.speed,
        hitDice: {
          count: Math.ceil(monster.hitPoints / 6),
          die: "d6" as const,
        },
        proficiencyBonus: 2,
        abilityScores: {
          strength: 10 + monster.abilityModifiers.strength,
          dexterity: 10 + monster.abilityModifiers.dexterity,
          constitution: 10 + monster.abilityModifiers.constitution,
          intelligence: 10 + monster.abilityModifiers.intelligence,
          wisdom: 10 + monster.abilityModifiers.wisdom,
          charisma: 10 + monster.abilityModifiers.charisma,
        },
        senses: {
          passivePerception: 10 + monster.abilityModifiers.wisdom,
        },
        userId: user._id,
        createdAt: Date.now(),
      };
      
      const id = await ctx.db.insert("monsters", monsterData);
      monsterIds.push(id);
    }

    return { loaded: monsterIds.length };
  },
});

export const loadSampleItems = mutation({
  args: {
    items: v.array(v.object({
      name: v.string(),
      type: v.string(),
      rarity: v.string(),
      description: v.string(),
      weight: v.number(),
      cost: v.number(),
      damageRolls: v.optional(v.array(v.object({
        dice: v.object({
          count: v.number(),
          type: v.string(),
        }),
        modifier: v.number(),
        damageType: v.string(),
      }))),
      effects: v.optional(v.string()),
      attunement: v.optional(v.boolean()),
      abilityModifiers: v.optional(v.object({
        strength: v.optional(v.number()),
        dexterity: v.optional(v.number()),
        constitution: v.optional(v.number()),
        intelligence: v.optional(v.number()),
        wisdom: v.optional(v.number()),
        charisma: v.optional(v.number()),
      })),
      armorClass: v.optional(v.number()),
    })),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from database using Clerk ID
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }
    
    const itemIds = [];
    
    for (const item of args.items) {
      // Convert damage rolls to proper enum types
      const convertedDamageRolls = item.damageRolls?.map(roll => ({
        dice: {
          count: roll.dice.count,
          type: roll.dice.type.toUpperCase() as "D4" | "D6" | "D8" | "D10" | "D12" | "D20"
        },
        modifier: roll.modifier,
        damageType: roll.damageType.toUpperCase() as "BLUDGEONING" | "PIERCING" | "SLASHING" | "ACID" | "COLD" | "FIRE" | "FORCE" | "LIGHTNING" | "NECROTIC" | "POISON" | "PSYCHIC" | "RADIANT" | "THUNDER"
      }));
      
      const itemData = {
        name: item.name,
        type: item.type === "Weapon" ? "Weapon" as const : 
              item.type === "Armor" ? "Armor" as const : 
              item.type === "Potion" ? "Potion" as const : 
              item.type === "Scroll" ? "Scroll" as const : 
              item.type === "Wondrous Item" ? "Wondrous Item" as const : 
              item.type === "Ring" ? "Ring" as const : 
              item.type === "Rod" ? "Rod" as const : 
              item.type === "Staff" ? "Staff" as const : 
              item.type === "Wand" ? "Wand" as const : 
              item.type === "Ammunition" ? "Ammunition" as const : 
              item.type === "Adventuring Gear" ? "Adventuring Gear" as const : 
              item.type === "Tool" ? "Tool" as const : 
              item.type === "Mount" ? "Mount" as const : 
              item.type === "Vehicle" ? "Vehicle" as const : 
              item.type === "Treasure" ? "Treasure" as const : "Other" as const,
        rarity: item.rarity === "Common" ? "Common" as const : 
                item.rarity === "Uncommon" ? "Uncommon" as const : 
                item.rarity === "Rare" ? "Rare" as const : 
                item.rarity === "Very Rare" ? "Very Rare" as const : 
                item.rarity === "Legendary" ? "Legendary" as const : "Unique" as const,
        description: item.description,
        weight: item.weight,
        cost: item.cost,
        damageRolls: convertedDamageRolls,
        effects: item.effects,
        attunement: item.attunement,
        abilityModifiers: item.abilityModifiers,
        armorClass: item.armorClass,
        userId: user._id,
      };
      
      const id = await ctx.db.insert("items", itemData);
      itemIds.push(id);
    }

    return { loaded: itemIds.length };
  },
});

export const loadSampleQuests = mutation({
  args: {
    quests: v.array(v.object({
      name: v.string(),
      description: v.string(),
      status: v.string(),
      completionXP: v.number(),
      rewards: v.object({
        xp: v.number(),
        gold: v.number(),
        itemIds: v.array(v.string()),
      }),
    })),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from database using Clerk ID
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }
    
    const questIds = [];
    
    for (const quest of args.quests) {
      const questData = {
        name: quest.name,
        description: quest.description,
        completionXP: quest.completionXP,
        status: quest.status === "idle" ? "idle" as const : 
                quest.status === "in_progress" ? "in_progress" as const : 
                quest.status === "completed" ? "completed" as const : 
                quest.status === "NotStarted" ? "NotStarted" as const : 
                quest.status === "InProgress" ? "InProgress" as const : "Failed" as const,
        creatorId: user._id,
        taskIds: [],
        rewards: {
          xp: quest.rewards.xp,
          gold: quest.rewards.gold,
          itemIds: [], // Convert to empty array since we don't have actual item IDs
        },
        createdAt: Date.now(),
      };
      
      const id = await ctx.db.insert("quests", questData);
      questIds.push(id);
    }

    return { loaded: questIds.length };
  },
});

export const loadSampleActions = mutation({
  args: {
    actions: v.array(v.object({
      name: v.string(),
      description: v.string(),
      actionCost: v.string(),
      type: v.string(),
      requiresConcentration: v.boolean(),
      sourceBook: v.string(),
      attackBonusAbilityScore: v.optional(v.string()),
      isProficient: v.optional(v.boolean()),
      damageRolls: v.optional(v.array(v.object({
        dice: v.object({
          count: v.number(),
          type: v.string(),
        }),
        modifier: v.number(),
        damageType: v.string(),
      }))),
      className: v.optional(v.string()),
      usesPer: v.optional(v.string()),
      maxUses: v.optional(v.number()),
    })),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from database using Clerk ID
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }
    
    const actionIds = [];
    for (const action of args.actions) {
      // Convert damage rolls to proper enum types
      const convertedDamageRolls = action.damageRolls?.map(roll => ({
        dice: {
          count: roll.dice.count,
          type: roll.dice.type.toUpperCase() as "D4" | "D6" | "D8" | "D10" | "D12" | "D20"
        },
        modifier: roll.modifier,
        damageType: roll.damageType.toUpperCase() as "BLUDGEONING" | "PIERCING" | "SLASHING" | "ACID" | "COLD" | "FIRE" | "FORCE" | "LIGHTNING" | "NECROTIC" | "POISON" | "PSYCHIC" | "RADIANT" | "THUNDER"
      }));
      
      const actionData = {
        name: action.name,
        description: action.description,
        actionCost: action.actionCost === "Action" ? "Action" as const : 
                   action.actionCost === "Bonus Action" ? "Bonus Action" as const : 
                   action.actionCost === "Reaction" ? "Reaction" as const : 
                   action.actionCost === "No Action" ? "No Action" as const : "Special" as const,
        type: action.type === "MELEE_ATTACK" ? "MELEE_ATTACK" as const : 
              action.type === "RANGED_ATTACK" ? "RANGED_ATTACK" as const : 
              action.type === "SPELL" ? "SPELL" as const : 
              action.type === "COMMONLY_AVAILABLE_UTILITY" ? "COMMONLY_AVAILABLE_UTILITY" as const : 
              action.type === "CLASS_FEATURE" ? "CLASS_FEATURE" as const : 
              action.type === "BONUS_ACTION" ? "BONUS_ACTION" as const : 
              action.type === "REACTION" ? "REACTION" as const : "OTHER" as const,
        requiresConcentration: action.requiresConcentration,
        sourceBook: action.sourceBook,
        attackBonusAbilityScore: action.attackBonusAbilityScore,
        isProficient: action.isProficient,
        damageRolls: convertedDamageRolls,
        className: action.className,
        usesPer: action.usesPer === "Short Rest" ? "Short Rest" as const : 
                 action.usesPer === "Long Rest" ? "Long Rest" as const : 
                 action.usesPer === "Day" ? "Day" as const : 
                 action.usesPer === "Special" ? "Special" as const : undefined,
        maxUses: action.maxUses,
        createdAt: Date.now(),
      };
      
      const id = await ctx.db.insert("actions", actionData);
      actionIds.push(id);
    }

    return { loaded: actionIds.length };
  },
});

export const deleteAllSampleData = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from database using Clerk ID
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }

    // Delete all data for the current user
    const campaigns = await ctx.db
      .query("campaigns")
      .filter((q) => q.eq(q.field("creatorId"), user._id))
      .collect();
    
    const characters = await ctx.db
      .query("playerCharacters")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    
    const monsters = await ctx.db
      .query("monsters")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    
    const items = await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    
    const quests = await ctx.db
      .query("quests")
      .filter((q) => q.eq(q.field("creatorId"), user._id))
      .collect();
    
    const actions = await ctx.db
      .query("actions")
      .collect();

    // Delete all found records
    for (const campaign of campaigns) {
      await ctx.db.delete(campaign._id);
    }
    
    for (const character of characters) {
      await ctx.db.delete(character._id);
    }
    
    for (const monster of monsters) {
      await ctx.db.delete(monster._id);
    }
    
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    
    for (const quest of quests) {
      await ctx.db.delete(quest._id);
    }
    
    for (const action of actions) {
      await ctx.db.delete(action._id);
    }

    return {
      deleted: {
        campaigns: campaigns.length,
        characters: characters.length,
        monsters: monsters.length,
        items: items.length,
        quests: quests.length,
        actions: actions.length,
      }
    };
  },
}); 