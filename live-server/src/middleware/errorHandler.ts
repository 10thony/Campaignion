import { Request, Response, NextFunction } from 'express';
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Express error handling middleware
 */
export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  logger.error('Express Error Handler', {
    error: error.message,
    stack: error.stack,
    statusCode,
    isOperational,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Don't expose internal errors in production
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

/**
 * Creates an operational error (safe to expose to client)
 */
export function createAppError(message: string, statusCode: number = 500): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * Async error wrapper for Express routes
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}