import { ImportedCharacterData, DND_CLASSES, CLASS_HIT_DICE, SPELLCASTING_ABILITIES } from './types'
import { importedCharacterDataSchema } from './schemas'
import { parsePDFCharacterSheet } from './pdfParser'
import { CharacterImportError } from './errors'

// Utility functions for character import parsing

// Calculate ability modifier from ability score
export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

// Calculate proficiency bonus from character level
export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1
}

// Calculate spell save DC
export function calculateSpellSaveDC(
  abilityModifier: number, 
  proficiencyBonus: number
): number {
  return 8 + abilityModifier + proficiencyBonus
}

// Calculate spell attack bonus
export function calculateSpellAttackBonus(
  abilityModifier: number, 
  proficiencyBonus: number
): number {
  return abilityModifier + proficiencyBonus
}

// Get hit die for a class
export function getClassHitDie(className: string): string {
  return CLASS_HIT_DICE[className] || 'd8'
}

// Get spellcasting ability for a class
export function getSpellcastingAbility(className: string): string | undefined {
  return SPELLCASTING_ABILITIES[className]
}

// Calculate passive perception
export function calculatePassivePerception(
  wisdomModifier: number,
  proficiencyBonus: number,
  isPerceptionProficient: boolean
): number {
  return 10 + wisdomModifier + (isPerceptionProficient ? proficiencyBonus : 0)
}

// Calculate passive investigation
export function calculatePassiveInvestigation(
  intelligenceModifier: number,
  proficiencyBonus: number,
  isInvestigationProficient: boolean
): number {
  return 10 + intelligenceModifier + (isInvestigationProficient ? proficiencyBonus : 0)
}

// Calculate passive insight
export function calculatePassiveInsight(
  wisdomModifier: number,
  proficiencyBonus: number,
  isInsightProficient: boolean
): number {
  return 10 + wisdomModifier + (isInsightProficient ? proficiencyBonus : 0)
}

// Calculate total character level from multiclass
export function calculateTotalLevel(classes: { name: string; level: number }[]): number {
  return classes.reduce((total, cls) => total + cls.level, 0)
}

// Calculate hit dice for multiclass character
export function calculateHitDice(classes: { name: string; level: number }[]): Array<{ die: string; current: number; max: number }> {
  const hitDiceMap = new Map<string, number>()
  
  classes.forEach(cls => {
    const hitDie = getClassHitDie(cls.name)
    const current = hitDiceMap.get(hitDie) || 0
    hitDiceMap.set(hitDie, current + cls.level)
  })
  
  return Array.from(hitDiceMap.entries()).map(([die, count]) => ({
    die,
    current: count,
    max: count,
  }))
}

// Parse JSON character data
export function parseJSONCharacterData(jsonData: any): ImportedCharacterData {
  try {
    // Handle common JSON formats (D&D Beyond, etc.)
    const normalizedData = normalizeJSONData(jsonData)
    
    // Validate the normalized data
    const validatedData = importedCharacterDataSchema.parse(normalizedData)
    
    return validatedData
  } catch (error) {
    if (error instanceof Error) {
      throw new CharacterImportError(`Failed to parse JSON character data: ${error.message}`)
    }
    throw new CharacterImportError('Failed to parse JSON character data: Unknown error')
  }
}

// Normalize different JSON formats to our standard format
function normalizeJSONData(data: any): Partial<ImportedCharacterData> {
  // Handle D&D Beyond format (has classes array with definition structure)
  if (data.name && data.classes && Array.isArray(data.classes) && 
      data.classes[0]?.definition?.name) {
    return normalizeDnDBeyondData(data)
  }
  
  // Handle multiclass data (has classes array with name/level structure)
  if (data.name && data.classes && Array.isArray(data.classes) && 
      data.classes[0]?.name && data.classes[0]?.level) {
    // Already in our format, just pass through
    return data
  }
  
  // Handle basic D&D 5e JSON format (single class)
  if (data.name && data.class && !data.classes) {
    return normalizeBasicDnDData(data)
  }
  
  // Assume it's already in our format
  return data
}

