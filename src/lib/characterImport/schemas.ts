import { z } from "zod"
import { 
  DND_CLASSES, 
  DND_RACES, 
  DND_SKILLS, 
  DND_ABILITIES, 
  DND_ALIGNMENTS,
  CLASS_HIT_DICE 
} from "./types"

// Validation schemas for imported character data

export const importedAbilityScoresSchema = z.object({
  strength: z.number().int().min(1).max(30),
  dexterity: z.number().int().min(1).max(30),
  constitution: z.number().int().min(1).max(30),
  intelligence: z.number().int().min(1).max(30),
  wisdom: z.number().int().min(1).max(30),
  charisma: z.number().int().min(1).max(30),
})

export const importedClassDataSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(1).max(20),
  hitDie: z.enum(['d6', 'd8', 'd10', 'd12']),
  features: z.array(z.string()).optional(),
  subclass: z.string().optional(),
})

export const importedHitDieSchema = z.object({
  die: z.enum(['d6', 'd8', 'd10', 'd12']),
  current: z.number().int().min(0),
  max: z.number().int().min(0),
})

export const importedSkillProficiencySchema = z.object({
  skill: z.string(),
  proficient: z.boolean(),
  expertise: z.boolean().optional(),
  source: z.string().optional(),
})

export const importedSavingThrowProficiencySchema = z.object({
  ability: z.string(),
  proficient: z.boolean(),
  source: z.string().optional(),
})

export const importedTraitSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
})

export const importedFeatureSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  source: z.string().min(1),
  uses: z.object({
    current: z.number().int().min(0),
    max: z.number().int().min(0),
    resetOn: z.enum(['short_rest', 'long_rest', 'dawn']),
  }).optional(),
})

export const importedFeatSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
})

export const importedSpellSlotSchema = z.object({
  level: z.number().int().min(1).max(9),
  total: z.number().int().min(0),
  used: z.number().int().min(0),
})

export const importedSpeedsSchema = z.object({
  walking: z.number().int().min(0).optional(),
  swimming: z.number().int().min(0).optional(),
  flying: z.number().int().min(0).optional(),
  climbing: z.number().int().min(0).optional(),
  burrowing: z.number().int().min(0).optional(),
})

export const importedEquipmentSchema = z.object({
  headgear: z.string().optional(),
  armwear: z.string().optional(),
  chestwear: z.string().optional(),
  legwear: z.string().optional(),
  footwear: z.string().optional(),
  mainHand: z.string().optional(),
  offHand: z.string().optional(),
  accessories: z.array(z.string()).optional(),
})

export const importedInventoryItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  description: z.string().optional(),
  weight: z.number().min(0).optional(),
  value: z.number().min(0).optional(),
})

export const importedDeathSavesSchema = z.object({
  successes: z.number().int().min(0).max(3),
  failures: z.number().int().min(0).max(3),
})

// Main character import schema
export const importedCharacterDataSchema = z.object({
  // Basic Information
  name: z.string().min(2).max(100),
  race: z.string().min(1),
  subrace: z.string().optional(),
  classes: z.array(importedClassDataSchema).min(1),
  background: z.string().min(1),
  alignment: z.string().optional(),
  level: z.number().int().min(1).max(20),
  experiencePoints: z.number().int().min(0),

  // Ability Scores
  abilityScores: importedAbilityScoresSchema,
  baseAbilityScores: importedAbilityScoresSchema.optional(),
  racialAbilityScoreImprovements: importedAbilityScoresSchema.optional(),

  // Hit Points and AC
  hitPoints: z.number().int().min(1),
  maxHitPoints: z.number().int().min(1).optional(),
  currentHitPoints: z.number().int().min(0).optional(),
  tempHitPoints: z.number().int().min(0).optional(),
  hitDice: z.array(importedHitDieSchema).optional(),
  armorClass: z.number().int().min(1).max(30),
  baseArmorClass: z.number().int().min(1).max(30).optional(),

  // Skills and Proficiencies
  skills: z.array(z.string()),
  skillProficiencies: z.array(importedSkillProficiencySchema).optional(),
  savingThrows: z.array(z.string()),
  savingThrowProficiencies: z.array(importedSavingThrowProficiencySchema).optional(),
  proficiencies: z.array(z.string()),
  weaponProficiencies: z.array(z.string()).optional(),
  armorProficiencies: z.array(z.string()).optional(),
  toolProficiencies: z.array(z.string()).optional(),

  // Character Features
  traits: z.array(z.string()).optional(),
  racialTraits: z.array(importedTraitSchema).optional(),
  features: z.array(importedFeatureSchema).optional(),
  feats: z.array(importedFeatSchema).optional(),
  languages: z.array(z.string()).optional(),

  // Movement and Senses
  speed: z.string().optional(),
  speeds: importedSpeedsSchema.optional(),
  initiative: z.number().optional(),
  passivePerception: z.number().int().min(0).optional(),
  passiveInvestigation: z.number().int().min(0).optional(),
  passiveInsight: z.number().int().min(0).optional(),

  // Spellcasting
  spellcastingAbility: z.enum(['Intelligence', 'Wisdom', 'Charisma']).optional(),
  spellSaveDC: z.number().int().min(8).max(30).optional(),
  spellAttackBonus: z.number().int().optional(),
  spellSlots: z.array(importedSpellSlotSchema).optional(),
  spellsKnown: z.array(z.string()).optional(),
  cantripsKnown: z.array(z.string()).optional(),

  // Other Resources
  inspiration: z.boolean().optional(),
  deathSaves: importedDeathSavesSchema.optional(),

  // Equipment and Inventory
  equipment: importedEquipmentSchema.optional(),
  inventory: z.array(importedInventoryItemSchema).optional(),

  // Import metadata
  importSource: z.enum(['dnd_beyond', 'json', 'pdf', 'manual']).optional(),
  originalData: z.any().optional(),
})

