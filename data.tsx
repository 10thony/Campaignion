import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// --- MOCK DATA GENERATION ---

// Helper to generate mock IDs for linking documents
const mockId = (tableName: string, id: number) =>
  `mock_${tableName}_${id}` as any;

// --- 1. USERS ---
// We'll create a Dungeon Master (DM) and three players.
export const users = [
  {
    _id: mockId("users", 1),
    clerkId: "user_30wQvGF7jVlHWZkcZoMegXfFTj6", // testuserone@email.com
    email: "testuserone@email.com",
    firstName: "Alex",
    lastName: "Chen",
    imageUrl: "https://i.pravatar.cc/150?u=dm",
    createdAt: Date.now(),
    role: "admin" as const,
  },
  {
    _id: mockId("users", 2),
    clerkId: "user_30wQwjkLe71BL07BGM8VmGGNk7y", // testusertwo@email.com
    email: "testusertwo@email.com",
    firstName: "Brianna",
    lastName: "Jones",
    imageUrl: "https://i.pravatar.cc/150?u=player1",
    createdAt: Date.now(),
    role: "user" as const,
  },
  {
    _id: mockId("users", 3),
    clerkId: "user_30wR7CXDj7tmHRPzZPxhZuay79d", // testuserthree@email.com
    email: "testuserthree@email.com",
    firstName: "Carlos",
    lastName: "Reyes",
    imageUrl: "https://i.pravatar.cc/150?u=player2",
    createdAt: Date.now(),
    role: "user" as const,
  },
  {
    _id: mockId("users", 4),
    clerkId: "user_30wRdopuzCpfKRooPEulobWFxSh", // testuserfour@email.com
    email: "testuserfour@email.com",
    firstName: "Diana",
    lastName: "Prince",
    imageUrl: "https://i.pravatar.cc/150?u=player3",
    createdAt: Date.now(),
    role: "user" as const,
  },
];

// --- 2. CAMPAIGN ---
// The central hub for our adventure.
export const campaigns = [
  {
    _id: mockId("campaigns", 1),
    name: "The Whispering Caves of Phandalin",
    creatorId: mockId("users", 1),
    description:
      "A group of adventurers are hired to escort a valuable cargo to the mining town of Phandalin, but a simple job quickly turns into a dangerous rescue mission.",
    imageUrl: "https://img.freepik.com/free-photo/fantasy-landscape-with-mountains-water_23-2151329258.jpg",
    isPublic: true,
    dmId: "user_30wQvGF7jVlHWZkcZoMegXfFTj6",
    participantUserIds: [
      mockId("users", 2),
      mockId("users", 3),
      mockId("users", 4),
    ],
    participantPlayerCharacterIds: [
      mockId("characters", 1),
      mockId("characters", 2),
      mockId("characters", 3),
    ],
    locationIds: [mockId("locations", 1), mockId("locations", 2)],
    questIds: [mockId("quests", 1)],
    sessionIds: [mockId("sessions", 1)],
    npcIds: [mockId("characters", 4)],
    monsterIds: [mockId("monsters", 1)],
    createdAt: Date.now(),
  },
];

