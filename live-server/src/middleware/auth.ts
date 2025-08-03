import { TRPCError } from '@trpc/server';
import { middleware, publicProcedure } from '../utils/trpc';
import { logger } from '../utils/logger';

/**
 * Authentication middleware that ensures user is logged in
 */
export const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    logger.warn('Unauthorized access attempt', {
      connectionId: ctx.connectionId,
      timestamp: new Date().toISOString(),
      ip: ctx.req ? (ctx.req as any).ip : 'unknown',
    });
    
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid Clerk token.',
    });
  }

  // Validate user session is still active
  if (!ctx.user.sessionId) {
    logger.warn('Invalid session - missing session ID', {
      userId: ctx.user.userId,
      connectionId: ctx.connectionId,
    });
    
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid session. Please re-authenticate.',
    });
  }

  logger.debug('User authenticated successfully', {
    userId: ctx.user.userId,
    sessionId: ctx.user.sessionId,
    orgId: ctx.user.orgId,
    connectionId: ctx.connectionId,
  });

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type narrowing - user is guaranteed to exist
    },
  });
});

/**
 * DM authorization middleware that ensures user has DM permissions
 * Note: This is a placeholder - actual DM validation will be implemented
 * when we have access to the campaign/interaction data
 */
export const dmMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  // TODO: Implement actual DM permission check against campaign data
  // For now, we'll just ensure the user is authenticated
  // This will be enhanced in future tasks when we have campaign context
  
  logger.debug('DM access granted', {
    userId: ctx.user.userId,
    connectionId: ctx.connectionId,
  });

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware to prevent abuse
 */
export const rateLimitMiddleware = middleware(async ({ ctx, next }) => {
  const userId = ctx.user?.userId || ctx.connectionId || 'anonymous';
  const now = Date.now();
  const windowMs = parseInt(process.env['RATE_LIMIT_WINDOW'] || '60000'); // 1 minute
  const maxRequests = parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100');
  
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit window
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else {
    // Increment count
    userLimit.count++;
    
    if (userLimit.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        userId,
        count: userLimit.count,
        maxRequests,
        windowMs,
        connectionId: ctx.connectionId,
      });
      
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }
  }
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  return next();
});

/**
 * Protected procedure that requires authentication
 */
export const protectedProcedure = publicProcedure.use(authMiddleware).use(rateLimitMiddleware);

/**
 * DM-only procedure that requires DM permissions
 */
export const dmOnlyProcedure = publicProcedure.use(authMiddleware).use(dmMiddleware).use(rateLimitMiddleware);