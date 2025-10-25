import { Id } from "../convex/_generated/dataModel";

export type TokenType = "pc" | "npc_friendly" | "npc_foe";

export interface BattleToken {
  _id: Id<"battleTokens">;
  x: number;
  y: number;
  label: string;
  type: TokenType;
  color: string;
  size: number;
  hp?: number;
  maxHp?: number;
  speed?: number;
  characterId?: Id<"characters">;
  monsterId?: Id<"monsters">;
}

export interface Action {
  _id: Id<"actions">;
  name: string;
  description: string;
  actionCost: "Action" | "Bonus Action" | "Reaction" | "No Action" | "Special";
  type: "MELEE_ATTACK" | "RANGED_ATTACK" | "SPELL" | "COMMONLY_AVAILABLE_UTILITY" | "CLASS_FEATURE" | "BONUS_ACTION" | "REACTION" | "OTHER";
  requiresConcentration: boolean;
  sourceBook: string;
  attackBonusAbilityScore?: string;
  isProficient?: boolean;
  damageRolls?: Array<{
    dice: { count: number; type: "D4" | "D6" | "D8" | "D10" | "D12" | "D20" };
    modifier: number;
    damageType: "BLUDGEONING" | "PIERCING" | "SLASHING" | "ACID" | "COLD" | "FIRE" | "FORCE" | "LIGHTNING" | "NECROTIC" | "POISON" | "PSYCHIC" | "RADIANT" | "THUNDER";
  }>;
  spellLevel?: number;
  castingTime?: string;
  range?: string;
  components?: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materialComponent?: string;
  };
  duration?: string;
  savingThrow?: {
    ability: string;
    onSave: string;
  };
  spellEffectDescription?: string;
  category: "general" | "class_specific" | "race_specific" | "feat_specific";
  requiredClass?: string;
  requiredClasses?: string[];
  requiredLevel?: number;
  requiredSubclass?: string;
  className?: string;
  usesPer?: "Short Rest" | "Long Rest" | "Day" | "Special";
  maxUses?: number | string;
  isBaseAction?: boolean;
  tags?: string[];
  prerequisites?: string[];
  targetClass?: string;
  createdAt: number;
}

export interface Character {
  _id: Id<"characters">;
  name: string;
  characterType: "player" | "npc";
  level?: number;
  classes?: Array<{
    name: string;
    level: number;
  }>;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  abilityModifiers?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  armorClass?: number;
  hitPoints?: number;
  maxHitPoints?: number;
  speed?: number;
  spellSlots?: Array<{
    level: number;
    total: number;
    used: number;
  }>;
  actions?: Id<"actions">[];
  createdAt: number;
}

export interface Monster {
  _id: Id<"monsters">;
  name: string;
  size: "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: number;
  speed: {
    walking?: number;
    swimming?: number;
    flying?: number;
    climbing?: number;
    burrowing?: number;
  };
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  actions?: Array<{
    name: string;
    description: string;
  }>;
  createdAt: number;
}

/**
 * Calculate distance between two tokens using D&D 5e diagonal movement rules
 * Every other diagonal costs 10ft instead of 5ft
 */
export function calculateDistance(token1: BattleToken, token2: BattleToken): number {
  const dx = Math.abs(token2.x - token1.x);
  const dy = Math.abs(token2.y - token1.y);
  
  // D&D 5e diagonal rules: every other diagonal costs 10ft instead of 5ft
  const diagonal = Math.min(dx, dy);
  const straight = Math.max(dx, dy) - diagonal;
  return (diagonal * 7.5) + (straight * 5); // Average diagonal cost
}

/**
 * Check if a target is within range for a given action
 */
export function isWithinRange(attacker: BattleToken, target: BattleToken, action: Action): boolean {
  const distance = calculateDistance(attacker, target);
  
  if (!action.range) {
    // Default ranges based on action type
    switch (action.type) {
      case "MELEE_ATTACK":
        return distance <= 5; // 5ft melee range
      case "RANGED_ATTACK":
        return distance <= 150; // Default long range
      case "SPELL":
        return distance <= 60; // Default spell range
      default:
        return distance <= 5;
    }
  }
  
  // Parse range string (e.g., "30 feet", "120 feet", "Touch", "Self")
  const rangeStr = action.range.toLowerCase();
  
  if (rangeStr.includes("touch") || rangeStr.includes("self")) {
    return distance <= 5;
  }
  
  // Extract numeric range
  const rangeMatch = rangeStr.match(/(\d+)/);
  if (rangeMatch) {
    const range = parseInt(rangeMatch[1]);
    return distance <= range;
  }
  
  return false;
}

/**
 * Check if two tokens are enemies (can attack each other)
 */
