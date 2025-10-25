import campaignsData from '@/data/sample/campaigns.json'
import charactersData from '@/data/sample/characters.json'
import monstersData from '@/data/sample/monsters.json'
import itemsData from '@/data/sample/items.json'
import questsData from '@/data/sample/quests.json'
import actionsData from '@/data/sample/actions.json'
import mapsData from '@/data/sample/maps.json'
// Import additional actions and items
// @ts-ignore
import { actions as additionalActions } from '../../additionalActions..js'
// @ts-ignore
import { items as additionalItems } from '../../additionalItems.js'

export interface SampleDataInfo {
  version: string
  description: string
  count: number
  lastLoaded?: number
}

export class SampleDataService {
  static async loadSampleCampaigns(mutateFn: any, clerkId: string) {
    const campaigns = campaignsData.campaigns.map(campaign => ({
      name: campaign.name,
      description: campaign.description,
      worldSetting: campaign.worldSetting,
      isPublic: campaign.isPublic,
      dmId: clerkId,
      createdAt: Date.now(),
    }))
    
    return await mutateFn({ campaigns, clerkId })
  }

  static async loadSampleCharacters(mutateFn: any, clerkId: string) {
    // Helper function to assign actions based on character class
    // This will return action names that need to be resolved to IDs later
    const assignActions = (characterClass: string) => {
      // Get all available general actions (base actions + general category actions from additionalActions)
      const generalActions = additionalActions
        .filter((action: any) => action.isBaseAction === true || action.category === "general")
        .map((action: any) => action.name);
      
      // Get class-specific actions for this character class
      const classActions = additionalActions
        .filter((action: any) => action.targetClass === characterClass)
        .map((action: any) => action.name);
      
      // For classes without specific actions (like Commoner), use general utility actions
      const fallbackActions = ["Use an Object", "Search", "Ready", "Cast a Spell"];
      
      // Select exactly 5 general actions (prioritize core combat actions)
      const coreGeneralActions = [
        "Attack", "Dodge", "Dash", "Disengage", "Help"
      ];
      
      // Use core actions if available, otherwise take first 5 from general actions
      const selectedGeneralActions = coreGeneralActions.filter((action: string) => 
        generalActions.includes(action)
      ).concat(
        generalActions.filter((action: string) => !coreGeneralActions.includes(action))
      ).slice(0, 5);
      
      // Ensure we have exactly 5 general actions
      if (selectedGeneralActions.length < 5) {
        const remainingActions = generalActions.filter((action: string) => 
          !selectedGeneralActions.includes(action)
        );
        selectedGeneralActions.push(...remainingActions.slice(0, 5 - selectedGeneralActions.length));
      }
      
      // Select exactly 2 class-specific actions
      // For classes with specific actions, use them; otherwise use fallback actions
      let selectedClassActions: string[];
      if (classActions.length >= 2) {
        selectedClassActions = classActions.slice(0, 2);
      } else if (classActions.length === 1) {
        selectedClassActions = [...classActions, ...fallbackActions.slice(0, 1)];
      } else {
        // For classes like Commoner that have no specific actions
        selectedClassActions = fallbackActions.slice(0, 2);
      }
      
      // Ensure we have exactly 7 actions total (5 general + 2 class-specific)
      const allActions = [...selectedGeneralActions, ...selectedClassActions];
      
      console.log(`Assigned actions for ${characterClass}:`, {
        general: selectedGeneralActions,
        classSpecific: selectedClassActions,
        total: allActions.length
      });
      
      return allActions;
    };

    // Helper function to assign equipment based on character class and level
    const assignEquipment = (characterClass: string, level: number) => {
      // Combine base items and additional items for equipment assignment
      const allItems = [...itemsData.items, ...additionalItems];
      
      // Required inventory items: 1 equipment (non-weapon), 1 melee weapon, 1 ranged weapon, 1 potion, 1 magical item
      
      // Find equipment items (non-weapon)
      const equipmentItems = allItems.filter(item => 
        item.type === "Armor" || 
        item.type === "Adventuring Gear" || 
        item.type === "Wondrous Item" ||
        item.type === "Ring" ||
        item.type === "Tool"
      );
      
      // Find melee weapons
      const meleeWeapons = allItems.filter(item => 
        item.type === "Weapon" && 
        !item.name.toLowerCase().includes("bow") && 
        !item.name.toLowerCase().includes("crossbow") &&
        !item.name.toLowerCase().includes("sling")
      );
      
      // Find ranged weapons
      const rangedWeapons = allItems.filter(item => 
        item.type === "Weapon" && 
        (item.name.toLowerCase().includes("bow") || 
         item.name.toLowerCase().includes("crossbow") ||
         item.name.toLowerCase().includes("sling"))
      );
      
      // Find potions
      const potions = allItems.filter(item => item.type === "Potion");
      
      // Find magical items (excluding potions and basic equipment)
      const magicalItems = allItems.filter(item => 
        item.rarity === "Uncommon" || 
        item.rarity === "Rare" || 
        item.rarity === "Very Rare" ||
        item.rarity === "Legendary" ||
        item.rarity === "Artifact" ||
        item.rarity === "Unique"
      );
      
      // Class-specific equipment selection
      let selectedEquipment = equipmentItems.find(item => item.type === "Armor") || equipmentItems[0]; // Prefer armor as equipment
      let selectedMeleeWeapon = meleeWeapons[0]; // Default melee weapon
      let selectedRangedWeapon = rangedWeapons[0]; // Default ranged weapon
      let selectedMagicalItem = magicalItems[0]; // Default magical item
      
      // Class-specific preferences
      if (characterClass === "Wizard" || characterClass === "Sorcerer") {
        // Spellcasters prefer staves and wands
        selectedMeleeWeapon = meleeWeapons.find(item => item.type === "Staff") || selectedMeleeWeapon;
        selectedMagicalItem = magicalItems.find(item => item.type === "Wand" || item.type === "Staff") || selectedMagicalItem;
        selectedEquipment = equipmentItems.find(item => item.type === "Armor" && item.name !== "Plate Armor") || selectedEquipment;
      } else if (characterClass === "Rogue") {
        // Rogues prefer finesse weapons
        selectedMeleeWeapon = meleeWeapons.find(item => 
          item.name.includes("Dagger") || 
          item.name.includes("Rapier") || 
          item.name.includes("Shortsword")
        ) || selectedMeleeWeapon;
        selectedMagicalItem = magicalItems.find(item => 
          item.name.includes("Cloak") || 
          item.type === "Ring"
        ) || selectedMagicalItem;
        selectedEquipment = equipmentItems.find(item => 
          item.type === "Armor" && item.name !== "Plate Armor"
        ) || selectedEquipment;
      } else if (characterClass === "Cleric") {
        // Clerics prefer maces and hammers
        selectedMeleeWeapon = meleeWeapons.find(item => 
          item.name.includes("Mace") || 
          item.name.includes("Hammer") || 
          item.name.includes("Warhammer")
        ) || selectedMeleeWeapon;
        selectedMagicalItem = magicalItems.find(item => 
          item.type === "Ring" || 
          item.name.includes("Holy")
        ) || selectedMagicalItem;
      } else if (characterClass === "Fighter" || characterClass === "Paladin") {
        // Fighters and Paladins prefer heavy armor and swords
        selectedEquipment = equipmentItems.find(item => item.type === "Armor") || selectedEquipment;
        selectedMeleeWeapon = meleeWeapons.find(item => 
          item.type === "Weapon" && !item.name.includes("Staff")
        ) || selectedMeleeWeapon;
        selectedMagicalItem = magicalItems.find(item => 
          item.type === "Ring" || 
          item.name.includes("Sword")
        ) || selectedMagicalItem;
      } else if (characterClass === "Barbarian") {
        // Barbarians prefer two-handed weapons
        selectedMeleeWeapon = meleeWeapons.find(item => 
          item.type === "Weapon" && !item.name.includes("Staff")
        ) || selectedMeleeWeapon;
        selectedMagicalItem = magicalItems.find(item => 
          item.type === "Ring" || 
          item.name.includes("Belt")
        ) || selectedMagicalItem;
      } else if (characterClass === "Monk") {
        // Monks prefer simple weapons and don't wear heavy armor
        selectedMeleeWeapon = meleeWeapons.find(item => 
          item.type === "Weapon" && (
            item.name.includes("Staff") || 
            item.name.includes("Dagger")
          )
        ) || selectedMeleeWeapon;
        selectedMagicalItem = magicalItems.find(item => 
          item.type === "Ring" || 
          item.name.includes("Belt")
        ) || selectedMagicalItem;
        selectedEquipment = equipmentItems.find(item => 
          item.type === "Adventuring Gear" || 
          item.type === "Tool"
        ) || selectedEquipment;
      }
      
      // Level-based equipment upgrades
      if (level >= 5) {
        selectedMagicalItem = magicalItems.find(item => item.rarity === "Rare") || selectedMagicalItem;
      } else if (level >= 3) {
        selectedMagicalItem = magicalItems.find(item => 
          item.rarity === "Uncommon" || item.rarity === "Rare"
        ) || selectedMagicalItem;
      }
      
      // Ensure we have exactly 1 potion
      const selectedPotion = potions[0] || { name: "Potion of Healing" };
      
      // Create inventory with exactly the required items
      const inventoryItems = [
        { itemId: selectedEquipment.name, quantity: 1 },
        { itemId: selectedMeleeWeapon.name, quantity: 1 },
        { itemId: selectedRangedWeapon.name, quantity: 1 },
        { itemId: selectedPotion.name, quantity: 1 },
        { itemId: selectedMagicalItem.name, quantity: 1 }
      ];
      
      console.log(`Assigned equipment for ${characterClass} (Level ${level}):`, {
        equipment: selectedEquipment.name,
        meleeWeapon: selectedMeleeWeapon.name,
        rangedWeapon: selectedRangedWeapon.name,
        potion: selectedPotion.name,
        magicalItem: selectedMagicalItem.name,
        inventoryCount: inventoryItems.length
      });
      
      // Create equipment slots
      const equipment = {
        chestwear: selectedEquipment.type === "Armor" ? selectedEquipment.name : undefined,
        mainHand: selectedMeleeWeapon.name,
        offHand: undefined,
        accessories: selectedMagicalItem.type === "Ring" ? [selectedMagicalItem.name] : []
      };
      
      // Calculate equipment bonuses
      const armorClassBonus = selectedEquipment?.armorClass || 0;
      const totalArmorClassBonus = armorClassBonus;
      
      return {
        inventory: {
          capacity: 150,
          items: inventoryItems
        },
        equipment,
        equipmentBonuses: {
          armorClass: totalArmorClassBonus,
          abilityScores: {
            strength: (selectedMagicalItem?.abilityModifiers as any)?.strength || 0,
            dexterity: (selectedMagicalItem?.abilityModifiers as any)?.dexterity || 0,
            constitution: (selectedMagicalItem?.abilityModifiers as any)?.constitution || 0,
            intelligence: (selectedMagicalItem?.abilityModifiers as any)?.intelligence || 0,
            wisdom: (selectedMagicalItem?.abilityModifiers as any)?.wisdom || 0,
            charisma: (selectedMagicalItem?.abilityModifiers as any)?.charisma || 0,
          }
        }
      };
    };

    // Process player characters
    const playerCharacters = charactersData.playerCharacters.map((character) => {
      const equipmentData = assignEquipment(character.class, character.level);
      const assignedActions = assignActions(character.class);
      
      return {
        name: character.name,
        race: character.race,
        class: character.class,
        level: character.level,
        hitPoints: character.hitPoints,
        armorClass: character.armorClass,
        characterType: character.characterType === "PlayerCharacter" ? "player" : "npc",
        abilityScores: {
          strength: 10 + character.abilityModifiers.strength,
          dexterity: 10 + character.abilityModifiers.dexterity,
          constitution: 10 + character.abilityModifiers.constitution,
          intelligence: 10 + character.abilityModifiers.intelligence,
          wisdom: 10 + character.abilityModifiers.wisdom,
          charisma: 10 + character.abilityModifiers.charisma,
        },
        abilityModifiers: character.abilityModifiers,
        skills: [],
        savingThrows: [],
        proficiencies: [],
        background: "Acolyte",
        alignment: "Lawful Good",
        actions: assignedActions,
        experiencePoints: character.experiencePoints,
        proficiencyBonus: character.proficiencyBonus,
        ...equipmentData
      };
    });
    
    // Process NPCs
    const npcs = charactersData.npcs.map((npc) => {
      const equipmentData = assignEquipment(npc.class, npc.level);
      const assignedActions = assignActions(npc.class);
      
      return {
        name: npc.name,
        race: npc.race,
        class: npc.class,
        level: npc.level,
        hitPoints: npc.hitPoints,
        armorClass: npc.armorClass,
        characterType: npc.characterType === "NonPlayerCharacter" ? "npc" : "player",
        abilityScores: {
          strength: 10 + npc.abilityModifiers.strength,
          dexterity: 10 + npc.abilityModifiers.dexterity,
          constitution: 10 + npc.abilityModifiers.constitution,
          intelligence: 10 + npc.abilityModifiers.intelligence,
          wisdom: 10 + npc.abilityModifiers.wisdom,
          charisma: 10 + npc.abilityModifiers.charisma,
        },
        abilityModifiers: npc.abilityModifiers,
        skills: [],
        savingThrows: [],
        proficiencies: [],
        background: "Commoner",
        alignment: "Neutral",
        actions: assignedActions,
        ...equipmentData
      };
    });
    
    // Combine all characters into a single array as expected by the Convex mutation
    const characters = [...playerCharacters, ...npcs];
    
    return await mutateFn({ characters, clerkId })
  }

