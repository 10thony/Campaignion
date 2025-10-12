import { z } from "zod"

// Campaign Validation Schema
export const campaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().or(z.literal("")),
  worldSetting: z.string().max(200, "World setting cannot exceed 200 characters").optional().or(z.literal("")),
  isPublic: z.boolean().default(false),
})

export type CampaignFormData = z.infer<typeof campaignSchema>

// Quest Task Validation Schema - D&D 5e specific task types
export const questTaskSchema = z.object({
  title: z.string().min(3, "Task title must be at least 3 characters").max(100, "Task title cannot exceed 100 characters"),
  description: z.string().max(1000, "Task description cannot exceed 1000 characters").optional().or(z.literal("")),
  type: z.enum(["Fetch", "Kill", "Speak", "Explore", "Puzzle", "Deliver", "Escort", "Custom"]).default("Custom"),
  status: z.enum(["NotStarted", "InProgress", "Completed", "Failed"]).default("NotStarted"),
  dependsOn: z.array(z.string()).optional(), // Quest task IDs this task depends on
  assignedTo: z.array(z.string()).optional(), // Character IDs assigned to this task
  locationId: z.string().optional().or(z.literal("__no_location__")), // Location where task takes place
  targetNpcId: z.string().optional(), // NPC to interact with
  requiredItemIds: z.array(z.string()).optional(), // Items required to complete task
  completionNotes: z.string().max(500, "Completion notes cannot exceed 500 characters").optional().or(z.literal("")),
})

export type QuestTaskFormData = z.infer<typeof questTaskSchema>

// Enhanced Quest Validation Schema - Full D&D campaign quest system
export const questSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().or(z.literal("")),
  campaignId: z.string().optional().or(z.literal("")).or(z.literal("__no_campaign__")),
  status: z.enum(["idle", "in_progress", "completed", "NotStarted", "InProgress", "Failed"]).default("idle"),
  locationId: z.string().optional().or(z.literal("__no_location__")),
  
  // Enhanced quest properties for D&D campaigns
  questType: z.enum(["Main", "Side", "Personal", "Guild", "Faction"]).optional().default("Side"),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Deadly"]).optional(),
  estimatedSessions: z.number().min(1, "Must be at least 1 session").max(20, "Cannot exceed 20 sessions").optional(),
  
  // Timeline integration
  timelineEventId: z.string().optional().or(z.literal("__no_timeline_event__")),
  
  // Rewards system
  completionXP: z.number().min(0, "XP must be positive").optional(),
  rewards: z.object({
    xp: z.number().min(0, "XP must be positive").optional(),
    gold: z.number().min(0, "Gold must be positive").optional(),
    itemIds: z.array(z.string()).optional(),
  }).optional(),
  
  // Quest relationships
  involvedCharacterIds: z.array(z.string()).optional(), // NPCs involved in quest
  requiredLevel: z.number().min(1, "Level must be at least 1").max(20, "Level cannot exceed 20").optional(),
  
  // DM notes and player-visible information
  dmNotes: z.string().max(2000, "DM notes cannot exceed 2000 characters").optional().or(z.literal("")),
  playerNotes: z.array(z.string()).optional(), // Player-visible notes and clues
  
  // Quest progression
  isRepeatable: z.boolean().default(false),
  prerequisiteQuestIds: z.array(z.string()).optional(), // Quests that must be completed first
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
  actions: z.array(z.object({
    name: z.string().min(1, "Action name is required").max(100, "Action name cannot exceed 100 characters"),
    description: z.string().min(1, "Action description is required").max(1000, "Action description cannot exceed 1000 characters"),
  })).optional(),
})

export type MonsterFormData = z.infer<typeof monsterSchema>

// Character Validation Schema (Base)
export const abilityScoresSchema = z.object({
  strength: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
  dexterity: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
  constitution: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
  intelligence: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
  wisdom: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
  charisma: z.number().min(1, "Ability score must be at least 1").max(30, "Ability score cannot exceed 30"),
})

// Class data schema for multiclass support
export const classDataSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  level: z.number().int().min(1, "Level must be at least 1").max(20, "Level cannot exceed 20"),
  hitDie: z.enum(['d6', 'd8', 'd10', 'd12']),
  features: z.array(z.string()).optional(),
  subclass: z.string().optional(),
})

