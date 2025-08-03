/**
 * API-related types for the Live Interaction System
 * These types are used for API responses, error handling, and client-server communication
 */
// Type guards
export function isApiError(error) {
    return typeof error === 'object' &&
        error !== null &&
        typeof error.code === 'string' &&
        typeof error.message === 'string';
}
export function isRateLimitError(error) {
    return isApiError(error) &&
        error.code === 'RATE_LIMIT_EXCEEDED' &&
        'rateLimitInfo' in error;
}
export function isWebSocketMessage(message) {
    return typeof message === 'object' &&
        message !== null &&
        typeof message.id === 'string' &&
        typeof message.type === 'string' &&
        typeof message.timestamp === 'number';
}
