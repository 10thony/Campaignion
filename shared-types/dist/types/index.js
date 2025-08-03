/**
 * Main types export file
 * Re-exports all shared types for easy consumption
 */
// Core types
export * from './core';
// Event types
export * from './events';
// API types
export * from './api';
// Router types
export * from './router';
// Type guards
export function isPlayerCharacter(entityType) {
    return entityType === 'playerCharacter';
}
export function isNPC(entityType) {
    return entityType === 'npc';
}
export function isMonster(entityType) {
    return entityType === 'monster';
}
export function isActiveGame(status) {
    return status === 'active';
}
export function isPausedGame(status) {
    return status === 'paused';
}
export function isCompletedGame(status) {
    return status === 'completed';
}
// Utility functions
export function createPosition(x, y) {
    return { x, y };
}
export function isValidPosition(pos) {
    return typeof pos === 'object' &&
        pos !== null &&
        typeof pos.x === 'number' &&
        typeof pos.y === 'number';
}
export function createChatMessage(id, userId, content, type, entityId, recipients) {
    return {
        id,
        userId,
        entityId,
        content,
        type,
        recipients,
        timestamp: Date.now(),
    };
}
export function createTurnAction(type, entityId, options = {}) {
    return {
        type,
        entityId,
        ...options,
    };
}