export const characterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  race: z.string().min(1, "Race is required").max(50, "Race cannot exceed 50 characters"),
  class: z.string().min(1, "Class is required").max(50, "Class cannot exceed 50 characters"),
  background: z.string().min(1, "Background is required").max(50, "Background cannot exceed 50 characters"),
  alignment: z.string().max(50, "Alignment cannot exceed 50 characters").optional().or(z.literal("")),
  level: z.number().min(1, "Level must be at least 1").max(20, "Level cannot exceed 20"),
  abilityScores: abilityScoresSchema,
  hitPoints: z.number().min(1, "Hit points must be at least 1").max(1000, "Hit points cannot exceed 1000"),
  armorClass: z.number().min(1, "AC must be at least 1").max(30, "AC cannot exceed 30"),
  speed: z.string().optional().or(z.literal("")),
  skills: z.array(z.string()).default([]),
  savingThrows: z.array(z.string()).default([]),
  proficiencies: z.array(z.string()).default([]),
})

// Extended character schema with multiclass and import support
export const extendedCharacterSchema = characterSchema.extend({
  subrace: z.string().optional(),
  classes: z.array(classDataSchema).optional(),
  baseAbilityScores: abilityScoresSchema.optional(),
  racialAbilityScoreImprovements: abilityScoresSchema.optional(),
  maxHitPoints: z.number().int().min(1).optional(),
  currentHitPoints: z.number().int().min(0).optional(),
  tempHitPoints: z.number().int().min(0).optional(),
  hitDice: z.array(z.object({
    die: z.enum(['d6', 'd8', 'd10', 'd12']),
    current: z.number().int().min(0),
    max: z.number().int().min(0),
  })).optional(),
  baseArmorClass: z.number().int().min(1).max(30).optional(),
  skillProficiencies: z.array(z.object({
    skill: z.string(),
    proficient: z.boolean(),
    expertise: z.boolean().optional(),
    source: z.string().optional(),
  })).optional(),
  savingThrowProficiencies: z.array(z.object({
    ability: z.string(),
    proficient: z.boolean(),
    source: z.string().optional(),
  })).optional(),
  weaponProficiencies: z.array(z.string()).optional(),
  armorProficiencies: z.array(z.string()).optional(),
  toolProficiencies: z.array(z.string()).optional(),
  traits: z.array(z.string()).optional(),
  racialTraits: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional(),
  languages: z.array(z.string()).optional(),
  speeds: z.object({
    walking: z.number().int().min(0).optional(),
    swimming: z.number().int().min(0).optional(),
    flying: z.number().int().min(0).optional(),
    climbing: z.number().int().min(0).optional(),
    burrowing: z.number().int().min(0).optional(),
  }).optional(),
  initiative: z.number().optional(),
  passivePerception: z.number().int().min(0).optional(),
  passiveInvestigation: z.number().int().min(0).optional(),
  passiveInsight: z.number().int().min(0).optional(),
  spellcastingAbility: z.enum(['Intelligence', 'Wisdom', 'Charisma']).optional(),
  spellSaveDC: z.number().int().min(8).max(30).optional(),
  spellAttackBonus: z.number().int().optional(),
  spellSlots: z.array(z.object({
    level: z.number().int().min(1).max(9),
    total: z.number().int().min(0),
    used: z.number().int().min(0),
  })).optional(),
  spellsKnown: z.array(z.string()).optional(),
  cantripsKnown: z.array(z.string()).optional(),
  features: z.array(z.object({
    name: z.string(),
    description: z.string(),
    source: z.string(),
    uses: z.object({
      current: z.number().int().min(0),
      max: z.number().int().min(0),
      resetOn: z.string(),
    }).optional(),
  })).optional(),
  feats: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional(),
  inspiration: z.boolean().optional(),
  deathSaves: z.object({
    successes: z.number().int().min(0).max(3),
    failures: z.number().int().min(0).max(3),
  }).optional(),
  importedFrom: z.string().optional(),
  importData: z.any().optional(),
  actions: z.array(z.string()).optional(),
  // Inventory and Equipment
  inventory: z.object({
    capacity: z.number().min(0, "Capacity must be non-negative"),
    items: z.array(z.object({
      itemId: z.string(),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })).optional().default([]),
  }).optional(),
  equipment: z.object({
    headgear: z.string().optional(),
    armwear: z.string().optional(),
    chestwear: z.string().optional(),
    legwear: z.string().optional(),
    footwear: z.string().optional(),
    mainHand: z.string().optional(),
    offHand: z.string().optional(),
    accessories: z.array(z.string()).optional().default([]),
  }).optional(),
  equipmentBonuses: z.object({
    armorClass: z.number().min(0).optional().default(0),
    abilityScores: z.object({
      strength: z.number().min(-10).max(10).optional().default(0),
      dexterity: z.number().min(-10).max(10).optional().default(0),
      constitution: z.number().min(-10).max(10).optional().default(0),
      intelligence: z.number().min(-10).max(10).optional().default(0),
      wisdom: z.number().min(-10).max(10).optional().default(0),
      charisma: z.number().min(-10).max(10).optional().default(0),
    }).optional().default({
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    }),
  }).optional(),
})

