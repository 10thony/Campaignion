/**
 * Client-side utility for GPT entity generation
 * 
 * This module provides a hook and utilities for generating D&D entities
 * using the OpenAI GPT-4o-mini API through Convex actions.
 */

import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export type EntityType = "monster" | "character" | "item" | "quest" | "action";

export interface GenerationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Hook for generating entities with GPT
 * 
 * @example
 * const { generate, isGenerating } = useGPTGeneration();
 * const result = await generate("monster", "A fire-breathing dragon");
 */
export function useGPTGeneration() {
  const generateEntity = useAction(api.gptGeneration.generateEntity);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async <T = any>(
    entityType: EntityType,
    additionalContext?: string
  ): Promise<GenerationResult<T>> => {
    setIsGenerating(true);
    try {
      const result = await generateEntity({
        entityType,
        additionalContext,
      });

      return result as GenerationResult<T>;
    } catch (error: any) {
      console.error("Error generating entity:", error);
      return {
        success: false,
        error: error.message || "Failed to generate entity",
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generate,
    isGenerating,
  };
}

/**
 * Formats the GPT generation result to match the form structure
 * This helps transform the GPT output to be compatible with form fields
 */
export function formatGenerationResult<T>(
  result: GenerationResult<T>,
  defaultValues?: Partial<T>
): T | null {
  if (!result.success || !result.data) {
    return null;
  }

  // Merge with default values if provided
  if (defaultValues) {
    return {
      ...defaultValues,
      ...result.data,
    } as T;
  }

  return result.data;
}

/**
 * Validates that the generated entity has all required fields
 * This is a basic validation - form validation will catch any issues
 */
export function validateGeneratedEntity(
  entityType: EntityType,
  data: any
): { valid: boolean; missingFields?: string[] } {
  const requiredFields: Record<EntityType, string[]> = {
    monster: ["name", "size", "type", "alignment", "armorClass", "hitPoints", "abilityScores"],
    character: ["name", "race", "class", "background", "level", "abilityScores", "hitPoints", "armorClass"],
    item: ["name", "type", "rarity", "description"],
    quest: ["name", "description", "status"],
    action: ["name", "description", "actionCost", "type", "requiresConcentration", "sourceBook", "category"],
  };

  const required = requiredFields[entityType];
  const missingFields: string[] = [];

  for (const field of required) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  };
}

