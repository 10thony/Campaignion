"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.createAppError = createAppError;
exports.asyncHandler = asyncHandler;
const logger_1 = require("../utils/logger");
function errorHandler(error, req, res, _next) {
    const statusCode = error.statusCode || 500;
    const isOperational = error.isOperational || false;
    logger_1.logger.error('Express Error Handler', {
        error: error.message,
        stack: error.stack,
        statusCode,
        isOperational,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    const message = process.env['NODE_ENV'] === 'production' && !isOperational
        ? 'Internal Server Error'
        : error.message;
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack }),
        },
        timestamp: new Date().toISOString(),
    });
}
function createAppError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map