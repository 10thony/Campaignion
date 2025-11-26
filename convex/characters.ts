import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./clerkService";
import { api } from "./_generated/api";

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

// Helper function to calculate total AC
function calculateTotalArmorClass(baseAC: number, dexMod: number, equipmentBonus: number = 0): number {
  return Math.max(10 + dexMod + equipmentBonus, baseAC + equipmentBonus);
}

// Type definitions for initiative calculation
type InitiativeEntity = {
  abilityModifiers?: { dexterity: number; charisma?: number };
  abilityScores?: { dexterity: number };
  equipmentBonuses?: { 
    abilityScores?: { dexterity: number };
    initiative?: number; // Direct initiative bonus from equipped items
  };
  classes?: Array<{ name: string; level: number; subclass?: string }>;
  feats?: Array<{ name: string }>;
  features?: Array<{ name: string; source: string }>;
};

// Helper function to calculate initiative modifier breakdown
// This checks for bonuses from feats, class features, items, etc.
function calculateInitiativeModifier(entity: InitiativeEntity): number {
  // Get Dexterity modifier
  let dexModifier = 0;
  if (entity.abilityModifiers?.dexterity !== undefined) {
    dexModifier = entity.abilityModifiers.dexterity;
  } else if (entity.abilityScores?.dexterity !== undefined) {
    dexModifier = Math.floor((entity.abilityScores.dexterity - 10) / 2);
  }
  
  // Add equipment bonuses to dexterity (which affects the modifier)
  if (entity.equipmentBonuses?.abilityScores?.dexterity) {
    const equipmentDexBonus = entity.equipmentBonuses.abilityScores.dexterity;
    if (entity.abilityScores?.dexterity !== undefined) {
      const totalDex = entity.abilityScores.dexterity + equipmentDexBonus;
      dexModifier = Math.floor((totalDex - 10) / 2);
    }
  }
  
  let totalModifier = dexModifier;
  
  // Check for Alert feat (+5 bonus)
  const hasAlertFeat = entity.feats?.some(f => 
    f.name.toLowerCase().includes("alert")
  ) || false;
  
  if (hasAlertFeat) {
    totalModifier += 5;
  }
  
  // Check for Swashbuckler Rogue (adds Charisma modifier at 3rd level)
  const swashbucklerClass = entity.classes?.find(
    c => c.name === "Rogue" && c.subclass === "Swashbuckler" && c.level >= 3
  );
  
  if (swashbucklerClass && entity.abilityModifiers?.charisma !== undefined) {
    totalModifier += entity.abilityModifiers.charisma;
  }
  
  // Check for Harengon race (add proficiency bonus)
  // Note: This requires level information, which we'll need from the entity
  const hasHarengonTrait = entity.features?.some(f =>
    f.name.toLowerCase().includes("hare-trigger") ||
    f.name.toLowerCase().includes("harengon")
  );
  
  if (hasHarengonTrait && entity.classes && entity.classes.length > 0) {
    const totalLevel = entity.classes.reduce((sum, c) => sum + c.level, 0);
    const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;
    totalModifier += proficiencyBonus;
  }
  
  // Add direct initiative bonus from equipped items
  if (entity.equipmentBonuses?.initiative) {
    totalModifier += entity.equipmentBonuses.initiative;
  }
  
  return totalModifier;
}

// Helper function to roll initiative (d20 + modifier)
function rollInitiative(modifier: number): number {
  const roll = Math.floor(Math.random() * 20) + 1;
  return roll + modifier;
}

// Phase 2: Database-driven helper functions
export const getClassHitDie = query({
  args: { className: v.string() },
  handler: async (ctx, args) => {
    const dndClass = await ctx.db
      .query("dndClasses")
      .filter((q) => q.eq(q.field("name"), args.className))
      .first();
    
    return dndClass?.hitDie || 'd8';
  },
});

export const getProficiencyBonus = query({
  args: { level: v.number() },
  handler: async (_ctx, args): Promise<number> => {
    return Math.ceil(args.level / 4) + 1;
  },
});

export const getPlayerCharacters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("characters")
      .filter((q) => q.eq(q.field("characterType"), "player"))
      .collect();
  },
});

export const getNPCs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("characters")
      .filter((q) => q.eq(q.field("characterType"), "npc"))
      .collect();
  },
});

