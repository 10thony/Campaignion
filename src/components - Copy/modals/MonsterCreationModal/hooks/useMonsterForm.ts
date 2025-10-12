import { useState, useCallback } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { MonsterFormData, MonsterFormHook, defaultMonsterFormData, getChallengeRatingXP } from "../types/monsterForm";

export const useMonsterForm = (): MonsterFormHook => {
  const [formData, setFormData] = useState<MonsterFormData>(defaultMonsterFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Id<"actions">[]>([]);
  const [databaseActions, setDatabaseActions] = useState<{ name: string; description: string }[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const setField = useCallback((field: keyof MonsterFormData, value: any) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Auto-update experience points when challenge rating changes
      if (field === "challengeRating") {
        updated.experiencePoints = getChallengeRatingXP(value);
      }

      return updated;
    });
  }, []);

  const setNestedField = useCallback(<
    T extends keyof MonsterFormData,
    K extends keyof MonsterFormData[T]
  >(
    parentField: T,
    childField: K,
    value: MonsterFormData[T][K]
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
  }, []);

  const reset = useCallback(() => {
    setFormData(defaultMonsterFormData);
    setIsSubmitting(false);
    setSelectedActions([]);
    setDatabaseActions([]);
    setNewTag("");
    setError(null);
  }, []);

  const populateForm = useCallback((data: Partial<MonsterFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
    }));
  }, []);

  // Helper methods for managing arrays
  const addTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setField("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  }, [newTag, formData.tags, setField]);

  const removeTag = useCallback((index: number) => {
    setField("tags", formData.tags.filter((_, i) => i !== index));
  }, [formData.tags, setField]);

  const addTrait = useCallback(() => {
    setField("traits", [...formData.traits, { name: "", description: "" }]);
  }, [formData.traits, setField]);

  const updateTrait = useCallback((index: number, field: 'name' | 'description', value: string) => {
    const updatedTraits = [...formData.traits];
    updatedTraits[index] = { ...updatedTraits[index], [field]: value };
    setField("traits", updatedTraits);
  }, [formData.traits, setField]);

  const removeTrait = useCallback((index: number) => {
    setField("traits", formData.traits.filter((_, i) => i !== index));
  }, [formData.traits, setField]);

  const addAction = useCallback((type: 'actions' | 'reactions' | 'legendaryActions' | 'lairActions' | 'regionalEffects') => {
    setField(type, [...formData[type], { name: "", description: "" }]);
  }, [formData, setField]);

  const updateAction = useCallback((
    type: 'actions' | 'reactions' | 'legendaryActions' | 'lairActions' | 'regionalEffects',
    index: number,
    field: 'name' | 'description',
    value: string
  ) => {
    const updatedActions = [...formData[type]];
    updatedActions[index] = { ...updatedActions[index], [field]: value };
    setField(type, updatedActions);
  }, [formData, setField]);

  const removeAction = useCallback((
    type: 'actions' | 'reactions' | 'legendaryActions' | 'lairActions' | 'regionalEffects',
    index: number
  ) => {
    setField(type, formData[type].filter((_, i) => i !== index));
  }, [formData, setField]);

  const addEnvironment = useCallback((environment: string) => {
    if (environment.trim() && !formData.environment.includes(environment.trim())) {
      setField("environment", [...formData.environment, environment.trim()]);
    }
  }, [formData.environment, setField]);

  const removeEnvironment = useCallback((index: number) => {
    setField("environment", formData.environment.filter((_, i) => i !== index));
  }, [formData.environment, setField]);

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
    databaseActions,
    setDatabaseActions,
    newTag,
    setNewTag,
    error,
    setError,
    // Helper methods
    addTag,
    removeTag,
    addTrait,
    updateTrait,
    removeTrait,
    addAction,
    updateAction,
    removeAction,
    addEnvironment,
    removeEnvironment,
  };
}; 