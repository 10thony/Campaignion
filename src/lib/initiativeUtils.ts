/**
 * D&D 5e Initiative System Utilities
 * 
 * Calculates initiative modifiers and rolls for characters and monsters.
 * Initiative = d20 + Dexterity modifier + relevant bonuses
 */

import { Id } from "../../convex/_generated/dataModel";

export interface InitiativeModifierSource {
  source: string; // "dexterity", "feat", "class_feature", "item", "spell", "racial", "condition"
  sourceName: string; // e.g., "Alert", "Swashbuckler", "Sentinel Shield"
  bonus: number;
  type: "bonus" | "advantage" | "disadvantage" | "dice"; // For future expansion
  description?: string;
}

export interface InitiativeBreakdown {
  baseModifier: number; // Dexterity modifier
  totalModifier: number; // Base + all bonuses
  sources: InitiativeModifierSource[];
  hasAdvantage: boolean;
  hasDisadvantage: boolean;
  diceBonus?: number; // e.g., 1d8 from Gift of Alacrity
}

export interface InitiativeRoll {
  roll: number; // The d20 roll (or higher if advantage)
  modifier: number; // Total modifier applied
  total: number; // Final initiative value (roll + modifier)
  dexterityScore: number; // For tie-breaking
  breakdown: InitiativeBreakdown;
}

/**
 * Calculate Dexterity modifier from ability score
 */
export function calculateDexterityModifier(dexterityScore: number): number {
  return Math.floor((dexterityScore - 10) / 2);
}

/**
 * Calculate initiative modifier breakdown for a character or monster
 * This function checks for hardcoded bonuses that affect initiative
 * 
 * Future enhancement: This will query character features, feats, items, etc.
 */
export function calculateInitiativeBreakdown(
  entity: {
    abilityScores?: { dexterity: number };
    abilityModifiers?: { dexterity: number };
    dexterity?: number; // For monsters that might have this directly
    classes?: Array<{ name: string; level: number; subclass?: string }>;
    feats?: Array<{ name: string }>;
    features?: Array<{ name: string; source: string }>;
    equipmentBonuses?: { 
      abilityScores?: { dexterity: number };
      initiative?: number; // Direct initiative bonus from equipped items
    };
    conditions?: string[];
  }
): InitiativeBreakdown {
  const sources: InitiativeModifierSource[] = [];
  
  // Get Dexterity modifier
  let dexModifier = 0;
  if (entity.abilityModifiers?.dexterity !== undefined) {
    dexModifier = entity.abilityModifiers.dexterity;
  } else if (entity.abilityScores?.dexterity !== undefined) {
    dexModifier = calculateDexterityModifier(entity.abilityScores.dexterity);
  } else if (entity.dexterity !== undefined) {
    dexModifier = calculateDexterityModifier(entity.dexterity);
  }
  
  // Add equipment bonuses to dexterity (which affects the modifier)
  if (entity.equipmentBonuses?.abilityScores?.dexterity) {
    const equipmentDexBonus = entity.equipmentBonuses.abilityScores.dexterity;
    if (entity.abilityScores?.dexterity !== undefined) {
      const totalDex = entity.abilityScores.dexterity + equipmentDexBonus;
      const newDexModifier = calculateDexterityModifier(totalDex);
      const equipmentModifierBonus = newDexModifier - dexModifier;
      if (equipmentModifierBonus !== 0) {
        sources.push({
          source: "item",
          sourceName: "Equipment",
          bonus: equipmentModifierBonus,
          type: "bonus",
          description: `Equipment bonus to Dexterity`,
        });
      }
      dexModifier = newDexModifier;
    }
  }
  
  sources.push({
    source: "dexterity",
    sourceName: "Dexterity Modifier",
    bonus: dexModifier,
    type: "bonus",
  });
  
  let hasAdvantage = false;
  let hasDisadvantage = false;
  let diceBonus: number | undefined = undefined;
  
  // Check for Alert feat (+5 bonus)
  const hasAlertFeat = entity.feats?.some(f => 
    f.name.toLowerCase().includes("alert")
  ) || false;
  
  if (hasAlertFeat) {
    sources.push({
      source: "feat",
      sourceName: "Alert",
      bonus: 5,
      type: "bonus",
      description: "You gain a +5 bonus to initiative",
    });
  }
  
  // Check for Swashbuckler Rogue (adds Charisma modifier at 3rd level)
  const swashbucklerClass = entity.classes?.find(
    c => c.name === "Rogue" && c.subclass === "Swashbuckler" && c.level >= 3
  );
  
  if (swashbucklerClass && entity.abilityModifiers?.charisma !== undefined) {
    const charismaMod = entity.abilityModifiers.charisma;
    sources.push({
      source: "class_feature",
      sourceName: "Swashbuckler (Rakish Audacity)",
      bonus: charismaMod,
      type: "bonus",
      description: "Add your Charisma modifier to initiative rolls",
    });
  }
  
  // Check for Barbarian Feral Instinct (advantage)
  const hasFeralInstinct = entity.features?.some(f =>
    f.name.toLowerCase().includes("feral instinct") ||
    (f.source === "class" && f.name.toLowerCase().includes("barbarian"))
  ) || entity.classes?.some(c => 
    c.name === "Barbarian" && c.level >= 7
  );
  
  if (hasFeralInstinct) {
    hasAdvantage = true;
    sources.push({
      source: "class_feature",
      sourceName: "Feral Instinct (Barbarian)",
      bonus: 0,
      type: "advantage",
      description: "You have advantage on initiative rolls",
    });
  }
  
  // Check for Harengon race (add proficiency bonus)
  // Note: This would need race information in the entity
  // For now, we'll add it as a placeholder that can be checked via features
  const hasHarengonTrait = entity.features?.some(f =>
    f.name.toLowerCase().includes("hare-trigger") ||
    f.name.toLowerCase().includes("harengon")
  );
  
  if (hasHarengonTrait && entity.classes && entity.classes.length > 0) {
    const totalLevel = entity.classes.reduce((sum, c) => sum + c.level, 0);
    const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;
    sources.push({
      source: "racial",
      sourceName: "Hare-Trigger (Harengon)",
      bonus: proficiencyBonus,
      type: "bonus",
      description: "Add your proficiency bonus to initiative rolls",
    });
  }
  
  // Check for conditions that affect initiative
  if (entity.conditions) {
    const exhaustionLevel = entity.conditions.find(c => 
      c.toLowerCase().includes("exhaustion")
    );
    // Exhaustion level 1+ can impose disadvantage on ability checks (initiative is a Dex check)
    if (exhaustionLevel) {
      hasDisadvantage = true;
      sources.push({
        source: "condition",
        sourceName: "Exhaustion",
        bonus: 0,
        type: "disadvantage",
        description: "Exhaustion can impose disadvantage on ability checks",
      });
    }
  }
  
  // Check for direct initiative bonuses from equipped items
  if (entity.equipmentBonuses?.initiative) {
    sources.push({
      source: "item",
      sourceName: "Equipment (Initiative)",
      bonus: entity.equipmentBonuses.initiative,
      type: "bonus",
      description: "Direct initiative bonus from equipped items",
    });
  }
  
  // Note: Gift of Alacrity and other spells would need active spell tracking
  // For now, this is a placeholder that can be extended
  
  const totalModifier = sources.reduce((sum, s) => {
    if (s.type === "bonus" || s.type === "dice") {
      return sum + s.bonus;
    }
    return sum;
  }, 0);
  
  return {
    baseModifier: dexModifier,
    totalModifier,
    sources,
    hasAdvantage,
    hasDisadvantage,
    diceBonus,
  };
}

