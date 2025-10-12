// Types are now handled with 'any' for flexibility

/**
 * Maps parsed equipment data to form-compatible format
 * This function transforms the enhanced parsed equipment data into a format
 * that can be directly used by the character creation form
 */
export function mapEquipmentToForm(parsedEquipment: any) {
  // Add defensive checks for undefined arrays
  if (!parsedEquipment) {
    console.warn('mapEquipmentToForm: parsedEquipment is undefined')
    return {
      weapons: [],
      armor: [],
      gear: [],
      tools: [],
      ammunition: [],
      potions: [],
      books: [],
      valuables: [],
      equipment: {},
      inventory: {
        capacity: 100,
        items: []
      },
      currency: {
        copper: 0,
        silver: 0,
        electrum: 0,
        gold: 0,
        platinum: 0
      }
    }
  }
  
  // Handle both enhanced and legacy formats
  const weapons = parsedEquipment.weapons || parsedEquipment.inventory?.filter((item: any) => item.type === 'weapon') || []
  const armor = parsedEquipment.armor || parsedEquipment.inventory?.filter((item: any) => item.type === 'armor') || []
  const gear = parsedEquipment.gear || parsedEquipment.inventory?.filter((item: any) => item.type === 'gear') || []
  const tools = parsedEquipment.tools || parsedEquipment.inventory?.filter((item: any) => item.type === 'tool') || []
  const ammunition = parsedEquipment.ammunition || parsedEquipment.inventory?.filter((item: any) => item.type === 'ammunition') || []
  const potions = parsedEquipment.potions || parsedEquipment.inventory?.filter((item: any) => item.type === 'potion') || []
  const books = parsedEquipment.books || parsedEquipment.inventory?.filter((item: any) => item.type === 'book') || []
  const valuables = parsedEquipment.valuables || parsedEquipment.inventory?.filter((item: any) => item.type === 'valuable') || []
  
  const formEquipment = {
    weapons: weapons.map((weapon: any) => ({
      name: weapon.name,
      type: weapon.type || 'weapon',
      quantity: weapon.quantity || 1,
      weight: weapon.weight || 0,
      value: weapon.value || 0,
      properties: {},
      notes: '',
      equipped: false,
      // Map to form-specific fields - use default values since detailed properties aren't available
      attackBonus: 0,
      damage: '',
      damageType: '',
      range: '',
      ammunition: undefined
    })),
    
    armor: armor.map((armor: any) => ({
      name: armor.name,
      type: armor.type || 'armor',
      quantity: armor.quantity || 1,
      weight: armor.weight || 0,
      value: armor.value || 0,
      properties: {},
      notes: '',
      equipped: false,
      // Map to form-specific fields - use default values
      armorClass: 0,
      armorType: 'light',
      stealthDisadvantage: false
    })),
    
    gear: gear.map((item: any) => ({
      name: item.name,
      type: item.type || 'gear',
      quantity: item.quantity || 1,
      weight: item.weight || 0,
      value: item.value || 0,
      properties: {},
      notes: '',
      equipped: false
    })),
    
    tools: tools.map((tool: any) => ({
      name: tool.name,
      type: tool.type || 'tool',
      quantity: tool.quantity || 1,
      weight: tool.weight || 0,
      value: tool.value || 0,
      properties: {},
      notes: '',
      equipped: false,
      proficiency: false
    })),
    
    ammunition: ammunition.map((ammo: any) => ({
      name: ammo.name,
      type: ammo.type || 'ammunition',
      quantity: ammo.quantity || 1,
      weight: ammo.weight || 0,
      value: ammo.value || 0,
      properties: {},
      notes: '',
      equipped: false
    })),
    
    potions: potions.map((potion: any) => ({
      name: potion.name,
      type: potion.type || 'potion',
      quantity: potion.quantity || 1,
      weight: potion.weight || 0,
      value: potion.value || 0,
      properties: {},
      notes: '',
      equipped: false,
      rarity: 'common'
    })),
    
    books: books.map((book: any) => ({
      name: book.name,
      type: book.type || 'book',
      quantity: book.quantity || 1,
      weight: book.weight || 0,
      value: book.value || 0,
      properties: {},
      notes: '',
      equipped: false,
      language: 'common'
    })),
    
    valuables: valuables.map((valuable: any) => ({
      name: valuable.name,
      type: valuable.type || 'valuable',
      quantity: valuable.quantity || 1,
      weight: valuable.weight || 0,
      value: valuable.value || 0,
      properties: {},
      notes: '',
      equipped: false
    })),
    
    currency: parsedEquipment.currency || {
      copper: 0,
      silver: 0,
      electrum: 0,
      gold: 0,
      platinum: 0
    },
    
    // Enhanced inventory structure for form compatibility
    inventory: {
      capacity: 100, // Default capacity
      items: [
        ...weapons.map((item: any, index: number) => ({ itemId: `weapon_${index}`, quantity: item.quantity || 1 })),
        ...armor.map((item: any, index: number) => ({ itemId: `armor_${index}`, quantity: item.quantity || 1 })),
        ...gear.map((item: any, index: number) => ({ itemId: `gear_${index}`, quantity: item.quantity || 1 })),
        ...tools.map((item: any, index: number) => ({ itemId: `tool_${index}`, quantity: item.quantity || 1 })),
        ...ammunition.map((item: any, index: number) => ({ itemId: `ammo_${index}`, quantity: item.quantity || 1 })),
        ...potions.map((item: any, index: number) => ({ itemId: `potion_${index}`, quantity: item.quantity || 1 })),
        ...books.map((item: any, index: number) => ({ itemId: `book_${index}`, quantity: item.quantity || 1 })),
        ...valuables.map((item: any, index: number) => ({ itemId: `valuable_${index}`, quantity: item.quantity || 1 }))
      ]
    },
    
    // Equipment slots for equipped items
    equipment: {
      headgear: undefined,
      armwear: undefined,
      chestwear: undefined,
      legwear: undefined,
      footwear: undefined,
      mainHand: undefined,
      offHand: undefined,
      accessories: []
    }
  }
  
  return formEquipment
}

