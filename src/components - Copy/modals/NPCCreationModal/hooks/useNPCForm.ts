import { useState, useCallback } from "react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { CharacterFormData, CharacterFormHook } from "../types/npcForm";
import { calculateInventoryCapacity } from "../../../../utils/equipmentUtils";

const initialFormData: CharacterFormData = {
  name: "",
  race: "",
  class: "",
  background: "",
  alignment: "Neutral",
  level: 1,
  hitPoints: 10,
  armorClass: 10,
  proficiencyBonus: 2,
  speed: "30",
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  skills: [],
  savingThrows: [],
  proficiencies: [],
  traits: [],
  languages: [],
  equipment: [],
  description: "",
  actions: [],
  
  // New equipment system fields
  inventory: {
    capacity: calculateInventoryCapacity(10), // Default strength 10
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

export const useCharacterForm = (): CharacterFormHook => {
  const [formData, setFormData] = useState<CharacterFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Id<"actions">[]>([]);
  const [racialBonusesApplied, setRacialBonusesApplied] = useState(false);
  const [appliedRace, setAppliedRace] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const setField = useCallback((field: keyof CharacterFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Reset racial bonuses applied state when race changes
    if (field === "race") {
      setRacialBonusesApplied(false);
      setAppliedRace("");
    }
  }, []);

  const setNestedField = useCallback((
    parentField: keyof CharacterFormData,
    childField: string,
    value: any
  ) => {
    setFormData(prev => {
      const parentValue = prev[parentField];
      const parentObj = (typeof parentValue === 'object' && parentValue !== null) ? parentValue : {};
      return {
        ...prev,
        [parentField]: {
          ...parentObj,
          [childField]: value,
        },
      };
    });

    // Reset racial bonuses applied state when ability scores change manually
    if (parentField === "abilityScores" && racialBonusesApplied) {
      setRacialBonusesApplied(false);
      setAppliedRace("");
    }
  }, [racialBonusesApplied]);

  const reset = useCallback(() => {
    setFormData(initialFormData);
    setIsSubmitting(false);
    setSelectedActions([]);
    setRacialBonusesApplied(false);
    setAppliedRace("");
    setError(null);
  }, []);

  const populateForm = useCallback((data: Partial<CharacterFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
    }));
  }, []);

  return {
    formData,
    setField,
    setNestedField,
    reset,
    isSubmitting,
    setIsSubmitting,
    populateForm,
    selectedActions,
    setSelectedActions,
    racialBonusesApplied,
    setRacialBonusesApplied,
    appliedRace,
    setAppliedRace,
    error,
    setError,
  };
};

// Legacy export for backward compatibility
export const useNPCForm = useCharacterForm; 