export const getAllCharacters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("characters").collect();
  },
});

// Public function for MAUI native apps - returns all characters without authentication
export const getAllCharactersPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("characters").collect();
  },
});

export const getCharacterById = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.characterId);
  },
});

export const getCharacterWithActions = query({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args): Promise<({
    resolvedActions: import("./_generated/dataModel").Doc<"actions">[];
  } & import("./_generated/dataModel").Doc<"characters">) | null> => {
    const character = await ctx.db.get(args.characterId);
    if (!character) return null;

    // Resolve action IDs to actual action objects
    const resolvedActions: import("./_generated/dataModel").Doc<"actions">[] = [];
    if (character.actions && character.actions.length > 0) {
      for (const actionId of character.actions) {
        const action = await ctx.db.get(actionId);
        if (action) {
          resolvedActions.push(action);
        }
      }
    }

    return {
      ...character,
      resolvedActions
    };
  },
});

export const getNPCById = query({
  args: { npcId: v.id("characters") },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.npcId);
    if (character && character.characterType !== "npc") {
      throw new Error("Character is not an NPC");
    }
    return character;
  },
});

export const getMyCharacters = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      
      return await ctx.db
        .query("characters")
        .filter((q) => q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("characterType"), "player")
        ))
        .collect();
    } catch (error) {
      // Return empty array if not authenticated
      return [];
    }
  },
});

export const getCharacters = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    try {
      // If campaignId is provided, we need to get characters that are associated with the campaign
      // Since characters don't have a direct campaignId field, we'll need to get them through other means
      // For now, we'll return all characters that belong to the current user
      const user = await getCurrentUser(ctx);
      
      if (args.campaignId) {
        // TODO: Implement proper campaign character filtering
        // This would require either:
        // 1. Adding campaignId to characters table
        // 2. Creating a separate campaignCharacters table
        // 3. Filtering through quests/interactions that reference the campaign
        
        // For now, return empty array as placeholder
        return [];
      }
      
      // Return all characters for the current user
      return await ctx.db
        .query("characters")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
    } catch (error) {
      // Return empty array if not authenticated
      return [];
    }
  },
});

