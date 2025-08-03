"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const ws_1 = require("ws");
const trpcExpress = __importStar(require("@trpc/server/adapters/express"));
const ws_2 = require("@trpc/server/adapters/ws");
const routers_1 = require("./routers");
const context_1 = require("./middleware/context");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const config_1 = require("./config");
const convex_1 = require("./config/convex");
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
if (config_1.config.ENABLE_HELMET) {
    app.use((0, helmet_1.default)());
}
app.use((0, cors_1.default)({
    origin: (0, config_1.getCorsOrigins)(),
    credentials: true,
}));
app.use(express_1.default.json());
app.use(errorHandler_1.errorHandler);
app.get('/health', async (_req, res) => {
    const startTime = Date.now();
    try {
        const convexHealthy = await Promise.race([
            (0, convex_1.checkConvexConnection)(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), config_1.config.HEALTH_CHECK_TIMEOUT))
        ]);
        const responseTime = Date.now() - startTime;
        const healthStatus = {
            status: convexHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            version: process.env['npm_package_version'] || '1.0.0',
            environment: config_1.config.NODE_ENV,
            uptime: process.uptime(),
            responseTime,
            services: {
                convex: convexHealthy ? 'healthy' : 'unhealthy',
                websocket: 'healthy',
            },
            configuration: {
                port: config_1.config.PORT,
                maxRooms: config_1.config.MAX_ROOMS_PER_SERVER,
                turnTimeLimit: config_1.config.TURN_TIME_LIMIT,
                roomInactivityTimeout: config_1.config.ROOM_INACTIVITY_TIMEOUT,
            }
        };
        res.status(convexHealthy ? 200 : 503).json(healthStatus);
    }
    catch (error) {
        const responseTime = Date.now() - startTime;
        logger_1.logger.error('Health check failed', {
            error: error instanceof Error ? error.message : String(error),
            responseTime,
        });
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            version: process.env['npm_package_version'] || '1.0.0',
            environment: config_1.config.NODE_ENV,
            uptime: process.uptime(),
            responseTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            services: {
                convex: 'unhealthy',
                websocket: 'healthy',
            }
        });
    }
});
app.use('/trpc', trpcExpress.createExpressMiddleware({
    router: routers_1.appRouter,
    createContext: context_1.createContext,
    onError: ({ error, path, input, ctx }) => {
        logger_1.logger.error('tRPC HTTP Error:', {
            error: error.message,
            code: error.code,
            path,
            input: (0, config_1.isDevelopment)() ? input : '[REDACTED]',
            stack: (0, config_1.isDevelopment)() ? error.stack : undefined,
            userId: ctx?.user?.userId,
            timestamp: new Date().toISOString(),
        });
    },
}));
const wss = new ws_1.WebSocketServer({ server });
exports.wss = wss;
const wsHandler = (0, ws_2.applyWSSHandler)({
    wss,
    router: routers_1.appRouter,
    createContext: context_1.createContext,
    onError: ({ error, path, input, ctx }) => {
        logger_1.logger.error('tRPC WebSocket Error:', {
            error: error.message,
            code: error.code,
            path,
            input: (0, config_1.isDevelopment)() ? input : '[REDACTED]',
            stack: (0, config_1.isDevelopment)() ? error.stack : undefined,
            userId: ctx?.user?.userId,
            connectionId: ctx?.connectionId,
            timestamp: new Date().toISOString(),
        });
    },
});
wss.on('connection', (ws, req) => {
    const connectionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    logger_1.logger.info('New WebSocket connection established', {
        connectionId,
        ip: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        url: req.url,
        timestamp: new Date().toISOString(),
    });
    ws.on('error', (error) => {
        logger_1.logger.error('WebSocket connection error', {
            connectionId,
            error: error.message,
            stack: error.stack,
            ip: req.socket.remoteAddress,
        });
    });
    ws.on('close', (code, reason) => {
        logger_1.logger.info('WebSocket connection closed', {
            connectionId,
            code,
            reason: reason.toString(),
            ip: req.socket.remoteAddress,
        });
    });
    ws.on('pong', () => {
        logger_1.logger.debug('WebSocket pong received', { connectionId });
    });
});
wss.on('error', (error) => {
    logger_1.logger.error('WebSocket server error', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });
});
async function initializeServer() {
    try {
        (0, convex_1.createConvexClient)();
        server.listen(config_1.config.PORT, () => {
            logger_1.logger.info(`Live Interaction Server running on port ${config_1.config.PORT}`, {
                nodeEnv: config_1.config.NODE_ENV,
                nodeVersion: process.version,
                timestamp: new Date().toISOString(),
                maxRooms: config_1.config.MAX_ROOMS_PER_SERVER,
                turnTimeLimit: config_1.config.TURN_TIME_LIMIT,
                corsOrigins: (0, config_1.getCorsOrigins)(),
            });
            logger_1.logger.info(`WebSocket server ready for connections`);
            logger_1.logger.info(`tRPC endpoint available at http://localhost:${config_1.config.PORT}/trpc`);
            logger_1.logger.info(`Health check available at http://localhost:${config_1.config.PORT}/health`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize server', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}
initializeServer();
server.on('error', (error) => {
    logger_1.logger.error('Server error', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });
    server.close(() => {
        process.exit(1);
    });
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: String(promise),
        timestamp: new Date().toISOString(),
    });
});
function gracefulShutdown(signal) {
    logger_1.logger.info(`${signal} received, shutting down gracefully`);
    wsHandler.broadcastReconnectNotification();
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
        (0, convex_1.closeConvexClient)();
        logger_1.logger.info('Server shutdown complete');
        process.exit(0);
    });
    setTimeout(() => {
        logger_1.logger.error('Forced shutdown due to timeout');
        process.exit(1);
    }, 10000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
//# sourceMappingURL=index.js.map