/**
 * Maps parsed action data to form-compatible format
 * This function transforms the enhanced parsed action data into a format
 * that can be directly used by the character creation form
 */
export function mapActionsToForm(parsedActions: any) {
  // Add defensive checks for undefined arrays
  if (!parsedActions) {
    console.warn('mapActionsToForm: parsedActions is undefined')
    return {
      weaponAttacks: [],
      spellAttacks: [],
      featureActions: [],
      actions: []
    }
  }
  
  const formActions = {
    weaponAttacks: (parsedActions.weaponAttacks || []).map((weapon: any) => ({
      name: weapon.name,
      type: 'MELEE_ATTACK' as const,
      actionCost: 'Action' as const,
      attackBonus: weapon.attackBonus,
      damage: weapon.damage,
      damageType: weapon.damageType,
      range: weapon.range || '5 ft.',
      properties: weapon.properties,
      requiresConcentration: false,
      sourceBook: 'Character Sheet',
      isProficient: true
    })),
    
    spellAttacks: (parsedActions.spellAttacks || []).map((spell: any) => ({
      name: spell.name,
      type: 'SPELL' as const,
      actionCost: 'Action' as const,
      attackBonus: spell.attackBonus,
      damage: spell.damage,
      damageType: spell.damageType,
      range: spell.range,
      saveDC: spell.saveDC,
      requiresConcentration: false,
      sourceBook: 'Character Sheet',
      isProficient: true
    })),
    
    featureActions: (parsedActions.featureActions || []).map((feature: any) => ({
      name: feature.name,
      type: 'CLASS_FEATURE' as const,
      actionCost: 'Action' as const,
      description: feature.description,
      damage: feature.damage,
      damageType: feature.damageType,
      range: feature.range,
      saveDC: feature.saveDC,
      uses: feature.uses,
      requiresConcentration: false,
      sourceBook: 'Character Sheet',
      isProficient: true
    }))
  }
  
  return formActions
}

