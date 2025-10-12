import { useState, useCallback } from "react";
import { CharacterFormData, CharacterValidationHook } from "../types/npcForm";

export const useCharacterValidation = (formData: CharacterFormData): CharacterValidationHook => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic required field validation
    if (!formData.name?.trim()) {
      newErrors.name = "Character name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Character name must be at least 2 characters long";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Character name must be 50 characters or less";
    }

    if (!formData.race) {
      newErrors.race = "Race is required";
    }

    if (!formData.class) {
      newErrors.class = "Class is required";
    }

    if (!formData.background) {
      newErrors.background = "Background is required";
    }

    // Level validation
    if (!formData.level || formData.level < 1) {
      newErrors.level = "Level must be at least 1";
    } else if (formData.level > 20) {
      newErrors.level = "Level cannot exceed 20";
    }

    // Hit Points validation
    if (!formData.hitPoints || formData.hitPoints < 1) {
      newErrors.hitPoints = "Hit points must be at least 1";
    } else if (formData.hitPoints > 999) {
      newErrors.hitPoints = "Hit points cannot exceed 999";
    }

    // Armor Class validation
    if (!formData.armorClass || formData.armorClass < 1) {
      newErrors.armorClass = "Armor class must be at least 1";
    } else if (formData.armorClass > 30) {
      newErrors.armorClass = "Armor class cannot exceed 30";
    }

    // Proficiency Bonus validation
    if (!formData.proficiencyBonus || formData.proficiencyBonus < 1) {
      newErrors.proficiencyBonus = "Proficiency bonus must be at least 1";
    } else if (formData.proficiencyBonus > 6) {
      newErrors.proficiencyBonus = "Proficiency bonus cannot exceed 6";
    }

    // Ability Scores validation
    const abilityScoreErrors = validateAbilityScores(formData.abilityScores);
    Object.assign(newErrors, abilityScoreErrors);

    // Description length validation
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = "Description must be 2000 characters or less";
    }

    // Array field validation
    if (formData.skills && formData.skills.length > 20) {
      newErrors.skills = "Cannot have more than 20 skills";
    }

    if (formData.savingThrows && formData.savingThrows.length > 6) {
      newErrors.savingThrows = "Cannot have more than 6 saving throws";
    }

    if (formData.proficiencies && formData.proficiencies.length > 30) {
      newErrors.proficiencies = "Cannot have more than 30 proficiencies";
    }

    if (formData.traits && formData.traits.length > 20) {
      newErrors.traits = "Cannot have more than 20 traits";
    }

    if (formData.languages && formData.languages.length > 15) {
      newErrors.languages = "Cannot have more than 15 languages";
    }

    if (formData.equipment && formData.equipment.length > 50) {
      newErrors.equipment = "Cannot have more than 50 equipment items";
    }

    if (formData.actions && formData.actions.length > 30) {
      newErrors.actions = "Cannot have more than 30 actions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateAbilityScores = (abilityScores: CharacterFormData["abilityScores"]) => {
    const errors: Record<string, string> = {};
    const abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

    abilities.forEach((ability) => {
      const score = abilityScores[ability as keyof typeof abilityScores];
      
      if (score === undefined || score === null) {
        errors[`abilityScores.${ability}`] = `${ability} score is required`;
      } else if (score < 1) {
        errors[`abilityScores.${ability}`] = `${ability} score must be at least 1`;
      } else if (score > 30) {
        errors[`abilityScores.${ability}`] = `${ability} score cannot exceed 30`;
      }
    });

    // Check for extremely low or high total
    const totalPoints = Object.values(abilityScores).reduce((sum, score) => sum + (score || 0), 0);
    if (totalPoints < 30) {
      errors["abilityScores.total"] = "Total ability scores are unusually low (under 30 points)";
    } else if (totalPoints > 120) {
      errors["abilityScores.total"] = "Total ability scores are unusually high (over 120 points)";
    }

    return errors;
  };

  const validateField = useCallback((fieldName: string, value: any): string | null => {
    switch (fieldName) {
      case "name":
        if (!value?.trim()) return "Character name is required";
        if (value.trim().length < 2) return "Character name must be at least 2 characters long";
        if (value.trim().length > 50) return "Character name must be 50 characters or less";
        break;
      
      case "race":
        if (!value) return "Race is required";
        break;
      
      case "class":
        if (!value) return "Class is required";
        break;
      
      case "background":
        if (!value) return "Background is required";
        break;
      
      case "level":
        if (!value || value < 1) return "Level must be at least 1";
        if (value > 20) return "Level cannot exceed 20";
        break;
      
      case "hitPoints":
        if (!value || value < 1) return "Hit points must be at least 1";
        if (value > 999) return "Hit points cannot exceed 999";
        break;
      
      case "armorClass":
        if (!value || value < 1) return "Armor class must be at least 1";
        if (value > 30) return "Armor class cannot exceed 30";
        break;
      
      case "proficiencyBonus":
        if (!value || value < 1) return "Proficiency bonus must be at least 1";
        if (value > 6) return "Proficiency bonus cannot exceed 6";
        break;
      
      case "description":
        if (value && value.length > 2000) return "Description must be 2000 characters or less";
        break;
      
      default:
        // Handle ability score fields
        if (fieldName.startsWith("abilityScores.")) {
          const ability = fieldName.split(".")[1];
          if (!value || value < 1) return `${ability} score must be at least 1`;
          if (value > 30) return `${ability} score cannot exceed 30`;
        }
        break;
    }
    
    return null;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  }, []);

  const hasErrors = Object.keys(errors).length > 0;
  const hasFieldError = useCallback((fieldName: string) => {
    return !!errors[fieldName];
  }, [errors]);

  const getFieldError = useCallback((fieldName: string) => {
    return errors[fieldName] || null;
  }, [errors]);

  return {
    errors,
    validateForm,
    clearErrors,
    setErrors,
    // Additional validation utilities
    validateField,
    clearFieldError,
    setFieldError,
    hasErrors,
    hasFieldError,
    getFieldError,
  };
};

// Legacy export for backward compatibility
export const useNPCValidation = useCharacterValidation; 