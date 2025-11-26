import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./clerkService";

// Helper function to calculate total equipment bonuses
async function calculateEquipmentBonuses(ctx: any, equipment: any) {
  const bonuses = {
    armorClass: 0,
    abilityScores: {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    },
    initiative: 0, // Direct initiative bonus from equipped items
  };

  // Get all equipped item IDs
  const equippedItemIds = [
    equipment.headgear,
    equipment.armwear,
    equipment.chestwear,
    equipment.legwear,
    equipment.footwear,
    equipment.mainHand,
    equipment.offHand,
    ...(equipment.accessories || [])
  ].filter(Boolean);

  // Fetch all equipped items
  const items = await Promise.all(
    equippedItemIds.map(itemId => ctx.db.get(itemId))
  );

  // Calculate total bonuses
  for (const item of items) {
    if (!item) continue;

    // Add armor class bonus
    if (item.armorClass) {
      bonuses.armorClass += item.armorClass;
    }

    // Add ability score bonuses
    if (item.abilityModifiers) {
      Object.keys(bonuses.abilityScores).forEach(ability => {
        const modifier = item.abilityModifiers[ability] || 0;
        bonuses.abilityScores[ability] += modifier;
      });
      
      // Add direct initiative bonus from items
      if (item.abilityModifiers.initiative) {
        bonuses.initiative += item.abilityModifiers.initiative;
      }
    }
  }

  return bonuses;
}

// Equip an item to a character
export const equipItem = mutation({
  args: {
    characterId: v.id("characters"),
    itemId: v.id("items"),
    slot: v.union(
      v.literal("headgear"),
      v.literal("armwear"),
      v.literal("chestwear"),
      v.literal("legwear"),
      v.literal("footwear"),
      v.literal("mainHand"),
      v.literal("offHand"),
      v.literal("accessories")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Get character and verify ownership
    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }
    
    if (character.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to modify this character");
    }

    // Get the item to verify it exists
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Update equipment
    const currentEquipment = character.equipment || {
      headgear: undefined,
      armwear: undefined,
      chestwear: undefined,
      legwear: undefined,
      footwear: undefined,
      mainHand: undefined,
      offHand: undefined,
      accessories: []
    };

    let newEquipment = { ...currentEquipment };

    if (args.slot === "accessories") {
      const accessories = newEquipment.accessories || [];
      if (!accessories.includes(args.itemId)) {
        newEquipment.accessories = [...accessories, args.itemId];
      }
    } else {
      newEquipment[args.slot] = args.itemId;
    }

    // Calculate new equipment bonuses
    const equipmentBonuses = await calculateEquipmentBonuses(ctx, newEquipment);

    // Update character
    await ctx.db.patch(args.characterId, {
      equipment: newEquipment,
      equipmentBonuses,
      updatedAt: Date.now(),
    });

    return { success: true, equipmentBonuses };
  },
});

// Unequip an item from a character
export const unequipItem = mutation({
  args: {
    characterId: v.id("characters"),
    slot: v.union(
      v.literal("headgear"),
      v.literal("armwear"),
      v.literal("chestwear"),
      v.literal("legwear"),
      v.literal("footwear"),
      v.literal("mainHand"),
      v.literal("offHand"),
      v.literal("accessories")
    ),
    itemId: v.optional(v.id("items")), // For accessories, specify which item to remove
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Get character and verify ownership
    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }
    
    if (character.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to modify this character");
    }

    // Update equipment
    const currentEquipment = character.equipment || {
      headgear: undefined,
      armwear: undefined,
      chestwear: undefined,
      legwear: undefined,
      footwear: undefined,
      mainHand: undefined,
      offHand: undefined,
      accessories: []
    };

    let newEquipment = { ...currentEquipment };

    if (args.slot === "accessories" && args.itemId) {
      const accessories = newEquipment.accessories || [];
      newEquipment.accessories = accessories.filter(id => id !== args.itemId);
    } else {
      newEquipment[args.slot] = undefined;
    }

    // Calculate new equipment bonuses
    const equipmentBonuses = await calculateEquipmentBonuses(ctx, newEquipment);

    // Update character
    await ctx.db.patch(args.characterId, {
      equipment: newEquipment,
      equipmentBonuses,
      updatedAt: Date.now(),
    });

    return { success: true, equipmentBonuses };
  },
});