// Schema for character form data that extends the existing characterSchema
export const extendedCharacterFormDataSchema = z.object({
  // Basic fields (existing)
  name: z.string().min(2).max(100),
  race: z.string().min(1),
  class: z.string().min(1), // Primary class for backward compatibility
  background: z.string().min(1),
  alignment: z.string().optional(),
  level: z.number().int().min(1).max(20),
  abilityScores: importedAbilityScoresSchema,
  hitPoints: z.number().int().min(1),
  armorClass: z.number().int().min(1).max(30),
  speed: z.string().optional(),
  skills: z.array(z.string()),
  savingThrows: z.array(z.string()),
  proficiencies: z.array(z.string()),

  // Extended fields for multiclass and import
  subrace: z.string().optional(),
  classes: z.array(importedClassDataSchema).optional(),
  baseAbilityScores: importedAbilityScoresSchema.optional(),
  racialAbilityScoreImprovements: importedAbilityScoresSchema.optional(),
  maxHitPoints: z.number().int().min(1).optional(),
  currentHitPoints: z.number().int().min(0).optional(),
  tempHitPoints: z.number().int().min(0).optional(),
  hitDice: z.array(importedHitDieSchema).optional(),
  baseArmorClass: z.number().int().min(1).max(30).optional(),
  skillProficiencies: z.array(importedSkillProficiencySchema).optional(),
  savingThrowProficiencies: z.array(importedSavingThrowProficiencySchema).optional(),
  weaponProficiencies: z.array(z.string()).optional(),
  armorProficiencies: z.array(z.string()).optional(),
  toolProficiencies: z.array(z.string()).optional(),
  traits: z.array(z.string()).optional(),
  racialTraits: z.array(importedTraitSchema).optional(),
  features: z.array(importedFeatureSchema).optional(),
  feats: z.array(importedFeatSchema).optional(),
  languages: z.array(z.string()).optional(),
  speeds: importedSpeedsSchema.optional(),
  initiative: z.number().optional(),
  passivePerception: z.number().int().min(0).optional(),
  passiveInvestigation: z.number().int().min(0).optional(),
  passiveInsight: z.number().int().min(0).optional(),
  spellcastingAbility: z.enum(['Intelligence', 'Wisdom', 'Charisma']).optional(),
  spellSaveDC: z.number().int().min(8).max(30).optional(),
  spellAttackBonus: z.number().int().optional(),
  spellSlots: z.array(importedSpellSlotSchema).optional(),
  spellsKnown: z.array(z.string()).optional(),
  cantripsKnown: z.array(z.string()).optional(),
  inspiration: z.boolean().optional(),
  deathSaves: importedDeathSavesSchema.optional(),
  equipment: importedEquipmentSchema.optional(),
  inventory: z.array(importedInventoryItemSchema).optional(),
  importedFrom: z.string().optional(),
  importData: z.any().optional(),
})

export type ImportedCharacterData = z.infer<typeof importedCharacterDataSchema>
export type ExtendedCharacterFormData = z.infer<typeof extendedCharacterFormDataSchema>
