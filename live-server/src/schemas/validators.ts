import { z } from 'zod';
import {
  GameStateSchema,
  ParticipantStateSchema,
  TurnActionSchema,
  ChatMessageSchema,
  GameEventSchema,
} from '@campaignion/shared-types';

// Define local ValidationResult type to avoid conflicts
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Validates game state data and returns a validation result
 */
export function validateGameState(data: unknown): ValidationResult {
  try {
    GameStateSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Validates participant state data and returns a validation result
 */
export function validateParticipantState(data: unknown): ValidationResult {
  try {
    ParticipantStateSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Validates turn action data and returns a validation result
 */
export function validateTurnAction(data: unknown): ValidationResult {
  try {
    TurnActionSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Validates chat message data and returns a validation result
 */
export function validateChatMessage(data: unknown): ValidationResult {
  try {
    ChatMessageSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Validates game event data and returns a validation result
 */
export function validateGameEvent(data: unknown): ValidationResult {
  try {
    GameEventSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Generic validation function that can be used with any Zod schema
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult {
  try {
    schema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Safe parsing function that returns the parsed data or null
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch {
    return null;
  }
}

/**
 * Validates multiple items with the same schema
 */
export function validateArray<T>(schema: z.ZodSchema<T>, items: unknown[]): ValidationResult {
  const errors: string[] = [];
  
  items.forEach((item, index) => {
    try {
      schema.parse(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push(`Item ${index} - ${err.path.join('.')}: ${err.message}`);
        });
      } else {
        errors.push(`Item ${index}: Unknown validation error`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}