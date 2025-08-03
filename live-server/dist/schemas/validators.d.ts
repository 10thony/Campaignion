import { z } from 'zod';
import { type ValidationResult } from '@campaignion/shared-types/schemas';
export declare function validateGameState(data: unknown): ValidationResult;
export declare function validateParticipantState(data: unknown): ValidationResult;
export declare function validateTurnAction(data: unknown): ValidationResult;
export declare function validateChatMessage(data: unknown): ValidationResult;
export declare function validateGameEvent(data: unknown): ValidationResult;
export declare function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult;
export declare function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null;
export declare function validateArray<T>(schema: z.ZodSchema<T>, items: unknown[]): ValidationResult;
//# sourceMappingURL=validators.d.ts.map