/**
 * Maps parsed equipment data to Convex schema format for direct database insertion
 * This function creates the proper structure for the Convex items table and character equipment
 */
export function mapEquipmentToConvexSchema(parsedEquipment: any, userId: string) {
  // Create items for the items table
  const items: any[] = []
  
  // Process weapons
  const weapons = parsedEquipment.weapons || [];
  weapons.forEach((weapon: any) => {
    items.push({
      name: weapon.name,
      type: mapWeaponTypeToConvex(weapon.type || 'weapon'),
      rarity: 'Common' as const,
      description: weapon.notes || `Imported weapon: ${weapon.name}`,
      scope: 'entitySpecific' as const,
      weight: weapon.weight || 0,
      cost: weapon.value || 0,
      attunement: false,
      damageRolls: weapon.damage ? [parseDamageRoll(weapon.damage, weapon.damageType)] : undefined,
      userId
    })
  })
  
  // Process armor
  const armor = parsedEquipment.armor || [];
  armor.forEach((armor: any) => {
    items.push({
      name: armor.name,
      type: mapArmorTypeToConvex(armor.type || 'armor'),
      rarity: 'Common' as const,
      description: armor.notes || `Imported armor: ${armor.name}`,
      scope: 'entitySpecific' as const,
      weight: armor.weight || 0,
      cost: armor.value || 0,
      attunement: false,
      typeOfArmor: mapArmorClassToConvex(armor.armorType || 'light'),
      armorClass: armor.armorClass || 0,
      userId
    })
  })
  
  // Process other item types
  const otherItems = [
    ...(parsedEquipment.gear || []),
    ...(parsedEquipment.tools || []),
    ...(parsedEquipment.ammunition || []),
    ...(parsedEquipment.potions || []),
    ...(parsedEquipment.books || []),
    ...(parsedEquipment.valuables || [])
  ]
  
  otherItems.forEach((item: any) => {
    items.push({
      name: item.name,
      type: mapItemTypeToConvex(item.type || 'gear'),
      rarity: 'Common' as const,
      description: item.notes || `Imported item: ${item.name}`,
      scope: 'entitySpecific' as const,
      weight: item.weight || 0,
      cost: item.value || 0,
      attunement: false,
      userId
    })
  })
  
  // Create equipment slots mapping
  const equipment = {
    headgear: undefined as string | undefined,
    armwear: undefined as string | undefined,
    chestwear: undefined as string | undefined,
    legwear: undefined as string | undefined,
    footwear: undefined as string | undefined,
    mainHand: undefined as string | undefined,
    offHand: undefined as string | undefined,
    accessories: [] as string[]
  }
  
  // Map equipped items to slots using temporary IDs
  // Note: In real implementation, these would be actual item IDs from the database
  let itemIndex = 0;
  
  const weaponsToMap = parsedEquipment.weapons || [];
  weaponsToMap.forEach((weapon: any) => {
    if (weapon.equipped) {
      const tempItemId = `temp_${Date.now()}_${itemIndex++}`;
      if (weapon.properties?.twoHanded) {
        equipment.mainHand = tempItemId
      } else if (equipment.mainHand === undefined) {
        equipment.mainHand = tempItemId
      } else if (equipment.offHand === undefined) {
        equipment.offHand = tempItemId
      }
    }
  })
  
  const armorToMap = parsedEquipment.armor || [];
  armorToMap.forEach((armor: any) => {
    if (armor.equipped) {
      const tempItemId = `temp_${Date.now()}_${itemIndex++}`;
      const armorName = armor.name.toLowerCase();
      
      if (armorName.includes('helmet') || armorName.includes('hat') || armorName.includes('crown')) {
        equipment.headgear = tempItemId
      } else if (armorName.includes('gauntlet') || armorName.includes('glove') || armorName.includes('bracer')) {
        equipment.armwear = tempItemId
      } else if (armorName.includes('breastplate') || armorName.includes('chain') || 
                 armorName.includes('leather') || armorName.includes('plate') || 
                 armorName.includes('mail') || armorName.includes('armor')) {
        equipment.chestwear = tempItemId
      } else if (armorName.includes('greave') || armorName.includes('leg') || armorName.includes('pant')) {
        equipment.legwear = tempItemId
      } else if (armorName.includes('boot') || armorName.includes('shoe') || armorName.includes('sandal')) {
        equipment.footwear = tempItemId
      } else {
        // Default armor goes to chest
        equipment.chestwear = tempItemId
      }
    }
  })
  
  // Create inventory structure with proper item references
  // Note: In a real implementation, items would be created first and their IDs used here
  const inventory = {
    capacity: calculateInventoryCapacity(items),
    items: items.map((item: any, index: number) => ({ 
      itemId: `temp_${Date.now()}_${index}`, // Temporary ID until items are created
      quantity: item.quantity || 1 
    }))
  }
  
  return {
    items,
    equipment,
    inventory,
    currency: parsedEquipment.currency || {
      copper: 0,
      silver: 0,
      electrum: 0,
      gold: 0,
      platinum: 0
    }
  }
}