// Normalize D&D Beyond JSON format
function normalizeDnDBeyondData(data: any): Partial<ImportedCharacterData> {
  const abilityScores = {
    strength: data.stats?.[0]?.value || data.strength || 10,
    dexterity: data.stats?.[1]?.value || data.dexterity || 10,
    constitution: data.stats?.[2]?.value || data.constitution || 10,
    intelligence: data.stats?.[3]?.value || data.intelligence || 10,
    wisdom: data.stats?.[4]?.value || data.wisdom || 10,
    charisma: data.stats?.[5]?.value || data.charisma || 10,
  }

  const classes = data.classes?.map((cls: any) => ({
    name: cls.definition?.name || cls.name,
    level: cls.level || 1,
    hitDie: getClassHitDie(cls.definition?.name || cls.name),
    subclass: cls.subclassDefinition?.name || cls.subclass,
    features: cls.classFeatures?.map((f: any) => f.definition?.name || f.name) || [],
  })) || []

  const totalLevel = calculateTotalLevel(classes)
  const proficiencyBonus = calculateProficiencyBonus(totalLevel)

  // Extract skills
  const skills = data.modifiers
    ?.filter((mod: any) => mod.type === 'proficiency' && mod.subType === 'ability-check')
    ?.map((mod: any) => mod.friendlySubtypeName)
    || []

  // Extract saving throws
  const savingThrows = data.modifiers
    ?.filter((mod: any) => mod.type === 'proficiency' && mod.subType === 'saving-throws')
    ?.map((mod: any) => mod.friendlySubtypeName)
    || []

  return {
    name: data.name,
    race: data.race?.fullName || data.race?.baseName || 'Human',
    subrace: data.race?.subRaceShortName,
    classes,
    background: data.background?.definition?.name || data.background?.name || 'Folk Hero',
    alignment: data.alignmentId ? getAlignmentFromId(data.alignmentId) : undefined,
    level: totalLevel,
    experiencePoints: data.currentXp || 0,
    abilityScores,
    hitPoints: data.baseHitPoints || data.hitPoints || 1,
    maxHitPoints: data.baseHitPoints || data.hitPoints || 1,
    currentHitPoints: data.hitPoints || data.baseHitPoints || 1,
    armorClass: data.armorClass || 10,
    skills,
    savingThrows,
    proficiencies: [],
    speed: `${data.race?.weightSpeeds?.normal?.walk || 30} ft.`,
    hitDice: calculateHitDice(classes),
    languages: data.languages?.map((lang: any) => lang.definition?.name || lang.name) || [],
    traits: data.traits?.map((trait: any) => trait.definition?.name || trait.name) || [],
    features: data.classFeatures?.map((feature: any) => ({
      name: feature.definition?.name || feature.name,
      description: feature.definition?.description || feature.description || '',
      source: 'class',
    })) || [],
    importSource: 'dnd_beyond',
    originalData: data,
  }
}

// Normalize basic D&D JSON format
function normalizeBasicDnDData(data: any): Partial<ImportedCharacterData> {
  const classes = data.classes || [{
    name: data.class,
    level: data.level || 1,
    hitDie: getClassHitDie(data.class),
    subclass: data.subclass,
  }]

  return {
    name: data.name,
    race: data.race,
    subrace: data.subrace,
    classes,
    background: data.background,
    alignment: data.alignment,
    level: data.level || calculateTotalLevel(classes),
    experiencePoints: data.experiencePoints || data.xp || 0,
    abilityScores: {
      strength: data.abilityScores?.strength || data.strength || 10,
      dexterity: data.abilityScores?.dexterity || data.dexterity || 10,
      constitution: data.abilityScores?.constitution || data.constitution || 10,
      intelligence: data.abilityScores?.intelligence || data.intelligence || 10,
      wisdom: data.abilityScores?.wisdom || data.wisdom || 10,
      charisma: data.abilityScores?.charisma || data.charisma || 10,
    },
    hitPoints: data.hitPoints || data.hp || 1,
    maxHitPoints: data.maxHitPoints || data.maxHp || data.hitPoints || data.hp || 1,
    currentHitPoints: data.currentHitPoints || data.currentHp || data.hitPoints || data.hp || 1,
    armorClass: data.armorClass || data.ac || 10,
    skills: data.skills || [],
    savingThrows: data.savingThrows || [],
    proficiencies: data.proficiencies || [],
    speed: data.speed,
    languages: data.languages || [],
    traits: data.traits || [],
    hitDice: data.hitDice || calculateHitDice(classes),
    importSource: 'json',
    originalData: data,
  }
}