export const createPlayerCharacter = mutation({
  args: {
    name: v.string(),
    race: v.string(),
    class: v.string(), // Primary class for backward compatibility
    background: v.string(),
    alignment: v.optional(v.string()),
    level: v.number(),
    abilityScores: v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    }),
    hitPoints: v.number(),
    armorClass: v.number(),
    speed: v.optional(v.string()),
    skills: v.array(v.string()),
    savingThrows: v.array(v.string()),
    proficiencies: v.array(v.string()),
    
    // Extended fields for multiclass and import support
    subrace: v.optional(v.string()),
    classes: v.optional(v.array(v.object({
      name: v.string(),
      level: v.number(),
      hitDie: v.string(),
      features: v.optional(v.array(v.string())),
      subclass: v.optional(v.string()),
    }))),
    baseAbilityScores: v.optional(v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    })),
    racialAbilityScoreImprovements: v.optional(v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    })),
    maxHitPoints: v.optional(v.number()),
    currentHitPoints: v.optional(v.number()),
    tempHitPoints: v.optional(v.number()),
    hitDice: v.optional(v.array(v.object({
      die: v.string(),
      current: v.number(),
      max: v.number(),
    }))),
    baseArmorClass: v.optional(v.number()),
    skillProficiencies: v.optional(v.array(v.object({
      skill: v.string(),
      proficient: v.boolean(),
      expertise: v.optional(v.boolean()),
      source: v.optional(v.string()),
    }))),
    savingThrowProficiencies: v.optional(v.array(v.object({
      ability: v.string(),
      proficient: v.boolean(),
      source: v.optional(v.string()),
    }))),
    weaponProficiencies: v.optional(v.array(v.string())),
    armorProficiencies: v.optional(v.array(v.string())),
    toolProficiencies: v.optional(v.array(v.string())),
    traits: v.optional(v.array(v.string())),
    racialTraits: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
    }))),
    languages: v.optional(v.array(v.string())),
    speeds: v.optional(v.object({
      walking: v.optional(v.number()),
      swimming: v.optional(v.number()),
      flying: v.optional(v.number()),
      climbing: v.optional(v.number()),
      burrowing: v.optional(v.number()),
    })),
    initiative: v.optional(v.number()),
    passivePerception: v.optional(v.number()),
    passiveInvestigation: v.optional(v.number()),
    passiveInsight: v.optional(v.number()),
    spellcastingAbility: v.optional(v.string()),
    spellSaveDC: v.optional(v.number()),
    spellAttackBonus: v.optional(v.number()),
    spellSlots: v.optional(v.array(v.object({
      level: v.number(),
      total: v.number(),
      used: v.number(),
    }))),
    spellsKnown: v.optional(v.array(v.string())),
    cantripsKnown: v.optional(v.array(v.string())),
    features: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      source: v.string(),
      uses: v.optional(v.object({
        current: v.number(),
        max: v.number(),
        resetOn: v.string(),
      })),
    }))),
    feats: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
    }))),
    inspiration: v.optional(v.boolean()),
    deathSaves: v.optional(v.object({
      successes: v.number(),
      failures: v.number(),
    })),
    importedFrom: v.optional(v.string()),
    importData: v.optional(v.any()),
    actions: v.optional(v.array(v.id("actions"))),
    
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
  handler: async (ctx, args): Promise<import("./_generated/dataModel").Id<"characters">> => {
    const user = await getCurrentUser(ctx);

    // Calculate derived stats server-side
    const abilityModifiers = calculateAbilityModifiers(args.abilityScores);
    const proficiencyBonus: number = await ctx.runQuery(api.characters.getProficiencyBonus, { level: args.level });
    
    // Calculate total AC considering Dex modifier
    const dexModifier = abilityModifiers.dexterity;
    const totalAC = calculateTotalArmorClass(10, dexModifier);

    // Process multiclass data if provided
    const processedClasses: Array<{
      name: string;
      level: number;
      hitDie: string;
      features?: string[];
      subclass?: string;
    }> = args.classes || [{
      name: args.class,
      level: args.level,
      hitDie: await ctx.runQuery(api.characters.getClassHitDie, { className: args.class }),
      features: [],
      subclass: undefined,
    }];

    // Calculate and roll initiative
    const initiativeModifier = calculateInitiativeModifier({
      abilityModifiers,
      abilityScores: args.abilityScores,
      equipmentBonuses: args.equipmentBonuses,
      classes: processedClasses,
      feats: args.feats,
      features: args.features,
    });
    const rolledInitiative = rollInitiative(initiativeModifier);

    const characterId: import("./_generated/dataModel").Id<"characters"> = await ctx.db.insert("characters", {
      ...args,
      characterType: "player" as const,
      classes: processedClasses,
      abilityModifiers,
      proficiencyBonus,
      armorClass: totalAC,
      maxHitPoints: args.maxHitPoints || args.hitPoints,
      currentHitPoints: args.currentHitPoints || args.hitPoints,
      tempHitPoints: args.tempHitPoints || 0,
      baseArmorClass: args.baseArmorClass || args.armorClass,
      experiencePoints: 0, // Default starting XP
      actions: args.actions || [], // Use provided actions or empty array
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
      equipmentBonuses: args.equipmentBonuses || {
        armorClass: 0,
        abilityScores: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0
        }
      },
      
      userId: user._id,
      createdAt: Date.now(),
      importedAt: args.importedFrom ? Date.now() : undefined,
    });

    return characterId;
  },
});