  static async loadSampleMonsters(mutateFn: any, clerkId: string) {
    // Helper function to assign actions based on monster type and challenge rating
    const assignMonsterActions = (monsterType: string, challengeRating: string, monsterName: string) => {
      // Get all available general actions (base actions + general category actions from additionalActions)
      const generalActions = additionalActions
        .filter((action: any) => action.isBaseAction === true || action.category === "general")
        .map((action: any) => action.name);
      
      // Get monster-specific actions from the base actions data (available for reference)
      // const monsterActions = actionsData.monsterActions.map((action: any) => action.name);
      
      // Core combat actions that most monsters should have
      const coreCombatActions = ["Attack", "Dash", "Dodge"];
      
      // Monster-specific action assignments based on type and CR
      let assignedActions: string[] = [];
      
      // Always include core combat actions if available
      const selectedCoreActions = coreCombatActions.filter((action: string) => 
        generalActions.includes(action)
      );
      
      assignedActions.push(...selectedCoreActions);
      
      // Type-specific actions
      if (monsterType === "dragon") {
        assignedActions.push("Multiattack", "Bite", "Claw");
        // Dragons get breath weapon (represented as a spell-like action)
        if (monsterName.toLowerCase().includes("red")) {
          assignedActions.push("Fire Breath");
        }
      } else if (monsterType === "undead") {
        assignedActions.push("Bite", "Claw");
        if (monsterName.toLowerCase().includes("skeleton")) {
          assignedActions.push("Shortsword Attack", "Shortbow Attack");
        }
      } else if (monsterType === "humanoid") {
        if (monsterName.toLowerCase().includes("goblin")) {
          assignedActions.push("Scimitar Attack", "Shortbow Attack");
        } else if (monsterName.toLowerCase().includes("orc")) {
          assignedActions.push("Greataxe Attack", "Javelin Attack");
        }
      } else if (monsterType === "monstrosity") {
        assignedActions.push("Multiattack", "Bite", "Claw");
        if (monsterName.toLowerCase().includes("owlbear")) {
          assignedActions.push("Beak Attack");
        }
      } else if (monsterType === "giant") {
        assignedActions.push("Multiattack", "Bite", "Claw");
        if (monsterName.toLowerCase().includes("troll")) {
          assignedActions.push("Regeneration");
        }
      } else if (monsterType === "aberration") {
        assignedActions.push("Eye Ray", "Bite");
        if (monsterName.toLowerCase().includes("beholder")) {
          assignedActions.push("Antimagic Cone", "Eye Ray");
        }
      }
      
      // Challenge Rating based additions
      const crValue = parseFloat(challengeRating) || 0;
      if (crValue >= 5) {
        // Higher CR monsters get more sophisticated actions
        assignedActions.push("Multiattack");
        if (!assignedActions.includes("Dodge")) {
          assignedActions.push("Dodge");
        }
      }
      
      // Ensure we have at least 3 actions, fill with general actions if needed
      const remainingSlots = Math.max(0, 5 - assignedActions.length);
      const availableGeneralActions = generalActions.filter((action: string) => 
        !assignedActions.includes(action)
      );
      
      assignedActions.push(...availableGeneralActions.slice(0, remainingSlots));
      
      // Remove duplicates and ensure we don't exceed 7 actions
      const uniqueActions = [...new Set(assignedActions)].slice(0, 7);
      
      console.log(`Assigned actions for ${monsterName} (${monsterType}, CR ${challengeRating}):`, {
        actions: uniqueActions,
        total: uniqueActions.length
      });
      
      return uniqueActions;
    };

    // Helper function to assign basic equipment to monsters
    const assignMonsterEquipment = () => {
      // Combine base items and additional items for monster equipment assignment
      const allItems = [...itemsData.items, ...additionalItems];
      
      // Find basic equipment for monsters
      let weapon = allItems.find(item => item.type === "Weapon");
      let potion = allItems.find(item => item.type === "Potion");
      
      // Create inventory with basic items
      const inventoryItems = [
        ...(weapon ? [{ itemId: weapon.name, quantity: 1 }] : []),
        ...(potion ? [{ itemId: potion.name, quantity: 2 }] : [])
      ];
      
      // Create equipment slots (monsters typically only use weapons)
      const equipment = {
        mainHand: weapon ? weapon.name : undefined,
        accessories: []
      };
      
      return {
        inventory: {
          capacity: 50, // Smaller capacity for monsters
          items: inventoryItems
        },
        equipment,
        equipmentBonuses: {
          armorClass: 0,
          abilityScores: {
            strength: 0,
            dexterity: 0,
            constitution: 0,
            intelligence: 0,
            wisdom: 0,
            charisma: 0,
          }
        }
      };
    };

    // Helper function to convert action names to action objects with descriptions
    const convertActionsToObjects = (actionNames: string[]) => {
      // Combine all available actions to get descriptions
      const allActions = [
        ...actionsData.generalActions,
        ...actionsData.monsterActions,
        ...Object.values(actionsData.classActions).flat(),
        ...additionalActions
      ];
      
      return actionNames.map(actionName => {
        // Find the action in our available actions to get the description
        const actionData = allActions.find(action => action.name === actionName);
        
        return {
          name: actionName,
          description: actionData?.description || `${actionName} - A monster action.`
        };
      });
    };

    const monsters = monstersData.monsters.map(monster => {
      const equipmentData = assignMonsterEquipment();
      const assignedActionNames = assignMonsterActions(monster.type, monster.challengeRating, monster.name);
      const assignedActions = convertActionsToObjects(assignedActionNames);
      
      // Use special abilities from JSON data if available, otherwise fall back to assigned actions
      const finalActions = (monster as any).actions && (monster as any).actions.length > 0 
        ? (monster as any).actions 
        : assignedActions;
      
      return {
        name: monster.name,
        size: monster.size,
        type: monster.type,
        challengeRating: monster.challengeRating,
        challengeRatingValue: parseFloat(monster.challengeRating) || 0,
        hitPoints: monster.hitPoints,
        armorClass: monster.armorClass,
        speed: {
          walk: monster.speed.walk || "30 ft.",
          swim: (monster.speed as any).swim,
          fly: monster.speed.fly,
          burrow: (monster.speed as any).burrow,
          climb: (monster.speed as any).climb,
        },
        abilityScores: {
          strength: 10 + monster.abilityModifiers.strength,
          dexterity: 10 + monster.abilityModifiers.dexterity,
          constitution: 10 + monster.abilityModifiers.constitution,
          intelligence: 10 + monster.abilityModifiers.intelligence,
          wisdom: 10 + monster.abilityModifiers.wisdom,
          charisma: 10 + monster.abilityModifiers.charisma,
        },
        abilityModifiers: monster.abilityModifiers,
        proficiencyBonus: Math.max(1, Math.floor((parseFloat(monster.challengeRating) || 0) / 4) + 2),
        senses: {
          passivePerception: 10 + monster.abilityModifiers.wisdom,
          darkvision: (monster as any).traits?.find((t: any) => t.name.includes("Darkvision"))?.description,
          blindsight: (monster as any).traits?.find((t: any) => t.name.includes("Blindsight"))?.description,
          tremorsense: (monster as any).traits?.find((t: any) => t.name.includes("Tremorsense"))?.description,
          truesight: (monster as any).traits?.find((t: any) => t.name.includes("Truesight"))?.description,
        },
        languages: (monster as any).traits?.find((t: any) => t.name === "Languages")?.description || "Common",
        experiencePoints: Math.floor((parseFloat(monster.challengeRating) || 0) * 100),
        alignment: "Neutral",
        hitDice: {
          count: Math.ceil(monster.hitPoints / 6),
          die: "d8" as const,
        },
        traits: (monster as any).traits || [],
        actions: finalActions,
        reactions: (monster as any).reactions || [],
        legendaryActions: (monster as any).legendaryActions || [],
        lairActions: (monster as any).lairActions || [],
        ...equipmentData
      };
    });
    
    return await mutateFn({ monsters, clerkId })
  }

