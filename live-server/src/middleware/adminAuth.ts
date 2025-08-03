import { TRPCError } from '@trpc/server';
import { middleware, publicProcedure } from '../utils/trpc';
import { logger } from '../utils/logger';

/**
 * Admin authorization middleware that ensures user has admin permissions
 * This is used for test mode and other administrative functions
 */
export const adminMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  // Check if user has admin role
  // In a real implementation, this would check against a database or external service
  // For now, we'll check for specific admin user IDs or a special claim
  const isAdmin = checkAdminPermissions(ctx.user.userId, ctx.user.orgId);

  if (!isAdmin) {
    logger.warn('Non-admin user attempted to access admin functionality', {
      userId: ctx.user.userId,
      orgId: ctx.user.orgId,
      connectionId: ctx.connectionId,
      timestamp: new Date().toISOString(),
    });

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin permissions required. This functionality is restricted to administrators only.',
    });
  }

  logger.debug('Admin access granted', {
    userId: ctx.user.userId,
    orgId: ctx.user.orgId,
    connectionId: ctx.connectionId,
  });

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Check if a user has admin permissions
 * This is a placeholder implementation - in production this would check against
 * a proper authorization system
 */
function checkAdminPermissions(userId: string, orgId?: string): boolean {
  // Environment variable for admin user IDs (comma-separated)
  const adminUserIds = process.env['ADMIN_USER_IDS']?.split(',').map(id => id.trim()) || [];
  
  // Check if user ID is in admin list
  if (adminUserIds.includes(userId)) {
    return true;
  }

  // Check for admin role in development environment
  if (process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'test') {
    // In development, allow users with 'admin' in their user ID
    if (userId.includes('admin') || userId.includes('test-admin')) {
      return true;
    }
  }

  // Check for special admin claim (this would be set by Clerk or another auth provider)
  // This is a placeholder - in a real implementation, you'd check ctx.user.publicMetadata
  // or make an API call to verify admin status
  
  return false;
}

/**
 * Rate limiting middleware specifically for admin operations
 * More lenient than regular rate limiting since admins need to perform bulk operations
 */
export const adminRateLimitMiddleware = middleware(async ({ ctx, next }) => {
  // Admin operations get higher rate limits
  const userId = ctx.user?.userId || ctx.connectionId || 'anonymous';
  const now = Date.now();
  const windowMs = parseInt(process.env['ADMIN_RATE_LIMIT_WINDOW'] || '60000'); // 1 minute
  const maxRequests = parseInt(process.env['ADMIN_RATE_LIMIT_MAX_REQUESTS'] || '1000'); // Much higher for admins
  
  // Simple in-memory rate limiting (in production, use Redis or similar)
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  const userLimit = rateLimitStore.get(`admin_${userId}`);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(`admin_${userId}`, {
      count: 1,
      resetTime: now + windowMs,
    });
  } else {
    userLimit.count++;
    
    if (userLimit.count > maxRequests) {
      logger.warn('Admin rate limit exceeded', {
        userId,
        count: userLimit.count,
        maxRequests,
        windowMs,
        connectionId: ctx.connectionId,
      });
      
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Admin rate limit exceeded. Please try again later.',
      });
    }
  }
  
  return next();
});

/**
 * Admin-only procedure that requires admin permissions
 */
export const adminOnlyProcedure = publicProcedure
  .use(adminMiddleware)
  .use(adminRateLimitMiddleware);

/**
 * Utility function to check if a user is an admin (for use in other services)
 */
export function isAdminUser(userId: string, orgId?: string): boolean {
  return checkAdminPermissions(userId, orgId);
}