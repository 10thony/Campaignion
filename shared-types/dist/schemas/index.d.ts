/**
 * Main schemas export file
 * Re-exports all Zod schemas for validation
 */
export * from './core';
export * from './events';
export * from './api';
export * from './router';
import { z } from 'zod';
/**
 * Generic validation function that can be used with any Zod schema
 */
export declare function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
    valid: boolean;
    errors: string[];
    data?: T;
};
/**
 * Safe parsing function that returns the parsed data or null
 */
export declare function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null;
/**
 * Validates multiple items with the same schema
 */
export declare function validateArray<T>(schema: z.ZodSchema<T>, items: unknown[]): {
    valid: boolean;
    errors: string[];
    validItems: T[];
};
//# sourceMappingURL=index.d.ts.map