  static async loadSampleItems(mutateFn: any, clerkId: string) {
    // Process base items from JSON data
    const baseItems = itemsData.items.map(item => ({
      name: item.name,
      type: item.type === "Shield" ? "Armor" : item.type,
      rarity: item.rarity,
      description: item.description,
      weight: item.weight,
      cost: item.cost,
      damageRolls: item.damageRolls,
      effects: item.effects,
      attunement: item.attunement,
      abilityModifiers: item.abilityModifiers,
      armorClass: item.armorClass,
      scope: "global" as const,
      typeOfArmor: item.type === "Armor" ? "Heavy" as const : undefined,
    }))

    // Process additional items from additionalItems.js
    const additionalItemsProcessed = additionalItems.map((item: any) => ({
      name: item.name,
      type: item.type === "Shield" ? "Armor" : item.type,
      rarity: item.rarity,
      description: item.description,
      weight: item.weight,
      cost: item.cost,
      damageRolls: item.damageRolls,
      effects: item.effects,
      attunement: item.attunement,
      abilityModifiers: item.abilityModifiers,
      armorClass: item.armorClass,
      scope: item.scope || "global" as const,
      typeOfArmor: item.typeOfArmor || (item.type === "Armor" ? "Heavy" as const : undefined),
      durability: item.durability,
    }))

    // Combine all items
    const allItems = [...baseItems, ...additionalItemsProcessed]
    
    return await mutateFn({ items: allItems, clerkId })
  }