// Recalculate equipment bonuses for a character (useful for maintenance)
export const recalculateEquipmentBonuses = mutation({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Get character and verify ownership
    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }
    
    if (character.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to modify this character");
    }

    // Calculate equipment bonuses
    const equipmentBonuses = await calculateEquipmentBonuses(ctx, character.equipment);

    // Update character
    await ctx.db.patch(args.characterId, {
      equipmentBonuses,
      updatedAt: Date.now(),
    });

    return { success: true, equipmentBonuses };
  },
});

// Get character's total stats (base + equipment bonuses)
export const getCharacterTotalStats = query({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    const baseStats = {
      armorClass: character.armorClass,
      abilityScores: character.abilityScores,
    };

    const equipmentBonuses = character.equipmentBonuses || {
      armorClass: 0,
      abilityScores: {
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0,
      },
      initiative: 0,
    };

    const totalStats = {
      armorClass: baseStats.armorClass + equipmentBonuses.armorClass,
      abilityScores: {
        strength: baseStats.abilityScores.strength + equipmentBonuses.abilityScores.strength,
        dexterity: baseStats.abilityScores.dexterity + equipmentBonuses.abilityScores.dexterity,
        constitution: baseStats.abilityScores.constitution + equipmentBonuses.abilityScores.constitution,
        intelligence: baseStats.abilityScores.intelligence + equipmentBonuses.abilityScores.intelligence,
        wisdom: baseStats.abilityScores.wisdom + equipmentBonuses.abilityScores.wisdom,
        charisma: baseStats.abilityScores.charisma + equipmentBonuses.abilityScores.charisma,
      },
    };

    // Calculate total ability modifiers
    const totalAbilityModifiers = {
      strength: Math.floor((totalStats.abilityScores.strength - 10) / 2),
      dexterity: Math.floor((totalStats.abilityScores.dexterity - 10) / 2),
      constitution: Math.floor((totalStats.abilityScores.constitution - 10) / 2),
      intelligence: Math.floor((totalStats.abilityScores.intelligence - 10) / 2),
      wisdom: Math.floor((totalStats.abilityScores.wisdom - 10) / 2),
      charisma: Math.floor((totalStats.abilityScores.charisma - 10) / 2),
    };

    // Calculate total initiative modifier (Dex modifier + equipment initiative bonus)
    const totalInitiativeModifier = totalAbilityModifiers.dexterity + (equipmentBonuses.initiative || 0);

    return {
      baseStats,
      equipmentBonuses,
      totalStats,
      totalAbilityModifiers,
      totalInitiativeModifier,
    };
  },
});

// Get all equipped items for a character
export const getEquippedItems = query({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.characterId);
    if (!character || !character.equipment) {
      return {};
    }

    const equipment = character.equipment;
    const equippedItems: any = {};

    // Fetch each equipped item
    if (equipment.headgear) {
      equippedItems.headgear = await ctx.db.get(equipment.headgear);
    }
    if (equipment.armwear) {
      equippedItems.armwear = await ctx.db.get(equipment.armwear);
    }
    if (equipment.chestwear) {
      equippedItems.chestwear = await ctx.db.get(equipment.chestwear);
    }
    if (equipment.legwear) {
      equippedItems.legwear = await ctx.db.get(equipment.legwear);
    }
    if (equipment.footwear) {
      equippedItems.footwear = await ctx.db.get(equipment.footwear);
    }
    if (equipment.mainHand) {
      equippedItems.mainHand = await ctx.db.get(equipment.mainHand);
    }
    if (equipment.offHand) {
      equippedItems.offHand = await ctx.db.get(equipment.offHand);
    }
    if (equipment.accessories && equipment.accessories.length > 0) {
      equippedItems.accessories = await Promise.all(
        equipment.accessories.map(itemId => ctx.db.get(itemId))
      );
    }

    return equippedItems;
  },
});