/**
 * Maps parsed action data to Convex schema format for direct database insertion
 * This function creates the proper structure for the Convex actions table
 */
export function mapActionsToConvexSchema(parsedActions: any, userId: string) {
  const actions: any[] = []
  
  // Process weapon attacks
  const weaponAttacks = parsedActions.weaponAttacks || [];
  weaponAttacks.forEach((weapon: any) => {
    actions.push({
      name: weapon.name,
      description: `Imported weapon attack: ${weapon.name}`,
      actionCost: 'Action' as const,
      type: determineActionType(weapon),
      requiresConcentration: false,
      sourceBook: 'Character Sheet',
      attackBonusAbilityScore: determineAttackAbility(weapon.properties),
      isProficient: true,
      damageRolls: weapon.damage ? [parseDamageRoll(weapon.damage, weapon.damageType)] : undefined,
      range: weapon.range || '5 ft.',
      createdAt: Date.now(),
      userId
    })
  })
  
  // Process spell attacks
  const spellAttacks = parsedActions.spellAttacks || [];
  spellAttacks.forEach((spell: any) => {
    actions.push({
      name: spell.name,
      description: `Imported spell: ${spell.name}`,
      actionCost: 'Action' as const,
      type: 'SPELL' as const,
      requiresConcentration: false,
      sourceBook: 'Character Sheet',
      attackBonusAbilityScore: 'intelligence',
      isProficient: true,
      damageRolls: spell.damage ? [parseDamageRoll(spell.damage, spell.damageType)] : undefined,
      range: spell.range,
      spellLevel: 0,
      castingTime: '1 action',
      components: {
        verbal: true,
        somatic: true,
        material: undefined
      },
      duration: 'Instantaneous',
      savingThrow: spell.saveDC ? {
        ability: 'dexterity',
        onSave: 'Half damage'
      } : undefined,
      spellEffectDescription: `Imported spell: ${spell.name}`,
      createdAt: Date.now(),
      userId
    })
  })
  
  // Process feature actions
  const featureActions = parsedActions.featureActions || [];
  featureActions.forEach((feature: any) => {
    actions.push({
      name: feature.name,
      description: feature.description,
      actionCost: 'Action' as const,
      type: 'CLASS_FEATURE' as const,
      requiresConcentration: false,
      sourceBook: 'Character Sheet',
      attackBonusAbilityScore: undefined,
      isProficient: true,
      damageRolls: feature.damage ? [parseDamageRoll(feature.damage, feature.damageType)] : undefined,
      range: feature.range,
      usesPer: feature.uses?.resetOn === 'short_rest' ? 'Short Rest' as const :
               feature.uses?.resetOn === 'long_rest' ? 'Long Rest' as const :
               feature.uses?.resetOn === 'dawn' ? 'Day' as const : 'Special' as const,
      maxUses: feature.uses?.max || 'Special',
      createdAt: Date.now(),
      userId
    })
  })
  
  return actions
}