// --- 3. CHARACTERS (PCs & NPCs) ---
// Our brave adventurers and a key non-player character.
export const characters = [
  // Player Characters
  {
    _id: mockId("characters", 1),
    name: "Theron Ironhand",
    race: "Mountain Dwarf",
    class: "Fighter",
    background: "Soldier",
    alignment: "Lawful Good",
    characterType: "player" as const,
    imageUrl: "https://e8zcnvv6pc.ufs.sh/f/EGwxt3j7spbwTX1sLJywOvQdh9oksP1VXercybFaf0NJHCRA",
    abilityScores: {
      strength: 16,
      dexterity: 12,
      constitution: 15,
      intelligence: 10,
      wisdom: 13,
      charisma: 8,
    },
    abilityModifiers: { strength: 3, dexterity: 1, constitution: 2, intelligence: 0, wisdom: 1, charisma: -1 },
    skills: ["Athletics", "Intimidation"],
    savingThrows: ["Strength", "Constitution"],
    proficiencies: ["All armor", "Shields", "Simple and martial weapons"],
    level: 1,
    experiencePoints: 300,
    hitPoints: 12,
    armorClass: 18, // Chain mail + Shield
    proficiencyBonus: 2,
    actions: [mockId("actions", 1)],
    userId: mockId("users", 2),
    createdAt: Date.now(),
  },
  {
    _id: mockId("characters", 2),
    name: "Lyra Meadowlight",
    race: "Wood Elf",
    class: "Rogue",
    background: "Urchin",
    alignment: "Chaotic Good",
    characterType: "player" as const,
    imageUrl: "https://e8zcnvv6pc.ufs.sh/f/EGwxt3j7spbw8hOxAw35tm3VI8ugaFbZC6Sezfdp70XnHwWK",
    abilityScores: {
      strength: 11,
      dexterity: 17,
      constitution: 13,
      intelligence: 12,
      wisdom: 14,
      charisma: 10,
    },
    abilityModifiers: { strength: 0, dexterity: 3, constitution: 1, intelligence: 1, wisdom: 2, charisma: 0 },
    skills: ["Acrobatics", "Stealth", "Sleight of Hand", "Perception"],
    savingThrows: ["Dexterity", "Intelligence"],
    proficiencies: ["Light armor", "Simple weapons", "Hand crossbows", "Longswords", "Rapiers", "Shortswords", "Thieves' Tools"],
    level: 1,
    experiencePoints: 300,
    hitPoints: 9,
    armorClass: 14, // Leather armor + Dex
    proficiencyBonus: 2,
    actions: [mockId("actions", 2)],
    userId: mockId("users", 3),
    createdAt: Date.now(),
  },
  {
    _id: mockId("characters", 3),
    name: "Elias Vance",
    race: "Human",
    class: "Wizard",
    background: "Sage",
    alignment: "Neutral Good",
    characterType: "player" as const,
    imageUrl: "https://e8zcnvv6pc.ufs.sh/f/EGwxt3j7spbwiEQrpbKTwrKs3h5SFfUDcB4qMXm1Tu9NRztb",
    abilityScores: {
      strength: 8,
      dexterity: 14,
      constitution: 12,
      intelligence: 17,
      wisdom: 15,
      charisma: 10,
    },
    abilityModifiers: { strength: -1, dexterity: 2, constitution: 1, intelligence: 3, wisdom: 2, charisma: 0 },
    skills: ["Arcana", "History", "Investigation"],
    savingThrows: ["Intelligence", "Wisdom"],
    proficiencies: ["Daggers", "Darts", "Slings", "Quarterstaffs", "Light crossbows"],
    level: 1,
    experiencePoints: 300,
    hitPoints: 7,
    armorClass: 12, // Dex
    proficiencyBonus: 2,
    actions: [mockId("actions", 3)],
    userId: mockId("users", 4),
    createdAt: Date.now(),
  },
  // Non-Player Character (Quest Giver)
  {
    _id: mockId("characters", 4),
    name: "Gundren Rockseeker",
    race: "Dwarf",
    class: "Merchant",
    background: "Guild Artisan",
    alignment: "Neutral Good",
    characterType: "npc" as const,
    imageUrl: "https://img.freepik.com/premium-photo/dwarf-stands-front-store-with-sign-that-says-dwarf-s-goods_839182-27.jpg",
    abilityScores: {
      strength: 12,
      dexterity: 10,
      constitution: 14,
      intelligence: 13,
      wisdom: 16,
      charisma: 11,
    },
    level: 3,
    hitPoints: 22,
    armorClass: 12,
    proficiencyBonus: 2,
    actions: [],
    userId: mockId("users", 1), // Created by the DM
    createdAt: Date.now(),
  },
];