// Monster equipment functions

// Equip an item to a monster
export const equipItemToMonster = mutation({
  args: {
    monsterId: v.id("monsters"),
    itemId: v.id("items"),
    slot: v.union(
      v.literal("headgear"),
      v.literal("armwear"),
      v.literal("chestwear"),
      v.literal("legwear"),
      v.literal("footwear"),
      v.literal("mainHand"),
      v.literal("offHand"),
      v.literal("accessories")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Get monster and verify ownership
    const monster = await ctx.db.get(args.monsterId);
    if (!monster) {
      throw new Error("Monster not found");
    }
    
    if (monster.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to modify this monster");
    }

    // Get the item to verify it exists
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Update equipment
    const currentEquipment = monster.equipment || {
      headgear: undefined,
      armwear: undefined,
      chestwear: undefined,
      legwear: undefined,
      footwear: undefined,
      mainHand: undefined,
      offHand: undefined,
      accessories: []
    };

    let newEquipment = { ...currentEquipment };

    if (args.slot === "accessories") {
      const accessories = newEquipment.accessories || [];
      if (!accessories.includes(args.itemId)) {
        newEquipment.accessories = [...accessories, args.itemId];
      }
    } else {
      newEquipment[args.slot] = args.itemId;
    }

    // Calculate new equipment bonuses
    const equipmentBonuses = await calculateEquipmentBonuses(ctx, newEquipment);

    // Update monster
    await ctx.db.patch(args.monsterId, {
      equipment: newEquipment,
      equipmentBonuses,
      updatedAt: Date.now(),
    });

    return { success: true, equipmentBonuses };
  },
});

// Unequip an item from a monster
export const unequipItemFromMonster = mutation({
  args: {
    monsterId: v.id("monsters"),
    slot: v.union(
      v.literal("headgear"),
      v.literal("armwear"),
      v.literal("chestwear"),
      v.literal("legwear"),
      v.literal("footwear"),
      v.literal("mainHand"),
      v.literal("offHand"),
      v.literal("accessories")
    ),
    itemId: v.optional(v.id("items")), // For accessories, specify which item to remove
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Get monster and verify ownership
    const monster = await ctx.db.get(args.monsterId);
    if (!monster) {
      throw new Error("Monster not found");
    }
    
    if (monster.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to modify this monster");
    }

    // Update equipment
    const currentEquipment = monster.equipment || {
      headgear: undefined,
      armwear: undefined,
      chestwear: undefined,
      legwear: undefined,
      footwear: undefined,
      mainHand: undefined,
      offHand: undefined,
      accessories: []
    };

    let newEquipment = { ...currentEquipment };

    if (args.slot === "accessories" && args.itemId) {
      const accessories = newEquipment.accessories || [];
      newEquipment.accessories = accessories.filter(id => id !== args.itemId);
    } else {
      newEquipment[args.slot] = undefined;
    }

    // Calculate new equipment bonuses
    const equipmentBonuses = await calculateEquipmentBonuses(ctx, newEquipment);

    // Update monster
    await ctx.db.patch(args.monsterId, {
      equipment: newEquipment,
      equipmentBonuses,
      updatedAt: Date.now(),
    });

    return { success: true, equipmentBonuses };
  },
});

// Recalculate equipment bonuses for a monster (useful for maintenance)
export const recalculateMonsterEquipmentBonuses = mutation({
  args: {
    monsterId: v.id("monsters"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Get monster and verify ownership
    const monster = await ctx.db.get(args.monsterId);
    if (!monster) {
      throw new Error("Monster not found");
    }
    
    if (monster.userId !== user._id && user.role !== "admin") {
      throw new Error("You don't have permission to modify this monster");
    }

    // Calculate equipment bonuses
    const equipmentBonuses = await calculateEquipmentBonuses(ctx, monster.equipment);

    // Update monster
    await ctx.db.patch(args.monsterId, {
      equipmentBonuses,
      updatedAt: Date.now(),
    });

    return { success: true, equipmentBonuses };
  },
});

// Get monster's total stats (base + equipment bonuses)
export const getMonsterTotalStats = query({
  args: {
    monsterId: v.id("monsters"),
  },
  handler: async (ctx, args) => {
    const monster = await ctx.db.get(args.monsterId);
    if (!monster) {
      throw new Error("Monster not found");
    }

    const baseStats = {
      armorClass: monster.armorClass,
      abilityScores: monster.abilityScores,
    };

    const equipmentBonuses = monster.equipmentBonuses || {
      armorClass: 0,
      abilityScores: {
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0,
      },
      initiative: 0,
    };

    const totalStats = {
      armorClass: baseStats.armorClass + equipmentBonuses.armorClass,
      abilityScores: {
        strength: baseStats.abilityScores.strength + equipmentBonuses.abilityScores.strength,
        dexterity: baseStats.abilityScores.dexterity + equipmentBonuses.abilityScores.dexterity,
        constitution: baseStats.abilityScores.constitution + equipmentBonuses.abilityScores.constitution,
        intelligence: baseStats.abilityScores.intelligence + equipmentBonuses.abilityScores.intelligence,
        wisdom: baseStats.abilityScores.wisdom + equipmentBonuses.abilityScores.wisdom,
        charisma: baseStats.abilityScores.charisma + equipmentBonuses.abilityScores.charisma,
      },
    };

    // Calculate total ability modifiers
    const totalAbilityModifiers = {
      strength: Math.floor((totalStats.abilityScores.strength - 10) / 2),
      dexterity: Math.floor((totalStats.abilityScores.dexterity - 10) / 2),
      constitution: Math.floor((totalStats.abilityScores.constitution - 10) / 2),
      intelligence: Math.floor((totalStats.abilityScores.intelligence - 10) / 2),
      wisdom: Math.floor((totalStats.abilityScores.wisdom - 10) / 2),
      charisma: Math.floor((totalStats.abilityScores.charisma - 10) / 2),
    };

    // Calculate total initiative modifier (Dex modifier + equipment initiative bonus)
    const totalInitiativeModifier = totalAbilityModifiers.dexterity + (equipmentBonuses.initiative || 0);

    return {
      baseStats,
      equipmentBonuses,
      totalStats,
      totalAbilityModifiers,
      totalInitiativeModifier,
    };
  },
});

// Get all equipped items for a monster
export const getMonsterEquippedItems = query({
  args: {
    monsterId: v.id("monsters"),
  },
  handler: async (ctx, args) => {
    const monster = await ctx.db.get(args.monsterId);
    if (!monster || !monster.equipment) {
      return {};
    }

    const equipment = monster.equipment;
    const equippedItems: any = {};

    // Fetch each equipped item
    if (equipment.headgear) {
      equippedItems.headgear = await ctx.db.get(equipment.headgear);
    }
    if (equipment.armwear) {
      equippedItems.armwear = await ctx.db.get(equipment.armwear);
    }
    if (equipment.chestwear) {
      equippedItems.chestwear = await ctx.db.get(equipment.chestwear);
    }
    if (equipment.legwear) {
      equippedItems.legwear = await ctx.db.get(equipment.legwear);
    }
    if (equipment.footwear) {
      equippedItems.footwear = await ctx.db.get(equipment.footwear);
    }
    if (equipment.mainHand) {
      equippedItems.mainHand = await ctx.db.get(equipment.mainHand);
    }
    if (equipment.offHand) {
      equippedItems.offHand = await ctx.db.get(equipment.offHand);
    }
    if (equipment.accessories && equipment.accessories.length > 0) {
      equippedItems.accessories = await Promise.all(
        equipment.accessories.map(itemId => ctx.db.get(itemId))
      );
    }

    return equippedItems;
  },
});