/**
 * Roll initiative for an entity
 * @param breakdown - The initiative breakdown for the entity
 * @param dexterityScore - The dexterity score (for tie-breaking)
 * @param advantage - Override advantage (for spells like Enhance Ability)
 * @param disadvantage - Override disadvantage (for conditions)
 * @param diceBonus - Additional dice bonus (e.g., 1d8 from Gift of Alacrity)
 */
export function rollInitiative(
  breakdown: InitiativeBreakdown,
  dexterityScore: number,
  advantage?: boolean,
  disadvantage?: boolean,
  diceBonus?: number
): InitiativeRoll {
  // Determine if we have advantage or disadvantage
  const hasAdvantage = advantage ?? breakdown.hasAdvantage;
  const hasDisadvantage = disadvantage ?? breakdown.hasDisadvantage;
  
  // Roll d20
  let roll = Math.floor(Math.random() * 20) + 1;
  
  // Apply advantage/disadvantage
  if (hasAdvantage && !hasDisadvantage) {
    const secondRoll = Math.floor(Math.random() * 20) + 1;
    roll = Math.max(roll, secondRoll);
  } else if (hasDisadvantage && !hasAdvantage) {
    const secondRoll = Math.floor(Math.random() * 20) + 1;
    roll = Math.min(roll, secondRoll);
  }
  
  // Apply dice bonus (e.g., Gift of Alacrity 1d8)
  let diceBonusRoll = 0;
  if (diceBonus) {
    diceBonusRoll = Math.floor(Math.random() * diceBonus) + 1;
  }
  
  const total = roll + breakdown.totalModifier + diceBonusRoll;
  
  return {
    roll,
    modifier: breakdown.totalModifier,
    total,
    dexterityScore,
    breakdown: {
      ...breakdown,
      diceBonus: diceBonus,
    },
  };
}

/**
 * Compare two initiative rolls to determine order
 * Uses initiative total, then Dexterity score as tiebreaker
 */
export function compareInitiative(a: InitiativeRoll, b: InitiativeRoll): number {
  // First compare by total initiative
  if (b.total !== a.total) {
    return b.total - a.total;
  }
  
  // Then compare by Dexterity score
  if (b.dexterityScore !== a.dexterityScore) {
    return b.dexterityScore - a.dexterityScore;
  }
  
  // If still tied, maintain order (or could reroll/use DM decision)
  return 0;
}

/**
 * Get a readable description of the initiative modifier breakdown
 */
export function formatInitiativeBreakdown(breakdown: InitiativeBreakdown): string {
  const parts: string[] = [];
  
  parts.push(`Dex ${breakdown.baseModifier >= 0 ? '+' : ''}${breakdown.baseModifier}`);
  
  breakdown.sources.forEach(source => {
    if (source.source !== "dexterity" && source.bonus !== 0) {
      if (source.type === "bonus") {
        parts.push(`${source.sourceName} ${source.bonus >= 0 ? '+' : ''}${source.bonus}`);
      } else if (source.type === "advantage") {
        parts.push(`${source.sourceName} (advantage)`);
      } else if (source.type === "disadvantage") {
        parts.push(`${source.sourceName} (disadvantage)`);
      }
    }
  });
  
  const modifierText = breakdown.totalModifier >= 0 
    ? `+${breakdown.totalModifier}` 
    : `${breakdown.totalModifier}`;
  
  let result = `Modifier: ${modifierText}`;
  
  if (parts.length > 1) {
    result += ` (${parts.join(', ')})`;
  }
  
  if (breakdown.hasAdvantage) {
    result += " [Advantage]";
  }
  if (breakdown.hasDisadvantage) {
    result += " [Disadvantage]";
  }
  
  return result;
}

