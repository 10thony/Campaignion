import { Id } from "../../../../convex/_generated/dataModel";
import { Equipment, Inventory, EquipmentBonuses } from "../../../../types/character";

export interface MonsterFormData {
  name: string;
  source: string;
  page: string;
  size: "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
  type: string;
  tags: string[];
  alignment: string;
  armorClass: number;
  armorType: string;
  hitPoints: number;
  hitDice: {
    count: number;
    die: "d4" | "d6" | "d8" | "d10" | "d12";
  };
  proficiencyBonus: number;
  speed: {
    walk: string;
    swim: string;
    fly: string;
    burrow: string;
    climb: string;
  };
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  savingThrows: string[];
  skills: string[];
  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: {
    darkvision: string;
    blindsight: string;
    tremorsense: string;
    truesight: string;
    passivePerception: number;
  };
  languages: string;
  challengeRating: string;
  experiencePoints: number;
  traits: { name: string; description: string }[];
  actions: { name: string; description: string }[];
  reactions: { name: string; description: string }[];
  legendaryActions: { name: string; description: string }[];
  lairActions: { name: string; description: string }[];
  regionalEffects: { name: string; description: string }[];
  environment: string[];
  
  // Equipment system fields
  inventory: Inventory;
  equipmentSlots: Equipment;
  equipmentBonuses?: EquipmentBonuses;
}

export interface MonsterFormProps {
  formData: MonsterFormData;
  setField: (field: keyof MonsterFormData, value: any) => void;
  setNestedField: <
    T extends keyof MonsterFormData,
    K extends keyof MonsterFormData[T]
  >(
    parentField: T,
    childField: K,
    value: MonsterFormData[T][K]
  ) => void;
  errors: Record<string, string>;
  isReadOnly?: boolean;
}

export interface MonsterFormHook {
  formData: MonsterFormData;
  setField: (field: keyof MonsterFormData, value: any) => void;
  setNestedField: <
    T extends keyof MonsterFormData,
    K extends keyof MonsterFormData[T]
  >(
    parentField: T,
    childField: K,
    value: MonsterFormData[T][K]
  ) => void;
  reset: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  populateForm: (data: Partial<MonsterFormData>) => void;
  // Enhanced state management for actions
  selectedActions: Id<"actions">[];
  setSelectedActions: (actions: Id<"actions">[]) => void;
  databaseActions: { name: string; description: string }[];
  setDatabaseActions: (actions: { name: string; description: string }[]) => void;
  // Tag management
  newTag: string;
  setNewTag: (tag: string) => void;
  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  // Helper methods
  addTag: () => void;
  removeTag: (index: number) => void;
  addTrait: () => void;
  updateTrait: (index: number, field: 'name' | 'description', value: string) => void;
  removeTrait: (index: number) => void;
  addAction: (type: 'actions' | 'reactions' | 'legendaryActions' | 'lairActions' | 'regionalEffects') => void;
  updateAction: (
    type: 'actions' | 'reactions' | 'legendaryActions' | 'lairActions' | 'regionalEffects',
    index: number,
    field: 'name' | 'description',
    value: string
  ) => void;
  removeAction: (
    type: 'actions' | 'reactions' | 'legendaryActions' | 'lairActions' | 'regionalEffects',
    index: number
  ) => void;
  addEnvironment: (environment: string) => void;
  removeEnvironment: (index: number) => void;
}

export interface MonsterValidationHook {
  errors: Record<string, string>;
  validateForm: () => boolean;
  clearErrors: () => void;
  setErrors: (errors: Record<string, string>) => void;
  // Additional validation utilities
  validateField: (fieldName: string, value: any) => string | null;
  clearFieldError: (fieldName: string) => void;
  setFieldError: (fieldName: string, error: string) => void;
  hasErrors: boolean;
  hasFieldError: (fieldName: string) => boolean;
  getFieldError: (fieldName: string) => string | null;
}

// Default form data
export const defaultMonsterFormData: MonsterFormData = {
  name: "",
  source: "",
  page: "",
  size: "Medium",
  type: "",
  tags: [],
  alignment: "",
  armorClass: 10,
  armorType: "",
  hitPoints: 10,
  hitDice: { count: 1, die: "d8" },
  proficiencyBonus: 2,
  speed: { walk: "30 ft.", swim: "", fly: "", burrow: "", climb: "" },
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  savingThrows: [],
  skills: [],
  damageVulnerabilities: [],
  damageResistances: [],
  damageImmunities: [],
  conditionImmunities: [],
  senses: {
    darkvision: "",
    blindsight: "",
    tremorsense: "",
    truesight: "",
    passivePerception: 10,
  },
  languages: "",
  challengeRating: "1/4",
  experiencePoints: 50,
  traits: [],
  actions: [],
  reactions: [],
  legendaryActions: [],
  lairActions: [],
  regionalEffects: [],
  environment: [],
  
  // Equipment system fields
  inventory: {
    capacity: 20, // Default capacity for monsters
    items: [],
  },
  equipmentSlots: {
    headgear: undefined,
    armwear: undefined,
    chestwear: undefined,
    legwear: undefined,
    footwear: undefined,
    mainHand: undefined,
    offHand: undefined,
    accessories: [],
  },
  equipmentBonuses: {
    armorClass: 0,
    abilityScores: {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    },
  },
};

// Helper functions
export const getAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export const formatAbilityModifier = (score: number): string => {
  const modifier = getAbilityModifier(score);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
};

export const rollAbilityScore = (): number => {
  // Roll 4d6, drop lowest
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => b - a);
  return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
};

export const getChallengeRatingXP = (challengeRating: string): number => {
  const crXpMap: Record<string, number> = {
    "0": 0,
    "1/8": 25,
    "1/4": 50,
    "1/2": 100,
    "1": 200,
    "2": 450,
    "3": 700,
    "4": 1100,
    "5": 1800,
    "6": 2300,
    "7": 2900,
    "8": 3900,
    "9": 5000,
    "10": 5900,
    "11": 7200,
    "12": 8400,
    "13": 10000,
    "14": 11500,
    "15": 13000,
    "16": 15000,
    "17": 18000,
    "18": 20000,
    "19": 22000,
    "20": 25000,
    "21": 33000,
    "22": 41000,
    "23": 50000,
    "24": 62000,
    "25": 75000,
    "26": 90000,
    "27": 105000,
    "28": 120000,
    "29": 135000,
    "30": 155000,
  };
  return crXpMap[challengeRating] || 50;
}; 