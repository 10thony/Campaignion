/**
 * D&D 5e Game Constants
 * 
 * This file centralizes all hardcoded D&D 5e game rules and constants
 * that are currently scattered throughout the codebase.
 * 
 * These constants should eventually be moved to database tables for
 * better maintainability and flexibility.
 */

export const DND5E_CONSTANTS = {
  // Ability Score System
  ABILITY_SCORES: {
    NAMES: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const,
    DISPLAY_NAMES: [
      { key: 'strength', label: 'Strength', short: 'STR' },
      { key: 'dexterity', label: 'Dexterity', short: 'DEX' },
      { key: 'constitution', label: 'Constitution', short: 'CON' },
      { key: 'intelligence', label: 'Intelligence', short: 'INT' },
      { key: 'wisdom', label: 'Wisdom', short: 'WIS' },
      { key: 'charisma', label: 'Charisma', short: 'CHA' },
    ] as const,
    POINT_BUY: {
      MIN: 8,
      MAX: 15,
      TOTAL_POINTS: 27,
      COSTS: { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 } as const,
    },
    SCORE_RANGE: {
      MIN: 1,
      MAX: 30,
    },
    MODIFIER_FORMULA: (score: number): number => Math.floor((score - 10) / 2),
  },

  // Character Classes
  CLASSES: {
    HIT_DICE: {
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
      'Wizard': 'd6',
    } as const,
    PROFICIENCY_BONUS_FORMULA: (level: number): number => Math.ceil(level / 4) + 1,
  },

  // Equipment System
  EQUIPMENT: {
    SLOTS: [
      { key: 'headgear', label: 'Head', icon: '🪖', allowedTypes: ['Armor'] },
      { key: 'armwear', label: 'Arms', icon: '🥽', allowedTypes: ['Armor'] },
      { key: 'chestwear', label: 'Chest', icon: '🦺', allowedTypes: ['Armor'] },
      { key: 'legwear', label: 'Legs', icon: '👖', allowedTypes: ['Armor'] },
      { key: 'footwear', label: 'Feet', icon: '👢', allowedTypes: ['Armor'] },
      { key: 'mainHand', label: 'Main Hand', icon: '⚔️', allowedTypes: ['Weapon', 'Shield'] },
      { key: 'offHand', label: 'Off Hand', icon: '🛡️', allowedTypes: ['Weapon', 'Shield'] },
      { key: 'accessories', label: 'Accessories', icon: '💍', allowedTypes: ['Ring', 'Wondrous Item'] },
    ] as const,
    SLOT_KEYS: ['headgear', 'armwear', 'chestwear', 'legwear', 'footwear', 'mainHand', 'offHand', 'accessories'] as const,
  },

  // Action System
  ACTIONS: {
    COSTS: [
      { value: 'Action', icon: 'Sword', color: 'bg-red-100 text-red-800', description: 'Standard action during turn' },
      { value: 'Bonus Action', icon: 'Zap', color: 'bg-yellow-100 text-yellow-800', description: 'Quick action during turn' },
      { value: 'Reaction', icon: 'Shield', color: 'bg-blue-100 text-blue-800', description: 'Response to trigger' },
      { value: 'No Action', icon: null, color: 'bg-gray-100 text-gray-800', description: 'Free action' },
      { value: 'Special', icon: null, color: 'bg-purple-100 text-purple-800', description: 'Unique timing' },
    ] as const,
    TYPES: [
      'MELEE_ATTACK',
      'RANGED_ATTACK',
      'SPELL',
      'COMMONLY_AVAILABLE_UTILITY',
      'CLASS_FEATURE',
      'BONUS_ACTION',
      'REACTION',
      'OTHER',
    ] as const,
  },

  // Dice System
  DICE: {
    TYPES: ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'] as const,
    ROLL_FORMULAS: {
      '4d6_drop_lowest': (): number => {
        const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
        rolls.sort((a, b) => b - a);
        return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
      },
    },
  },

  // Damage Types
  DAMAGE_TYPES: [
    'BLUDGEONING',
    'PIERCING',
    'SLASHING',
    'ACID',
    'COLD',
    'FIRE',
    'FORCE',
    'LIGHTNING',
    'NECROTIC',
    'POISON',
    'PSYCHIC',
    'RADIANT',
    'THUNDER',
  ] as const,

  // Item System
  ITEMS: {
    TYPES: [
      'Weapon',
      'Armor',
      'Potion',
      'Scroll',
      'Wondrous Item',
      'Ring',
      'Rod',
      'Staff',
      'Wand',
      'Ammunition',
      'Adventuring Gear',
      'Tool',
      'Mount',
      'Vehicle',
      'Treasure',
      'Other',
    ] as const,
    RARITY: [
      'Common',
      'Uncommon',
      'Rare',
      'Very Rare',
      'Legendary',
      'Artifact',
      'Unique',
    ] as const,
    ARMOR_CATEGORIES: [
      'Light',
      'Medium',
      'Heavy',
      'Shield',
    ] as const,
  },

  // Spell System
  SPELLS: {
    LEVELS: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const,
    REST_TYPES: [
      'Short Rest',
      'Long Rest',
      'Day',
      'Special',
    ] as const,
  },

  // Character Types
  CHARACTER_TYPES: [
    'player',
    'npc',
  ] as const,

  // User Roles
  USER_ROLES: [
    'admin',
    'user',
  ] as const,

  // Map System
  MAP: {
    CELL_STATES: [
      'inbounds',
      'outbounds',
      'occupied',
    ] as const,
    TERRAIN_TYPES: [
      'normal',
      'difficult',
      'impassable',
      'water',
      'forest',
      'mountain',
      'desert',
      'swamp',
      'urban',
    ] as const,
  },

  // Default Values
  DEFAULTS: {
    CHARACTER: {
      BACKGROUND: 'Sample Background',
      SPEED: '30 ft.',
      PROFICIENCY_BONUS: 2,
      ALIGNMENT: 'Neutral',
      HIT_DIE: 'd8',
    },
    MONSTER: {
      HIT_DIE: 'd6',
      PROFICIENCY_BONUS: 2,
    },
  },
} as const;

