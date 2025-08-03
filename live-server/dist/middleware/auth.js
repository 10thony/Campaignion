"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dmOnlyProcedure = exports.protectedProcedure = exports.rateLimitMiddleware = exports.dmMiddleware = exports.authMiddleware = void 0;
const server_1 = require("@trpc/server");
const trpc_1 = require("../utils/trpc");
const logger_1 = require("../utils/logger");
exports.authMiddleware = (0, trpc_1.middleware)(async ({ ctx, next }) => {
    if (!ctx.user) {
        logger_1.logger.warn('Unauthorized access attempt', {
            connectionId: ctx.connectionId,
            timestamp: new Date().toISOString(),
            ip: ctx.req ? ctx.req.ip : 'unknown',
        });
        throw new server_1.TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required. Please provide a valid Clerk token.',
        });
    }
    if (!ctx.user.sessionId) {
        logger_1.logger.warn('Invalid session - missing session ID', {
            userId: ctx.user.userId,
            connectionId: ctx.connectionId,
        });
        throw new server_1.TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid session. Please re-authenticate.',
        });
    }
    logger_1.logger.debug('User authenticated successfully', {
        userId: ctx.user.userId,
        sessionId: ctx.user.sessionId,
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
exports.dmMiddleware = (0, trpc_1.middleware)(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new server_1.TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
        });
    }
    logger_1.logger.debug('DM access granted', {
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
const rateLimitStore = new Map();
exports.rateLimitMiddleware = (0, trpc_1.middleware)(async ({ ctx, next }) => {
    const userId = ctx.user?.userId || ctx.connectionId || 'anonymous';
    const now = Date.now();
    const windowMs = parseInt(process.env['RATE_LIMIT_WINDOW'] || '60000');
    const maxRequests = parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100');
    const userLimit = rateLimitStore.get(userId);
    if (!userLimit || now > userLimit.resetTime) {
        rateLimitStore.set(userId, {
            count: 1,
            resetTime: now + windowMs,
        });
    }
    else {
        userLimit.count++;
        if (userLimit.count > maxRequests) {
            logger_1.logger.warn('Rate limit exceeded', {
                userId,
                count: userLimit.count,
                maxRequests,
                windowMs,
                connectionId: ctx.connectionId,
            });
            throw new server_1.TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: 'Rate limit exceeded. Please try again later.',
            });
        }
    }
    if (Math.random() < 0.01) {
        for (const [key, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }
    return next();
});
exports.protectedProcedure = trpc_1.publicProcedure.use(exports.authMiddleware).use(exports.rateLimitMiddleware);
exports.dmOnlyProcedure = trpc_1.publicProcedure.use(exports.authMiddleware).use(exports.dmMiddleware).use(exports.rateLimitMiddleware);
//# sourceMappingURL=auth.js.map