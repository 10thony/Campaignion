import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  parseLogs: defineTable({
    filename: v.string(),
    fileSize: v.number(),
    parseSuccess: v.boolean(),
    parseLog: v.array(v.string()),
    sampleText: v.optional(v.string()),
    confidenceSummary: v.object({ high: v.number(), medium: v.number(), low: v.number() }),
    createdAt: v.number(),
  }),
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    role: v.union(v.literal("admin"), v.literal("user")),
  }),

  characters: defineTable({
    name: v.string(),
    race: v.string(),
    // Support for multiclass characters
    class: v.string(), // Primary class for backward compatibility
    primaryClassId: v.optional(v.id("dndClasses")), // Reference to primary class in dndClasses table
    classes: v.optional(v.array(v.object({
      classId: v.optional(v.id("dndClasses")), // Reference to class in dndClasses table
      name: v.string(), // Keep for backward compatibility and quick access
      level: v.number(),
      hitDie: v.string(), // d6, d8, d10, d12
      features: v.optional(v.array(v.string())),
      subclass: v.optional(v.string()),
    }))),
    subrace: v.optional(v.string()),
    background: v.string(),
    alignment: v.optional(v.string()),
    characterType: v.union(
      v.literal("player"),
      v.literal("npc")
    ),
    imageUrl: v.optional(v.string()),

    abilityScores: v.object({
      strength: v.float64(),
      dexterity: v.float64(),
      constitution: v.float64(),
      intelligence: v.float64(),
      wisdom: v.float64(),
      charisma: v.float64(),
    }),

    // Base ability scores before racial/equipment bonuses
    baseAbilityScores: v.optional(v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    })),

    // Racial ability score improvements
    racialAbilityScoreImprovements: v.optional(v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    })),

    // ← NEW: precomputed ability modifiers
    abilityModifiers: v.optional(
      v.object({
        strength: v.number(),
        dexterity: v.number(),
        constitution: v.number(),
        intelligence: v.number(),
        wisdom: v.number(),
        charisma: v.number(),
      })
    ),

    skills: v.array(v.string()),
    skillProficiencies: v.optional(v.array(v.object({
      skill: v.string(),
      proficient: v.boolean(),
      expertise: v.optional(v.boolean()),
      source: v.optional(v.string()), // "class", "background", "race", "feat"
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
    traits: v.optional(v.array(v.string())),
    racialTraits: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
    }))),
    languages: v.optional(v.array(v.string())),

    inventory: v.optional(
      v.object({
        capacity: v.number(),
        items: v.array(v.object({
          itemId: v.union(v.id("items"), v.string()),
          quantity: v.number(),
        })),
      })
    ),
    equipment: v.optional(
      v.object({
        headgear: v.optional(v.union(v.id("items"), v.string())),
        armwear: v.optional(v.union(v.id("items"), v.string())),
        chestwear: v.optional(v.union(v.id("items"), v.string())),
        legwear: v.optional(v.union(v.id("items"), v.string())),
        footwear: v.optional(v.union(v.id("items"), v.string())),
        mainHand: v.optional(v.union(v.id("items"), v.string())),
        offHand: v.optional(v.union(v.id("items"), v.string())),
        accessories: v.array(v.union(v.id("items"), v.string())),
      })
    ),
    equipmentBonuses: v.optional(
      v.object({
        armorClass: v.number(),
        abilityScores: v.object({
          strength: v.number(),
          dexterity: v.number(),
          constitution: v.number(),
          intelligence: v.number(),
          wisdom: v.number(),
          charisma: v.number(),
        }),
      })
    ),

    level: v.float64(),
    experiencePoints: v.float64(),
    xpHistory: v.optional(
      v.array(
        v.object({
          amount: v.float64(),
          source: v.string(),
          date: v.float64(),
        })
      )
    ),
    hitPoints: v.float64(),
    maxHitPoints: v.optional(v.number()),
    currentHitPoints: v.optional(v.number()),
    tempHitPoints: v.optional(v.number()),
    hitDice: v.optional(v.array(v.object({
      die: v.string(), // d6, d8, d10, d12
      current: v.number(),
      max: v.number(),
    }))),
    armorClass: v.float64(),
    baseArmorClass: v.optional(v.number()),
    proficiencyBonus: v.float64(),
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
    
    // Character import metadata
    importedFrom: v.optional(v.string()), // "manual", "dnd_beyond", "json", "pdf"
    importData: v.optional(v.any()), // Raw import data for reference
    importedAt: v.optional(v.number()),
    
    // Clone metadata
    clonedFrom: v.optional(v.id("characters")), // Reference to original character if this is a clone
    clonedAt: v.optional(v.number()),
    
    // Temporarily capture any parsed fields we don't yet model
    uncapturedData: v.optional(v.any()),
    
    // Spellcasting
    spellcastingAbility: v.optional(v.string()), // "intelligence", "wisdom", "charisma"
    spellSaveDC: v.optional(v.number()),
    spellAttackBonus: v.optional(v.number()),
    spellSlots: v.optional(v.array(v.object({
      level: v.number(),
      total: v.number(),
      used: v.number(),
    }))),
    spellsKnown: v.optional(v.array(v.string())),
    cantripsKnown: v.optional(v.array(v.string())),
    
    // Additional features
    features: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
      source: v.string(), // "class", "race", "background", "feat"
      uses: v.optional(v.object({
        current: v.number(),
        max: v.number(),
        resetOn: v.string(), // "short_rest", "long_rest", "dawn"
      })),
    }))),
    feats: v.optional(v.array(v.object({
      name: v.string(),
      description: v.string(),
    }))),
    
    // Resources and other mechanics
    inspiration: v.optional(v.boolean()),
    deathSaves: v.optional(v.object({
      successes: v.number(),
      failures: v.number(),
    })),
    
    actions: v.array(v.id("actions")),
    factionId: v.optional(v.id("factions")),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),



  actions: defineTable({
    name: v.string(),
    description: v.string(),
    actionCost: v.union(
      v.literal("Action"),
      v.literal("Bonus Action"),
      v.literal("Reaction"),
      v.literal("No Action"),
      v.literal("Special")
    ),
    type: v.union(
      v.literal("MELEE_ATTACK"),
      v.literal("RANGED_ATTACK"),
      v.literal("SPELL"),
      v.literal("COMMONLY_AVAILABLE_UTILITY"),
      v.literal("CLASS_FEATURE"),
      v.literal("BONUS_ACTION"),
      v.literal("REACTION"),
      v.literal("OTHER")
    ),
    requiresConcentration: v.boolean(),
    sourceBook: v.string(),
    attackBonusAbilityScore: v.optional(v.string()),
    isProficient: v.optional(v.boolean()),
    damageRolls: v.optional(
      v.array(
        v.object({
          dice: v.object({
            count: v.number(),
            type: v.union(
              v.literal("D4"),
              v.literal("D6"),
              v.literal("D8"),
              v.literal("D10"),
              v.literal("D12"),
              v.literal("D20")
            ),
          }),
          modifier: v.number(),
          damageType: v.union(
            v.literal("BLUDGEONING"),
            v.literal("PIERCING"),
            v.literal("SLASHING"),
            v.literal("ACID"),
            v.literal("COLD"),
            v.literal("FIRE"),
            v.literal("FORCE"),
            v.literal("LIGHTNING"),
            v.literal("NECROTIC"),
            v.literal("POISON"),
            v.literal("PSYCHIC"),
            v.literal("RADIANT"),
            v.literal("THUNDER")
          ),
        })
      )
    ),
    spellLevel: v.optional(
      v.union(
        v.literal(0),
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
        v.literal(6),
        v.literal(7),
        v.literal(8),
        v.literal(9)
      )
    ),
    castingTime: v.optional(v.string()),
    range: v.optional(v.string()),
    components: v.optional(
      v.object({
        verbal: v.boolean(),
        somatic: v.boolean(),
        material: v.optional(v.string()),
      })
    ),
    duration: v.optional(v.string()),
    savingThrow: v.optional(
      v.object({
        ability: v.string(),
        onSave: v.string(),
      })
    ),
    spellEffectDescription: v.optional(v.string()),
    
    // Action categorization and availability
    category: v.union(
      v.literal("general"),           // Available to all characters
      v.literal("class_specific"),    // Available only to specific classes
      v.literal("race_specific"),     // Available only to specific races
      v.literal("feat_specific")      // Available through specific feats
    ),
    requiredClassId: v.optional(v.id("dndClasses")), // Reference to required class in dndClasses table
    requiredClassIds: v.optional(v.array(v.id("dndClasses"))), // References to required classes in dndClasses table
    requiredClass: v.optional(v.string()), // For class_specific actions (legacy)
    requiredClasses: v.optional(v.array(v.string())), // For actions available to multiple classes (legacy)
    requiredLevel: v.optional(v.number()), // Minimum level required
    requiredSubclass: v.optional(v.string()), // For subclass-specific actions
    
    // Legacy field for backward compatibility
    className: v.optional(v.string()),
    
    usesPer: v.optional(
      v.union(
        v.literal("Short Rest"),
        v.literal("Long Rest"),
        v.literal("Day"),
        v.literal("Special")
      )
    ),
    maxUses: v.optional(v.union(v.number(), v.string())),
    
    // Additional metadata
    isBaseAction: v.optional(v.boolean()), // True for core D&D actions like Attack, Dodge, etc.
    tags: v.optional(v.array(v.string())), // For categorization and filtering
    prerequisites: v.optional(v.array(v.string())), // Requirements to use this action
    targetClass: v.optional(v.string()), // The class this action is specifically for (e.g., "Barbarian", "Wizard")
    
    createdAt: v.number(),
  }),

  items: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("Weapon"),
      v.literal("Armor"),
      v.literal("Potion"),
      v.literal("Scroll"),
      v.literal("Wondrous Item"),
      v.literal("Ring"),
      v.literal("Rod"),
      v.literal("Staff"),
      v.literal("Wand"),
      v.literal("Ammunition"),
      v.literal("Adventuring Gear"),
      v.literal("Tool"),
      v.literal("Mount"),
      v.literal("Vehicle"),
      v.literal("Treasure"),
      v.literal("Other")
    ),
    rarity: v.union(
      v.literal("Common"),
      v.literal("Uncommon"),
      v.literal("Rare"),
      v.literal("Very Rare"),
      v.literal("Legendary"),
      v.literal("Artifact"),
      v.literal("Unique")
    ),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    scope: v.union(
      v.literal("entitySpecific"), 
      v.literal("campaignSpecific"), 
      v.literal("global")
    ),
    effects: v.optional(v.string()),
    weight: v.optional(v.number()),
    cost: v.optional(v.number()),
    attunement: v.optional(v.boolean()),

    typeOfArmor: v.optional(
      v.union(v.literal("Light"), v.literal("Medium"), v.literal("Heavy"), v.literal("Shield"))
    ),
    durability: v.optional(
      v.object({
        current: v.number(),
        max: v.number(),
        baseDurability: v.number(),
      })
    ),
    abilityModifiers: v.optional(
      v.object({
        strength: v.optional(v.number()),
        dexterity: v.optional(v.number()),
        constitution: v.optional(v.number()),
        intelligence: v.optional(v.number()),
        wisdom: v.optional(v.number()),
        charisma: v.optional(v.number()),
      })
    ),
    armorClass: v.optional(v.number()),
    damageRolls: v.optional(
      v.array(
        v.object({
          dice: v.object({
            count: v.number(),
            type: v.union(
              v.literal("D4"),
              v.literal("D6"),
              v.literal("D8"),
              v.literal("D10"),
              v.literal("D12"),
              v.literal("D20")
            ),
          }),
          modifier: v.number(),
          damageType: v.union(
            v.literal("BLUDGEONING"),
            v.literal("PIERCING"),
            v.literal("SLASHING"),
            v.literal("ACID"),
            v.literal("COLD"),
            v.literal("FIRE"),
            v.literal("FORCE"),
            v.literal("LIGHTNING"),
            v.literal("NECROTIC"),
            v.literal("POISON"),
            v.literal("PSYCHIC"),
            v.literal("RADIANT"),
            v.literal("THUNDER")
          ),
        })
      )
    ),

    userId: v.id("users"),
  }),

  maps: defineTable({
    name: v.string(),
    width: v.number(),
    height: v.number(),
    cells: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        state: v.union(v.literal("inbounds"), v.literal("outbounds"), v.literal("occupied")),
        terrainType: v.optional(
          v.union(
            v.literal("normal"),
            v.literal("difficult"),
            v.literal("hazardous"),
            v.literal("magical"),
            v.literal("water"),
            v.literal("ice"),
            v.literal("fire"),
            v.literal("acid"),
            v.literal("poison"),
            v.literal("unstable")
          )
        ),
        terrainEffect: v.optional(
          v.object({
            movementCostMultiplier: v.optional(v.number()),
            damage: v.optional(
              v.object({
                amount: v.number(),
                type: v.union(
                  v.literal("fire"),
                  v.literal("cold"),
                  v.literal("acid"),
                  v.literal("poison"),
                  v.literal("necrotic"),
                  v.literal("radiant")
                ),
                saveType: v.optional(v.string()),
                saveDC: v.optional(v.number())
              })
            ),
            abilityChecks: v.optional(
              v.array(
                v.object({
                  ability: v.string(),
                  dc: v.number(),
                  onFailure: v.string()
                })
              )
            ),
            specialEffects: v.optional(v.array(v.string()))
          })
        ),
        occupant: v.optional(
          v.object({
            id: v.string(),
            type: v.union(v.literal("character"), v.literal("monster")),
            color: v.string(),
            speed: v.number(),
            name: v.string(),
          })
        ),
        customColor: v.optional(v.string()),
      })
    ),
    createdBy: v.id("users"),
    clerkId: v.optional(v.string()), // Make optional for backward compatibility
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  locations: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("Town"),
      v.literal("City"),
      v.literal("Village"),
      v.literal("Dungeon"),
      v.literal("Castle"),
      v.literal("Forest"),
      v.literal("Mountain"),
      v.literal("Temple"),
      v.literal("Ruins"),
      v.literal("Camp"),
      v.literal("Other")
    ),
    description: v.string(),
    notableCharacterIds: v.array(v.id("characters")),
    linkedLocations: v.array(v.id("locations")),
    interactionsAtLocation: v.array(v.id("interactions")),
    imageUrls: v.array(v.string()),
    secrets: v.string(),
    mapId: v.optional(v.id("maps")),
    creatorId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  campaigns: defineTable({
    name: v.string(),
    creatorId: v.id("users"),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    worldSetting: v.optional(v.string()),
    startDate: v.optional(v.number()),
    isPublic: v.boolean(),
    dmId: v.string(),
    players: v.optional(v.array(v.string())),
    participantPlayerCharacterIds: v.optional(v.array(v.id("characters"))),
    participantUserIds: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.id("tags"))),
    locationIds: v.optional(v.array(v.id("locations"))),
    questIds: v.optional(v.array(v.id("quests"))),
    sessionIds: v.optional(v.array(v.id("sessions"))),
    npcIds: v.optional(v.array(v.id("characters"))),
    factionIds: v.optional(v.array(v.id("factions"))),
    monsterIds: v.optional(v.array(v.id("monsters"))),
    spellIds: v.optional(v.array(v.id("spells"))),
    deityIds: v.optional(v.array(v.id("deities"))),
    journalIds: v.optional(v.array(v.id("journals"))),
    mediaAssetIds: v.optional(v.array(v.id("mediaAssets"))),
    storyArcIds: v.optional(v.array(v.id("storyArcs"))),
    milestoneIds: v.optional(v.array(v.id("milestones"))),
    timelineEventIds: v.optional(v.array(v.id("timelineEvents"))),
    activeInteractionId: v.optional(v.id("interactions")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  quests: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    campaignId: v.optional(v.id("campaigns")),
    creatorId: v.id("users"),
    status: v.union(
      v.literal("idle"),
      v.literal("in_progress"), 
      v.literal("completed"),
      v.literal("NotStarted"), // Keep for backwards compatibility
      v.literal("InProgress"),
      v.literal("Failed")
    ),
    locationId: v.optional(v.id("locations")),
    taskIds: v.array(v.id("questTasks")),
    requiredItemIds: v.optional(v.array(v.id("items"))),
    involvedCharacterIds: v.optional(v.array(v.id("characters"))),
    participantIds: v.optional(v.array(v.id("characters"))),
    interactions: v.optional(v.array(v.id("interactions"))),
    rewards: v.optional(
      v.object({
        xp: v.optional(v.number()),
        gold: v.optional(v.number()),
        itemIds: v.optional(v.array(v.id("items"))),
      })
    ),
    completionXP: v.optional(v.number()),
    timelineEventId: v.optional(v.id("timelineEvents")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  questTasks: defineTable({
    questId: v.id("quests"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("Fetch"),
      v.literal("Kill"),
      v.literal("Speak"),
      v.literal("Explore"),
      v.literal("Puzzle"),
      v.literal("Deliver"),
      v.literal("Escort"),
      v.literal("Custom")
    ),
    status: v.union(
      v.literal("NotStarted"),
      v.literal("InProgress"),
      v.literal("Completed"),
      v.literal("Failed")
    ),
    dependsOn: v.optional(v.array(v.id("questTasks"))),
    assignedTo: v.optional(v.array(v.id("characters"))),
    locationId: v.optional(v.id("locations")),
    targetNpcId: v.optional(v.id("characters")),
    requiredItemIds: v.optional(v.array(v.id("items"))),
    interactions: v.optional(v.array(v.id("interactions"))),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  interactions: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    creatorId: v.id("users"),
    campaignId: v.optional(v.id("campaigns")),
    dmUserId: v.id("users"),
    relatedLocationId: v.optional(v.id("locations")),
    relatedQuestId: v.optional(v.id("quests")),
    questTaskId: v.optional(v.id("questTasks")),
    isTestInteraction: v.optional(v.boolean()),
    testScenarioId: v.optional(v.id("testScenarios")),
    status: v.union(
      v.literal("idle"),
      v.literal("live"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("PENDING_INITIATIVE"), // Keep for backwards compatibility
      v.literal("INITIATIVE_ROLLED"),
      v.literal("WAITING_FOR_PLAYER_TURN"),
      v.literal("PROCESSING_PLAYER_ACTION"),
      v.literal("DM_REVIEW"),
      v.literal("COMPLETED"),
      v.literal("CANCELLED")
    ),
    initiativeOrder: v.optional(
      v.array(
        v.object({
          entityId: v.string(),
          entityType: v.union(
            v.literal("playerCharacter"),
            v.literal("npc"),
            v.literal("monster")
          ),
          initiativeRoll: v.number(),
          dexterityModifier: v.number(),
        })
      )
    ),
    currentInitiativeIndex: v.optional(v.number()),
    participantMonsterIds: v.optional(v.array(v.id("monsters"))),
    participantNpcIds: v.optional(v.array(v.id("characters"))),
    participantPlayerCharacterIds: v.optional(v.array(v.id("characters"))),
    mapIds: v.optional(v.array(v.id("maps"))),
    turns: v.optional(v.array(v.id("turns"))),
    interactionLog: v.optional(v.array(v.any())),
    interactionState: v.optional(v.any()),
    rewardItemIds: v.optional(v.array(v.id("items"))),
    xpAwards: v.optional(
      v.array(
        v.object({
          playerCharacterId: v.id("characters"),
          xp: v.number(),
        })
      )
    ),
    playerCharacterIds: v.optional(v.array(v.id("characters"))),
    npcIds: v.optional(v.array(v.id("characters"))),
    monsterIds: v.optional(v.array(v.id("monsters"))),
    timelineEventIds: v.optional(v.array(v.id("timelineEvents"))),
    
    // Live system specific fields
    liveRoomId: v.optional(v.string()),
    lastStateSnapshot: v.optional(v.any()),
    snapshotTimestamp: v.optional(v.number()),
    
    // Connection tracking
    connectedParticipants: v.optional(v.array(v.string())),
    lastActivity: v.optional(v.number()),
    
    // Turn management
    currentTurnTimeout: v.optional(v.number()),
    turnTimeLimit: v.optional(v.number()), // seconds
    
    // Chat and communication
    chatEnabled: v.optional(v.boolean()),
    allowPrivateChat: v.optional(v.boolean()),
    
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  playerActions: defineTable({
    interactionId: v.id("interactions"),
    playerCharacterId: v.id("characters"),
    actionDescription: v.string(),
    actionType: v.union(
      v.literal("Dialogue"),
      v.literal("CombatAction"),
      v.literal("PuzzleInput"),
      v.literal("Custom")
    ),
    submittedAt: v.number(),
    status: v.union(v.literal("PENDING"), v.literal("DM_REVIEW"), v.literal("RESOLVED"), v.literal("SKIPPED")),
    dmNotes: v.optional(v.string()),
    associatedItemId: v.optional(v.id("items")),
    createdAt: v.number(),
  }),

  sessions: defineTable({
    campaignId: v.id("campaigns"),
    date: v.number(),
    participantPlayerCharacterIds: v.array(v.id("characters")),
    participantUserIds: v.array(v.id("users")),
    summary: v.optional(v.string()),
    xpAwards: v.optional(
      v.array(
        v.object({
          playerCharacterId: v.id("characters"),
          xp: v.number(),
        })
      )
    ),
    lootAwards: v.optional(
      v.array(
        v.object({
          playerCharacterId: v.id("characters"),
          gold: v.optional(v.number()),
          itemIds: v.optional(v.array(v.id("items"))),
        })
      )
    ),
    notes: v.optional(v.string()),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  timelineEvents: defineTable({
    campaignId: v.id("campaigns"),
    title: v.string(),
    description: v.string(),
    date: v.number(),
    status: v.union(v.literal("idle"), v.literal("in_progress"), v.literal("completed")),
    type: v.optional(
      v.union(
        v.literal("Battle"),
        v.literal("Alliance"),
        v.literal("Discovery"),
        v.literal("Disaster"),
        v.literal("Political"),
        v.literal("Cultural"),
        v.literal("Custom")
      )
    ),
    relatedLocationIds: v.optional(v.array(v.id("locations"))),
    relatedNpcIds: v.optional(v.array(v.id("characters"))),
    relatedFactionIds: v.optional(v.array(v.id("factions"))),
    relatedQuestIds: v.optional(v.array(v.id("quests"))),
    primaryQuestId: v.optional(v.id("quests")),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  factions: defineTable({
    campaignId: v.id("campaigns"),
    name: v.string(),
    description: v.string(),
    leaderNpcIds: v.optional(v.array(v.id("characters"))),
    alliedFactionIds: v.optional(v.array(v.id("factions"))),
    enemyFactionIds: v.optional(v.array(v.id("factions"))),
    goals: v.optional(v.array(v.string())),
    reputation: v.optional(
      v.array(
        v.object({
          playerCharacterId: v.id("characters"),
          score: v.number(),
        })
      )
    ),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  monsters: defineTable({
    name: v.string(),
    imageUrl: v.optional(v.string()),
    source: v.optional(v.string()),
    page: v.optional(v.string()),
    size: v.union(
      v.literal("Tiny"),
      v.literal("Small"),
      v.literal("Medium"),
      v.literal("Large"),
      v.literal("Huge"),
      v.literal("Gargantuan")
    ),
    type: v.string(),
    tags: v.optional(v.array(v.string())),
    alignment: v.string(),
    armorClass: v.number(),
    armorType: v.optional(v.string()),
    hitPoints: v.number(),
    hitDice: v.object({
      count: v.number(),
      die: v.union(v.literal("d4"), v.literal("d6"), v.literal("d8"), v.literal("d10"), v.literal("d12")),
    }),
    proficiencyBonus: v.number(),
    speed: v.object({
      walk: v.optional(v.string()),
      swim: v.optional(v.string()),
      fly: v.optional(v.string()),
      burrow: v.optional(v.string()),
      climb: v.optional(v.string()),
    }),

    abilityScores: v.object({
      strength: v.number(),
      dexterity: v.number(),
      constitution: v.number(),
      intelligence: v.number(),
      wisdom: v.number(),
      charisma: v.number(),
    }),

    // ← NEW: precomputed ability modifiers
    abilityModifiers: v.optional(
      v.object({
        strength: v.number(),
        dexterity: v.number(),
        constitution: v.number(),
        intelligence: v.number(),
        wisdom: v.number(),
        charisma: v.number(),
      })
    ),

    savingThrows: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    damageVulnerabilities: v.optional(v.array(v.string())),
    damageResistances: v.optional(v.array(v.string())),
    damageImmunities: v.optional(v.array(v.string())),
    conditionImmunities: v.optional(v.array(v.string())),
    senses: v.object({
      darkvision: v.optional(v.string()),
      blindsight: v.optional(v.string()),
      tremorsense: v.optional(v.string()),
      truesight: v.optional(v.string()),
      passivePerception: v.number(),
    }),
    languages: v.optional(v.string()),
    challengeRating: v.string(),
    challengeRatingValue: v.optional(v.number()),
    experiencePoints: v.optional(v.number()),
    legendaryActionCount: v.optional(v.number()),
    lairActionCount: v.optional(v.number()),
    traits: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
        })
      )
    ),
    actions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
        })
      )
    ),
    reactions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
        })
      )
    ),
    legendaryActions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
        })
      )
    ),
    lairActions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
        })
      )
    ),
    regionalEffects: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
        })
      )
    ),
    environment: v.optional(v.array(v.string())),
    inventory: v.optional(
      v.object({
        capacity: v.number(),
        items: v.array(v.object({
          itemId: v.union(v.id("items"), v.string()),
          quantity: v.number(),
        })),
      })
    ),
    equipment: v.optional(
      v.object({
        headgear: v.optional(v.union(v.id("items"), v.string())),
        armwear: v.optional(v.union(v.id("items"), v.string())),
        chestwear: v.optional(v.union(v.id("items"), v.string())),
        legwear: v.optional(v.union(v.id("items"), v.string())),
        footwear: v.optional(v.union(v.id("items"), v.string())),
        mainHand: v.optional(v.union(v.id("items"), v.string())),
        offHand: v.optional(v.union(v.id("items"), v.string())),
        accessories: v.array(v.union(v.id("items"), v.string())),
      })
    ),
    equipmentBonuses: v.optional(
      v.object({
        armorClass: v.number(),
        abilityScores: v.object({
          strength: v.number(),
          dexterity: v.number(),
          constitution: v.number(),
          intelligence: v.number(),
          wisdom: v.number(),
          charisma: v.number(),
        }),
      })
    ),

    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    
    // Clone metadata
    clonedFrom: v.optional(v.id("monsters")), // Reference to original monster if this is a clone
    clonedAt: v.optional(v.number()),
  }),

  spells: defineTable({
    campaignId: v.id("campaigns"),
    name: v.string(),
    level: v.union( 
      v.literal(0), v.literal(1), v.literal(2), v.literal(3), v.literal(4),
      v.literal(5), v.literal(6), v.literal(7), v.literal(8), v.literal(9)
    ),
    school: v.union(
      v.literal("Abjuration"),
      v.literal("Conjuration"),
      v.literal("Divination"),
      v.literal("Enchantment"),
      v.literal("Evocation"),
      v.literal("Illusion"),
      v.literal("Necromancy"),
      v.literal("Transmutation")
    ),
    classes: v.array(v.string()), // Keep for backward compatibility
    classIds: v.optional(v.array(v.id("dndClasses"))), // References to classes in dndClasses table
    castingTime: v.string(),
    range: v.string(),
    components: v.object({
      verbal: v.boolean(),
      somatic: v.boolean(),
      material: v.optional(v.string()),
    }),
    ritual: v.boolean(),
    concentration: v.boolean(),
    duration: v.string(),
    description: v.string(),
    higherLevel: v.optional(v.string()),
    source: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  deities: defineTable({
    campaignId: v.id("campaigns"),
    name: v.string(),
    alignment: v.string(),
    domains: v.array(v.string()),
    symbol: v.string(),
    description: v.string(),
    relationships: v.optional(
      v.array(
        v.object({
          deityId: v.id("deities"),
          relationship: v.string(),
        })
      )
    ),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  journals: defineTable({
    campaignId: v.id("campaigns"),
    title: v.string(),
    content: v.string(),
    authorUserId: v.id("users"),
    authorPlayerCharacterId: v.optional(v.id("characters")),
    dateCreated: v.number(),
    lastEdited: v.optional(v.number()),
  }),

  mediaAssets: defineTable({
    campaignId: v.id("campaigns"),
    name: v.string(),
    type: v.union(
      v.literal("Image"),
      v.literal("Audio"),
      v.literal("Video"),
      v.literal("Map"),
      v.literal("Handout"),
      v.literal("Other")
    ),
    url: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.id("tags"))),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  storyArcs: defineTable({
    campaignId: v.id("campaigns"),
    name: v.string(),
    description: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    relatedQuestIds: v.optional(v.array(v.id("quests"))),
    relatedEventIds: v.optional(v.array(v.id("timelineEvents"))),
    tags: v.optional(v.array(v.id("tags"))),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  tags: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }),

  milestones: defineTable({
    campaignId: v.id("campaigns"),
    name: v.string(),
    description: v.string(),
    targetDate: v.number(),
    achieved: v.boolean(),
    achievedAt: v.optional(v.number()),
    relatedEventIds: v.optional(v.array(v.id("timelineEvents"))),
    relatedQuestIds: v.optional(v.array(v.id("quests"))),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  userSessions: defineTable({
    clerkId: v.string(),
    startTime: v.number(),
    lastActivity: v.number(),
    isActive: v.boolean(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  }),

  userSessionActivities: defineTable({
    sessionId: v.id("userSessions"),
    clerkId: v.string(),
    activityType: v.string(),
    details: v.any(),
    timestamp: v.number(),
  }),

  joinRequests: defineTable({
    campaignId: v.id("campaigns"),
    requesterUserClerkId: v.string(),
    requesterUserId: v.id("users"),
    playerCharacterId: v.id("characters"),
    status: v.union(v.literal("PENDING"), v.literal("APPROVED"), v.literal("DENIED")),
    denyReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  notifications: defineTable({
    userClerkId: v.string(),
    type: v.union(v.literal("JOIN_REQUEST"), v.literal("JOIN_APPROVED"), v.literal("JOIN_DENIED")),
    payload: v.any(),
    isRead: v.boolean(),
    createdAt: v.number(),
  }),

  mapInstances: defineTable({
    mapId: v.id("maps"),
    campaignId: v.optional(v.id("campaigns")),
    interactionId: v.optional(v.id("interactions")),
    name: v.string(),
    currentPositions: v.array(
      v.object({
        entityId: v.string(),
        entityType: v.union(v.literal("playerCharacter"), v.literal("npc"), v.literal("monster")),
        x: v.number(),
        y: v.number(),
        speed: v.number(),
        name: v.string(),
        color: v.string(),
      })
    ),
    movementHistory: v.array(
      v.object({
        entityId: v.string(),
        entityType: v.union(v.literal("playerCharacter"), v.literal("npc"), v.literal("monster")),
        fromX: v.number(),
        fromY: v.number(),
        toX: v.number(),
        toY: v.number(),
        timestamp: v.number(),
        distance: v.number(),
      })
    ),
    createdBy: v.id("users"),
    clerkId: v.optional(v.string()), // Make optional for backward compatibility
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  turns: defineTable({
    interactionId: v.id("interactions"),
    turnOwner: v.object({
      id: v.string(),
      type: v.union(v.literal("playerCharacter"), v.literal("npc"), v.literal("monster"))
    }),
    actionTaken: v.string(),
    turnTarget: v.optional(v.object({
      id: v.string(),
      type: v.union(v.literal("playerCharacter"), v.literal("npc"), v.literal("monster"))
    })),
    distanceAvailable: v.number(),
    turnNumber: v.number(),
    roundNumber: v.number(),
    createdAt: v.number(),
  }),

  testScenarios: defineTable({
    level: v.number(),
    data: v.string(), // JSON stringified scenario data
    createdBy: v.id("users"),
    createdAt: v.number(),
  }),

  // Live interaction system tables
  liveInteractionLogs: defineTable({
    interactionId: v.id("interactions"),
    eventType: v.string(),
    eventData: v.any(),
    userId: v.optional(v.id("users")),
    entityId: v.optional(v.string()),
    timestamp: v.number(),
    sessionId: v.string(), // For grouping events by session
  }),

  turnRecords: defineTable({
    interactionId: v.id("interactions"),
    entityId: v.string(),
    entityType: v.union(
      v.literal("playerCharacter"),
      v.literal("npc"), 
      v.literal("monster")
    ),
    turnNumber: v.number(),
    roundNumber: v.number(),
    actions: v.array(v.any()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.union(
      v.literal("completed"),
      v.literal("skipped"),
      v.literal("timeout")
    ),
    userId: v.optional(v.id("users")),
  }),

  // Live System Tables for Real-time D&D Interactions
  liveRooms: defineTable({
    interactionId: v.id("interactions"),
    roomId: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("active"), 
      v.literal("paused"), 
      v.literal("completed")
    ),
    gameState: v.object({
      status: v.union(
        v.literal("waiting"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("completed")
      ),
      initiativeOrder: v.array(v.object({
        entityId: v.string(),
        entityType: v.union(
          v.literal("playerCharacter"),
          v.literal("npc"),
          v.literal("monster")
        ),
        initiativeRoll: v.number(),
        dexterityModifier: v.number(),
      })),
      currentTurnIndex: v.number(),
      roundNumber: v.number(),
      mapState: v.object({
        width: v.number(),
        height: v.number(),
        entities: v.any(), // Map serialized as object
        obstacles: v.array(v.object({
          x: v.number(),
          y: v.number(),
          width: v.number(),
          height: v.number(),
          type: v.string()
        })),
        terrain: v.array(v.object({
          x: v.number(),
          y: v.number(),
          terrainType: v.string(),
          effects: v.optional(v.array(v.string()))
        }))
      }),
      turnHistory: v.array(v.object({
        turnNumber: v.number(),
        entityId: v.string(),
        actions: v.array(v.any()),
        timestamp: v.number()
      })),
      chatLog: v.array(v.object({
        id: v.string(),
        timestamp: v.number(),
        userId: v.string(),
        content: v.string(),
        type: v.string()
      })),
      timestamp: v.number()
    }),
    participants: v.array(v.object({
      userId: v.string(),
      entityId: v.string(),
      entityType: v.union(
        v.literal("playerCharacter"),
        v.literal("npc"),
        v.literal("monster")
      ),
      connectionId: v.string(),
      isConnected: v.boolean(),
      lastActivity: v.number(),
      characterData: v.optional(v.any()) // Character stats for quick access
    })),
    dmUserId: v.string(),
    currentTurnTimeout: v.optional(v.number()),
    turnTimeLimit: v.optional(v.number()), // seconds
    createdAt: v.number(),
    lastActivity: v.number(),
    settings: v.optional(v.object({
      allowPrivateChat: v.boolean(),
      turnTimeLimit: v.number(),
      autoSkipInactivePlayers: v.boolean(),
      enableDiceRolling: v.boolean()
    }))
  })
    .index("by_interaction", ["interactionId"])
    .index("by_room_id", ["roomId"]),

  liveChatMessages: defineTable({
    interactionId: v.id("interactions"),
    roomId: v.string(),
    userId: v.string(),
    entityId: v.optional(v.string()),
    content: v.string(),
    type: v.union(
      v.literal("party"),
      v.literal("dm"),
      v.literal("private"),
      v.literal("system"),
      v.literal("dice"),
      v.literal("action")
    ),
    recipients: v.optional(v.array(v.string())),
    timestamp: v.number(),
    metadata: v.optional(v.object({
      diceRoll: v.optional(v.object({
        dice: v.string(), // e.g., "1d20+5"
        result: v.number(),
        breakdown: v.string() // e.g., "15 + 5 = 20"
      })),
      actionType: v.optional(v.string()),
      targetEntityId: v.optional(v.string()),
      damage: v.optional(v.object({
        amount: v.number(),
        type: v.string()
      }))
    })),
    isVisible: v.boolean(), // For DM-only messages
    editedAt: v.optional(v.number()),
    replyToId: v.optional(v.id("liveChatMessages"))
  })
    .index("by_interaction", ["interactionId"])
    .index("by_room", ["roomId"])
    .index("by_timestamp", ["timestamp"]),

  liveGameEvents: defineTable({
    interactionId: v.id("interactions"),
    roomId: v.string(),
    eventType: v.union(
      v.literal("PARTICIPANT_JOINED"),
      v.literal("PARTICIPANT_LEFT"),
      v.literal("TURN_STARTED"),
      v.literal("TURN_ENDED"),
      v.literal("ACTION_PERFORMED"),
      v.literal("DAMAGE_DEALT"),
      v.literal("HEALING_APPLIED"),
      v.literal("STATUS_EFFECT_APPLIED"),
      v.literal("STATUS_EFFECT_REMOVED"),
      v.literal("INITIATIVE_ROLLED"),
      v.literal("ROUND_STARTED"),
      v.literal("COMBAT_STARTED"),
      v.literal("COMBAT_ENDED"),
      v.literal("ROOM_PAUSED"),
      v.literal("ROOM_RESUMED"),
      v.literal("ERROR")
    ),
    eventData: v.any(),
    timestamp: v.number(),
    userId: v.optional(v.string()),
    entityId: v.optional(v.string()),
    isSystemEvent: v.boolean(),
    severity: v.optional(v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error")
    ))
  })
    .index("by_interaction", ["interactionId"])
    .index("by_room", ["roomId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_event_type", ["eventType"]),

  liveTurnActions: defineTable({
    interactionId: v.id("interactions"),
    roomId: v.string(),
    turnNumber: v.number(),
    entityId: v.string(),
    entityType: v.union(
      v.literal("playerCharacter"),
      v.literal("npc"),
      v.literal("monster")
    ),
    actionType: v.union(
      v.literal("move"),
      v.literal("attack"),
      v.literal("useItem"),
      v.literal("cast"),
      v.literal("interact"),
      v.literal("end")
    ),
    actionData: v.object({
      target: v.optional(v.string()),
      position: v.optional(v.object({
        x: v.number(),
        y: v.number()
      })),
      itemId: v.optional(v.string()),
      spellId: v.optional(v.string()),
      parameters: v.optional(v.any())
    }),
    result: v.optional(v.object({
      success: v.boolean(),
      damage: v.optional(v.number()),
      healing: v.optional(v.number()),
      effects: v.optional(v.array(v.string())),
      message: v.optional(v.string())
    })),
    diceRolls: v.optional(v.array(v.object({
      type: v.string(), // "attack", "damage", "save", etc.
      dice: v.string(),
      result: v.number(),
      breakdown: v.string()
    }))),
    timestamp: v.number(),
    processingTime: v.optional(v.number()), // ms to process
    validationErrors: v.optional(v.array(v.string()))
  })
    .index("by_interaction", ["interactionId"])
    .index("by_room", ["roomId"])
    .index("by_turn", ["turnNumber"])
    .index("by_entity", ["entityId"]),

  liveParticipantStates: defineTable({
    interactionId: v.id("interactions"),
    roomId: v.string(),
    userId: v.string(),
    entityId: v.string(),
    entityType: v.union(
      v.literal("playerCharacter"),
      v.literal("npc"),
      v.literal("monster")
    ),
    currentHP: v.number(),
    maxHP: v.number(),
    tempHP: v.optional(v.number()),
    armorClass: v.number(),
    position: v.object({
      x: v.number(),
      y: v.number()
    }),
    statusEffects: v.array(v.object({
      name: v.string(),
      description: v.string(),
      duration: v.optional(v.number()), // rounds remaining
      stackable: v.boolean(),
      source: v.optional(v.string())
    })),
    conditions: v.array(v.string()), // D&D 5e conditions
    resources: v.object({
      spellSlots: v.optional(v.array(v.object({
        level: v.number(),
        total: v.number(),
        used: v.number()
      }))),
      features: v.optional(v.array(v.object({
        name: v.string(),
        uses: v.number(),
        maxUses: v.number(),
        resetOn: v.string() // "short_rest", "long_rest", "dawn"
      })))
    }),
    lastActionTimestamp: v.optional(v.number()),
    isOnline: v.boolean(),
    updatedAt: v.number()
  })
    .index("by_interaction", ["interactionId"])
    .index("by_room", ["roomId"])
    .index("by_entity", ["entityId"])
    .index("by_user", ["userId"]),

  liveSystemLogs: defineTable({
    level: v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warn"),
      v.literal("error")
    ),
    component: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
    interactionId: v.optional(v.id("interactions")),
    roomId: v.optional(v.string()),
    userId: v.optional(v.string()),
    timestamp: v.number()
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_level", ["level"])
    .index("by_interaction", ["interactionId"]),

  // Game Constants Tables - Store hardcoded D&D 5e data
  gameConstants: defineTable({
    category: v.string(), // "damage_types", "dice_types", "action_costs", "item_types", etc.
    key: v.string(),
    value: v.string(),
    displayName: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    metadata: v.optional(v.any()), // Additional data like icons, colors, etc.
    isActive: v.boolean(), // Allow disabling constants without deleting
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_key", ["key"])
    .index("by_category_sort", ["category", "sortOrder"]),

  equipmentSlots: defineTable({
    key: v.string(), // "headgear", "armwear", etc.
    label: v.string(), // "Head", "Arms", etc.
    icon: v.string(), // Emoji or icon identifier
    allowedItemTypes: v.array(v.string()), // ["Armor"], ["Weapon", "Shield"], etc.
    sortOrder: v.number(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_sort", ["sortOrder"]),

  dndClasses: defineTable({
    name: v.string(), // "Fighter", "Wizard", etc.
    hitDie: v.string(), // "d10", "d6", etc.
    primaryAbility: v.string(), // "Strength", "Intelligence", etc.
    savingThrowProficiencies: v.array(v.string()), // ["Strength", "Constitution"]
    armorProficiencies: v.array(v.string()), // ["Light", "Medium", "Heavy"]
    weaponProficiencies: v.array(v.string()), // ["Simple", "Martial"]
    description: v.optional(v.string()),
    sourceBook: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_primary_ability", ["primaryAbility"]),

  abilityScores: defineTable({
    key: v.string(), // "strength", "dexterity", etc.
    label: v.string(), // "Strength", "Dexterity", etc.
    abbreviation: v.string(), // "STR", "DEX", etc.
    description: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_sort", ["sortOrder"]),

  pointBuyCosts: defineTable({
    score: v.number(), // 8, 9, 10, etc.
    cost: v.number(), // 0, 1, 2, etc.
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_score", ["score"]),

  actionCosts: defineTable({
    value: v.string(), // "Action", "Bonus Action", etc.
    icon: v.optional(v.string()), // Icon identifier
    color: v.optional(v.string()), // CSS color classes
    description: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_sort", ["sortOrder"]),

  actionTypes: defineTable({
    value: v.string(), // "MELEE_ATTACK", "RANGED_ATTACK", etc.
    displayName: v.string(), // "Melee Attack", "Ranged Attack", etc.
    description: v.string(),
    category: v.optional(v.string()), // "combat", "utility", "spell", etc.
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_category", ["category"])
    .index("by_sort", ["sortOrder"]),

  damageTypes: defineTable({
    value: v.string(), // "BLUDGEONING", "PIERCING", etc.
    displayName: v.string(), // "Bludgeoning", "Piercing", etc.
    description: v.string(),
    category: v.optional(v.string()), // "physical", "elemental", "magical", etc.
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_category", ["category"])
    .index("by_sort", ["sortOrder"]),

  diceTypes: defineTable({
    value: v.string(), // "D4", "D6", "D8", etc.
    displayName: v.string(), // "d4", "d6", "d8", etc.
    sides: v.number(), // 4, 6, 8, etc.
    description: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_sides", ["sides"])
    .index("by_sort", ["sortOrder"]),

  itemTypes: defineTable({
    value: v.string(), // "Weapon", "Armor", etc.
    displayName: v.string(), // "Weapon", "Armor", etc.
    description: v.string(),
    category: v.optional(v.string()), // "combat", "defense", "consumable", etc.
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_category", ["category"])
    .index("by_sort", ["sortOrder"]),

  itemRarities: defineTable({
    value: v.string(), // "Common", "Uncommon", etc.
    displayName: v.string(), // "Common", "Uncommon", etc.
    description: v.string(),
    color: v.optional(v.string()), // CSS color for UI display
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_sort", ["sortOrder"]),

  armorCategories: defineTable({
    value: v.string(), // "Light", "Medium", "Heavy", "Shield"
    displayName: v.string(), // "Light", "Medium", "Heavy", "Shield"
    description: v.string(),
    maxDexBonus: v.optional(v.number()), // Maximum dexterity bonus
    stealthDisadvantage: v.optional(v.boolean()), // Whether stealth is at disadvantage
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_sort", ["sortOrder"]),

  spellLevels: defineTable({
    level: v.number(), // 0, 1, 2, etc.
    displayName: v.string(), // "Cantrip", "1st Level", "2nd Level", etc.
    description: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_level", ["level"]),

  restTypes: defineTable({
    value: v.string(), // "Short Rest", "Long Rest", etc.
    displayName: v.string(), // "Short Rest", "Long Rest", etc.
    description: v.string(),
    duration: v.optional(v.string()), // "1 hour", "8 hours", etc.
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_sort", ["sortOrder"]),

  characterTypes: defineTable({
    value: v.string(), // "player", "npc"
    displayName: v.string(), // "Player Character", "Non-Player Character"
    description: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_sort", ["sortOrder"]),

  userRoles: defineTable({
    value: v.string(), // "admin", "user"
    displayName: v.string(), // "Administrator", "User"
    description: v.string(),
    permissions: v.array(v.string()), // Array of permission strings
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_sort", ["sortOrder"]),

  // Battle Map System Tables (Enhanced with terrain and cell features)
  battleMaps: defineTable({
    name: v.string(),
    cols: v.number(),
    rows: v.number(),
    cellSize: v.number(), // px
    // Terrain and cell data (optional for backward compatibility)
    cells: v.optional(v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        state: v.optional(v.union(v.literal("inbounds"), v.literal("outbounds"), v.literal("occupied"))),
        terrainType: v.optional(
          v.union(
            v.literal("normal"),
            v.literal("difficult"),
            v.literal("hazardous"),
            v.literal("magical"),
            v.literal("water"),
            v.literal("ice"),
            v.literal("fire"),
            v.literal("acid"),
            v.literal("poison"),
            v.literal("unstable")
          )
        ),
        terrainEffect: v.optional(
          v.object({
            movementCostMultiplier: v.optional(v.number()),
            damage: v.optional(
              v.object({
                amount: v.number(),
                type: v.union(
                  v.literal("fire"),
                  v.literal("cold"),
                  v.literal("acid"),
                  v.literal("poison"),
                  v.literal("necrotic"),
                  v.literal("radiant")
                ),
                saveType: v.optional(v.string()),
                saveDC: v.optional(v.number())
              })
            ),
            abilityChecks: v.optional(
              v.array(
                v.object({
                  ability: v.string(),
                  dc: v.number(),
                  onFailure: v.string()
                })
              )
            ),
            specialEffects: v.optional(v.array(v.string()))
          })
        ),
        customColor: v.optional(v.string()),
      })
    )),
    createdBy: v.optional(v.id("users")),
    clerkId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .index("by_creator", ["createdBy"]),

  battleTokens: defineTable({
    mapId: v.id("battleMaps"),
    x: v.number(), // 0..cols-1
    y: v.number(), // 0..rows-1
    label: v.string(),
    type: v.union(
      v.literal("pc"),
      v.literal("npc_friendly"),
      v.literal("npc_foe")
    ),
    color: v.string(), // hex
    size: v.number(), // tile size (1=1x1)
    // Enhanced token data
    characterId: v.optional(v.id("characters")),
    monsterId: v.optional(v.id("monsters")),
    speed: v.optional(v.number()),
    hp: v.optional(v.number()),
    maxHp: v.optional(v.number()),
    conditions: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_map", ["mapId"]),

  // Map instances for active game sessions
  battleMapInstances: defineTable({
    mapId: v.id("battleMaps"),
    name: v.string(),
    campaignId: v.optional(v.id("campaigns")),
    interactionId: v.optional(v.id("interactions")),
    currentPositions: v.array(
      v.object({
        tokenId: v.id("battleTokens"),
        x: v.number(),
        y: v.number(),
      })
    ),
    movementHistory: v.array(
      v.object({
        tokenId: v.id("battleTokens"),
        fromX: v.number(),
        fromY: v.number(),
        toX: v.number(),
        toY: v.number(),
        timestamp: v.number(),
        distance: v.number(),
      })
    ),
    createdBy: v.id("users"),
    clerkId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_map", ["mapId"])
    .index("by_campaign", ["campaignId"])
    .index("by_interaction", ["interactionId"]),

  mapCellStates: defineTable({
    value: v.string(), // "inbounds", "outbounds", "occupied"
    displayName: v.string(), // "In Bounds", "Out of Bounds", "Occupied"
    description: v.string(),
    color: v.optional(v.string()), // CSS color for map display
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_sort", ["sortOrder"]),

  terrainTypes: defineTable({
    value: v.string(), // "normal", "difficult", "water", etc.
    displayName: v.string(), // "Normal", "Difficult Terrain", "Water", etc.
    description: v.string(),
    movementCost: v.optional(v.number()), // Movement cost multiplier
    color: v.optional(v.string()), // CSS color for map display
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_value", ["value"])
    .index("by_sort", ["sortOrder"]),

});