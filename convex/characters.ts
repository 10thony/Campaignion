import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

// Helper function to calculate proficiency bonus based on level
function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

// Helper function to calculate total AC
function calculateTotalArmorClass(baseAC: number, dexMod: number, equipmentBonus: number = 0): number {
  return Math.max(10 + dexMod + equipmentBonus, baseAC + equipmentBonus);
}

export const getPlayerCharacters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("playerCharacters").collect();
  },
});

export const getNPCs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("npcs").collect();
  },
});

export const getCharacterById = query({
  args: { characterId: v.id("playerCharacters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.characterId);
  },
});

export const getNPCById = query({
  args: { npcId: v.id("npcs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.npcId);
  },
});

export const getMyCharacters = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("playerCharacters")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
  },
});

export const createPlayerCharacter = mutation({
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate derived stats server-side
    const abilityModifiers = calculateAbilityModifiers(args.abilityScores);
    const proficiencyBonus = calculateProficiencyBonus(args.level);
    
    // Calculate total AC considering Dex modifier
    const totalArmorClass = calculateTotalArmorClass(
      args.armorClass, 
      abilityModifiers.dexterity
    );

    const characterId = await ctx.db.insert("playerCharacters", {
      ...args,
      characterType: "PlayerCharacter" as const,
      abilityModifiers,
      proficiencyBonus,
      armorClass: totalArmorClass,
      experiencePoints: 0, // Default starting XP
      actions: [], // Empty actions array
      userId: user._id,
      createdAt: Date.now(),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate derived stats server-side
    const abilityModifiers = calculateAbilityModifiers(args.abilityScores);
    const proficiencyBonus = calculateProficiencyBonus(args.level);
    
    // Calculate total AC considering Dex modifier
    const totalArmorClass = calculateTotalArmorClass(
      args.armorClass, 
      abilityModifiers.dexterity
    );

    const npcId = await ctx.db.insert("npcs", {
      ...args,
      characterType: "NonPlayerCharacter" as const,
      abilityModifiers,
      proficiencyBonus,
      armorClass: totalArmorClass,
      experiencePoints: 0,
      actions: [],
      userId: user._id,
      createdAt: Date.now(),
    });

    return npcId;
  },
});

export const updateCharacter = mutation({
  args: {
    characterId: v.id("playerCharacters"),
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
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
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
      updatedData.proficiencyBonus = calculateProficiencyBonus(updates.level);
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
  args: { characterId: v.id("playerCharacters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check permissions
    if (character.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to delete this character");
    }

    await ctx.db.delete(args.characterId);
  },
});

export const deleteNPC = mutation({
  args: { npcId: v.id("npcs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const npc = await ctx.db.get(args.npcId);
    if (!npc) {
      throw new Error("NPC not found");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check permissions
    if (npc.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to delete this NPC");
    }

    await ctx.db.delete(args.npcId);
  },
}); 