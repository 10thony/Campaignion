"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHTTPContext = createHTTPContext;
exports.createWSContext = createWSContext;
exports.createContext = createContext;
const backend_1 = require("@clerk/backend");
const logger_1 = require("../utils/logger");
async function createHTTPContext({ req }) {
    const authHeader = req.headers.authorization;
    let user = null;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const secretKey = process.env['CLERK_SECRET_KEY'];
            if (!secretKey) {
                logger_1.logger.error('CLERK_SECRET_KEY environment variable is not set');
                throw new Error('Authentication configuration error');
            }
            const payload = await (0, backend_1.verifyToken)(token, {
                secretKey,
                issuer: (iss) => iss.startsWith('https://clerk.'),
            });
            if (payload.sub) {
                user = {
                    userId: payload.sub,
                    sessionId: payload.sid || '',
                    orgId: payload.org_id || undefined,
                };
                logger_1.logger.debug('User authenticated via HTTP', {
                    userId: user.userId,
                    sessionId: user.sessionId,
                    orgId: user.orgId,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to verify Clerk token via HTTP', {
                error: error instanceof Error ? error.message : 'Unknown error',
                tokenPrefix: token.substring(0, 10) + '...',
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
    }
    else if (authHeader) {
        logger_1.logger.warn('Invalid authorization header format', {
            headerPrefix: authHeader.substring(0, 10) + '...',
            ip: req.ip
        });
    }
    return {
        user,
        req: req,
    };
}
async function createWSContext({ req }) {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    let user = null;
    const connectionId = generateConnectionId();
    if (token) {
        try {
            const secretKey = process.env['CLERK_SECRET_KEY'];
            if (!secretKey) {
                logger_1.logger.error('CLERK_SECRET_KEY environment variable is not set');
                throw new Error('Authentication configuration error');
            }
            const payload = await (0, backend_1.verifyToken)(token, {
                secretKey,
                issuer: (iss) => iss.startsWith('https://clerk.'),
            });
            if (payload.sub) {
                user = {
                    userId: payload.sub,
                    sessionId: payload.sid || '',
                    orgId: payload.org_id || undefined,
                };
                logger_1.logger.debug('User authenticated via WebSocket', {
                    userId: user.userId,
                    sessionId: user.sessionId,
                    orgId: user.orgId,
                    connectionId,
                    ip: req.socket.remoteAddress
                });
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to verify Clerk token via WebSocket', {
                error: error instanceof Error ? error.message : 'Unknown error',
                tokenPrefix: token.substring(0, 10) + '...',
                connectionId,
                ip: req.socket.remoteAddress
            });
        }
    }
    else {
        logger_1.logger.debug('WebSocket connection without token', {
            connectionId,
            ip: req.socket.remoteAddress
        });
    }
    return {
        user,
        connectionId,
    };
}
async function createContext(opts) {
    if ('info' in opts) {
        return createWSContext(opts);
    }
    else {
        return createHTTPContext(opts);
    }
}
function generateConnectionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
//# sourceMappingURL=context.js.map