export const createNPC = mutation({
  args: {
    name: v.string(),
    race: v.string(),
    class: v.string(),
    background: v.string(),
    alignment: v.optional(v.string()),
    level: v.number(),
    abilityScores: v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    }),
    hitPoints: v.number(),
    armorClass: v.number(),
    speed: v.optional(v.string()),
    skills: v.array(v.string()),
    savingThrows: v.array(v.string()),
    proficiencies: v.array(v.string()),
    actions: v.optional(v.array(v.id("actions"))),
    
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
    
    // Extended fields for multiclass and import support (same as player character)
    subrace: v.optional(v.string()),
    classes: v.optional(v.array(v.object({
      name: v.string(),
      level: v.number(),
      hitDie: v.string(),
      features: v.optional(v.array(v.string())),
      subclass: v.optional(v.string()),
    }))),
    baseAbilityScores: v.optional(v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    })),
    racialAbilityScoreImprovements: v.optional(v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    })),
    maxHitPoints: v.optional(v.number()),
    currentHitPoints: v.optional(v.number()),
    tempHitPoints: v.optional(v.number()),
    hitDice: v.optional(v.array(v.object({
      die: v.string(),
      current: v.number(),
      max: v.number(),
    }))),
    baseArmorClass: v.optional(v.number()),
    skillProficiencies: v.optional(v.array(v.object({
      skill: v.string(),
      proficient: v.boolean(),
      expertise: v.optional(v.boolean()),
      source: v.optional(v.string()),
    }))),
    savingThrowProficiencies: v.optional(v.array(v.object({
      ability: v.string(),
      proficient: v.boolean(),
      source: v.optional(v.string()),
    }))),
    weaponProficiencies: v.optional(v.array(v.string())),
    armorProficiencies: v.optional(v.array(v.string())),
    toolProficiencies: v.optional(v.array(v.string())),
    traits: v.optional(v.array(v.string())),
    racialTraits: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
    }))),
    languages: v.optional(v.array(v.string())),
    speeds: v.optional(v.object({
      walking: v.optional(v.number()),
      swimming: v.optional(v.number()),
      flying: v.optional(v.number()),
      climbing: v.optional(v.number()),
      burrowing: v.optional(v.number()),
    })),
    initiative: v.optional(v.number()),
    passivePerception: v.optional(v.number()),
    passiveInvestigation: v.optional(v.number()),
    passiveInsight: v.optional(v.number()),
    spellcastingAbility: v.optional(v.string()),
    spellSaveDC: v.optional(v.number()),
    spellAttackBonus: v.optional(v.number()),
    spellSlots: v.optional(v.array(v.object({
      level: v.number(),
      total: v.number(),
      used: v.number(),
    }))),
    spellsKnown: v.optional(v.array(v.string())),
    cantripsKnown: v.optional(v.array(v.string())),
    features: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      source: v.string(),
      uses: v.optional(v.object({
        current: v.number(),
        max: v.number(),
        resetOn: v.string(),
      })),
    }))),
    feats: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
    }))),
    inspiration: v.optional(v.boolean()),
    deathSaves: v.optional(v.object({
      successes: v.number(),
      failures: v.number(),
    })),
    importedFrom: v.optional(v.string()),
    importData: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<import("./_generated/dataModel").Id<"characters">> => {
    const user = await getCurrentUser(ctx);

    // Calculate derived stats server-side
    const abilityModifiers = calculateAbilityModifiers(args.abilityScores);
    const proficiencyBonus: number = await ctx.runQuery(api.characters.getProficiencyBonus, { level: args.level });
    
    // Calculate total AC considering Dex modifier
    const dexModifier = abilityModifiers.dexterity;
    const totalAC = calculateTotalArmorClass(10, dexModifier);

    // Process multiclass data if provided
    const processedClasses: Array<{
      name: string;
      level: number;
      hitDie: string;
      features?: string[];
      subclass?: string;
    }> = args.classes || [{
      name: args.class,
      level: args.level,
      hitDie: await ctx.runQuery(api.characters.getClassHitDie, { className: args.class }),
      features: [],
      subclass: undefined,
    }];

    // Calculate and roll initiative
    const initiativeModifier = calculateInitiativeModifier({
      abilityModifiers,
      abilityScores: args.abilityScores,
      equipmentBonuses: args.equipmentBonuses,
      classes: processedClasses,
      feats: args.feats,
      features: args.features,
    });
    const rolledInitiative = rollInitiative(initiativeModifier);

    const npcId: import("./_generated/dataModel").Id<"characters"> = await ctx.db.insert("characters", {
      ...args,
      characterType: "npc" as const,
      classes: processedClasses,
      abilityModifiers,
      proficiencyBonus,
      armorClass: totalAC,
      maxHitPoints: args.maxHitPoints || args.hitPoints,
      currentHitPoints: args.currentHitPoints || args.hitPoints,
      tempHitPoints: args.tempHitPoints || 0,
      baseArmorClass: args.baseArmorClass || args.armorClass,
      experiencePoints: 0,
      actions: args.actions || [],
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
      equipmentBonuses: args.equipmentBonuses || {
        armorClass: 0,
        abilityScores: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0
        }
      },
      
      userId: user._id,
      createdAt: Date.now(),
      importedAt: args.importedFrom ? Date.now() : undefined,
    });

    return npcId;
  },
});