export type CharacterFormData = z.infer<typeof characterSchema>
export type ExtendedCharacterFormData = z.infer<typeof extendedCharacterSchema>
export type ClassData = z.infer<typeof classDataSchema>

// Timeline Event Validation Schema - D&D campaign timeline management
export const timelineEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(1, "Description is required").max(2000, "Description cannot exceed 2000 characters"),
  date: z.number().min(0, "Date must be a valid timestamp"),
  campaignId: z.string().min(1, "Campaign is required"),
  
  // Event categorization
  type: z.enum(["Battle", "Alliance", "Discovery", "Disaster", "Political", "Cultural", "Custom"]).default("Custom"),
  status: z.enum(["idle", "in_progress", "completed"]).default("idle"),
  
  // Entity relationships
  relatedLocationIds: z.array(z.string()).optional(),
  relatedNpcIds: z.array(z.string()).optional(),
  relatedFactionIds: z.array(z.string()).optional(),
  relatedQuestIds: z.array(z.string()).optional(),
  primaryQuestId: z.string().optional(), // Main quest this event relates to
  
  // Event details
  eventConsequences: z.array(z.string()).optional(), // Outcomes of the event
  participantOutcomes: z.array(z.object({
    characterId: z.string(),
    outcome: z.string(),
    impact: z.enum(["Positive", "Negative", "Neutral"])
  })).optional(),
  
  // Visibility control
  isPublic: z.boolean().default(true), // Whether players can see this event
  dmNotes: z.string().max(2000, "DM notes cannot exceed 2000 characters").optional().or(z.literal("")),
  playerVisibleNotes: z.string().max(1000, "Player notes cannot exceed 1000 characters").optional().or(z.literal("")),
})

export type TimelineEventFormData = z.infer<typeof timelineEventSchema>

// Faction Validation Schema - D&D faction system with relationships
export const factionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().min(1, "Description is required").max(2000, "Description cannot exceed 2000 characters"),
  campaignId: z.string().min(1, "Campaign is required"),
  
  // Faction organization
  goals: z.array(z.string()).optional(), // Faction objectives
  leaderNpcIds: z.array(z.string()).optional(), // Leader character IDs
  
  // Faction relationships
  alliedFactionIds: z.array(z.string()).optional(),
  enemyFactionIds: z.array(z.string()).optional(),
  
  // Reputation system (-100 to +100 scale)
  reputation: z.array(z.object({
    playerCharacterId: z.string(),
    score: z.number().min(-100, "Reputation cannot be below -100").max(100, "Reputation cannot exceed 100")
  })).optional(),
  
  // Faction details
  factionType: z.enum(["Government", "Religious", "Mercantile", "Criminal", "Military", "Scholarly", "Other"]).optional().default("Other"),
  influence: z.enum(["Local", "Regional", "National", "International"]).optional().default("Local"),
  resources: z.enum(["Poor", "Modest", "Wealthy", "Rich", "Aristocratic"]).optional().default("Modest"),
  
  // Information management
  publicInformation: z.string().max(1000, "Public information cannot exceed 1000 characters").optional().or(z.literal("")),
  factionSecrets: z.string().max(2000, "Faction secrets cannot exceed 2000 characters").optional().or(z.literal("")),
  dmNotes: z.string().max(2000, "DM notes cannot exceed 2000 characters").optional().or(z.literal("")),
})

