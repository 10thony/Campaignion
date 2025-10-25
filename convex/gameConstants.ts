import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

// Query functions for game constants
export const getGameConstants = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("gameConstants")
        .filter((q) => q.and(
          q.eq(q.field("category"), args.category),
          q.eq(q.field("isActive"), true)
        ))
        .order("asc")
        .collect();
    }
    
    return await ctx.db
      .query("gameConstants")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getEquipmentSlots = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("equipmentSlots")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getDndClasses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("dndClasses")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getAbilityScores = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await ctx.db
        .query("abilityScores")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("asc")
        .collect();
    } catch (error) {
      console.error("Error fetching ability scores:", error);
      // Return empty array as fallback
      return [];
    }
  },
});

export const getPointBuyCosts = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await ctx.db
        .query("pointBuyCosts")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("asc")
        .collect();
    } catch (error) {
      console.error("Error fetching point buy costs:", error);
      // Return empty array as fallback
      return [];
    }
  },
});

export const getActionCosts = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await ctx.db
        .query("actionCosts")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("asc")
        .collect();
    } catch (error) {
      console.error("Error fetching action costs:", error);
      // Return empty array as fallback
      return [];
    }
  },
});

export const getActionTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("actionTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getDamageTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("damageTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getDiceTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("diceTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getItemTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("itemTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getItemRarities = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("itemRarities")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getArmorCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("armorCategories")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getSpellLevels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("spellLevels")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getRestTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("restTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getCharacterTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("characterTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getUserRoles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("userRoles")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getMapCellStates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("mapCellStates")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

export const getTerrainTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("terrainTypes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect();
  },
});

// Mutation functions to populate initial data
export const populateGameConstants = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only administrators can populate game constants");
    }

    const now = Date.now();
    const results = [];

    // Populate ability scores
    const abilityScores = [
      { key: "strength", label: "Strength", abbreviation: "STR", description: "Physical power and athletic training", sortOrder: 1 },
      { key: "dexterity", label: "Dexterity", abbreviation: "DEX", description: "Agility, reflexes, balance, and poise", sortOrder: 2 },
      { key: "constitution", label: "Constitution", abbreviation: "CON", description: "Health, stamina, and vital force", sortOrder: 3 },
      { key: "intelligence", label: "Intelligence", abbreviation: "INT", description: "Mental acuity, accuracy of recall, and ability to reason", sortOrder: 4 },
      { key: "wisdom", label: "Wisdom", abbreviation: "WIS", description: "Awareness of surroundings and insight", sortOrder: 5 },
      { key: "charisma", label: "Charisma", abbreviation: "CHA", description: "Ability to interact effectively with others", sortOrder: 6 },
    ];

    for (const score of abilityScores) {
      const id = await ctx.db.insert("abilityScores", {
        ...score,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "abilityScores", id });
    }

    // Populate point buy costs
    const pointBuyCosts = [
      { score: 8, cost: 0, description: "Below average" },
      { score: 9, cost: 1, description: "Below average" },
      { score: 10, cost: 2, description: "Average" },
      { score: 11, cost: 3, description: "Average" },
      { score: 12, cost: 4, description: "Above average" },
      { score: 13, cost: 5, description: "Above average" },
      { score: 14, cost: 7, description: "Good" },
      { score: 15, cost: 9, description: "Very good" },
    ];

    for (const cost of pointBuyCosts) {
      const id = await ctx.db.insert("pointBuyCosts", {
        ...cost,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "pointBuyCosts", id });
    }

    // Populate D&D classes from classes.json data
    const dndClassesData = [
      { name: "Barbarian", hitDie: "d12", primaryAbility: "Strength", savingThrowProficiencies: ["Strength", "Constitution"], armorProficiencies: ["Light", "Medium", "Shield"], weaponProficiencies: ["Simple", "Martial"], description: "A fierce warrior of primitive background who can enter a battle rage.", sourceBook: "Player's Handbook" },
      { name: "Bard", hitDie: "d8", primaryAbility: "Charisma", savingThrowProficiencies: ["Dexterity", "Charisma"], armorProficiencies: ["Light"], weaponProficiencies: ["Simple", "Hand crossbows", "Longswords", "Rapiers", "Shortswords"], description: "An inspiring magician whose power echoes the music of creation.", sourceBook: "Player's Handbook" },
      { name: "Cleric", hitDie: "d8", primaryAbility: "Wisdom", savingThrowProficiencies: ["Wisdom", "Charisma"], armorProficiencies: ["Light", "Medium", "Shield"], weaponProficiencies: ["Simple"], description: "A priestly champion who wields divine magic in service of a higher power.", sourceBook: "Player's Handbook" },
      { name: "Druid", hitDie: "d8", primaryAbility: "Wisdom", savingThrowProficiencies: ["Intelligence", "Wisdom"], armorProficiencies: ["Light", "Medium"], weaponProficiencies: ["Clubs", "Daggers", "Darts", "Javelins", "Maces", "Quarterstaffs", "Scimitars", "Sickles", "Slings", "Spears"], description: "A priest of the Old Faith, wielding the powers of nature and able to take animal forms.", sourceBook: "Player's Handbook" },
      { name: "Fighter", hitDie: "d10", primaryAbility: "Strength or Dexterity", savingThrowProficiencies: ["Strength", "Constitution"], armorProficiencies: ["All armor", "Shield"], weaponProficiencies: ["Simple", "Martial"], description: "A master of martial combat, skilled with a variety of weapons and armor.", sourceBook: "Player's Handbook" },
      { name: "Monk", hitDie: "d8", primaryAbility: "Dexterity and Wisdom", savingThrowProficiencies: ["Strength", "Dexterity"], armorProficiencies: ["None"], weaponProficiencies: ["Simple", "Shortswords"], description: "A master of martial arts, harnessing the power of ki to perform extraordinary feats.", sourceBook: "Player's Handbook" },
      { name: "Paladin", hitDie: "d10", primaryAbility: "Strength and Charisma", savingThrowProficiencies: ["Wisdom", "Charisma"], armorProficiencies: ["All armor", "Shield"], weaponProficiencies: ["Simple", "Martial"], description: "A holy warrior bound to a sacred oath, combining martial prowess with divine magic.", sourceBook: "Player's Handbook" },
      { name: "Ranger", hitDie: "d10", primaryAbility: "Dexterity and Wisdom", savingThrowProficiencies: ["Strength", "Dexterity"], armorProficiencies: ["Light", "Medium", "Shield"], weaponProficiencies: ["Simple", "Martial"], description: "A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization.", sourceBook: "Player's Handbook" },
      { name: "Rogue", hitDie: "d8", primaryAbility: "Dexterity", savingThrowProficiencies: ["Dexterity", "Intelligence"], armorProficiencies: ["Light"], weaponProficiencies: ["Simple", "Hand crossbows", "Longswords", "Rapiers", "Shortswords"], description: "A scoundrel who uses stealth and trickery to overcome obstacles and enemies.", sourceBook: "Player's Handbook" },
      { name: "Sorcerer", hitDie: "d6", primaryAbility: "Charisma", savingThrowProficiencies: ["Constitution", "Charisma"], armorProficiencies: ["None"], weaponProficiencies: ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light crossbows"], description: "A spellcaster who draws on inherent magic from a gift or bloodline rather than study.", sourceBook: "Player's Handbook" },
      { name: "Warlock", hitDie: "d8", primaryAbility: "Charisma", savingThrowProficiencies: ["Wisdom", "Charisma"], armorProficiencies: ["Light"], weaponProficiencies: ["Simple"], description: "A wielder of magic granted by a pact with an otherworldly being.", sourceBook: "Player's Handbook" },
      { name: "Wizard", hitDie: "d6", primaryAbility: "Intelligence", savingThrowProficiencies: ["Intelligence", "Wisdom"], armorProficiencies: ["None"], weaponProficiencies: ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light crossbows"], description: "A scholarly magic-user capable of manipulating the structures of reality.", sourceBook: "Player's Handbook" },
      { name: "Artificer", hitDie: "d8", primaryAbility: "Intelligence", savingThrowProficiencies: ["Constitution", "Intelligence"], armorProficiencies: ["Light", "Medium", "Shield"], weaponProficiencies: ["Simple", "Hand crossbows", "Longswords", "Rapiers", "Shortswords"], description: "A master inventor who infuses objects with magical properties and uses tools as arcane implements.", sourceBook: "Eberron: Rising from the Last War / Tasha's Cauldron of Everything" },
    ];

    for (const cls of dndClassesData) {
      const id = await ctx.db.insert("dndClasses", {
        ...cls,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "dndClasses", id });
    }

    // Populate equipment slots
    const equipmentSlots = [
      { key: "headgear", label: "Head", icon: "🪖", allowedItemTypes: ["Armor"], description: "Head protection and accessories", sortOrder: 1 },
      { key: "armwear", label: "Arms", icon: "🥽", allowedItemTypes: ["Armor"], description: "Arm protection and accessories", sortOrder: 2 },
      { key: "chestwear", label: "Chest", icon: "🦺", allowedItemTypes: ["Armor"], description: "Body armor and chest protection", sortOrder: 3 },
      { key: "legwear", label: "Legs", icon: "👖", allowedItemTypes: ["Armor"], description: "Leg protection and accessories", sortOrder: 4 },
      { key: "footwear", label: "Feet", icon: "👢", allowedItemTypes: ["Armor"], description: "Foot protection and accessories", sortOrder: 5 },
      { key: "mainHand", label: "Main Hand", icon: "⚔️", allowedItemTypes: ["Weapon", "Shield"], description: "Primary weapon or shield", sortOrder: 6 },
      { key: "offHand", label: "Off Hand", icon: "🛡️", allowedItemTypes: ["Weapon", "Shield"], description: "Secondary weapon or shield", sortOrder: 7 },
      { key: "accessories", label: "Accessories", icon: "💍", allowedItemTypes: ["Ring", "Wondrous Item"], description: "Rings, amulets, and other magical items", sortOrder: 8 },
    ];

    for (const slot of equipmentSlots) {
      const id = await ctx.db.insert("equipmentSlots", {
        ...slot,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "equipmentSlots", id });
    }

    // Populate action costs
    const actionCosts = [
      { value: "Action", icon: "Sword", color: "bg-red-100 text-red-800", description: "Standard action during turn", sortOrder: 1 },
      { value: "Bonus Action", icon: "Zap", color: "bg-yellow-100 text-yellow-800", description: "Quick action during turn", sortOrder: 2 },
      { value: "Reaction", icon: "Shield", color: "bg-blue-100 text-blue-800", description: "Response to trigger", sortOrder: 3 },
      { value: "No Action", icon: null, color: "bg-gray-100 text-gray-800", description: "Free action", sortOrder: 4 },
      { value: "Special", icon: null, color: "bg-purple-100 text-purple-800", description: "Unique timing", sortOrder: 5 },
    ];

    for (const cost of actionCosts) {
      const id = await ctx.db.insert("actionCosts", {
        ...cost,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "actionCosts", id });
    }

    // Populate action types
    const actionTypes = [
      { value: "MELEE_ATTACK", displayName: "Melee Attack", description: "Close combat attack", category: "combat", sortOrder: 1 },
      { value: "RANGED_ATTACK", displayName: "Ranged Attack", description: "Distance attack", category: "combat", sortOrder: 2 },
      { value: "SPELL", displayName: "Spell", description: "Magical ability", category: "spell", sortOrder: 3 },
      { value: "COMMONLY_AVAILABLE_UTILITY", displayName: "Utility", description: "General utility action", category: "utility", sortOrder: 4 },
      { value: "CLASS_FEATURE", displayName: "Class Feature", description: "Class-specific ability", category: "class", sortOrder: 5 },
      { value: "BONUS_ACTION", displayName: "Bonus Action", description: "Quick action", category: "utility", sortOrder: 6 },
      { value: "REACTION", displayName: "Reaction", description: "Response action", category: "utility", sortOrder: 7 },
      { value: "OTHER", displayName: "Other", description: "Miscellaneous action", category: "other", sortOrder: 8 },
    ];

    for (const type of actionTypes) {
      const id = await ctx.db.insert("actionTypes", {
        ...type,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "actionTypes", id });
    }

    // Populate damage types
    const damageTypes = [
      { value: "BLUDGEONING", displayName: "Bludgeoning", description: "Blunt force damage", category: "physical", sortOrder: 1 },
      { value: "PIERCING", displayName: "Piercing", description: "Sharp point damage", category: "physical", sortOrder: 2 },
      { value: "SLASHING", displayName: "Slashing", description: "Cutting damage", category: "physical", sortOrder: 3 },
      { value: "ACID", displayName: "Acid", description: "Corrosive damage", category: "elemental", sortOrder: 4 },
      { value: "COLD", displayName: "Cold", description: "Freezing damage", category: "elemental", sortOrder: 5 },
      { value: "FIRE", displayName: "Fire", description: "Burning damage", category: "elemental", sortOrder: 6 },
      { value: "FORCE", displayName: "Force", description: "Pure magical energy", category: "magical", sortOrder: 7 },
      { value: "LIGHTNING", displayName: "Lightning", description: "Electrical damage", category: "elemental", sortOrder: 8 },
      { value: "NECROTIC", displayName: "Necrotic", description: "Death magic damage", category: "magical", sortOrder: 9 },
      { value: "POISON", displayName: "Poison", description: "Toxic damage", category: "elemental", sortOrder: 10 },
      { value: "PSYCHIC", displayName: "Psychic", description: "Mental damage", category: "magical", sortOrder: 11 },
      { value: "RADIANT", displayName: "Radiant", description: "Holy light damage", category: "magical", sortOrder: 12 },
      { value: "THUNDER", displayName: "Thunder", description: "Sonic damage", category: "elemental", sortOrder: 13 },
    ];

    for (const type of damageTypes) {
      const id = await ctx.db.insert("damageTypes", {
        ...type,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "damageTypes", id });
    }

    // Populate dice types
    const diceTypes = [
      { value: "D4", displayName: "d4", sides: 4, description: "Four-sided die", sortOrder: 1 },
      { value: "D6", displayName: "d6", sides: 6, description: "Six-sided die", sortOrder: 2 },
      { value: "D8", displayName: "d8", sides: 8, description: "Eight-sided die", sortOrder: 3 },
      { value: "D10", displayName: "d10", sides: 10, description: "Ten-sided die", sortOrder: 4 },
      { value: "D12", displayName: "d12", sides: 12, description: "Twelve-sided die", sortOrder: 5 },
      { value: "D20", displayName: "d20", sides: 20, description: "Twenty-sided die", sortOrder: 6 },
    ];

    for (const dice of diceTypes) {
      const id = await ctx.db.insert("diceTypes", {
        ...dice,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "diceTypes", id });
    }

    // Populate item types
    const itemTypes = [
      { value: "Weapon", displayName: "Weapon", description: "Combat implements", category: "combat", sortOrder: 1 },
      { value: "Armor", displayName: "Armor", description: "Protective gear", category: "defense", sortOrder: 2 },
      { value: "Potion", displayName: "Potion", description: "Consumable magical liquids", category: "consumable", sortOrder: 3 },
      { value: "Scroll", displayName: "Scroll", description: "One-use spell containers", category: "spell", sortOrder: 4 },
      { value: "Wondrous Item", displayName: "Wondrous Item", description: "Magical items with various effects", category: "magical", sortOrder: 5 },
      { value: "Ring", displayName: "Ring", description: "Magical rings", category: "magical", sortOrder: 6 },
      { value: "Rod", displayName: "Rod", description: "Magical rods", category: "magical", sortOrder: 7 },
      { value: "Staff", displayName: "Staff", description: "Magical staves", category: "magical", sortOrder: 8 },
      { value: "Wand", displayName: "Wand", description: "Magical wands", category: "magical", sortOrder: 9 },
      { value: "Ammunition", displayName: "Ammunition", description: "Projectiles for ranged weapons", category: "combat", sortOrder: 10 },
      { value: "Adventuring Gear", displayName: "Adventuring Gear", description: "General equipment and tools", category: "utility", sortOrder: 11 },
      { value: "Tool", displayName: "Tool", description: "Specialized tools and instruments", category: "utility", sortOrder: 12 },
      { value: "Mount", displayName: "Mount", description: "Riding animals and vehicles", category: "transport", sortOrder: 13 },
      { value: "Vehicle", displayName: "Vehicle", description: "Transportation devices", category: "transport", sortOrder: 14 },
      { value: "Treasure", displayName: "Treasure", description: "Valuable items and currency", category: "wealth", sortOrder: 15 },
      { value: "Other", displayName: "Other", description: "Miscellaneous items", category: "other", sortOrder: 16 },
    ];

    for (const type of itemTypes) {
      const id = await ctx.db.insert("itemTypes", {
        ...type,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "itemTypes", id });
    }

    // Populate item rarities
    const itemRarities = [
      { value: "Common", displayName: "Common", description: "Everyday items", color: "text-gray-600", sortOrder: 1 },
      { value: "Uncommon", displayName: "Uncommon", description: "Somewhat rare items", color: "text-green-600", sortOrder: 2 },
      { value: "Rare", displayName: "Rare", description: "Hard to find items", color: "text-blue-600", sortOrder: 3 },
      { value: "Very Rare", displayName: "Very Rare", description: "Extremely rare items", color: "text-purple-600", sortOrder: 4 },
      { value: "Legendary", displayName: "Legendary", description: "Mythical items", color: "text-orange-600", sortOrder: 5 },
      { value: "Artifact", displayName: "Artifact", description: "Unique magical items", color: "text-red-600", sortOrder: 6 },
      { value: "Unique", displayName: "Unique", description: "One-of-a-kind items", color: "text-pink-600", sortOrder: 7 },
    ];

    for (const rarity of itemRarities) {
      const id = await ctx.db.insert("itemRarities", {
        ...rarity,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "itemRarities", id });
    }

    // Populate armor categories
    const armorCategories = [
      { value: "Light", displayName: "Light", description: "Light armor that doesn't hinder movement", maxDexBonus: null, stealthDisadvantage: false, sortOrder: 1 },
      { value: "Medium", displayName: "Medium", description: "Medium armor with moderate protection", maxDexBonus: 2, stealthDisadvantage: false, sortOrder: 2 },
      { value: "Heavy", displayName: "Heavy", description: "Heavy armor with maximum protection", maxDexBonus: 0, stealthDisadvantage: true, sortOrder: 3 },
      { value: "Shield", displayName: "Shield", description: "Shield for additional protection", maxDexBonus: null, stealthDisadvantage: false, sortOrder: 4 },
    ];

    for (const category of armorCategories) {
      const id = await ctx.db.insert("armorCategories", {
        ...category,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "armorCategories", id });
    }

    // Populate spell levels
    const spellLevels = [
      { level: 0, displayName: "Cantrip", description: "Basic magical abilities" },
      { level: 1, displayName: "1st Level", description: "First level spells" },
      { level: 2, displayName: "2nd Level", description: "Second level spells" },
      { level: 3, displayName: "3rd Level", description: "Third level spells" },
      { level: 4, displayName: "4th Level", description: "Fourth level spells" },
      { level: 5, displayName: "5th Level", description: "Fifth level spells" },
      { level: 6, displayName: "6th Level", description: "Sixth level spells" },
      { level: 7, displayName: "7th Level", description: "Seventh level spells" },
      { level: 8, displayName: "8th Level", description: "Eighth level spells" },
      { level: 9, displayName: "9th Level", description: "Ninth level spells" },
    ];

    for (const level of spellLevels) {
      const id = await ctx.db.insert("spellLevels", {
        ...level,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "spellLevels", id });
    }

    // Populate rest types
    const restTypes = [
      { value: "Short Rest", displayName: "Short Rest", description: "Brief period of rest", duration: "1 hour", sortOrder: 1 },
      { value: "Long Rest", displayName: "Long Rest", description: "Extended period of rest", duration: "8 hours", sortOrder: 2 },
      { value: "Day", displayName: "Day", description: "Resets at dawn", duration: "24 hours", sortOrder: 3 },
      { value: "Special", displayName: "Special", description: "Unique reset condition", duration: "Varies", sortOrder: 4 },
    ];

    for (const rest of restTypes) {
      const id = await ctx.db.insert("restTypes", {
        ...rest,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "restTypes", id });
    }

    // Populate character types
    const characterTypes = [
      { value: "player", displayName: "Player Character", description: "Character controlled by a player", sortOrder: 1 },
      { value: "npc", displayName: "Non-Player Character", description: "Character controlled by the DM", sortOrder: 2 },
    ];

    for (const type of characterTypes) {
      const id = await ctx.db.insert("characterTypes", {
        ...type,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "characterTypes", id });
    }

    // Populate user roles
    const userRoles = [
      { value: "admin", displayName: "Administrator", description: "Full system access", permissions: ["read", "write", "delete", "admin"], sortOrder: 1 },
      { value: "user", displayName: "User", description: "Standard user access", permissions: ["read", "write"], sortOrder: 2 },
    ];

    for (const role of userRoles) {
      const id = await ctx.db.insert("userRoles", {
        ...role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "userRoles", id });
    }

    // Populate map cell states
    const mapCellStates = [
      { value: "inbounds", displayName: "In Bounds", description: "Valid movement area", color: "bg-green-100", sortOrder: 1 },
      { value: "outbounds", displayName: "Out of Bounds", description: "Invalid movement area", color: "bg-red-100", sortOrder: 2 },
      { value: "occupied", displayName: "Occupied", description: "Space occupied by entity", color: "bg-blue-100", sortOrder: 3 },
    ];

    for (const state of mapCellStates) {
      const id = await ctx.db.insert("mapCellStates", {
        ...state,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "mapCellStates", id });
    }

    // Populate terrain types
    const terrainTypes = [
      { value: "normal", displayName: "Normal", description: "Standard terrain", movementCost: 1, color: "bg-gray-100", sortOrder: 1 },
      { value: "difficult", displayName: "Difficult Terrain", description: "Harder to move through", movementCost: 2, color: "bg-yellow-100", sortOrder: 2 },
      { value: "impassable", displayName: "Impassable", description: "Cannot move through", movementCost: null, color: "bg-red-100", sortOrder: 3 },
      { value: "water", displayName: "Water", description: "Water terrain", movementCost: 2, color: "bg-blue-100", sortOrder: 4 },
      { value: "forest", displayName: "Forest", description: "Dense vegetation", movementCost: 2, color: "bg-green-100", sortOrder: 5 },
      { value: "mountain", displayName: "Mountain", description: "Rocky terrain", movementCost: 2, color: "bg-gray-200", sortOrder: 6 },
      { value: "desert", displayName: "Desert", description: "Sandy terrain", movementCost: 1.5, color: "bg-yellow-200", sortOrder: 7 },
      { value: "swamp", displayName: "Swamp", description: "Wet, muddy terrain", movementCost: 2, color: "bg-green-200", sortOrder: 8 },
      { value: "urban", displayName: "Urban", description: "City terrain", movementCost: 1, color: "bg-gray-300", sortOrder: 9 },
    ];

    for (const terrain of terrainTypes) {
      const id = await ctx.db.insert("terrainTypes", {
        ...terrain,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.push({ table: "terrainTypes", id });
    }

    return {
      message: "Game constants populated successfully",
      results,
      totalInserted: results.length,
    };
  },
});

// Mutation to populate D&D classes from JSON data
export const populateDndClasses = mutation({
  args: {
    classesData: v.array(v.object({
      name: v.string(),
      hitDie: v.string(),
      primaryAbility: v.string(),
      savingThrowProficiencies: v.array(v.string()),
      armorProficiencies: v.array(v.string()),
      weaponProficiencies: v.array(v.string()),
      description: v.string(),
      sourceBook: v.string(),
      isActive: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only administrators can populate D&D classes");
    }

    const results = [];

    // Clear existing D&D classes first
    const existingClasses = await ctx.db.query("dndClasses").collect();
    for (const cls of existingClasses) {
      await ctx.db.delete(cls._id);
    }
    console.log(`Cleared ${existingClasses.length} existing D&D classes`);

    // Insert new classes
    for (const cls of args.classesData) {
      const id = await ctx.db.insert("dndClasses", {
        name: cls.name,
        hitDie: cls.hitDie,
        primaryAbility: cls.primaryAbility,
        savingThrowProficiencies: cls.savingThrowProficiencies,
        armorProficiencies: cls.armorProficiencies,
        weaponProficiencies: cls.weaponProficiencies,
        description: cls.description,
        sourceBook: cls.sourceBook,
        isActive: cls.isActive,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
      });
      results.push({ name: cls.name, id });
    }

    return {
      message: `Successfully populated ${results.length} D&D classes`,
      results,
      totalInserted: results.length,
    };
  },
});

// Function to clear all game constants (for testing/reset)
export const clearGameConstants = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only administrators can clear game constants");
    }

    const tables = [
      "gameConstants",
      "equipmentSlots",
      "dndClasses",
      "abilityScores",
      "pointBuyCosts",
      "actionCosts",
      "actionTypes",
      "damageTypes",
      "diceTypes",
      "itemTypes",
      "itemRarities",
      "armorCategories",
      "spellLevels",
      "restTypes",
      "characterTypes",
      "userRoles",
      "mapCellStates",
      "terrainTypes",
    ];

    const results = [];
    for (const table of tables) {
      const deleted = await ctx.db.deleteMany(table as any);
      results.push({ table, deleted });
    }

    return {
      message: "All game constants cleared",
      results,
    };
  },
});