export const updateCharacter = mutation({
  args: {
    characterId: v.id("characters"),
    name: v.optional(v.string()),
    level: v.optional(v.number()),
    abilityScores: v.optional(v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    })),
    hitPoints: v.optional(v.number()),
    armorClass: v.optional(v.number()),
    experiencePoints: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    const user = await getCurrentUser(ctx);

    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    // Check permissions: own character, admin, or campaign DM
    if (character.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to edit this character");
    }

    const { characterId, ...updates } = args;
    const updatedData: any = { ...updates, updatedAt: Date.now() };

    // Recalculate derived stats if relevant fields changed
    if (updates.abilityScores) {
      updatedData.abilityModifiers = calculateAbilityModifiers(updates.abilityScores);
    }

    if (updates.level) {
      updatedData.proficiencyBonus = await ctx.runQuery(api.characters.getProficiencyBonus, { level: updates.level });
    }

    // Recalculate AC if ability scores or base AC changed
    if (updates.abilityScores || updates.armorClass) {
      const currentChar = await ctx.db.get(characterId);
      const abilityScores = updates.abilityScores || currentChar?.abilityScores;
      const baseAC = updates.armorClass || currentChar?.armorClass || 10;
      
      if (abilityScores) {
        const modifiers = calculateAbilityModifiers(abilityScores);
        updatedData.armorClass = calculateTotalArmorClass(baseAC, modifiers.dexterity);
      }
    }

    await ctx.db.patch(characterId, updatedData);
  },
});

export const deletePlayerCharacter = mutation({
      args: { characterId: v.id("characters") },
  handler: async (ctx, args): Promise<void> => {
    const user = await getCurrentUser(ctx);

    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    // Check permissions
    if (character.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to delete this character");
    }

    await ctx.db.delete(args.characterId);
  },
});

export const deleteNPC = mutation({
      args: { npcId: v.id("characters") },
  handler: async (ctx, args): Promise<void> => {
    const user = await getCurrentUser(ctx);

    const npc = await ctx.db.get(args.npcId);
    if (!npc) {
      throw new Error("NPC not found");
    }

    // Check permissions
    if (npc.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to delete this NPC");
    }

    await ctx.db.delete(args.npcId);
  },
});

export const cloneCharacter = mutation({
  args: { characterId: v.id("characters") },
  handler: async (ctx, args): Promise<import("./_generated/dataModel").Id<"characters">> => {
    const user = await getCurrentUser(ctx);

    const originalCharacter = await ctx.db.get(args.characterId);
    if (!originalCharacter) {
      throw new Error("Character not found");
    }

    // Create a copy of the character with the current user as the creator
    const { _id, ...characterWithoutId } = originalCharacter;
    const clonedCharacterData = {
      ...characterWithoutId,
      name: `${originalCharacter.name} (Copy)`,
      userId: user._id,
      createdAt: Date.now(),
      // Reset any dynamic fields that shouldn't be copied
      currentHitPoints: originalCharacter.maxHitPoints || originalCharacter.hitPoints,
      tempHitPoints: 0,
      experiencePoints: 0,
      // Reset any usage-based fields
      ...(originalCharacter.features && {
        features: originalCharacter.features.map(feature => ({
          ...feature,
          uses: feature.uses ? {
            ...feature.uses,
            current: feature.uses.max
          } : undefined
        }))
      }),
      // Reset spell slots if they exist
      ...(originalCharacter.spellSlots && {
        spellSlots: originalCharacter.spellSlots.map(slot => ({
          ...slot,
          used: 0
        }))
      }),
      // Reset death saves
      deathSaves: {
        successes: 0,
        failures: 0
      },
      // Reset inspiration
      inspiration: false,
      // Mark as cloned
      clonedFrom: args.characterId,
      clonedAt: Date.now()
    };

    const clonedCharacterId: import("./_generated/dataModel").Id<"characters"> = await ctx.db.insert("characters", clonedCharacterData);

    return clonedCharacterId;
  },
}); 