// Helper functions for mapping types and parsing data

function mapWeaponTypeToConvex(type: string): any {
  const typeMap: Record<string, any> = {
    'weapon': 'Weapon',
    'melee': 'Weapon',
    'ranged': 'Weapon',
    'sword': 'Weapon',
    'axe': 'Weapon',
    'bow': 'Weapon',
    'crossbow': 'Weapon',
    'dagger': 'Weapon',
    'hammer': 'Weapon',
    'spear': 'Weapon',
    'staff': 'Staff'
  }
  return typeMap[type.toLowerCase()] || 'Weapon'
}

function mapArmorTypeToConvex(type: string): any {
  const typeMap: Record<string, any> = {
    'armor': 'Armor',
    'light': 'Armor',
    'medium': 'Armor',
    'heavy': 'Armor',
    'shield': 'Armor'
  }
  return typeMap[type.toLowerCase()] || 'Armor'
}

function mapArmorClassToConvex(armorClass: string): any {
  const classMap: Record<string, any> = {
    'light': 'Light',
    'medium': 'Medium',
    'heavy': 'Heavy',
    'shield': 'Shield'
  }
  return classMap[armorClass.toLowerCase()] || 'Light'
}

function mapItemTypeToConvex(type: string): any {
  const typeMap: Record<string, any> = {
    'gear': 'Adventuring Gear',
    'tool': 'Tool',
    'ammunition': 'Ammunition',
    'potion': 'Potion',
    'book': 'Wondrous Item',
    'valuable': 'Treasure',
    'scroll': 'Scroll',
    'ring': 'Ring',
    'rod': 'Rod',
    'wand': 'Wand'
  }
  return typeMap[type.toLowerCase()] || 'Adventuring Gear'
}

function parseDamageRoll(damageString: string, damageType?: string): any {
  // Parse damage strings like "1d6+3" or "2d8"
  const match = damageString.match(/(\d+)d(\d+)([+-]\d+)?/)
  if (match) {
    return {
      dice: {
        count: parseInt(match[1]),
        type: mapDiceType(match[2])
      },
      modifier: match[3] ? parseInt(match[3]) : 0,
      damageType: mapDamageTypeToConvex(damageType || 'bludgeoning')
    }
  }
  return {
    dice: { count: 1, type: 'D4' as const },
    modifier: 0,
    damageType: mapDamageTypeToConvex(damageType || 'bludgeoning')
  }
}

function determineActionType(weapon: any): 'MELEE_ATTACK' | 'RANGED_ATTACK' {
  // Check if weapon has range indicators for ranged attacks
  if (weapon.range && (weapon.range.includes('/') || weapon.range.includes('ft') || weapon.range.includes('range'))) {
    const rangeMatch = weapon.range.match(/\d+/);
    if (rangeMatch && parseInt(rangeMatch[0]) > 10) {
      return 'RANGED_ATTACK';
    }
  }
  
  // Check weapon properties
  if (weapon.properties?.ammunition || weapon.properties?.thrown) {
    return 'RANGED_ATTACK';
  }
  
  // Check weapon name for common ranged weapons
  const weaponName = weapon.name?.toLowerCase() || '';
  const rangedWeapons = ['bow', 'crossbow', 'sling', 'dart', 'javelin', 'handaxe', 'spear'];
  if (rangedWeapons.some(w => weaponName.includes(w))) {
    return 'RANGED_ATTACK';
  }
  
  // Default to melee
  return 'MELEE_ATTACK';
}