  static async loadSampleQuests(mutateFn: any, clerkId: string) {
    const quests = questsData.quests.map(quest => ({
      name: quest.name,
      description: quest.description,
      status: quest.status as "idle" | "in_progress" | "completed" | "NotStarted" | "InProgress" | "Failed",
      completionXP: quest.completionXP,
      rewards: quest.rewards,
      taskIds: [],
      createdAt: Date.now(),
    }))
    
    return await mutateFn({ quests, clerkId })
  }

  static async loadSampleActions(mutateFn: any, clerkId: string) {
    // Helper function to create action key for deduplication (ignoring createdAt)
    const createActionKey = (action: any) => {
      return JSON.stringify({
        name: action.name,
        description: action.description,
        actionCost: action.actionCost,
        type: action.type,
        requiresConcentration: action.requiresConcentration,
        sourceBook: action.sourceBook,
        attackBonusAbilityScore: action.attackBonusAbilityScore,
        isProficient: action.isProficient,
        damageRolls: action.damageRolls,
        className: action.className || action.requiredClass,
        usesPer: action.usesPer,
        maxUses: action.maxUses,
        category: action.category,
        tags: action.tags,
        requiredLevel: action.requiredLevel,
        spellLevel: action.spellLevel,
        isBaseAction: action.isBaseAction,
        targetClass: action.targetClass
      });
    };

    const allActionsRaw = [
      ...actionsData.generalActions.map(action => ({
        name: action.name,
        description: action.description,
        actionCost: action.actionCost as "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special",
        type: action.type as "MELEE_ATTACK" | "RANGED_ATTACK" | "SPELL" | "COMMONLY_AVAILABLE_UTILITY" | "CLASS_FEATURE" | "BONUS_ACTION" | "REACTION" | "OTHER",
        requiresConcentration: action.requiresConcentration,
        sourceBook: action.sourceBook,
        attackBonusAbilityScore: (action as any).attackBonusAbilityScore || undefined,
        isProficient: (action as any).isProficient || undefined,
        damageRolls: (action as any).damageRolls || undefined,
        className: (action as any).className || undefined,
        usesPer: (action as any).usesPer as "Short Rest" | "Long Rest" | "Day" | "Special" | undefined,
        maxUses: (action as any).maxUses || undefined,
        category: "general",
      })),
      ...Object.entries(actionsData.classActions).flatMap(([className, actions]) =>
        actions.map(action => ({
          name: action.name,
          description: action.description,
          actionCost: action.actionCost as "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special",
          type: action.type as "MELEE_ATTACK" | "RANGED_ATTACK" | "SPELL" | "COMMONLY_AVAILABLE_UTILITY" | "CLASS_FEATURE" | "BONUS_ACTION" | "REACTION" | "OTHER",
          requiresConcentration: action.requiresConcentration,
          sourceBook: action.sourceBook,
          attackBonusAbilityScore: (action as any).attackBonusAbilityScore || undefined,
          isProficient: (action as any).isProficient || undefined,
          damageRolls: (action as any).damageRolls || undefined,
          className: className,
          targetClass: className,
          usesPer: (action as any).usesPer as "Short Rest" | "Long Rest" | "Day" | "Special" | undefined,
          maxUses: (action as any).maxUses || undefined,
          category: "class_specific",
        }))
      ),
      ...actionsData.monsterActions.map(action => ({
        name: action.name,
        description: action.description,
        actionCost: action.actionCost as "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special",
        type: action.type as "MELEE_ATTACK" | "RANGED_ATTACK" | "SPELL" | "COMMONLY_AVAILABLE_UTILITY" | "CLASS_FEATURE" | "BONUS_ACTION" | "REACTION" | "OTHER",
        requiresConcentration: action.requiresConcentration,
        sourceBook: action.sourceBook,
        attackBonusAbilityScore: (action as any).attackBonusAbilityScore || undefined,
        isProficient: (action as any).isProficient || undefined,
        damageRolls: (action as any).damageRolls || undefined,
        className: (action as any).className || undefined,
        usesPer: (action as any).usesPer as "Short Rest" | "Long Rest" | "Day" | "Special" | undefined,
        maxUses: (action as any).maxUses || undefined,
        category: "general",
      })),
      // Include additional actions from additionalActions..js
      ...additionalActions.map((action: any) => ({
        name: action.name,
        description: action.description,
        actionCost: action.actionCost as "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special",
        type: action.type as "MELEE_ATTACK" | "RANGED_ATTACK" | "SPELL" | "COMMONLY_AVAILABLE_UTILITY" | "CLASS_FEATURE" | "BONUS_ACTION" | "REACTION" | "OTHER",
        requiresConcentration: action.requiresConcentration,
        sourceBook: action.sourceBook,
        attackBonusAbilityScore: (action as any).attackBonusAbilityScore || undefined,
        isProficient: (action as any).isProficient || undefined,
        damageRolls: (action as any).damageRolls || undefined,
        className: (action as any).requiredClass || undefined,
        usesPer: (action as any).usesPer as "Short Rest" | "Long Rest" | "Day" | "Special" | undefined,
        maxUses: (action as any).maxUses || undefined,
        category: action.category || "general",
        tags: (action as any).tags || undefined,
        requiredLevel: (action as any).requiredLevel || undefined,
        spellLevel: (action as any).spellLevel || undefined,
        isBaseAction: (action as any).isBaseAction || undefined,
        targetClass: (action as any).targetClass || undefined,
      }))
    ];

    // Deduplicate actions based on all fields except createdAt
    const seenKeys = new Set<string>();
    const allActions = allActionsRaw.filter(action => {
      const key = createActionKey(action);
      if (seenKeys.has(key)) {
        console.log(`Skipping duplicate action: ${action.name}`);
        return false;
      }
      seenKeys.add(key);
      return true;
    });
    
    console.log(`Loaded ${allActions.length} unique actions (${allActionsRaw.length - allActions.length} duplicates removed)`);
    
    return await mutateFn({ actions: allActions, clerkId })
  }

