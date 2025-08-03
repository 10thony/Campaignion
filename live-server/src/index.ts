import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import * as trpcExpress from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from './routers';
import { createContext } from './middleware/context';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { config, getCorsOrigins, isDevelopment } from './config';
import { createConvexClient, checkConvexConnection, closeConvexClient } from './config/convex';

const app = express();
const server = createServer(app);

// Middleware
if (config.ENABLE_HELMET) {
  app.use(helmet());
}

app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
}));
app.use(express.json());

// Error handling middleware
app.use(errorHandler);

// Health check endpoint
app.get('/health', async (_req, res) => {
  const startTime = Date.now();
  
  try {
    // Check Convex connection
    const convexHealthy = await Promise.race([
      checkConvexConnection(),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), config.HEALTH_CHECK_TIMEOUT)
      )
    ]);

    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: convexHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: config.NODE_ENV,
      uptime: process.uptime(),
      responseTime,
      services: {
        convex: convexHealthy ? 'healthy' : 'unhealthy',
        websocket: 'healthy', // WebSocket server is running if we reach this point
      },
      configuration: {
        port: config.PORT,
        maxRooms: config.MAX_ROOMS_PER_SERVER,
        turnTimeLimit: config.TURN_TIME_LIMIT,
        roomInactivityTimeout: config.ROOM_INACTIVITY_TIMEOUT,
      }
    };

    res.status(convexHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error),
      responseTime,
    });

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] || '1.0.0',
      environment: config.NODE_ENV,
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

// tRPC HTTP handler
app.use('/trpc', trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext: createContext,
  onError: ({ error, path, input, ctx }) => {
    logger.error('tRPC HTTP Error:', {
      error: error.message,
      code: error.code,
      path,
      input: isDevelopment() ? input : '[REDACTED]',
      stack: isDevelopment() ? error.stack : undefined,
      userId: ctx?.user?.userId,
      timestamp: new Date().toISOString(),
    });
  },
}));

// WebSocket server for tRPC subscriptions
const wss = new WebSocketServer({ server });

const wsHandler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: createContext,
  onError: ({ error, path, input, ctx }) => {
    logger.error('tRPC WebSocket Error:', {
      error: error.message,
      code: error.code,
      path,
      input: isDevelopment() ? input : '[REDACTED]',
      stack: isDevelopment() ? error.stack : undefined,
      userId: ctx?.user?.userId,
      connectionId: ctx?.connectionId,
      timestamp: new Date().toISOString(),
    });
  },
});

// WebSocket connection logging and error handling
wss.on('connection', (ws, req) => {
  const connectionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  logger.info('New WebSocket connection established', {
    connectionId,
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    url: req.url,
    timestamp: new Date().toISOString(),
  });
  
  ws.on('error', (error) => {
    logger.error('WebSocket connection error', {
      connectionId,
      error: error.message,
      stack: error.stack,
      ip: req.socket.remoteAddress,
    });
  });
  
  ws.on('close', (code, reason) => {
    logger.info('WebSocket connection closed', {
      connectionId,
      code,
      reason: reason.toString(),
      ip: req.socket.remoteAddress,
    });
  });
  
  ws.on('pong', () => {
    logger.debug('WebSocket pong received', { connectionId });
  });
});

// WebSocket server error handling
wss.on('error', (error) => {
  logger.error('WebSocket server error', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
});

// Initialize Convex client on startup
async function initializeServer() {
  try {
    // Initialize Convex client
    createConvexClient();
    
    // Start the server
    server.listen(config.PORT, () => {
      logger.info(`Live Interaction Server running on port ${config.PORT}`, {
        nodeEnv: config.NODE_ENV,
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
        maxRooms: config.MAX_ROOMS_PER_SERVER,
        turnTimeLimit: config.TURN_TIME_LIMIT,
        corsOrigins: getCorsOrigins(),
      });
      logger.info(`WebSocket server ready for connections`);
      logger.info(`tRPC endpoint available at http://localhost:${config.PORT}/trpc`);
      logger.info(`Health check available at http://localhost:${config.PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to initialize server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Initialize the server
initializeServer();

// Server error handling
server.on('error', (error) => {
  logger.error('Server error', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  
  // Graceful shutdown
  server.close(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise),
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  
  // Broadcast reconnection notification to clients
  wsHandler.broadcastReconnectNotification();
  
  // Close server and cleanup resources
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close Convex client
    closeConvexClient();
    
    logger.info('Server shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server, wss };