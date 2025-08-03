"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGameState = validateGameState;
exports.validateParticipantState = validateParticipantState;
exports.validateTurnAction = validateTurnAction;
exports.validateChatMessage = validateChatMessage;
exports.validateGameEvent = validateGameEvent;
exports.validateWithSchema = validateWithSchema;
exports.safeParse = safeParse;
exports.validateArray = validateArray;
const zod_1 = require("zod");
const schemas_1 = require("@campaignion/shared-types/schemas");
function validateGameState(data) {
    try {
        schemas_1.GameStateSchema.parse(data);
        return { valid: true, errors: [] };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
function validateParticipantState(data) {
    try {
        schemas_1.ParticipantStateSchema.parse(data);
        return { valid: true, errors: [] };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
function validateTurnAction(data) {
    try {
        schemas_1.TurnActionSchema.parse(data);
        return { valid: true, errors: [] };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
function validateChatMessage(data) {
    try {
        schemas_1.ChatMessageSchema.parse(data);
        return { valid: true, errors: [] };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
function validateGameEvent(data) {
    try {
        schemas_1.GameEventSchema.parse(data);
        return { valid: true, errors: [] };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
function validateWithSchema(schema, data) {
    try {
        schema.parse(data);
        return { valid: true, errors: [] };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
function safeParse(schema, data) {
    try {
        return schema.parse(data);
    }
    catch {
        return null;
    }
}
function validateArray(schema, items) {
    const errors = [];
    items.forEach((item, index) => {
        try {
            schema.parse(item);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
    };
}
//# sourceMappingURL=validators.js.map