export function areEnemies(token1: BattleToken, token2: BattleToken): boolean {
  // PCs can attack NPC foes
  if (token1.type === "pc" && token2.type === "npc_foe") return true;
  if (token1.type === "npc_foe" && token2.type === "pc") return true;
  
  // NPC foes can attack each other (if desired)
  if (token1.type === "npc_foe" && token2.type === "npc_foe") return true;
  
  // PCs can attack each other (if desired)
  if (token1.type === "pc" && token2.type === "pc") return true;
  
  return false;
}

/**
 * Roll a dice with the specified sides
 */
export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll multiple dice of the same type
 */
export function rollMultipleDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => rollDice(sides));
}

/**
 * Roll dice based on D&D notation (e.g., "2d6+3")
 */
export function rollDiceNotation(notation: string): { rolls: number[]; total: number; notation: string } {
  // Parse notation like "2d6+3", "1d20", "3d8-1"
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/);
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }
  
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  const rolls = rollMultipleDice(count, sides);
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  
  return { rolls, total, notation };
}

/**
 * Roll attack roll with advantage/disadvantage
 */
export function rollAttackRoll(
  attackBonus: number,
  advantage: boolean = false,
  disadvantage: boolean = false
): { roll: number; total: number; advantage: boolean; disadvantage: boolean } {
  let roll1 = rollDice(20);
  let roll2 = rollDice(20);
  
  let finalRoll = roll1;
  let usedAdvantage = false;
  let usedDisadvantage = false;
  
  if (advantage && !disadvantage) {
    finalRoll = Math.max(roll1, roll2);
    usedAdvantage = true;
  } else if (disadvantage && !advantage) {
    finalRoll = Math.min(roll1, roll2);
    usedDisadvantage = true;
  }
  
  return {
    roll: finalRoll,
    total: finalRoll + attackBonus,
    advantage: usedAdvantage,
    disadvantage: usedDisadvantage
  };
}

/**
 * Roll damage for an action
 */
export function rollDamage(action: Action): { damageRolls: Array<{ rolls: number[]; total: number; type: string }>; totalDamage: number } {
  if (!action.damageRolls || action.damageRolls.length === 0) {
    return { damageRolls: [], totalDamage: 0 };
  }
  
  const damageRolls = action.damageRolls.map(damageRoll => {
    const rolls = rollMultipleDice(damageRoll.dice.count, parseInt(damageRoll.dice.type.substring(1)));
    const total = rolls.reduce((sum, roll) => sum + roll, 0) + damageRoll.modifier;
    
    return {
      rolls,
      total,
      type: damageRoll.damageType
    };
  });
  
  const totalDamage = damageRolls.reduce((sum, roll) => sum + roll.total, 0);
  
  return { damageRolls, totalDamage };
}

/**
 * Calculate attack bonus for a character/monster
 */
export function calculateAttackBonus(entity: Character | Monster, action: Action): number {
  let bonus = 0;
  
  // Get ability modifier
  const abilityScore = action.attackBonusAbilityScore;
  if (abilityScore && 'abilityScores' in entity) {
    const score = entity.abilityScores[abilityScore as keyof typeof entity.abilityScores];
    bonus += Math.floor((score - 10) / 2);
  }
  
  // Add proficiency bonus if proficient
  if (action.isProficient) {
    // For characters, calculate proficiency based on level
    if ('level' in entity && entity.level) {
      const proficiencyBonus = Math.ceil(entity.level / 4) + 1;
      bonus += proficiencyBonus;
    } else {
      // For monsters, assume they're proficient with their attacks
      bonus += 2; // Default proficiency bonus
    }
  }
  
  return bonus;
}

/**
 * Check if an action can be used (spell slots, uses per rest, etc.)
 */
export function canUseAction(entity: Character | Monster, action: Action): boolean {
  // For spells, check spell slots
  if (action.type === "SPELL" && action.spellLevel && action.spellLevel > 0) {
    if ('spellSlots' in entity && entity.spellSlots) {
      const spellSlot = entity.spellSlots.find(slot => slot.level === action.spellLevel);
      if (!spellSlot || spellSlot.used >= slot.total) {
        return false;
      }
    }
  }
  
  // TODO: Add more validation for uses per rest, etc.
  
  return true;
}

/**
 * Apply damage to a token
 */
export function applyDamage(token: BattleToken, damage: number): BattleToken {
  if (token.hp === undefined || token.maxHp === undefined) {
    return token; // Can't apply damage if no HP tracking
  }
  
  const newHp = Math.max(0, token.hp - damage);
  
  return {
    ...token,
    hp: newHp
  };
}

/**
 * Check if a token is unconscious (0 HP)
 */
export function isUnconscious(token: BattleToken): boolean {
  return token.hp !== undefined && token.hp <= 0;
}
