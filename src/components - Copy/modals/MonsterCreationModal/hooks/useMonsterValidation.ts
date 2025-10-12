import { useState, useCallback } from "react";
import { MonsterFormData, MonsterValidationHook } from "../types/monsterForm";

export const useMonsterValidation = (formData: MonsterFormData): MonsterValidationHook => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic required field validation
    if (!formData.name?.trim()) {
      newErrors.name = "Monster name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Monster name must be at least 2 characters long";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Monster name must be 100 characters or less";
    }

    if (!formData.type?.trim()) {
      newErrors.type = "Monster type is required";
    }

    if (!formData.alignment) {
      newErrors.alignment = "Alignment is required";
    }

    // Armor Class validation
    if (formData.armorClass < 0) {
      newErrors.armorClass = "Armor class must be 0 or greater";
    } else if (formData.armorClass > 50) {
      newErrors.armorClass = "Armor class cannot exceed 50";
    }

    // Hit Points validation
    if (formData.hitPoints < 1) {
      newErrors.hitPoints = "Hit points must be 1 or greater";
    } else if (formData.hitPoints > 9999) {
      newErrors.hitPoints = "Hit points cannot exceed 9999";
    }

    // Hit Dice validation
    if (formData.hitDice.count < 1) {
      newErrors["hitDice.count"] = "Hit dice count must be 1 or greater";
    } else if (formData.hitDice.count > 100) {
      newErrors["hitDice.count"] = "Hit dice count cannot exceed 100";
    }

    // Proficiency Bonus validation
    if (formData.proficiencyBonus < 0) {
      newErrors.proficiencyBonus = "Proficiency bonus must be 0 or greater";
    } else if (formData.proficiencyBonus > 20) {
      newErrors.proficiencyBonus = "Proficiency bonus cannot exceed 20";
    }

    // Ability Scores validation
    const abilityScoreErrors = validateAbilityScores(formData.abilityScores);
    Object.assign(newErrors, abilityScoreErrors);

    // Senses validation
    if (formData.senses.passivePerception < 0) {
      newErrors["senses.passivePerception"] = "Passive perception must be 0 or greater";
    } else if (formData.senses.passivePerception > 50) {
      newErrors["senses.passivePerception"] = "Passive perception cannot exceed 50";
    }

    // Experience Points validation
    if (formData.experiencePoints < 0) {
      newErrors.experiencePoints = "Experience points must be 0 or greater";
    } else if (formData.experiencePoints > 1000000) {
      newErrors.experiencePoints = "Experience points cannot exceed 1,000,000";
    }

    // Array field validation
    if (formData.tags && formData.tags.length > 20) {
      newErrors.tags = "Cannot have more than 20 tags";
    }

    if (formData.skills && formData.skills.length > 30) {
      newErrors.skills = "Cannot have more than 30 skills";
    }

    if (formData.savingThrows && formData.savingThrows.length > 6) {
      newErrors.savingThrows = "Cannot have more than 6 saving throws";
    }

    if (formData.traits && formData.traits.length > 50) {
      newErrors.traits = "Cannot have more than 50 traits";
    }

    if (formData.actions && formData.actions.length > 50) {
      newErrors.actions = "Cannot have more than 50 actions";
    }

    if (formData.reactions && formData.reactions.length > 20) {
      newErrors.reactions = "Cannot have more than 20 reactions";
    }

    if (formData.legendaryActions && formData.legendaryActions.length > 10) {
      newErrors.legendaryActions = "Cannot have more than 10 legendary actions";
    }

    if (formData.lairActions && formData.lairActions.length > 10) {
      newErrors.lairActions = "Cannot have more than 10 lair actions";
    }

    if (formData.regionalEffects && formData.regionalEffects.length > 10) {
      newErrors.regionalEffects = "Cannot have more than 10 regional effects";
    }

    if (formData.environment && formData.environment.length > 20) {
      newErrors.environment = "Cannot have more than 20 environment types";
    }

    // Source validation
    if (formData.source && formData.source.length > 100) {
      newErrors.source = "Source must be 100 characters or less";
    }

    if (formData.page && formData.page.length > 20) {
      newErrors.page = "Page must be 20 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateAbilityScores = (abilityScores: MonsterFormData["abilityScores"]) => {
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
        if (!value?.trim()) return "Monster name is required";
        if (value.trim().length < 2) return "Monster name must be at least 2 characters long";
        if (value.trim().length > 100) return "Monster name must be 100 characters or less";
        break;
      
      case "type":
        if (!value?.trim()) return "Monster type is required";
        break;
      
      case "alignment":
        if (!value) return "Alignment is required";
        break;
      
      case "armorClass":
        if (value < 0) return "Armor class must be 0 or greater";
        if (value > 50) return "Armor class cannot exceed 50";
        break;
      
      case "hitPoints":
        if (value < 1) return "Hit points must be 1 or greater";
        if (value > 9999) return "Hit points cannot exceed 9999";
        break;
      
      case "proficiencyBonus":
        if (value < 0) return "Proficiency bonus must be 0 or greater";
        if (value > 20) return "Proficiency bonus cannot exceed 20";
        break;
      
      case "experiencePoints":
        if (value < 0) return "Experience points must be 0 or greater";
        if (value > 1000000) return "Experience points cannot exceed 1,000,000";
        break;
      
      case "source":
        if (value && value.length > 100) return "Source must be 100 characters or less";
        break;
      
      case "page":
        if (value && value.length > 20) return "Page must be 20 characters or less";
        break;
      
      default:
        // Handle ability score fields
        if (fieldName.startsWith("abilityScores.")) {
          const ability = fieldName.split(".")[1];
          if (!value || value < 1) return `${ability} score must be at least 1`;
          if (value > 30) return `${ability} score cannot exceed 30`;
        }
        
        // Handle hit dice fields
        if (fieldName === "hitDice.count") {
          if (value < 1) return "Hit dice count must be 1 or greater";
          if (value > 100) return "Hit dice count cannot exceed 100";
        }
        
        // Handle senses fields
        if (fieldName === "senses.passivePerception") {
          if (value < 0) return "Passive perception must be 0 or greater";
          if (value > 50) return "Passive perception cannot exceed 50";
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