  static async deleteAllSampleData(mutateFn: any, clerkId: string) {
    return await mutateFn({ clerkId })
  }

  static async loadSampleData(entityType: string, mutateFn: any, clerkId: string) {
    switch (entityType) {
      case 'campaigns':
        return await this.loadSampleCampaigns(mutateFn, clerkId)
      case 'characters':
        return await this.loadSampleCharacters(mutateFn, clerkId)
      case 'monsters':
        return await this.loadSampleMonsters(mutateFn, clerkId)
      case 'items':
        return await this.loadSampleItems(mutateFn, clerkId)
      case 'quests':
        return await this.loadSampleQuests(mutateFn, clerkId)
      case 'actions':
        return await this.loadSampleActions(mutateFn, clerkId)
      case 'maps':
        return await this.loadSampleMaps(mutateFn, clerkId)
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
  }

  static async loadSampleMaps(mutateFn: any, clerkId: string) {
    const maps = mapsData.maps.map(map => ({
      name: map.name,
      cols: map.width,
      rows: map.height,
      description: map.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }))
    
    return await mutateFn({ maps, clerkId })
  }

  static getSampleDataInfo(): Record<string, SampleDataInfo> {
    const classActionsCount = Object.values(actionsData.classActions).reduce(
      (sum, actions) => sum + actions.length, 
      0
    )
    
    return {
      campaigns: {
        version: campaignsData.version,
        description: campaignsData.description,
        count: campaignsData.campaigns.length
      },
      characters: {
        version: charactersData.version,
        description: charactersData.description,
        count: charactersData.playerCharacters.length + charactersData.npcs.length
      },
      monsters: {
        version: monstersData.version,
        description: monstersData.description,
        count: monstersData.monsters.length
      },
      items: {
        version: itemsData.version,
        description: itemsData.description,
        count: itemsData.items.length + additionalItems.length
      },
      quests: {
        version: questsData.version,
        description: questsData.description,
        count: questsData.quests.length
      },
      actions: {
        version: actionsData.version,
        description: actionsData.description,
        count: actionsData.generalActions.length + 
               classActionsCount +
               actionsData.monsterActions.length +
               additionalActions.length
      },
      maps: {
        version: mapsData.version,
        description: mapsData.description,
        count: mapsData.maps.length
      }
    }
  }
}

// Note: Sample data mutations are disabled until backend functions are properly implemented
// The frontend components are ready and will work once the Convex functions are fixed 