// Helper function to convert D&D Beyond alignment ID to string
function getAlignmentFromId(alignmentId: number): string {
  const alignments: Record<number, string> = {
    1: 'Lawful Good',
    2: 'Neutral Good',
    3: 'Chaotic Good',
    4: 'Lawful Neutral',
    5: 'True Neutral',
    6: 'Chaotic Neutral',
    7: 'Lawful Evil',
    8: 'Neutral Evil',
    9: 'Chaotic Evil',
  }
  return alignments[alignmentId] || 'True Neutral'
}

// Validate and process imported character data
export function processImportedCharacter(data: ImportedCharacterData): ImportedCharacterData {
  // Calculate derived values
  const totalLevel = calculateTotalLevel(data.classes)
  const proficiencyBonus = calculateProficiencyBonus(totalLevel)
  
  // Calculate ability modifiers
  const abilityModifiers = {
    strength: calculateAbilityModifier(data.abilityScores.strength),
    dexterity: calculateAbilityModifier(data.abilityScores.dexterity),
    constitution: calculateAbilityModifier(data.abilityScores.constitution),
    intelligence: calculateAbilityModifier(data.abilityScores.intelligence),
    wisdom: calculateAbilityModifier(data.abilityScores.wisdom),
    charisma: calculateAbilityModifier(data.abilityScores.charisma),
  }

  // Calculate passive scores if not provided
  const isPerceptionProficient = data.skills.includes('Perception')
  const isInvestigationProficient = data.skills.includes('Investigation')
  const isInsightProficient = data.skills.includes('Insight')

  const processedData: ImportedCharacterData = {
    ...data,
    level: totalLevel,
    passivePerception: data.passivePerception || calculatePassivePerception(
      abilityModifiers.wisdom, 
      proficiencyBonus, 
      isPerceptionProficient
    ),
    passiveInvestigation: data.passiveInvestigation || calculatePassiveInvestigation(
      abilityModifiers.intelligence, 
      proficiencyBonus, 
      isInvestigationProficient
    ),
    passiveInsight: data.passiveInsight || calculatePassiveInsight(
      abilityModifiers.wisdom, 
      proficiencyBonus, 
      isInsightProficient
    ),
    initiative: data.initiative || abilityModifiers.dexterity,
    hitDice: data.hitDice || calculateHitDice(data.classes),
  }

  // Calculate spellcasting info for caster classes
  const casterClasses = data.classes.filter(cls => SPELLCASTING_ABILITIES[cls.name])
  if (casterClasses.length > 0 && !data.spellcastingAbility) {
    const primaryCaster = casterClasses[0]
    const spellcastingAbility = getSpellcastingAbility(primaryCaster.name)
    if (spellcastingAbility) {
      const abilityKey = spellcastingAbility.toLowerCase() as keyof typeof abilityModifiers
      const abilityMod = abilityModifiers[abilityKey]
      
      processedData.spellcastingAbility = spellcastingAbility
      processedData.spellSaveDC = data.spellSaveDC || calculateSpellSaveDC(abilityMod, proficiencyBonus)
      processedData.spellAttackBonus = data.spellAttackBonus || calculateSpellAttackBonus(abilityMod, proficiencyBonus)
    }
  }

  // Enhanced data mapping for equipment and actions if available
  if (data.originalData?.parsedEquipment) {
    const equipmentData = mapEquipmentToForm(data.originalData.parsedEquipment)
    processedData.equipment = equipmentData.equipment
    processedData.inventory = equipmentData.inventory.items.map(item => ({
      name: item.itemId, // This will be enhanced to show actual item names
      quantity: item.quantity,
      description: `Imported from character sheet`,
      weight: 0, // Default weight
      value: 0 // Default value
    }))
  }

  if (data.originalData?.parsedActions) {
    const actionsData = mapActionsToForm(data.originalData.parsedActions)
    // Add actions to features if they don't exist
    const existingFeatures = processedData.features || []
    const actionFeatures = actionsData.actions.map(actionName => ({
      name: actionName,
      description: `Imported action from character sheet`,
      source: 'character_import'
    }))
    processedData.features = [...existingFeatures, ...actionFeatures]
    
    // Add weapon proficiencies
    if (actionsData.weaponProficiencies.length > 0) {
      processedData.weaponProficiencies = [
        ...(processedData.weaponProficiencies || []),
        ...actionsData.weaponProficiencies
      ]
    }
    
    // Add combat notes to character notes
    if (actionsData.combatNotes) {
      const existingNotes = processedData.notes || ''
      processedData.notes = existingNotes 
        ? `${existingNotes}\n\nCombat Actions:\n${actionsData.combatNotes}`
        : `Combat Actions:\n${actionsData.combatNotes}`
    }
  }

  return processedData
}