// --- 4. MONSTERS ---
// The antagonists for our combat encounter.
export const monsters = [
  {
    _id: mockId("monsters", 1),
    name: "Goblin",
    imageUrl: "https://e8zcnvv6pc.ufs.sh/f/EGwxt3j7spbwI9mZ1sChMCDpzt8o1V0Xk2mUdwRKTHP7qOLZ",
    size: "Small" as const,
    type: "humanoid",
    alignment: "Neutral Evil",
    armorClass: 15,
    armorType: "leather armor, shield",
    hitPoints: 7,
    hitDice: { count: 2, die: "d6" as const },
    proficiencyBonus: 2,
    speed: { walk: "30 ft." },
    abilityScores: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
    abilityModifiers: { strength: -1, dexterity: 2, constitution: 0, intelligence: 0, wisdom: -1, charisma: -1 },
    skills: ["Stealth +6"],
    senses: { darkvision: "60 ft.", passivePerception: 9 },
    languages: "Common, Goblin",
    challengeRating: "1/4",
    experiencePoints: 50,
    actions: [
      { name: "Scimitar", description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage." },
      { name: "Shortbow", description: "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage." },
    ],
    traits: [
      { name: "Nimble Escape", description: "The goblin can take the Disengage or Hide action as a bonus action on each of its turns." },
    ],
    userId: mockId("users", 1),
    createdAt: Date.now(),
  },
];

// --- 5. ACTIONS ---
// Defining some reusable actions for characters.
export const actions = [
  {
    _id: mockId("actions", 1),
    name: "Battleaxe Attack",
    description: "A standard melee attack with a battleaxe.",
    actionCost: "Action" as const,
    type: "MELEE_ATTACK" as const,
    requiresConcentration: false,
    sourceBook: "Player's Handbook",
    attackBonusAbilityScore: "strength",
    isProficient: true,
    damageRolls: [{
      dice: { count: 1, type: "D8" as const },
      modifier: 3, // Strength modifier
      damageType: "SLASHING" as const,
    }],
    createdAt: Date.now(),
  },
  {
    _id: mockId("actions", 2),
    name: "Shortbow Attack",
    description: "A standard ranged attack with a shortbow.",
    actionCost: "Action" as const,
    type: "RANGED_ATTACK" as const,
    requiresConcentration: false,
    sourceBook: "Player's Handbook",
    attackBonusAbilityScore: "dexterity",
    isProficient: true,
    damageRolls: [{
      dice: { count: 1, type: "D6" as const },
      modifier: 3, // Dexterity modifier
      damageType: "PIERCING" as const,
    }],
    createdAt: Date.now(),
  },
  {
    _id: mockId("actions", 3),
    name: "Fire Bolt",
    description: "Hurl a mote of fire at a creature or object.",
    actionCost: "Action" as const,
    type: "SPELL" as const,
    requiresConcentration: false,
    sourceBook: "Player's Handbook",
    spellLevel: 0 as const,
    castingTime: "1 Action",
    range: "120 feet",
    damageRolls: [{
      dice: { count: 1, type: "D10" as const },
      modifier: 0,
      damageType: "FIRE" as const,
    }],
    savingThrow: { ability: "Dexterity", onSave: "None" },
    createdAt: Date.now(),
  },
];

// --- 6. ITEMS ---
// Starting gear, quest items, and rewards.
export const items = [
  {
    _id: mockId("items", 1),
    name: "Battleaxe",
    type: "Weapon" as const,
    rarity: "Common" as const,
    description: "A standard warrior's battleaxe.",
    scope: "global" as const,
    userId: mockId("users", 1),
  },
  {
    _id: mockId("items", 2),
    name: "Leather Armor",
    type: "Armor" as const,
    rarity: "Common" as const,
    description: "Armor made from cured animal hide.",
    scope: "global" as const,
    userId: mockId("users", 1),
  },
  {
    _id: mockId("items", 3),
    name: "Spellbook",
    type: "Adventuring Gear" as const,
    rarity: "Common" as const,
    description: "A wizard's treasured tome of spells.",
    scope: "global" as const,
    userId: mockId("users", 1),
  },
  {
    _id: mockId("items", 4),
    name: "Gundren's Map",
    type: "Treasure" as const,
    rarity: "Unique" as const,
    description: "A map showing the location of the lost Wave Echo Cave. It seems important.",
    scope: "campaignSpecific" as const,
    userId: mockId("users", 1),
  },
  {
    _id: mockId("items", 5),
    name: "Potion of Healing",
    type: "Potion" as const,
    rarity: "Common" as const,
    description: "A vial of red liquid that restores 2d4+2 hit points.",
    scope: "global" as const,
    effects: "Heals 2d4+2 HP when consumed.",
    userId: mockId("users", 1),
  },
];

// --- 7. LOCATIONS ---
// The settings for our story.
export const locations = [
  {
    _id: mockId("locations", 1),
    name: "The Stonehill Inn",
    type: "Town" as const,
    description: "A modest, yet bustling inn in the center of Phandalin. A good place to find rumors and a warm meal.",
    notableCharacterIds: [mockId("characters", 4)],
    linkedLocations: [mockId("locations", 2)],
    imageUrls: ["https://img.freepik.com/premium-photo/old-tavern-with-tables-benches-bar-background_873925-10595.jpg"],
    secrets: "The innkeeper, Toblen, is worried about the recent goblin troubles.",
    creatorId: mockId("users", 1),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: mockId("locations", 2),
    name: "Triboar Trail - Ambush Site",
    type: "Forest" as const,
    description: "A wooded stretch of the Triboar Trail, known for being overgrown and a prime spot for ambushes.",
    notableCharacterIds: [],
    linkedLocations: [mockId("locations",1)],
    imageUrls: ["https://img.freepik.com/free-photo/pathway-middle-forest-with-green-trees_181624-23 pathway-middle-forest-with-green-trees_181624-23.jpg"],
    secrets: "Goblins from the Cragmaw tribe use this area to raid caravans.",
    mapId: mockId("maps", 1),
    creatorId: mockId("users", 1),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// --- 8. QUESTS & TASKS ---
// The main objective for the players.
export const quests = [
  {
    _id: mockId("quests", 1),
    name: "Trouble on the Triboar Trail",
    description: "Gundren Rockseeker's supplies were meant to arrive in Phandalin days ago. He's hired you to investigate the goblin-infested trail and find his missing associate, Sildar Hallwinter.",
    campaignId: mockId("campaigns", 1),
    creatorId: mockId("users", 1),
    status: "completed" as const,
    locationId: mockId("locations", 2),
    taskIds: [mockId("questTasks", 1), mockId("questTasks", 2)],
    rewards: {
      xp: 250,
      gold: 50,
      itemIds: [mockId("items", 5)],
    },
    createdAt: Date.now(),
  },
];

export const questTasks = [
  {
    _id: mockId("questTasks", 1),
    questId: mockId("quests", 1),
    title: "Defeat the Goblin Ambushers",
    description: "The trail is blocked by a goblin ambush. You must defeat them to proceed safely.",
    type: "Kill" as const,
    status: "Completed" as const,
    locationId: mockId("locations", 2),
    userId: mockId("users", 1),
    createdAt: Date.now(),
  },
  {
    _id: mockId("questTasks", 2),
    questId: mockId("quests", 1),
    title: "Investigate the Ambush Site",
    description: "Search the area for clues about Gundren's associate and the stolen supplies.",
    type: "Explore" as const,
    status: "Completed" as const,
    dependsOn: [mockId("questTasks", 1)],
    locationId: mockId("locations", 2),
    userId: mockId("users", 1),
    createdAt: Date.now(),
  },
];

// --- 9. INTERACTIONS ---
// The narrative beats of the adventure.
export const interactions = [
  // Social Introduction
  {
    _id: mockId("interactions", 1),
    name: "A Meeting at the Inn",
    creatorId: mockId("users", 1),
    campaignId: mockId("campaigns", 1),
    dmUserId: mockId("users", 1),
    relatedLocationId: mockId("locations", 1),
    status: "completed" as const,
    participantPlayerCharacterIds: [
      mockId("characters", 1),
      mockId("characters", 2),
      mockId("characters", 3),
    ],
    participantNpcIds: [mockId("characters", 4)],
    interactionLog: [
      { type: "narrative", content: "The adventurers meet Gundren Rockseeker at the Stonehill Inn. He offers them 10 gold pieces each to escort his wagon of supplies to Phandalin." },
      { type: "dialogue", character: "Gundren", content: "It's a dangerous road, friends. I'd be mighty grateful for some capable protectors." },
    ],
    createdAt: Date.now(),
  },
  // Combat Encounter
  {
    _id: mockId("interactions", 2),
    name: "Goblin Ambush",
    creatorId: mockId("users", 1),
    campaignId: mockId("campaigns", 1),
    dmUserId: mockId("users", 1),
    relatedLocationId: mockId("locations", 2),
    relatedQuestId: mockId("quests", 1),
    status: "completed" as const,
    initiativeOrder: [
      { entityId: mockId("characters", 2), entityType: "playerCharacter", initiativeRoll: 18, dexterityModifier: 3 }, // Lyra
      { entityId: "mock_monster_goblin_1", entityType: "monster", initiativeRoll: 16, dexterityModifier: 2 },
      { entityId: mockId("characters", 1), entityType: "playerCharacter", initiativeRoll: 14, dexterityModifier: 1 }, // Theron
      { entityId: "mock_monster_goblin_2", entityType: "monster", initiativeRoll: 11, dexterityModifier: 2 },
      { entityId: mockId("characters", 3), entityType: "playerCharacter", initiativeRoll: 9, dexterityModifier: 2 }, // Elias
    ],
    participantPlayerCharacterIds: [
      mockId("characters", 1),
      mockId("characters", 2),
      mockId("characters", 3),
    ],
    participantMonsterIds: [mockId("monsters", 1), mockId("monsters", 1)], // Two goblins
    mapIds: [mockId("maps", 1)],
    xpAwards: [
      { playerCharacterId: mockId("characters", 1), xp: 50 },
      { playerCharacterId: mockId("characters", 2), xp: 50 },
      { playerCharacterId: mockId("characters", 3), xp: 50 },
    ],
    createdAt: Date.now(),
  },
];

// --- 10. MAPS ---
// A simple battle map for the ambush.
export const maps = [
  {
    _id: mockId("maps", 1),
    name: "Triboar Trail Crossing",
    width: 20,
    height: 15,
    cells: [
      // Example cells - a full map would have width * height entries
      { x: 5, y: 5, state: "inbounds", terrainType: "difficult" }, // A bush
      { x: 5, y: 6, state: "inbounds", terrainType: "difficult" },
      { x: 10, y: 8, state: "occupied", occupant: { id: "mock_monster_goblin_1", type: "monster", color: "red", speed: 30, name: "Goblin 1" } },
      { x: 12, y: 4, state: "occupied", occupant: { id: "mock_monster_goblin_2", type: "monster", color: "red", speed: 30, name: "Goblin 2" } },
    ],
    createdBy: mockId("users", 1),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// --- 11. SESSIONS ---
// A log of the game session where all this took place.
export const sessions = [
  {
    _id: mockId("sessions", 1),
    campaignId: mockId("campaigns", 1),
    date: Date.now(),
    participantPlayerCharacterIds: [
      mockId("characters", 1),
      mockId("characters", 2),
      mockId("characters", 3),
    ],
    participantUserIds: [
      mockId("users", 2),
      mockId("users", 3),
      mockId("users", 4),
    ],
    summary: "The party accepted a job from Gundren Rockseeker, were ambushed by goblins on the Triboar Trail, and successfully defeated them, clearing the path to Phandalin.",
    xpAwards: [
      { playerCharacterId: mockId("characters", 1), xp: 250 },
      { playerCharacterId: mockId("characters", 2), xp: 250 },
      { playerCharacterId: mockId("characters", 3), xp: 250 },
    ],
    lootAwards: [
      { playerCharacterId: mockId("characters", 1), gold: 17 }, // 50gp / 3 players
      { playerCharacterId: mockId("characters", 2), gold: 17, itemIds: [mockId("items", 5)] }, // Lyra gets the potion
      { playerCharacterId: mockId("characters", 3), gold: 16 },
    ],
    userId: mockId("users", 1),
    createdAt: Date.now(),
  },
];