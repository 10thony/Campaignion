"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnlyProcedure = exports.adminRateLimitMiddleware = exports.adminMiddleware = void 0;
exports.isAdminUser = isAdminUser;
const server_1 = require("@trpc/server");
const trpc_1 = require("../utils/trpc");
const logger_1 = require("../utils/logger");
exports.adminMiddleware = (0, trpc_1.middleware)(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new server_1.TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
        });
    }
    const isAdmin = checkAdminPermissions(ctx.user.userId, ctx.user.orgId);
    if (!isAdmin) {
        logger_1.logger.warn('Non-admin user attempted to access admin functionality', {
            userId: ctx.user.userId,
            orgId: ctx.user.orgId,
            connectionId: ctx.connectionId,
            timestamp: new Date().toISOString(),
        });
        throw new server_1.TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin permissions required. This functionality is restricted to administrators only.',
        });
    }
    logger_1.logger.debug('Admin access granted', {
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
function checkAdminPermissions(userId, orgId) {
    const adminUserIds = process.env['ADMIN_USER_IDS']?.split(',').map(id => id.trim()) || [];
    if (adminUserIds.includes(userId)) {
        return true;
    }
    if (process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'test') {
        if (userId.includes('admin') || userId.includes('test-admin')) {
            return true;
        }
    }
    return false;
}
exports.adminRateLimitMiddleware = (0, trpc_1.middleware)(async ({ ctx, next }) => {
    const userId = ctx.user?.userId || ctx.connectionId || 'anonymous';
    const now = Date.now();
    const windowMs = parseInt(process.env['ADMIN_RATE_LIMIT_WINDOW'] || '60000');
    const maxRequests = parseInt(process.env['ADMIN_RATE_LIMIT_MAX_REQUESTS'] || '1000');
    const rateLimitStore = new Map();
    const userLimit = rateLimitStore.get(`admin_${userId}`);
    if (!userLimit || now > userLimit.resetTime) {
        rateLimitStore.set(`admin_${userId}`, {
            count: 1,
            resetTime: now + windowMs,
        });
    }
    else {
        userLimit.count++;
        if (userLimit.count > maxRequests) {
            logger_1.logger.warn('Admin rate limit exceeded', {
                userId,
                count: userLimit.count,
                maxRequests,
                windowMs,
                connectionId: ctx.connectionId,
            });
            throw new server_1.TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: 'Admin rate limit exceeded. Please try again later.',
            });
        }
    }
    return next();
});
exports.adminOnlyProcedure = trpc_1.publicProcedure
    .use(exports.adminMiddleware)
    .use(exports.adminRateLimitMiddleware);
function isAdminUser(userId, orgId) {
    return checkAdminPermissions(userId, orgId);
}
//# sourceMappingURL=adminAuth.js.map