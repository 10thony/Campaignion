import { Id } from "../../../../../convex/_generated/dataModel";
import { Equipment, Inventory, EquipmentBonuses } from "../../../../types/character";

export interface CharacterFormData {
  name: string;
  race: string;
  class: string;
  background: string;
  alignment: string;
  level: number;
  hitPoints: number;
  armorClass: number;
  proficiencyBonus: number;
  speed: string;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  skills: string[];
  savingThrows: string[];
  proficiencies: string[];
  traits: string[];
  languages: string[];
  equipment: string[]; // Legacy field for backward compatibility
  description: string;
  actions: Id<"actions">[];
  
  // New equipment system fields
  inventory: Inventory;
  equipmentSlots: Equipment;
  equipmentBonuses?: EquipmentBonuses;
}

// Legacy interface for backward compatibility
export interface NPCFormData extends CharacterFormData {}

export type CharacterType = "PlayerCharacter" | "NonPlayerCharacter";

export interface CharacterFormProps {
  formData: CharacterFormData;
  setField: (field: keyof CharacterFormData, value: any) => void;
  setNestedField: (parentField: keyof CharacterFormData, childField: string, value: any) => void;
  errors: Record<string, string>;
  isReadOnly?: boolean;
  characterType?: CharacterType;
}

// Legacy interface for backward compatibility
export interface NPCFormProps extends CharacterFormProps {}

export interface CharacterFormHook {
  formData: CharacterFormData;
  setField: (field: keyof CharacterFormData, value: any) => void;
  setNestedField: (parentField: keyof CharacterFormData, childField: string, value: any) => void;
  reset: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  populateForm: (data: Partial<CharacterFormData>) => void;
  // Enhanced state management for ability scores
  selectedActions: Id<"actions">[];
  setSelectedActions: (actions: Id<"actions">[]) => void;
  racialBonusesApplied: boolean;
  setRacialBonusesApplied: (applied: boolean) => void;
  appliedRace: string;
  setAppliedRace: (race: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Legacy interface for backward compatibility
export interface NPCFormHook extends CharacterFormHook {}

export interface CharacterValidationHook {
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

// Legacy interface for backward compatibility
export interface NPCValidationHook extends CharacterValidationHook {} 