// Type exports for use in components
export type AbilityScoreKey = typeof DND5E_CONSTANTS.ABILITY_SCORES.NAMES[number];
export type EquipmentSlotKey = typeof DND5E_CONSTANTS.EQUIPMENT.SLOT_KEYS[number];
export type ActionCost = typeof DND5E_CONSTANTS.ACTIONS.COSTS[number]['value'];
export type ActionType = typeof DND5E_CONSTANTS.ACTIONS.TYPES[number];
export type DiceType = typeof DND5E_CONSTANTS.DICE.TYPES[number];
export type DamageType = typeof DND5E_CONSTANTS.DAMAGE_TYPES[number];
export type ItemType = typeof DND5E_CONSTANTS.ITEMS.TYPES[number];
export type ItemRarity = typeof DND5E_CONSTANTS.ITEMS.RARITY[number];
export type ArmorCategory = typeof DND5E_CONSTANTS.ITEMS.ARMOR_CATEGORIES[number];
export type SpellLevel = typeof DND5E_CONSTANTS.SPELLS.LEVELS[number];
export type RestType = typeof DND5E_CONSTANTS.SPELLS.REST_TYPES[number];
export type CharacterType = typeof DND5E_CONSTANTS.CHARACTER_TYPES[number];
export type UserRole = typeof DND5E_CONSTANTS.USER_ROLES[number];
export type CellState = typeof DND5E_CONSTANTS.MAP.CELL_STATES[number];
export type TerrainType = typeof DND5E_CONSTANTS.MAP.TERRAIN_TYPES[number];

// Helper functions
export const getAbilityScoreDisplayName = (key: AbilityScoreKey) => {
  return DND5E_CONSTANTS.ABILITY_SCORES.DISPLAY_NAMES.find(item => item.key === key);
};

export const getEquipmentSlot = (key: EquipmentSlotKey) => {
  return DND5E_CONSTANTS.EQUIPMENT.SLOTS.find(slot => slot.key === key);
};

export const getActionCostConfig = (cost: ActionCost) => {
  return DND5E_CONSTANTS.ACTIONS.COSTS.find(item => item.value === cost);
};

export const getClassHitDie = (className: string): string => {
  return DND5E_CONSTANTS.CLASSES.HIT_DICE[className as keyof typeof DND5E_CONSTANTS.CLASSES.HIT_DICE] || 'd8';
};

export const calculateProficiencyBonus = (level: number): number => {
  return DND5E_CONSTANTS.CLASSES.PROFICIENCY_BONUS_FORMULA(level);
};

export const calculateAbilityModifier = (score: number): number => {
  return DND5E_CONSTANTS.ABILITY_SCORES.MODIFIER_FORMULA(score);
};

export const roll4d6DropLowest = (): number => {
  return DND5E_CONSTANTS.DICE.ROLL_FORMULAS['4d6_drop_lowest']();
};
