import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const loadSampleMaps = mutation({
  args: {
    maps: v.array(v.object({
      name: v.string(),
      width: v.number(),
      height: v.number(),
      description: v.optional(v.string()),
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

    const mapIds = [];
    for (const map of args.maps) {
      // Generate cells for the map
      const cells = [];
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          cells.push({
            x,
            y,
            state: "inbounds" as const,
            terrainType: "normal" as const,
          });
        }
      }

      const mapData = {
        name: map.name,
        width: map.width,
        height: map.height,
        cells: cells,
        createdBy: user._id,
        clerkId: args.clerkId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const id = await ctx.db.insert("maps", mapData);
      mapIds.push(id);
    }

    return { loaded: mapIds.length };
  },
});

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
    characters: v.array(v.object({
      name: v.string(),
      race: v.string(),
      class: v.string(),
      level: v.float64(),
      hitPoints: v.float64(),
      armorClass: v.float64(),
      characterType: v.string(),
      abilityScores: v.object({
        strength: v.float64(),
        dexterity: v.float64(),
        constitution: v.float64(),
        intelligence: v.float64(),
        wisdom: v.float64(),
        charisma: v.float64(),
      }),
      abilityModifiers: v.object({
        strength: v.number(),
        dexterity: v.number(),
        constitution: v.number(),
        intelligence: v.number(),
        wisdom: v.number(),
        charisma: v.number(),
      }),
      skills: v.array(v.string()),
      savingThrows: v.array(v.string()),
      proficiencies: v.array(v.string()),
      background: v.string(),
      alignment: v.string(),
      actions: v.array(v.string()), // Changed back to strings for now - will resolve to IDs
      experiencePoints: v.optional(v.number()),
      proficiencyBonus: v.optional(v.number()),
      inventory: v.optional(v.object({
        capacity: v.number(),
        items: v.array(v.object({
          itemId: v.union(v.id("items"), v.string()),
          quantity: v.number(),
        })),
      })),
      equipment: v.optional(v.object({
        headgear: v.optional(v.union(v.id("items"), v.string())),
        armwear: v.optional(v.union(v.id("items"), v.string())),
        chestwear: v.optional(v.union(v.id("items"), v.string())),
        legwear: v.optional(v.union(v.id("items"), v.string())),
        footwear: v.optional(v.union(v.id("items"), v.string())),
        mainHand: v.optional(v.union(v.id("items"), v.string())),
        offHand: v.optional(v.union(v.id("items"), v.string())),
        accessories: v.array(v.union(v.id("items"), v.string())),
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
    
    // Insert characters
    for (const character of args.characters) {
      // Resolve action names to action IDs
      const actionIds = [];
      for (const actionName of character.actions) {
        const action = await ctx.db
          .query("actions")
          .filter((q: any) => q.eq(q.field("name"), actionName))
          .first();
        
        if (action) {
          actionIds.push(action._id);
        } else {
          console.warn(`Action not found: ${actionName}`);
        }
      }

      // Resolve item names to item IDs for inventory
      const resolvedInventoryItems = [];
      if (character.inventory?.items) {
        for (const inventoryItem of character.inventory.items) {
          if (typeof inventoryItem.itemId === 'string') {
            // Resolve item name to item ID
            const item = await ctx.db
              .query("items")
              .filter((q: any) => q.eq(q.field("name"), inventoryItem.itemId))
              .first();
            
            if (item) {
              resolvedInventoryItems.push({
                itemId: item._id,
                quantity: inventoryItem.quantity
              });
            } else {
              console.warn(`Item not found: ${inventoryItem.itemId}`);
            }
          } else {
            // Already an ID
            resolvedInventoryItems.push(inventoryItem);
          }
        }
      }

      // Resolve item names to item IDs for equipment
      const resolvedEquipment = {
        headgear: undefined,
        armwear: undefined,
        chestwear: undefined,
        legwear: undefined,
        footwear: undefined,
        mainHand: undefined,
        offHand: undefined,
        accessories: []
      };

      if (character.equipment) {
        // Helper function to resolve equipment slot
        const resolveEquipmentSlot = async (itemNameOrId: string | undefined) => {
          if (!itemNameOrId) return undefined;
          
          if (typeof itemNameOrId === 'string') {
            const item = await ctx.db
              .query("items")
              .filter((q: any) => q.eq(q.field("name"), itemNameOrId))
              .first();
            
            if (item) {
              return item._id;
            } else {
              console.warn(`Equipment item not found: ${itemNameOrId}`);
              return undefined;
            }
          } else {
            return itemNameOrId;
          }
        };

        // Resolve each equipment slot
        resolvedEquipment.headgear = await resolveEquipmentSlot(character.equipment.headgear);
        resolvedEquipment.armwear = await resolveEquipmentSlot(character.equipment.armwear);
        resolvedEquipment.chestwear = await resolveEquipmentSlot(character.equipment.chestwear);
        resolvedEquipment.legwear = await resolveEquipmentSlot(character.equipment.legwear);
        resolvedEquipment.footwear = await resolveEquipmentSlot(character.equipment.footwear);
        resolvedEquipment.mainHand = await resolveEquipmentSlot(character.equipment.mainHand);
        resolvedEquipment.offHand = await resolveEquipmentSlot(character.equipment.offHand);

        // Resolve accessories array
        for (const accessory of character.equipment.accessories || []) {
          if (typeof accessory === 'string') {
            const item = await ctx.db
              .query("items")
              .filter((q: any) => q.eq(q.field("name"), accessory))
              .first();
            
            if (item) {
              resolvedEquipment.accessories.push(item._id);
            } else {
              console.warn(`Accessory item not found: ${accessory}`);
            }
          } else {
            resolvedEquipment.accessories.push(accessory);
          }
        }
      }

      const characterData = {
        name: character.name,
        race: character.race,
        class: character.class,
        level: character.level,
        hitPoints: character.hitPoints,
        armorClass: character.armorClass,
        characterType: character.characterType === "player" ? "player" as const : "npc" as const,
        abilityScores: {
          strength: character.abilityScores.strength,
          dexterity: character.abilityScores.dexterity,
          constitution: character.abilityScores.constitution,
          intelligence: character.abilityScores.intelligence,
          wisdom: character.abilityScores.wisdom,
          charisma: character.abilityScores.charisma,
        },
        abilityModifiers: character.abilityModifiers,
        skills: character.skills,
        savingThrows: character.savingThrows,
        proficiencies: character.proficiencies,
        background: character.background,
        alignment: character.alignment,
        experiencePoints: character.experiencePoints || 0,
        proficiencyBonus: character.proficiencyBonus || 2,
        speed: "30 ft.",
        actions: actionIds, // Use resolved action IDs
        inventory: {
          capacity: character.inventory?.capacity || 150,
          items: resolvedInventoryItems
        },
        equipment: resolvedEquipment,
        equipmentBonuses: character.equipmentBonuses || {
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
      };
      
      const id = await ctx.db.insert("characters", characterData);
      characterIds.push(id);
    }

    return { loaded: characterIds.length };
  },
});

export const loadSampleMonsters = mutation({
  args: {
    monsters: v.array(v.object({
      name: v.string(),
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
      abilityModifiers: v.object({
        strength: v.number(),
        dexterity: v.number(),
        constitution: v.number(),
        intelligence: v.number(),
        wisdom: v.number(),
        charisma: v.number(),
      }),
      challengeRating: v.string(),
      challengeRatingValue: v.number(),
      proficiencyBonus: v.number(),
      senses: v.object({
        passivePerception: v.number(),
        darkvision: v.optional(v.string()),
        blindsight: v.optional(v.string()),
        tremorsense: v.optional(v.string()),
        truesight: v.optional(v.string()),
      }),
      languages: v.string(),
      experiencePoints: v.number(),
      inventory: v.optional(v.object({
        capacity: v.number(),
        items: v.array(v.object({
          itemId: v.string(),
          quantity: v.number(),
        })),
      })),
      equipment: v.optional(v.object({
        headgear: v.optional(v.union(v.id("items"), v.string())),
        armwear: v.optional(v.union(v.id("items"), v.string())),
        chestwear: v.optional(v.union(v.id("items"), v.string())),
        legwear: v.optional(v.union(v.id("items"), v.string())),
        footwear: v.optional(v.union(v.id("items"), v.string())),
        mainHand: v.optional(v.union(v.id("items"), v.string())),
        offHand: v.optional(v.union(v.id("items"), v.string())),
        accessories: v.array(v.union(v.id("items"), v.string())),
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
      actions: v.optional(v.array(v.object({
        name: v.string(),
        description: v.string(),
      }))),
      traits: v.optional(v.array(v.object({
        name: v.string(),
        description: v.string(),
      }))),
      reactions: v.optional(v.array(v.object({
        name: v.string(),
        description: v.string(),
      }))),
      legendaryActions: v.optional(v.array(v.object({
        name: v.string(),
        description: v.string(),
      }))),
      lairActions: v.optional(v.array(v.object({
        name: v.string(),
        description: v.string(),
      }))),
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
      // Resolve item names to item IDs for monster inventory
      const resolvedMonsterInventoryItems = [];
      if (monster.inventory?.items) {
        for (const inventoryItem of monster.inventory.items) {
          if (typeof inventoryItem.itemId === 'string') {
            // Resolve item name to item ID
            const item = await ctx.db
              .query("items")
              .filter((q: any) => q.eq(q.field("name"), inventoryItem.itemId))
              .first();
            
            if (item) {
              resolvedMonsterInventoryItems.push({
                itemId: item._id,
                quantity: inventoryItem.quantity
              });
            } else {
              console.warn(`Monster item not found: ${inventoryItem.itemId}`);
            }
          } else {
            // Already an ID
            resolvedMonsterInventoryItems.push(inventoryItem);
          }
        }
      }

      // Resolve item names to item IDs for monster equipment
      const resolvedMonsterEquipment = {
        headgear: undefined,
        armwear: undefined,
        chestwear: undefined,
        legwear: undefined,
        footwear: undefined,
        mainHand: undefined,
        offHand: undefined,
        accessories: []
      };

      if (monster.equipment) {
        // Helper function to resolve equipment slot
        const resolveMonsterEquipmentSlot = async (itemNameOrId: string | undefined) => {
          if (!itemNameOrId) return undefined;
          
          if (typeof itemNameOrId === 'string') {
            const item = await ctx.db
              .query("items")
              .filter((q: any) => q.eq(q.field("name"), itemNameOrId))
              .first();
            
            if (item) {
              return item._id;
            } else {
              console.warn(`Monster equipment item not found: ${itemNameOrId}`);
              return undefined;
            }
          } else {
            return itemNameOrId;
          }
        };

        // Resolve each equipment slot
        resolvedMonsterEquipment.headgear = await resolveMonsterEquipmentSlot(monster.equipment.headgear);
        resolvedMonsterEquipment.armwear = await resolveMonsterEquipmentSlot(monster.equipment.armwear);
        resolvedMonsterEquipment.chestwear = await resolveMonsterEquipmentSlot(monster.equipment.chestwear);
        resolvedMonsterEquipment.legwear = await resolveMonsterEquipmentSlot(monster.equipment.legwear);
        resolvedMonsterEquipment.footwear = await resolveMonsterEquipmentSlot(monster.equipment.footwear);
        resolvedMonsterEquipment.mainHand = await resolveMonsterEquipmentSlot(monster.equipment.mainHand);
        resolvedMonsterEquipment.offHand = await resolveMonsterEquipmentSlot(monster.equipment.offHand);

        // Resolve accessories array
        for (const accessory of monster.equipment.accessories || []) {
          if (typeof accessory === 'string') {
            const item = await ctx.db
              .query("items")
              .filter((q: any) => q.eq(q.field("name"), accessory))
              .first();
            
            if (item) {
              resolvedMonsterEquipment.accessories.push(item._id);
            } else {
              console.warn(`Monster accessory item not found: ${accessory}`);
            }
          } else {
            resolvedMonsterEquipment.accessories.push(accessory);
          }
        }
      }

      const monsterData = {
        name: monster.name,
        type: monster.type,
        alignment: monster.alignment,
        armorClass: monster.armorClass,
        hitPoints: monster.hitPoints,
        hitDice: monster.hitDice,
        speed: monster.speed,
        abilityScores: monster.abilityScores,
        abilityModifiers: monster.abilityModifiers,
        challengeRating: monster.challengeRating,
        challengeRatingValue: monster.challengeRatingValue,
        proficiencyBonus: monster.proficiencyBonus,
        senses: monster.senses,
        languages: monster.languages,
        experiencePoints: monster.experiencePoints,
        size: monster.size,
        inventory: {
          capacity: monster.inventory?.capacity || 50,
          items: resolvedMonsterInventoryItems
        },
        equipment: resolvedMonsterEquipment,
        equipmentBonuses: monster.equipmentBonuses || {
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
        actions: monster.actions || [],
        traits: monster.traits || [],
        reactions: monster.reactions || [],
        legendaryActions: monster.legendaryActions || [],
        lairActions: monster.lairActions || [],
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
      weight: v.optional(v.number()),
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
      scope: v.string(),
      typeOfArmor: v.optional(v.string()),
      durability: v.optional(v.object({
        current: v.number(),
        max: v.number(),
        baseDurability: v.number(),
      })),
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
        scope: item.scope,
        typeOfArmor: item.typeOfArmor,
        durability: item.durability,
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
      taskIds: v.array(v.string()),
      createdAt: v.number(),
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
        taskIds: quest.taskIds,
        rewards: {
          xp: quest.rewards.xp,
          gold: quest.rewards.gold,
          itemIds: quest.rewards.itemIds,
        },
        createdAt: quest.createdAt,
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
      maxUses: v.optional(v.union(v.number(), v.string())),
      category: v.optional(v.string()),
      // Additional fields from additionalActions..js
      tags: v.optional(v.array(v.string())),
      requiredLevel: v.optional(v.number()),
      spellLevel: v.optional(v.number()),
      isBaseAction: v.optional(v.boolean()),
      targetClass: v.optional(v.string()),
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
        category: action.category === "general" ? "general" as const :
                 action.category === "class_specific" ? "class_specific" as const :
                 action.category === "race_specific" ? "race_specific" as const :
                 action.category === "feat_specific" ? "feat_specific" as const : "general" as const,
        // Additional fields from additionalActions..js
        tags: action.tags,
        requiredLevel: action.requiredLevel,
        spellLevel: action.spellLevel,
        isBaseAction: action.isBaseAction,
        targetClass: action.targetClass,
        createdAt: Date.now(),
      };
      
      const id = await ctx.db.insert("actions", actionData);
      actionIds.push(id);
    }

    return { loaded: actionIds.length };
  },
});

// Specific delete functions for each entity type
export const deleteAllSampleCampaigns = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }

    const campaigns = await ctx.db
      .query("campaigns")
      .filter((q) => q.eq(q.field("creatorId"), user._id))
      .collect();

    for (const campaign of campaigns) {
      await ctx.db.delete(campaign._id);
    }

    return { deleted: campaigns.length };
  },
});

export const deleteAllSampleCharacters = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }

    const characters = await ctx.db
      .query("characters")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    for (const character of characters) {
      await ctx.db.delete(character._id);
    }

    return { deleted: characters.length };
  },
});

export const deleteAllSampleMonsters = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }

    const monsters = await ctx.db
      .query("monsters")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    for (const monster of monsters) {
      await ctx.db.delete(monster._id);
    }

    return { deleted: monsters.length };
  },
});

export const deleteAllSampleItems = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }

    const items = await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    return { deleted: items.length };
  },
});

export const deleteAllSampleQuests = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }

    const quests = await ctx.db
      .query("quests")
      .filter((q) => q.eq(q.field("creatorId"), user._id))
      .collect();

    for (const quest of quests) {
      await ctx.db.delete(quest._id);
    }

    return { deleted: quests.length };
  },
});

export const deleteAllSampleActions = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found in database");
    }

    // Actions are global, but we should only delete sample actions
    // For now, we'll delete all actions since they're typically sample data
    const actions = await ctx.db
      .query("actions")
      .collect();

    for (const action of actions) {
      await ctx.db.delete(action._id);
    }

    return { deleted: actions.length };
  },
});

// Keep the old function for backward compatibility, but mark it as deprecated
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
      .query("characters")
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