function determineAttackAbility(properties: any): string {
  if (properties?.finesse) {
    return 'dexterity' // Finesse weapons can use DEX
  }
  if (properties?.thrown) {
    return 'strength' // Thrown weapons typically use STR
  }
  return 'strength' // Default to strength for melee
}

function mapDiceType(diceSize: string): 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' {
  const size = parseInt(diceSize)
  switch (size) {
    case 4: return 'D4'
    case 6: return 'D6'
    case 8: return 'D8'
    case 10: return 'D10'
    case 12: return 'D12'
    case 20: return 'D20'
    default: return 'D6' // Default fallback
  }
}

function mapDamageTypeToConvex(damageType: string): 'BLUDGEONING' | 'PIERCING' | 'SLASHING' | 'ACID' | 'COLD' | 'FIRE' | 'FORCE' | 'LIGHTNING' | 'NECROTIC' | 'POISON' | 'PSYCHIC' | 'RADIANT' | 'THUNDER' {
  const typeMap: Record<string, any> = {
    'bludgeoning': 'BLUDGEONING',
    'piercing': 'PIERCING',
    'slashing': 'SLASHING',
    'acid': 'ACID',
    'cold': 'COLD',
    'fire': 'FIRE',
    'force': 'FORCE',
    'lightning': 'LIGHTNING',
    'necrotic': 'NECROTIC',
    'poison': 'POISON',
    'psychic': 'PSYCHIC',
    'radiant': 'RADIANT',
    'thunder': 'THUNDER'
  }
  return typeMap[damageType.toLowerCase()] || 'BLUDGEONING'
}

function calculateInventoryCapacity(items: any[]): number {
  // Basic capacity calculation based on character strength
  // This would typically be calculated from the character's strength score
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0)
  return Math.max(100, totalWeight * 2) // Minimum 100, or 2x total weight
}

/**
 * Finds or creates an item ID based on the item name and type
 * This function handles the mapping between parsed item names and
 * existing item IDs in the system, or creates new ones if needed
 */
export function findOrCreateItemId(
  itemName: string, 
  itemType: string,
  existingItems: Array<{ id: string, name: string, type: string }> = []
): string {
  // First, try to find an exact match
  const exactMatch = existingItems.find(item => 
    item.name.toLowerCase() === itemName.toLowerCase() && 
    item.type === itemType
  )
  
  if (exactMatch) {
    return exactMatch.id
  }
  
  // Try to find a partial match
  const partialMatch = existingItems.find(item => 
    item.name.toLowerCase().includes(itemName.toLowerCase()) && 
    item.type === itemType
  )
  
  if (partialMatch) {
    return partialMatch.id
  }
  
  // Try to find by type only
  const typeMatch = existingItems.find(item => 
    item.type === itemType && 
    item.name.toLowerCase().includes(itemName.toLowerCase().split(' ')[0])
  )
  
  if (typeMatch) {
    return typeMatch.id
  }
  
  // Generate a new ID if no match found
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return `${itemType}_${timestamp}_${randomSuffix}`
}

/**
 * Maps currency data to form format
 * This function handles the conversion of parsed currency data
 * to the format expected by the character form
 */
export function mapCurrencyToForm(currency: any) {
  // Handle different currency field naming conventions
  return {
    cp: currency.cp || currency.copper || 0,
    sp: currency.sp || currency.silver || 0,
    ep: currency.ep || currency.electrum || 0,
    gp: currency.gp || currency.gold || 0,
    pp: currency.pp || currency.platinum || 0
  }
}

/**
 * Maps proficiency data to form format
 * This function handles the conversion of parsed proficiency data
 * to the format expected by the character form
 */
export function mapProficienciesToForm(proficiencies: any) {
  return {
    armor: proficiencies.armor || [],
    weapons: proficiencies.weapons || [],
    tools: proficiencies.tools || [],
    languages: proficiencies.languages || [],
    savingThrows: proficiencies.savingThrows || [],
    skills: proficiencies.skills || []
  }
}

