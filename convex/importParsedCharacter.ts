import { mutation } from "./_generated/server"
import { v } from "convex/values"

// Define the mutation parameter schema
const importParsedCharacterSchema = v.object({
  // Basic Information
  name: v.string(),
  race: v.string(),
  subrace: v.optional(v.string()),
  classes: v.array(v.object({
    name: v.string(),
    level: v.number(),
    hitDie: v.string(),
    subclass: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
  })),
  background: v.string(),
  alignment: v.optional(v.string()),
  level: v.number(),
  experiencePoints: v.number(),

  // Ability Scores
  abilityScores: v.object({
    strength: v.number(),
    dexterity: v.number(),
    constitution: v.number(),
    intelligence: v.number(),
    wisdom: v.number(),
    charisma: v.number(),
  }),
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

  // Hit Points and AC
  hitPoints: v.number(),
  maxHitPoints: v.optional(v.number()),
  currentHitPoints: v.optional(v.number()),
  tempHitPoints: v.optional(v.number()),
  hitDice: v.optional(v.array(v.object({
    die: v.string(),
    current: v.number(),
    max: v.number(),
  }))),
  armorClass: v.number(),
  baseArmorClass: v.optional(v.number()),

  // Skills and Proficiencies
  skills: v.array(v.string()),
  skillProficiencies: v.optional(v.array(v.object({
    skill: v.string(),
    proficient: v.boolean(),
    expertise: v.optional(v.boolean()),
    source: v.optional(v.string()),
  }))),
  savingThrows: v.array(v.string()),
  savingThrowProficiencies: v.optional(v.array(v.object({
    ability: v.string(),
    proficient: v.boolean(),
    source: v.optional(v.string()),
  }))),
  proficiencies: v.array(v.string()),
  weaponProficiencies: v.optional(v.array(v.string())),
  armorProficiencies: v.optional(v.array(v.string())),
  toolProficiencies: v.optional(v.array(v.string())),

  // Character Features
  traits: v.optional(v.array(v.string())),
  racialTraits: v.optional(v.array(v.object({
    name: v.string(),
    description: v.string(),
  }))),
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
  languages: v.optional(v.array(v.string())),

  // Movement and Senses
  speed: v.optional(v.string()),
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

  // Spellcasting
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

  // Other Resources
  inspiration: v.optional(v.boolean()),
  deathSaves: v.optional(v.object({
    successes: v.number(),
    failures: v.number(),
  })),

  // Enhanced parsed data for equipment and actions
  parsedEquipment: v.optional(v.object({
    weapons: v.array(v.object({
      name: v.string(),
      type: v.optional(v.string()),
      quantity: v.optional(v.number()),
      weight: v.optional(v.number()),
      value: v.optional(v.number()),
      properties: v.optional(v.any()),
      notes: v.optional(v.string()),
      equipped: v.optional(v.boolean()),
      attackBonus: v.optional(v.number()),
      damage: v.optional(v.string()),
      damageType: v.optional(v.string()),
      range: v.optional(v.string()),
      ammunition: v.optional(v.string()),
      armorClass: v.optional(v.number()),
      armorType: v.optional(v.string()),
      stealthDisadvantage: v.optional(v.boolean()),
      proficiency: v.optional(v.boolean()),
      rarity: v.optional(v.string()),
      language: v.optional(v.string())
    })),
    armor: v.array(v.object({
      name: v.string(),
      type: v.optional(v.string()),
      quantity: v.optional(v.number()),
      weight: v.optional(v.number()),
      value: v.optional(v.number()),
      properties: v.optional(v.any()),
      notes: v.optional(v.string()),
      equipped: v.optional(v.boolean()),
      armorClass: v.optional(v.number()),
      armorType: v.optional(v.string()),
      stealthDisadvantage: v.optional(v.boolean())
    })),
    gear: v.array(v.object({
      name: v.string(),
      type: v.optional(v.string()),
      quantity: v.optional(v.number()),
      weight: v.optional(v.number()),
      value: v.optional(v.number()),
      properties: v.optional(v.any()),
      notes: v.optional(v.string()),
      equipped: v.optional(v.boolean())
    })),
    tools: v.array(v.object({
      name: v.string(),
      type: v.optional(v.string()),
      quantity: v.optional(v.number()),
      weight: v.optional(v.number()),
      value: v.optional(v.number()),
      properties: v.optional(v.any()),
      notes: v.optional(v.string()),
      equipped: v.optional(v.boolean()),
      proficiency: v.optional(v.boolean())
    })),
    ammunition: v.array(v.object({
      name: v.string(),
      type: v.optional(v.string()),
      quantity: v.optional(v.number()),
      weight: v.optional(v.number()),
      value: v.optional(v.number()),
      properties: v.optional(v.any()),
      notes: v.optional(v.string()),
      equipped: v.optional(v.boolean())
    })),
    potions: v.array(v.object({
      name: v.string(),
      type: v.optional(v.string()),
      quantity: v.optional(v.number()),
      weight: v.optional(v.number()),
      value: v.optional(v.number()),
      properties: v.optional(v.any()),
      notes: v.optional(v.string()),
      equipped: v.optional(v.boolean()),
      rarity: v.optional(v.string())
    })),
    books: v.array(v.object({
      name: v.string(),
      type: v.optional(v.string()),
      quantity: v.optional(v.number()),
      weight: v.optional(v.number()),
      value: v.optional(v.number()),
      properties: v.optional(v.any()),
      notes: v.optional(v.string()),
      equipped: v.optional(v.boolean()),
      language: v.optional(v.string())
    })),
    valuables: v.array(v.object({
      name: v.string(),
      type: v.optional(v.string()),
      quantity: v.optional(v.number()),
      weight: v.optional(v.number()),
      value: v.optional(v.number()),
      properties: v.optional(v.any()),
      notes: v.optional(v.string()),
      equipped: v.optional(v.boolean())
    })),
    currency: v.optional(v.object({
      copper: v.optional(v.number()),
      silver: v.optional(v.number()),
      electrum: v.optional(v.number()),
      gold: v.optional(v.number()),
      platinum: v.optional(v.number())
    }))
  })),

  parsedActions: v.optional(v.object({
    weaponAttacks: v.array(v.object({
      name: v.string(),
      attackBonus: v.number(),
      damage: v.string(),
      damageType: v.string(),
      range: v.optional(v.string()),
      properties: v.optional(v.object({
        finesse: v.optional(v.boolean()),
        versatile: v.optional(v.boolean()),
        heavy: v.optional(v.boolean()),
        light: v.optional(v.boolean()),
        reach: v.optional(v.boolean()),
        thrown: v.optional(v.boolean()),
        ammunition: v.optional(v.boolean()),
        loading: v.optional(v.boolean()),
        twoHanded: v.optional(v.boolean())
      }))
    })),
    spellAttacks: v.array(v.object({
      name: v.string(),
      attackBonus: v.number(),
      damage: v.string(),
      damageType: v.string(),
      range: v.string(),
      saveDC: v.optional(v.number())
    })),
    featureActions: v.array(v.object({
      name: v.string(),
      description: v.string(),
      damage: v.optional(v.string()),
      damageType: v.optional(v.string()),
      saveDC: v.optional(v.number()),
      range: v.optional(v.string()),
      uses: v.optional(v.object({
        current: v.number(),
        max: v.number(),
        resetOn: v.string()
      }))
    }))
  })),

  // Legacy fields for backward compatibility
  equipment: v.optional(v.object({
    headgear: v.optional(v.string()),
    armwear: v.optional(v.string()),
    chestwear: v.optional(v.string()),
    legwear: v.optional(v.string()),
    footwear: v.optional(v.string()),
    mainHand: v.optional(v.string()),
    offHand: v.optional(v.string()),
    accessories: v.optional(v.array(v.string())),
  })),
  inventory: v.optional(v.array(v.object({
    name: v.string(),
    quantity: v.number(),
    description: v.optional(v.string()),
    weight: v.optional(v.number()),
    value: v.optional(v.number()),
    type: v.optional(v.string()),
    isEquipped: v.optional(v.boolean()),
    equipmentSlot: v.optional(v.string()),
  }))),

  // Import metadata
  importedFrom: v.optional(v.string()),
  importData: v.optional(v.any()),
  importedAt: v.optional(v.number()),
  uncapturedData: v.optional(v.any()),
})