export type FactionFormData = z.infer<typeof factionSchema>

// Action Validation Schema - D&D actions, abilities, and spells
export const actionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().min(1, "Description is required").max(2000, "Description cannot exceed 2000 characters"),
  actionCost: z.enum(["Action", "Bonus Action", "Reaction", "No Action", "Special"]),
  type: z.enum([
    "MELEE_ATTACK",
    "RANGED_ATTACK",
    "SPELL",
    "COMMONLY_AVAILABLE_UTILITY",
    "CLASS_FEATURE",
    "BONUS_ACTION",
    "REACTION",
    "OTHER"
  ]),
  requiresConcentration: z.boolean(),
  sourceBook: z.string().min(1, "Source book is required").max(100),
  category: z.enum(["general", "class_specific", "race_specific", "feat_specific"]),
  
  // Optional fields
  attackBonusAbilityScore: z.string().max(50).optional(),
  isProficient: z.boolean().optional(),
  damageRolls: z.array(z.object({
    dice: z.object({
      count: z.number().min(1).max(20),
      type: z.enum(["D4", "D6", "D8", "D10", "D12", "D20"]),
    }),
    modifier: z.number().min(-10).max(20),
    damageType: z.enum([
      "BLUDGEONING", "PIERCING", "SLASHING", "ACID", "COLD", "FIRE",
      "FORCE", "LIGHTNING", "NECROTIC", "POISON", "PSYCHIC", "RADIANT", "THUNDER"
    ]),
  })).optional(),
  spellLevel: z.union([
    z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4),
    z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9)
  ]).optional(),
  castingTime: z.string().max(100).optional(),
  range: z.string().max(100).optional(),
  components: z.object({
    verbal: z.boolean(),
    somatic: z.boolean(),
    material: z.string().max(200).optional(),
  }).optional(),
  duration: z.string().max(100).optional(),
  savingThrow: z.object({
    ability: z.string().max(50),
    onSave: z.string().max(500),
  }).optional(),
  spellEffectDescription: z.string().max(1000).optional(),
  requiredClass: z.string().max(50).optional(),
  requiredLevel: z.number().min(1).max(20).optional(),
  requiredSubclass: z.string().max(50).optional(),
  usesPer: z.enum(["Short Rest", "Long Rest", "Day", "Special"]).optional(),
  maxUses: z.union([z.number(), z.string()]).optional(),
  isBaseAction: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
})

export type ActionFormData = z.infer<typeof actionSchema>

// Location Validation Schema - D&D location management with connections
export const locationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name cannot exceed 100 characters"),
  description: z.string().min(1, "Description is required").max(2000, "Description cannot exceed 2000 characters"),
  
  // Location categorization
  type: z.enum(["Town", "City", "Village", "Dungeon", "Castle", "Forest", "Mountain", "Temple", "Ruins", "Camp", "Other"]).default("Other"),
  campaignId: z.string().optional(), // Locations can be campaign-specific or global
  
  // Notable features
  notableCharacterIds: z.array(z.string()).optional(), // NPCs associated with this location
  linkedLocations: z.array(z.string()).optional(), // Connected locations
  
  // Location details
  population: z.number().min(0, "Population cannot be negative").optional(),
  government: z.string().max(100, "Government type cannot exceed 100 characters").optional().or(z.literal("")),
  defenses: z.string().max(500, "Defense description cannot exceed 500 characters").optional().or(z.literal("")),
  
  // Visual resources
  imageUrls: z.array(z.string().url("Must be a valid URL")).optional(),
  mapId: z.string().optional(), // Reference to battle map
  
  // Information management
  publicInformation: z.string().max(1000, "Public information cannot exceed 1000 characters").optional().or(z.literal("")),
  secrets: z.string().max(2000, "Secrets cannot exceed 2000 characters").optional().or(z.literal("")), // DM-only content
  dmNotes: z.string().max(2000, "DM notes cannot exceed 2000 characters").optional().or(z.literal("")),
  
  // Interaction tracking
  interactionsAtLocation: z.array(z.string()).optional(), // Interaction IDs that happened here
})

export type LocationFormData = z.infer<typeof locationSchema>

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