/**
 * Maps spell data to form format
 * This function handles the conversion of parsed spell data
 * to the format expected by the character form
 */
export function mapSpellsToForm(spells: any) {
  return {
    cantrips: spells.cantrips || [],
    firstLevel: spells.firstLevel || [],
    secondLevel: spells.secondLevel || [],
    thirdLevel: spells.thirdLevel || [],
    fourthLevel: spells.fourthLevel || [],
    fifthLevel: spells.fifthLevel || [],
    sixthLevel: spells.sixthLevel || [],
    seventhLevel: spells.seventhLevel || [],
    eighthLevel: spells.eighthLevel || [],
    ninthLevel: spells.ninthLevel || []
  }
}

/**
 * Creates a comprehensive form data object from all parsed data
 * This is the main function that combines all the mapping functions
 * to create a complete form-ready data structure
 */
export function createFormDataFromParsedData(parsedData: any) {
  const formData = {
    basicInfo: {
      name: parsedData.name || '',
      race: parsedData.race || '',
      subrace: parsedData.subrace || '',
      background: parsedData.background || '',
      alignment: parsedData.alignment || '',
      level: parsedData.level || 1,
      experience: parsedData.experience || 0
    },
    
    abilityScores: parsedData.abilityScores || {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    
    equipment: mapEquipmentToForm(parsedData.parsedEquipment || {}),
    actions: mapActionsToForm(parsedData.parsedActions || {}),
    proficiencies: mapProficienciesToForm(parsedData.proficiencies || {}),
    spells: mapSpellsToForm(parsedData.spellcasting || {}),
    features: parsedData.features || [],
    currency: mapCurrencyToForm(parsedData.parsedEquipment?.currency || {}),
    
    // Additional metadata
    confidence: parsedData.confidence || {},
    parseLog: parsedData.parseLog || [],
    importedFrom: parsedData.importedFrom || '',
    importData: parsedData.importData || {},
    importedAt: parsedData.importedAt || Date.now()
  }
  
  // Validate and enhance the form data
  return validateAndEnhanceFormData(formData)
}

/**
 * Validates and enhances form data to ensure compatibility and completeness
 * This function checks for missing required fields and provides sensible defaults
 */
export function validateAndEnhanceFormData(formData: any) {
  // Ensure all required arrays exist
  if (!formData.equipment.weapons) formData.equipment.weapons = []
  if (!formData.equipment.armor) formData.equipment.armor = []
  if (!formData.equipment.gear) formData.equipment.gear = []
  if (!formData.equipment.tools) formData.equipment.tools = []
  if (!formData.equipment.ammunition) formData.equipment.ammunition = []
  if (!formData.equipment.potions) formData.equipment.potions = []
  if (!formData.equipment.books) formData.equipment.books = []
  if (!formData.equipment.valuables) formData.equipment.valuables = []
  
  // Ensure inventory structure exists
  if (!formData.equipment.inventory) {
    formData.equipment.inventory = {
      capacity: 100,
      items: []
    }
  }
  
  // Ensure equipment structure exists
  if (!formData.equipment.equipment) {
    formData.equipment.equipment = {
      headgear: undefined,
      armwear: undefined,
      chestwear: undefined,
      legwear: undefined,
      footwear: undefined,
      mainHand: undefined,
      offHand: undefined,
      accessories: []
    }
  }
  
  // Ensure currency structure exists
  if (!formData.currency) {
    formData.currency = {
      cp: 0, sp: 0, ep: 0, gp: 0, pp: 0
    }
  }
  
  // Validate ability scores are within reasonable bounds
  Object.keys(formData.abilityScores).forEach(ability => {
    const score = formData.abilityScores[ability]
    if (typeof score !== 'number' || score < 1 || score > 30) {
      console.warn(`Invalid ability score for ${ability}: ${score}, setting to 10`)
      formData.abilityScores[ability] = 10
    }
  })
  
  return formData
}