export default mutation({
  args: {
    parsedCharacter: importParsedCharacterSchema,
  },
  handler: async (ctx, args) => {
    // 1. Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Authentication required to import character data")
    }

    const clerkId = identity.subject
    const now = Date.now()
    const { parsedCharacter } = args

    // 2. Look up the user in our database
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), clerkId))
      .first()

    if (!user) {
      throw new Error("User not found in database")
    }

    try {
      // 3. Process enhanced parsed actions if available
      const actionIds: string[] = []
      const createdActionIds: string[] = []
      const reusedActionIds: string[] = []

      if (parsedCharacter.parsedActions) {
        // Process weapon attacks
        for (const weapon of parsedCharacter.parsedActions.weaponAttacks) {
          const actionId = await processWeaponAction(ctx, weapon, createdActionIds, reusedActionIds, user._id)
          actionIds.push(actionId)
        }
        
        // Process spell attacks
        for (const spell of parsedCharacter.parsedActions.spellAttacks) {
          const actionId = await processSpellAction(ctx, spell, createdActionIds, reusedActionIds, user._id)
          actionIds.push(actionId)
        }
        
        // Process feature actions
        for (const feature of parsedCharacter.parsedActions.featureActions) {
          const actionId = await processFeatureAction(ctx, feature, createdActionIds, reusedActionIds, user._id)
          actionIds.push(actionId)
        }
      }

      // 4. Process enhanced parsed equipment if available
      const createdItemIds: string[] = []
      const equipmentItemIds: { [key: string]: string | string[] } = {}
      
      if (parsedCharacter.parsedEquipment) {
        // Process all item types from parsed equipment
        const allItems = [
          ...parsedCharacter.parsedEquipment.weapons,
          ...parsedCharacter.parsedEquipment.armor,
          ...parsedCharacter.parsedEquipment.gear,
          ...parsedCharacter.parsedEquipment.tools,
          ...parsedCharacter.parsedEquipment.ammunition,
          ...parsedCharacter.parsedEquipment.potions,
          ...parsedCharacter.parsedEquipment.books,
          ...parsedCharacter.parsedEquipment.valuables
        ]
        
        for (const item of allItems) {
          const itemId = await createEnhancedItem(ctx, item, user._id)
          createdItemIds.push(itemId)
          
          // Track equipped items for equipment slots
          if (item.equipped) {
            const slot = determineEquipmentSlot(item, item.type || 'gear')
            if (slot) {
              if (slot === 'accessories') {
                if (!equipmentItemIds.accessories) {
                  equipmentItemIds.accessories = []
                }
                (equipmentItemIds.accessories as string[]).push(itemId)
              } else {
              equipmentItemIds[slot] = itemId
              }
            }
          }
        }
      } else if (parsedCharacter.inventory) {
        // Fallback to legacy inventory processing
        for (const inventoryItem of parsedCharacter.inventory) {
          const itemId = await createItem(ctx, inventoryItem, user._id)
          createdItemIds.push(itemId)
          
          if (inventoryItem.isEquipped && inventoryItem.equipmentSlot) {
            equipmentItemIds[inventoryItem.equipmentSlot] = itemId
          }
        }
      }

      // 5. Calculate ability modifiers if not provided
      const abilityModifiers = {
        strength: Math.floor((parsedCharacter.abilityScores.strength - 10) / 2),
        dexterity: Math.floor((parsedCharacter.abilityScores.dexterity - 10) / 2),
        constitution: Math.floor((parsedCharacter.abilityScores.constitution - 10) / 2),
        intelligence: Math.floor((parsedCharacter.abilityScores.intelligence - 10) / 2),
        wisdom: Math.floor((parsedCharacter.abilityScores.wisdom - 10) / 2),
        charisma: Math.floor((parsedCharacter.abilityScores.charisma - 10) / 2),
      }

      // Calculate proficiency bonus
      const proficiencyBonus = Math.ceil(parsedCharacter.level / 4) + 1

      // 6. Create character record
      const characterData = {
        name: parsedCharacter.name,
        race: parsedCharacter.race,
        subrace: parsedCharacter.subrace,
        class: parsedCharacter.classes[0]?.name || 'Fighter',
        classes: parsedCharacter.classes,
        background: parsedCharacter.background,
        alignment: parsedCharacter.alignment,
        characterType: "player" as const,
        level: parsedCharacter.level,
        experiencePoints: parsedCharacter.experiencePoints,
        
        // Ability scores
        abilityScores: {
          strength: parsedCharacter.abilityScores.strength,
          dexterity: parsedCharacter.abilityScores.dexterity,
          constitution: parsedCharacter.abilityScores.constitution,
          intelligence: parsedCharacter.abilityScores.intelligence,
          wisdom: parsedCharacter.abilityScores.wisdom,
          charisma: parsedCharacter.abilityScores.charisma,
        },
        baseAbilityScores: parsedCharacter.baseAbilityScores,
        racialAbilityScoreImprovements: parsedCharacter.racialAbilityScoreImprovements,
        abilityModifiers,
        
        // Combat stats
        hitPoints: parsedCharacter.hitPoints,
        maxHitPoints: parsedCharacter.maxHitPoints || parsedCharacter.hitPoints,
        currentHitPoints: parsedCharacter.currentHitPoints || parsedCharacter.hitPoints,
        tempHitPoints: parsedCharacter.tempHitPoints || 0,
        hitDice: parsedCharacter.hitDice,
        armorClass: parsedCharacter.armorClass,
        baseArmorClass: parsedCharacter.baseArmorClass,
        proficiencyBonus,
        
        // Skills and proficiencies
        skills: parsedCharacter.skills,
        skillProficiencies: parsedCharacter.skillProficiencies,
        savingThrows: parsedCharacter.savingThrows,
        savingThrowProficiencies: parsedCharacter.savingThrowProficiencies,
        proficiencies: parsedCharacter.proficiencies,
        weaponProficiencies: parsedCharacter.weaponProficiencies,
        armorProficiencies: parsedCharacter.armorProficiencies,
        toolProficiencies: parsedCharacter.toolProficiencies,
        
        // Character features
        traits: parsedCharacter.traits,
        racialTraits: parsedCharacter.racialTraits,
        features: parsedCharacter.features,
        feats: parsedCharacter.feats,
        languages: parsedCharacter.languages,
        
        // Movement and senses
        speed: parsedCharacter.speed,
        speeds: parsedCharacter.speeds,
        initiative: parsedCharacter.initiative,
        passivePerception: parsedCharacter.passivePerception,
        passiveInvestigation: parsedCharacter.passiveInvestigation,
        passiveInsight: parsedCharacter.passiveInsight,
        
        // Spellcasting
        spellcastingAbility: parsedCharacter.spellcastingAbility,
        spellSaveDC: parsedCharacter.spellSaveDC,
        spellAttackBonus: parsedCharacter.spellAttackBonus,
        spellSlots: parsedCharacter.spellSlots,
        spellsKnown: parsedCharacter.spellsKnown,
        cantripsKnown: parsedCharacter.cantripsKnown,
        
        // Other resources
        inspiration: parsedCharacter.inspiration,
        deathSaves: parsedCharacter.deathSaves,
        
        // Actions and items
        actions: actionIds as any,
        
        // Inventory and equipment
        inventory: {
          capacity: parsedCharacter.abilityScores.strength * 15, // Standard D&D 5e carrying capacity
          items: createdItemIds as any,
        },
        equipment: {
          headgear: equipmentItemIds.headgear,
          armwear: equipmentItemIds.armwear,
          chestwear: equipmentItemIds.chestwear,
          legwear: equipmentItemIds.legwear,
          footwear: equipmentItemIds.footwear,
          mainHand: equipmentItemIds.mainHand,
          offHand: equipmentItemIds.offHand,
          accessories: equipmentItemIds.accessories || [],
        } as any,
        
        // Import metadata
        importedFrom: parsedCharacter.importedFrom || 'pdf',
        importData: parsedCharacter.importData,
        importedAt: parsedCharacter.importedAt || now,
        uncapturedData: parsedCharacter.uncapturedData,
        
        // System fields
        userId: user._id,
        createdAt: now,
        updatedAt: now,
      }

      const characterId = await ctx.db.insert("characters", characterData)

      // 7. Return result
      return {
        characterId,
        createdActionIds,
        reusedActionIds,
        createdItemIds,
        summary: {
          name: parsedCharacter.name,
          race: parsedCharacter.race,
          classes: parsedCharacter.classes.map(c => `${c.name} ${c.level}`).join(', '),
          level: parsedCharacter.level,
          actionsProcessed: actionIds.length,
          itemsCreated: createdItemIds.length,
        }
      }

    } catch (error) {
      console.error("Error importing character:", error)
      throw new Error(`Failed to import character: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})



// Helper function to create items
async function createItem(ctx: any, inventoryItem: any, userId: string): Promise<string> {
  const itemData = {
    name: inventoryItem.name,
    type: "Adventuring Gear" as const, // Default type
    rarity: "Common" as const,
    description: inventoryItem.description || '',
    scope: "entitySpecific" as const,
    weight: inventoryItem.weight,
    cost: inventoryItem.value,
    userId,
  }
  
  return await ctx.db.insert("items", itemData)
}





function mapDiceType(diceStr: string) {
  const mapping: Record<string, any> = {
    '4': 'D4',
    '6': 'D6',
    '8': 'D8',
    '10': 'D10',
    '12': 'D12',
    '20': 'D20',
  }
  return mapping[diceStr] || 'D6'
}

function mapDamageType(damageType: string) {
  const mapping: Record<string, any> = {
    'BLUDGEONING': 'BLUDGEONING',
    'PIERCING': 'PIERCING',
    'SLASHING': 'SLASHING',
    'FIRE': 'FIRE',
    'COLD': 'COLD',
    'LIGHTNING': 'LIGHTNING',
    'THUNDER': 'THUNDER',
    'ACID': 'ACID',
    'POISON': 'POISON',
    'NECROTIC': 'NECROTIC',
    'RADIANT': 'RADIANT',
    'PSYCHIC': 'PSYCHIC',
    'FORCE': 'FORCE',
  }
  return mapping[damageType?.toUpperCase()] || 'BLUDGEONING'
}

// Helper function to process weapon actions from parsed data
async function processWeaponAction(
  ctx: any, 
  weapon: any, 
  createdActionIds: string[], 
  reusedActionIds: string[], 
  userId: string
): Promise<string> {
  
  // Try to find existing action
  const existingAction = await ctx.db
    .query("actions")
    .filter((q: any) => q.and(
      q.eq(q.field("name"), weapon.name),
      q.eq(q.field("type"), "MELEE_ATTACK")
    ))
    .first()
  
  if (existingAction) {
    reusedActionIds.push(existingAction._id)
    return existingAction._id
  }
  
  // Parse damage dice
  const damageMatch = weapon.damage?.match(/(\d+)d(\d+)(?:\+(\d+))?/)
  const damageRolls = damageMatch ? [{
    dice: {
      count: parseInt(damageMatch[1]) || 1,
      type: mapDiceType(damageMatch[2]) || "D6",
    },
    modifier: parseInt(damageMatch[3]) || 0,
    damageType: mapDamageType(weapon.damageType) || "BLUDGEONING",
  }] : []
  
  // Create new weapon action
  const actionData = {
    name: weapon.name,
    description: `${weapon.name}: +${weapon.attackBonus || 0} to hit, ${weapon.damage || '1d4'} ${weapon.damageType || 'bludgeoning'} damage${weapon.range ? `, ${weapon.range}` : ''}`,
    actionCost: 'Action',
    type: weapon.range && (weapon.range.includes('ft') || weapon.range.includes('range')) ? 'RANGED_ATTACK' : 'MELEE_ATTACK',
    requiresConcentration: false,
    sourceBook: "Imported",
    damageRolls,
    range: weapon.range || undefined,
    createdAt: Date.now(),
    userId,
  }
  
  const actionId = await ctx.db.insert("actions", actionData)
  createdActionIds.push(actionId)
  return actionId
}

// Helper function to process spell actions from parsed data
async function processSpellAction(
  ctx: any, 
  spell: any, 
  createdActionIds: string[], 
  reusedActionIds: string[], 
  userId: string
): Promise<string> {
  
  // Try to find existing action
  const existingAction = await ctx.db
    .query("actions")
    .filter((q: any) => q.and(
      q.eq(q.field("name"), spell.name),
      q.eq(q.field("type"), "SPELL")
    ))
    .first()
  
  if (existingAction) {
    reusedActionIds.push(existingAction._id)
    return existingAction._id
  }
  
  // Parse damage dice
  const damageMatch = spell.damage?.match(/(\d+)d(\d+)(?:\+(\d+))?/)
  const damageRolls = damageMatch ? [{
    dice: {
      count: parseInt(damageMatch[1]) || 1,
      type: mapDiceType(damageMatch[2]) || "D6",
    },
    modifier: parseInt(damageMatch[3]) || 0,
    damageType: mapDamageType(spell.damageType) || "FORCE",
  }] : []
  
  // Create new spell action
  const actionData = {
    name: spell.name,
    description: `${spell.name}: +${spell.attackBonus || 0} to hit, ${spell.damage || '1d4'} ${spell.damageType || 'force'} damage, ${spell.range || '60 ft'}${spell.saveDC ? `, DC ${spell.saveDC}` : ''}`,
    actionCost: 'Action',
    type: 'SPELL',
    requiresConcentration: false,
    sourceBook: "Imported",
    damageRolls,
    range: spell.range || '60 ft',
    savingThrow: spell.saveDC ? {
      ability: 'Constitution', // Default, could be improved with better parsing
      onSave: "half damage",
    } : undefined,
    createdAt: Date.now(),
    userId,
  }
  
  const actionId = await ctx.db.insert("actions", actionData)
  createdActionIds.push(actionId)
  return actionId
}

// Helper function to process feature actions from parsed data
async function processFeatureAction(
  ctx: any, 
  feature: any, 
  createdActionIds: string[], 
  reusedActionIds: string[], 
  userId: string
): Promise<string> {
  
  // Try to find existing action
  const existingAction = await ctx.db
    .query("actions")
    .filter((q: any) => q.and(
      q.eq(q.field("name"), feature.name),
      q.eq(q.field("type"), "OTHER")
    ))
    .first()
  
  if (existingAction) {
    reusedActionIds.push(existingAction._id)
    return existingAction._id
  }
  
  // Parse damage dice if present
  const damageMatch = feature.damage?.match(/(\d+)d(\d+)(?:\+(\d+))?/)
  const damageRolls = damageMatch ? [{
    dice: {
      count: parseInt(damageMatch[1]) || 1,
      type: mapDiceType(damageMatch[2]) || "D6",
    },
    modifier: parseInt(damageMatch[3]) || 0,
    damageType: mapDamageType(feature.damageType) || "BLUDGEONING",
  }] : []
  
  // Create new feature action
  const actionData = {
    name: feature.name,
    description: feature.description,
    actionCost: 'Action',
    type: 'OTHER',
    requiresConcentration: false,
    sourceBook: "Imported",
    damageRolls: damageRolls.length > 0 ? damageRolls : undefined,
    range: feature.range || undefined,
    savingThrow: feature.saveDC ? {
      ability: 'Constitution', // Default, could be improved with better parsing
      onSave: "half damage",
    } : undefined,
    createdAt: Date.now(),
    userId,
  }
  
  const actionId = await ctx.db.insert("actions", actionData)
  createdActionIds.push(actionId)
  return actionId
}

// Helper function to create enhanced item from parsed equipment data
async function createEnhancedItem(ctx: any, item: any, userId: string): Promise<string> {
  // Map item type to database schema
  const typeMapping: Record<string, string> = {
    'weapon': 'Weapon',
    'armor': 'Armor',
    'gear': 'Adventuring Gear',
    'tool': 'Tool',
    'ammunition': 'Ammunition',
    'potion': 'Potion',
    'book': 'Book',
    'valuable': 'Treasure',
  }
  
  const itemData = {
    name: item.name,
    type: typeMapping[item.type] || 'Adventuring Gear',
    rarity: item.rarity || 'Common',
    description: item.notes || item.description || '',
    scope: "entitySpecific" as const,
    weight: item.weight || 0,
    cost: item.value || 0,
    userId,
    // Enhanced weapon/armor properties
    ...(item.attackBonus && { attackBonus: item.attackBonus }),
    ...(item.damage && { damage: item.damage }),
    ...(item.damageType && { damageType: item.damageType }),
    ...(item.armorClass && { armorClass: item.armorClass }),
    ...(item.armorType && { armorType: item.armorType }),
    ...(item.range && { range: item.range }),
    ...(item.properties && { properties: item.properties }),
  }
  
  return await ctx.db.insert("items", itemData)
}

// Helper function to determine equipment slot based on item type and name
function determineEquipmentSlot(item: any, itemType: string): string | null {
  const itemLower = item.name.toLowerCase()
  
  if (itemType === 'armor') {
    if (itemLower.includes('helmet') || itemLower.includes('hat') || itemLower.includes('crown') || itemLower.includes('cap') || itemLower.includes('hood')) {
      return 'headgear'
    } else if (itemLower.includes('gloves') || itemLower.includes('gauntlets') || itemLower.includes('bracers') || itemLower.includes('vambraces')) {
      return 'armwear'
    } else if (itemLower.includes('breastplate') || itemLower.includes('chain') || itemLower.includes('leather') || itemLower.includes('scale') || itemLower.includes('plate') || itemLower.includes('mail')) {
      return 'chestwear'
    } else if (itemLower.includes('greaves') || itemLower.includes('pants') || itemLower.includes('leg')) {
      return 'legwear'
    } else if (itemLower.includes('boots') || itemLower.includes('shoes') || itemLower.includes('sabatons')) {
      return 'footwear'
    } else if (itemLower.includes('shield') || itemLower.includes('buckler')) {
      return 'offHand'
    }
  }
  
  if (itemType === 'weapon') {
    // Most weapons go to main hand, some specific ones to off-hand
    if (itemLower.includes('dagger') || itemLower.includes('dart') || itemLower.includes('handaxe') || itemLower.includes('light')) {
      return 'mainHand' // Could be offHand if main is occupied
    }
    return 'mainHand'
  }
  
  // Accessories for other items
  if (itemType === 'valuable' || itemType === 'tool' || itemType === 'book') {
    return 'accessories'
  }
  
  return null
}