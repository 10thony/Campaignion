/**
 * Main schemas export file
 * Re-exports all Zod schemas for validation
 */
// Core schemas
export * from './core';
// Event schemas
export * from './events';
// API schemas
export * from './api';
// Router schemas
export * from './router';
// Validation utilities
import { z } from 'zod';
/**
 * Generic validation function that can be used with any Zod schema
 */
export function validateWithSchema(schema, data) {
    try {
        const parsed = schema.parse(data);
        return { valid: true, errors: [], data: parsed };
    }
    catch (error) {
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
export function safeParse(schema, data) {
    try {
        return schema.parse(data);
    }
    catch {
        return null;
    }
}
/**
 * Validates multiple items with the same schema
 */
export function validateArray(schema, items) {
    const errors = [];
    const validItems = [];
    items.forEach((item, index) => {
        try {
            const parsed = schema.parse(item);
            validItems.push(parsed);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                error.errors.forEach(err => {
                    errors.push(`Item ${index} - ${err.path.join('.')}: ${err.message}`);
                });
            }
            else {
                errors.push(`Item ${index}: Unknown validation error`);
            }
        }
    });
    return {
        valid: errors.length === 0,
        errors,
        validItems,
    };
}
