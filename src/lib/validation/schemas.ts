import { z } from "zod"

// Campaign Validation Schema
export const campaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().or(z.literal("")),
  worldSetting: z.string().max(200, "World setting cannot exceed 200 characters").optional().or(z.literal("")),
  isPublic: z.boolean().default(false),
})

export type CampaignFormData = z.infer<typeof campaignSchema>

// Quest Validation Schema
export const questSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().or(z.literal("")),
  campaignId: z.string().optional(),
  status: z.enum(["idle", "in_progress", "completed", "NotStarted", "InProgress", "Failed"]).default("idle"),
  locationId: z.string().optional(),
  completionXP: z.number().min(0, "XP must be positive").optional(),
  rewards: z.object({
    xp: z.number().min(0, "XP must be positive").optional(),
    gold: z.number().min(0, "Gold must be positive").optional(),
    itemIds: z.array(z.string()).optional(),
  }).optional(),
})

export type QuestFormData = z.infer<typeof questSchema>

// Item Validation Schema
export const itemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  type: z.enum([
    "Weapon", "Armor", "Potion", "Scroll", "Wondrous Item", "Ring",
    "Rod", "Staff", "Wand", "Ammunition", "Adventuring Gear", "Tool",
    "Mount", "Vehicle", "Treasure", "Other"
  ]),
  rarity: z.enum(["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact", "Unique"]),
  description: z.string().min(1, "Description is required").max(1000, "Description cannot exceed 1000 characters"),
  effects: z.string().max(500, "Effects cannot exceed 500 characters").optional().or(z.literal("")),
  weight: z.number().min(0, "Weight must be positive").optional(),
  cost: z.number().min(0, "Cost must be positive").optional(),
  attunement: z.boolean().optional(),
  typeOfArmor: z.enum(["Light", "Medium", "Heavy", "Shield"]).optional(),
  armorClass: z.number().min(1, "AC must be at least 1").max(30, "AC cannot exceed 30").optional(),
  abilityModifiers: z.object({
    strength: z.number().min(-5, "Modifier too low").max(10, "Modifier too high").optional(),
    dexterity: z.number().min(-5, "Modifier too low").max(10, "Modifier too high").optional(),
    constitution: z.number().min(-5, "Modifier too low").max(10, "Modifier too high").optional(),
    intelligence: z.number().min(-5, "Modifier too low").max(10, "Modifier too high").optional(),
    wisdom: z.number().min(-5, "Modifier too low").max(10, "Modifier too high").optional(),
    charisma: z.number().min(-5, "Modifier too low").max(10, "Modifier too high").optional(),
  }).optional(),
})

export type ItemFormData = z.infer<typeof itemSchema>

// Monster Validation Schema
export const monsterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  source: z.string().max(100, "Source cannot exceed 100 characters").optional().or(z.literal("")),
  size: z.enum(["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"]),
  type: z.string().min(1, "Type is required").max(50, "Type cannot exceed 50 characters"),
  alignment: z.string().min(1, "Alignment is required").max(50, "Alignment cannot exceed 50 characters"),
  armorClass: z.number().min(1, "AC must be at least 1").max(30, "AC cannot exceed 30"),
  hitPoints: z.number().min(1, "Hit points must be at least 1").max(1000, "Hit points cannot exceed 1000"),
  hitDice: z.object({
    count: z.number().min(1, "Must have at least 1 hit die").max(100, "Cannot exceed 100 hit dice"),
    die: z.enum(["d4", "d6", "d8", "d10", "d12"]),
  }),
  speed: z.object({
    walk: z.string().optional().or(z.literal("")),
    swim: z.string().optional().or(z.literal("")),
    fly: z.string().optional().or(z.literal("")),
    burrow: z.string().optional().or(z.literal("")),
    climb: z.string().optional().or(z.literal("")),
  }),
  abilityScores: z.object({
    strength: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    dexterity: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    constitution: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    intelligence: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    wisdom: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    charisma: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
  }),
  challengeRating: z.string().min(1, "Challenge rating is required"),
  proficiencyBonus: z.number().min(2, "Proficiency bonus must be at least 2").max(9, "Proficiency bonus cannot exceed 9"),
  senses: z.object({
    passivePerception: z.number().min(1, "Passive perception must be at least 1").max(30, "Passive perception cannot exceed 30"),
    darkvision: z.string().optional().or(z.literal("")),
    blindsight: z.string().optional().or(z.literal("")),
    tremorsense: z.string().optional().or(z.literal("")),
    truesight: z.string().optional().or(z.literal("")),
  }),
  challengeRatingValue: z.number().min(0, "CR value must be non-negative").optional(),
  legendaryActionCount: z.number().min(0, "Legendary actions must be non-negative").max(5, "Cannot exceed 5 legendary actions").optional(),
  lairActionCount: z.number().min(0, "Lair actions must be non-negative").max(5, "Cannot exceed 5 lair actions").optional(),
})

export type MonsterFormData = z.infer<typeof monsterSchema>

// Character Validation Schema
export const characterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  race: z.string().min(1, "Race is required").max(50, "Race cannot exceed 50 characters"),
  class: z.string().min(1, "Class is required").max(50, "Class cannot exceed 50 characters"),
  background: z.string().min(1, "Background is required").max(50, "Background cannot exceed 50 characters"),
  alignment: z.string().max(50, "Alignment cannot exceed 50 characters").optional().or(z.literal("")),
  level: z.number().min(1, "Level must be at least 1").max(20, "Level cannot exceed 20"),
  abilityScores: z.object({
    strength: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    dexterity: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    constitution: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    intelligence: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    wisdom: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
    charisma: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
  }),
  hitPoints: z.number().min(1, "Hit points must be at least 1").max(1000, "Hit points cannot exceed 1000"),
  armorClass: z.number().min(1, "AC must be at least 1").max(30, "AC cannot exceed 30"),
  speed: z.string().optional().or(z.literal("")),
  skills: z.array(z.string()).default([]),
  savingThrows: z.array(z.string()).default([]),
  proficiencies: z.array(z.string()).default([]),
})

export type CharacterFormData = z.infer<typeof characterSchema>

// D&D 5e Reference Data
export const DND_SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"] as const
export const DND_ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral", 
  "Lawful Evil", "Neutral Evil", "Chaotic Evil", "Unaligned"
] as const
export const DND_CHALLENGE_RATINGS = [
  "0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
] as const
export const DND_HIT_DICE = ["d4", "d6", "d8", "d10", "d12"] as const
export const DND_ITEM_TYPES = [
  "Weapon", "Armor", "Potion", "Scroll", "Wondrous Item", "Ring",
  "Rod", "Staff", "Wand", "Ammunition", "Adventuring Gear", "Tool",
  "Mount", "Vehicle", "Treasure", "Other"
] as const
export const DND_RARITIES = ["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact", "Unique"] as const
export const DND_ARMOR_TYPES = ["Light", "Medium", "Heavy", "Shield"] as const
export const DND_QUEST_STATUSES = ["idle", "in_progress", "completed", "NotStarted", "InProgress", "Failed"] as const

// Helper functions for D&D calculations
export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1
} 