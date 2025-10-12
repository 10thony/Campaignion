// Character import types for D&D 5e character sheets

export interface ImportedCharacterData {
  // Basic Information
  name: string
  race: string
  subrace?: string
  classes: ImportedClassData[]
  background: string
  alignment?: string
  level: number
  experiencePoints: number

  // Ability Scores
  abilityScores: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  baseAbilityScores?: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  racialAbilityScoreImprovements?: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }

  // Hit Points and AC
  hitPoints: number
  maxHitPoints?: number
  currentHitPoints?: number
  tempHitPoints?: number
  hitDice?: ImportedHitDie[]
  armorClass: number
  baseArmorClass?: number

  // Skills and Proficiencies
  skills: string[]
  skillProficiencies?: ImportedSkillProficiency[]
  savingThrows: string[]
  savingThrowProficiencies?: ImportedSavingThrowProficiency[]
  proficiencies: string[]
  weaponProficiencies?: string[]
  armorProficiencies?: string[]
  toolProficiencies?: string[]

  // Character Features
  traits?: string[]
  racialTraits?: ImportedTrait[]
  features?: ImportedFeature[]
  feats?: ImportedFeat[]
  languages?: string[]

  // Movement and Senses
  speed?: string
  speeds?: {
    walking?: number
    swimming?: number
    flying?: number
    climbing?: number
    burrowing?: number
  }
  initiative?: number
  passivePerception?: number
  passiveInvestigation?: number
  passiveInsight?: number

  // Spellcasting
  spellcastingAbility?: string
  spellSaveDC?: number
  spellAttackBonus?: number
  spellSlots?: ImportedSpellSlot[]
  spellsKnown?: string[]
  cantripsKnown?: string[]

  // Other Resources
  inspiration?: boolean
  deathSaves?: {
    successes: number
    failures: number
  }

  // Equipment and Inventory
  equipment?: ImportedEquipment
  inventory?: ImportedInventoryItem[]

  // Actions and Combat
  actions?: string[]

  // Import metadata
  importSource?: 'dnd_beyond' | 'json' | 'pdf' | 'manual'
  importedAt?: number
  originalData?: {
    confidence?: { [key: string]: 'high' | 'medium' | 'low' }
    parseLog?: string[]
    importedAt?: number
  }
}

export interface ImportedClassData {
  name: string
  level: number
  hitDie: string
  features?: string[]
  subclass?: string
}

export interface ImportedHitDie {
  die: string
  current: number
  max: number
}

export interface ImportedSkillProficiency {
  skill: string
  proficient: boolean
  expertise?: boolean
  source?: string
}

export interface ImportedSavingThrowProficiency {
  ability: string
  proficient: boolean
  source?: string
}

export interface ImportedTrait {
  name: string
  description: string
}

export interface ImportedFeature {
  name: string
  description: string
  source: string
  uses?: {
    current: number
    max: number
    resetOn: string
  }
}

export interface ImportedFeat {
  name: string
  description: string
}

export interface ImportedSpellSlot {
  level: number
  total: number
  used: number
}

export interface ImportedEquipment {
  headgear?: string
  armwear?: string
  chestwear?: string
  legwear?: string
  footwear?: string
  mainHand?: string
  offHand?: string
  accessories?: string[]
}

export interface ImportedInventoryItem {
  name: string
  quantity: number
  description?: string
  weight?: number
  value?: number
}

// Enhanced parsed data interfaces for improved PDF parsing
export interface ParsedEquipmentData {
  // Inventory items with quantities
  inventory: Array<{
    name: string
    quantity: number
    description?: string
    weight?: number
    value?: number
    type: 'weapon' | 'armor' | 'tool' | 'gear' | 'ammunition' | 'potion' | 'book' | 'valuable' | 'currency'
  }>
  
  // Equipped items by slot
  equipment: {
    headgear?: string
    armwear?: string
    chestwear?: string
    legwear?: string
    footwear?: string
    mainHand?: string
    offHand?: string
    accessories: string[]
  }
  
  // Currency and wealth
  currency: {
    copper?: number
    silver?: number
    electrum?: number
    gold?: number
    platinum?: number
  }
}

export interface ParsedActionData {
  // Weapon attacks with full stats
  weaponAttacks: Array<{
    name: string
    attackBonus: number
    damage: string
    damageType: string
    range?: string
    properties: {
      finesse?: boolean
      versatile?: boolean
      heavy?: boolean
      light?: boolean
      reach?: boolean
      thrown?: boolean
      ammunition?: boolean
      loading?: boolean
      twoHanded?: boolean
    }
  }>
  
  // Spell attacks
  spellAttacks: Array<{
    name: string
    attackBonus: number
    damage: string
    damageType: string
    range: string
    saveDC?: number
  }>
  
  // Feature-based actions
  featureActions: Array<{
    name: string
    description: string
    damage?: string
    damageType?: string
    saveDC?: number
    range?: string
    uses?: {
      current: number
      max: number
      resetOn: string
    }
  }>
}

// Enhanced parsed character data with equipment and actions
export interface ParsedCharacterData extends ImportedCharacterData {
  uncapturedData?: any
  confidence?: {
    [key: string]: 'high' | 'medium' | 'low'
  }
  parseLog?: string[]
  importedFrom?: string
  importData?: any
  importedAt?: number
  // Enhanced parsed data for form mapping
  parsedEquipment?: ParsedEquipmentData
  parsedActions?: ParsedActionData
}

// Common D&D 5e reference data
export const DND_CLASSES = [
  'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
] as const

export const DND_RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf',
  'Half-Orc', 'Tiefling', 'Aarakocra', 'Genasi', 'Goliath', 'Aasimar',
  'Firbolg', 'Kenku', 'Lizardfolk', 'Tabaxi', 'Triton', 'Bugbear',
  'Goblin', 'Hobgoblin', 'Kobold', 'Orc', 'Yuan-ti Pureblood'
] as const

export const DND_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
] as const

export const DND_ABILITIES = [
  'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'
] as const

export const DND_ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
] as const

export const CLASS_HIT_DICE: Record<string, string> = {
  'Artificer': 'd8',
  'Barbarian': 'd12',
  'Bard': 'd8',
  'Cleric': 'd8',
  'Druid': 'd8',
  'Fighter': 'd10',
  'Monk': 'd8',
  'Paladin': 'd10',
  'Ranger': 'd10',
  'Rogue': 'd8',
  'Sorcerer': 'd6',
  'Warlock': 'd8',
  'Wizard': 'd6'
}

export const SPELLCASTING_ABILITIES: Record<string, string> = {
  'Artificer': 'Intelligence',
  'Bard': 'Charisma',
  'Cleric': 'Wisdom',
  'Druid': 'Wisdom',
  'Paladin': 'Charisma',
  'Ranger': 'Wisdom',
  'Sorcerer': 'Charisma',
  'Warlock': 'Charisma',
  'Wizard': 'Intelligence'
}