// Parse character data from file upload
export async function parseCharacterFile(file: File): Promise<ImportedCharacterData> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()

  try {
    if (fileType === 'application/json' || fileName.endsWith('.json')) {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      return parseJSONCharacterData(jsonData)
    }
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Use workerized PDF parsing for responsiveness
      const worker = new Worker(new URL('../../workers/parseWorker.ts', import.meta.url), { type: 'module' })
      const arrayBuffer = await file.arrayBuffer()
      const parsedData = await new Promise<any>((resolve, reject) => {
        const onMessage = (ev: MessageEvent) => {
          const data = ev.data
          if (!data || !data.type) return
          if (data.type === 'progress') {
            // Optionally: expose via callback/event bus in future
            return
          }
          if (data.type === 'result') {
            worker.removeEventListener('message', onMessage)
            worker.terminate()
            if (data.ok) resolve(data.parsed)
            else reject(new CharacterImportError(data.error))
          }
        }
        worker.addEventListener('message', onMessage)
        worker.postMessage({ type: 'parse', fileBuffer: arrayBuffer, fileName, fileSize: file.size, ocrAllowed: true })
      })
      
      // Convert ParsedCharacterData to ImportedCharacterData (preserve enhanced parsed data)
      const { confidence, parseLog, uncapturedData, parsedEquipment, parsedActions, ...importedData } = parsedData
      
      // Store parsing metadata and enhanced data in originalData
      if (!importedData.originalData) {
        importedData.originalData = {}
      }
      importedData.originalData.confidence = confidence
      importedData.originalData.parseLog = parseLog
      importedData.originalData.uncapturedData = uncapturedData
      importedData.originalData.parsedEquipment = parsedEquipment
      importedData.originalData.parsedActions = parsedActions
      
      return importedData as ImportedCharacterData
    }
    
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      throw new CharacterImportError('Text file import is not yet supported. Please use JSON format or manual entry.')
    }
    
    throw new CharacterImportError(`Unsupported file type: ${fileType}`)
  } catch (error) {
    if (error instanceof CharacterImportError) {
      throw error
    }
    throw new CharacterImportError(`Failed to parse character file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Enhanced data mapping functions for equipment and actions
export function mapEquipmentToForm(parsedEquipment: any): {
  inventory: { capacity: number; items: Array<{itemId: string; quantity: number}> }
  equipment: any
} {
  // Transform inventory items to form format
  const inventoryItems = parsedEquipment.inventory.map((item: any) => ({
    itemId: findOrCreateItemId(item.name, item.type),
    quantity: item.quantity
  }))
  
  // Transform equipped items to form format
  const equipment = {
    headgear: parsedEquipment.equipment.headgear ? findOrCreateItemId(parsedEquipment.equipment.headgear, 'armor') : undefined,
    armwear: parsedEquipment.equipment.armwear ? findOrCreateItemId(parsedEquipment.equipment.armwear, 'armor') : undefined,
    chestwear: parsedEquipment.equipment.chestwear ? findOrCreateItemId(parsedEquipment.equipment.chestwear, 'armor') : undefined,
    legwear: parsedEquipment.equipment.legwear ? findOrCreateItemId(parsedEquipment.equipment.legwear, 'armor') : undefined,
    footwear: parsedEquipment.equipment.footwear ? findOrCreateItemId(parsedEquipment.equipment.footwear, 'armor') : undefined,
    mainHand: parsedEquipment.equipment.mainHand ? findOrCreateItemId(parsedEquipment.equipment.mainHand, 'weapon') : undefined,
    offHand: parsedEquipment.equipment.offHand ? findOrCreateItemId(parsedEquipment.equipment.offHand, 'weapon') : undefined,
    accessories: parsedEquipment.equipment.accessories?.map((acc: string) => findOrCreateItemId(acc, 'gear')) || []
  }
  
  return { 
    inventory: { 
      capacity: calculateInventoryCapacity(parsedEquipment.inventory), 
      items: inventoryItems 
    }, 
    equipment 
  }
}

export function mapActionsToForm(parsedActions: any): {
  actions: string[]
  weaponProficiencies: string[]
  combatNotes: string
} {
  // Extract action names for basic actions field
  const actions = [
    ...parsedActions.weaponAttacks.map((w: any) => w.name),
    ...parsedActions.spellAttacks.map((s: any) => s.name),
    ...parsedActions.featureActions.map((f: any) => f.name)
  ]
  
  // Extract weapon types for proficiencies
  const weaponProficiencies = parsedActions.weaponAttacks
    .map((w: any) => extractWeaponType(w.name))
    .filter((w: string, i: number, arr: string[]) => arr.indexOf(w) === i)
  
  // Create combat notes with detailed stats
  const combatNotes = generateCombatNotes(parsedActions)
  
  return { actions, weaponProficiencies, combatNotes }
}

// Helper function to find or create item IDs
function findOrCreateItemId(itemName: string, itemType: string): string {
  // For now, return a placeholder ID - in a real implementation,
  // this would look up existing items in the database or create new ones
  return `item_${itemName.toLowerCase().replace(/\s+/g, '_')}_${itemType}`
}

// Helper function to calculate inventory capacity
function calculateInventoryCapacity(inventory: any[]): number {
  // Basic capacity calculation - could be enhanced with strength modifier
  const baseCapacity = 100
  const itemCount = inventory.reduce((sum: number, item: any) => sum + item.quantity, 0)
  return Math.max(baseCapacity, itemCount * 10)
}

// Helper function to extract weapon type from weapon name
function extractWeaponType(weaponName: string): string {
  const weaponLower = weaponName.toLowerCase()
  
  // Simple weapon type detection
  if (weaponLower.includes('sword')) return 'Sword'
  if (weaponLower.includes('axe')) return 'Axe'
  if (weaponLower.includes('hammer')) return 'Hammer'
  if (weaponLower.includes('bow')) return 'Bow'
  if (weaponLower.includes('crossbow')) return 'Crossbow'
  if (weaponLower.includes('dagger')) return 'Dagger'
  if (weaponLower.includes('spear')) return 'Spear'
  if (weaponLower.includes('staff')) return 'Staff'
  if (weaponLower.includes('mace')) return 'Mace'
  if (weaponLower.includes('flail')) return 'Flail'
  if (weaponLower.includes('glaive')) return 'Glaive'
  if (weaponLower.includes('halberd')) return 'Halberd'
  if (weaponLower.includes('lance')) return 'Lance'
  if (weaponLower.includes('rapier')) return 'Rapier'
  if (weaponLower.includes('scimitar')) return 'Scimitar'
  if (weaponLower.includes('trident')) return 'Trident'
  if (weaponLower.includes('whip')) return 'Whip'
  
  return 'Weapon' // Default fallback
}

// Helper function to generate combat notes from parsed actions
function generateCombatNotes(parsedActions: any): string {
  const notes: string[] = []
  
  // Add weapon attack details
  if (parsedActions.weaponAttacks.length > 0) {
    notes.push('Weapon Attacks:')
    parsedActions.weaponAttacks.forEach((weapon: any) => {
      const properties = Object.keys(weapon.properties || {}).join(', ')
      notes.push(`  ${weapon.name}: +${weapon.attackBonus} to hit, ${weapon.damage} ${weapon.damageType} damage${weapon.range ? `, ${weapon.range}` : ''}${properties ? ` (${properties})` : ''}`)
    })
  }
  
  // Add spell attack details
  if (parsedActions.spellAttacks.length > 0) {
    notes.push('Spell Attacks:')
    parsedActions.spellAttacks.forEach((spell: any) => {
      notes.push(`  ${spell.name}: +${spell.attackBonus} to hit, ${spell.damage} ${spell.damageType} damage, ${spell.range}`)
    })
  }
  
  // Add feature action details
  if (parsedActions.featureActions.length > 0) {
    notes.push('Feature Actions:')
    parsedActions.featureActions.forEach((feature: any) => {
      let featureNote = `  ${feature.name}`
      if (feature.damage) featureNote += `: ${feature.damage} ${feature.damageType} damage`
      if (feature.saveDC) featureNote += `, DC ${feature.saveDC}`
      if (feature.range) featureNote += `, ${feature.range}`
      if (feature.uses) featureNote += ` (${feature.uses.current}/${feature.uses.max} ${feature.uses.resetOn})`
      notes.push(featureNote)
    })
  }
  
  return notes.join('\n')
}
