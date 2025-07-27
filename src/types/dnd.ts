// D&D 5e Core Types
export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface AbilityModifiers {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export type DamageType = 
  | "BLUDGEONING" | "PIERCING" | "SLASHING"
  | "ACID" | "COLD" | "FIRE" | "FORCE"
  | "LIGHTNING" | "NECROTIC" | "POISON"
  | "PSYCHIC" | "RADIANT" | "THUNDER";

export type DiceType = "D4" | "D6" | "D8" | "D10" | "D12" | "D20";

export interface DamageRoll {
  dice: {
    count: number;
    type: DiceType;
  };
  modifier: number;
  damageType: DamageType;
}

export type CreatureSize = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";

export type QuestStatus = "idle" | "in_progress" | "completed" | "failed";
export type TaskType = "Fetch" | "Kill" | "Speak" | "Explore" | "Puzzle" | "Deliver" | "Escort" | "Custom";
export type TaskStatus = "NotStarted" | "InProgress" | "Completed" | "Failed";

export type ArmorType = "Light" | "Medium" | "Heavy" | "Shield";
export type ItemType = 
  | "Weapon" | "Armor" | "Potion" | "Scroll" 
  | "Wondrous Item" | "Ring" | "Rod" | "Staff" 
  | "Wand" | "Ammunition" | "Adventuring Gear" 
  | "Tool" | "Mount" | "Vehicle" | "Treasure" | "Other";

export type ItemRarity = 
  | "Common" | "Uncommon" | "Rare" 
  | "Very Rare" | "Legendary" | "Artifact" | "Unique";

// Enhanced monster types with BaseSystemPrompt requirements
export interface MonsterEnhancements {
  challengeRatingValue: number;
  legendaryActionCount?: number;
  lairActionCount?: number;
}

// Campaign roles
export type UserRole = "admin" | "user";
export type CampaignRole = "dm" | "player";

// Authentication context
export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: UserRole;
}

// Campaign authorization
export interface CampaignAuth {
  isDM: boolean;
  isPlayer: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  canDelete: boolean;
} 