// Phase 3: Update mutations for admin interface
export const updateEquipmentSlot = mutation({
  args: {
    id: v.id("equipmentSlots"),
    updates: v.object({
      label: v.optional(v.string()),
      icon: v.optional(v.string()),
      allowedItemTypes: v.optional(v.array(v.string())),
      description: v.optional(v.string()),
      sortOrder: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only administrators can update game constants");
    }

    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateActionCost = mutation({
  args: {
    id: v.id("actionCosts"),
    updates: v.object({
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      description: v.optional(v.string()),
      sortOrder: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only administrators can update game constants");
    }

    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateDndClass = mutation({
  args: {
    id: v.id("dndClasses"),
    updates: v.object({
      hitDie: v.optional(v.string()),
      primaryAbility: v.optional(v.string()),
      savingThrowProficiencies: v.optional(v.array(v.string())),
      armorProficiencies: v.optional(v.array(v.string())),
      weaponProficiencies: v.optional(v.array(v.string())),
      description: v.optional(v.string()),
      sourceBook: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only administrators can update game constants");
    }

    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateAbilityScore = mutation({
  args: {
    id: v.id("abilityScores"),
    updates: v.object({
      label: v.optional(v.string()),
      abbreviation: v.optional(v.string()),
      description: v.optional(v.string()),
      sortOrder: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only administrators can update game constants");
    }

    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updatePointBuyCost = mutation({
  args: {
    id: v.id("pointBuyCosts"),
    updates: v.object({
      cost: v.optional(v.number()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only administrators can update game constants");
    }

    await ctx.db.patch(args.id, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
