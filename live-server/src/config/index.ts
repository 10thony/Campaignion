import dotenv from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

// Environment variable schema with validation
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.string().optional().default('development').pipe(z.enum(['development', 'production', 'test'])),
  PORT: z.string().optional().default('3001').transform(Number).pipe(z.number().min(1).max(65535)),
  FRONTEND_URL: z.string().optional().default('http://localhost:5173').pipe(z.string().url()),
  
  // Clerk Authentication (required)
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required'),
  
  // Convex Database (required)
  CONVEX_URL: z.string().url('CONVEX_URL must be a valid URL'),
  CONVEX_DEPLOY_KEY: z.string().optional(),
  
  // WebSocket Configuration
  WS_HEARTBEAT_INTERVAL: z.string().optional().default('30000').transform(Number).pipe(z.number().positive()),
  WS_CONNECTION_TIMEOUT: z.string().optional().default('60000').transform(Number).pipe(z.number().positive()),
  
  // Room Management
  ROOM_INACTIVITY_TIMEOUT: z.string().optional().default('1800000').transform(Number).pipe(z.number().positive()), // 30 minutes
  MAX_ROOMS_PER_SERVER: z.string().optional().default('100').transform(Number).pipe(z.number().positive()),
  TURN_TIME_LIMIT: z.string().optional().default('90000').transform(Number).pipe(z.number().positive()), // 90 seconds
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.string().optional().default('60000').transform(Number).pipe(z.number().positive()), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.string().optional().default('100').transform(Number).pipe(z.number().positive()),
  
  // Logging
  LOG_LEVEL: z.string().optional().default('INFO').pipe(z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR'])),
  
  // Performance
  MESSAGE_BATCH_SIZE: z.string().optional().default('10').transform(Number).pipe(z.number().positive()),
  MESSAGE_BATCH_TIMEOUT: z.string().optional().default('100').transform(Number).pipe(z.number().positive()),
  
  // Security
  CORS_ORIGINS: z.string().optional(),
  ENABLE_HELMET: z.string().optional().default('true').transform(val => val === 'true'),
  
  // Health Check
  HEALTH_CHECK_TIMEOUT: z.string().optional().default('5000').transform(Number).pipe(z.number().positive()),
});

export type Config = z.infer<typeof envSchema>;

class ConfigurationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function validateEnvironment(): Config {
  try {
    const env = {
      NODE_ENV: process.env['NODE_ENV'],
      PORT: process.env['PORT'],
      FRONTEND_URL: process.env['FRONTEND_URL'],
      CLERK_SECRET_KEY: process.env['CLERK_SECRET_KEY'],
      CLERK_PUBLISHABLE_KEY: process.env['CLERK_PUBLISHABLE_KEY'],
      CONVEX_URL: process.env['CONVEX_URL'],
      CONVEX_DEPLOY_KEY: process.env['CONVEX_DEPLOY_KEY'],
      WS_HEARTBEAT_INTERVAL: process.env['WS_HEARTBEAT_INTERVAL'],
      WS_CONNECTION_TIMEOUT: process.env['WS_CONNECTION_TIMEOUT'],
      ROOM_INACTIVITY_TIMEOUT: process.env['ROOM_INACTIVITY_TIMEOUT'],
      MAX_ROOMS_PER_SERVER: process.env['MAX_ROOMS_PER_SERVER'],
      TURN_TIME_LIMIT: process.env['TURN_TIME_LIMIT'],
      RATE_LIMIT_WINDOW: process.env['RATE_LIMIT_WINDOW'],
      RATE_LIMIT_MAX_REQUESTS: process.env['RATE_LIMIT_MAX_REQUESTS'],
      LOG_LEVEL: process.env['LOG_LEVEL'],
      MESSAGE_BATCH_SIZE: process.env['MESSAGE_BATCH_SIZE'],
      MESSAGE_BATCH_TIMEOUT: process.env['MESSAGE_BATCH_TIMEOUT'],
      CORS_ORIGINS: process.env['CORS_ORIGINS'],
      ENABLE_HELMET: process.env['ENABLE_HELMET'],
      HEALTH_CHECK_TIMEOUT: process.env['HEALTH_CHECK_TIMEOUT'],
    };

    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);

      let errorMessage = 'Environment configuration validation failed:\n';
      
      if (missingVars.length > 0) {
        errorMessage += `\nMissing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}`;
      }
      
      if (invalidVars.length > 0) {
        errorMessage += `\nInvalid environment variables:\n${invalidVars.map(v => `  - ${v}`).join('\n')}`;
      }

      errorMessage += '\n\nPlease check your .env file and ensure all required variables are set correctly.';
      errorMessage += '\nRefer to .env.example for the expected format.';

      throw new ConfigurationError(errorMessage, error.errors);
    }
    throw error;
  }
}

// Validate and export configuration
let config: Config;

function initializeConfig(): Config {
  try {
    const validatedConfig = validateEnvironment();
    
    // Log successful configuration load (without sensitive data)
    if (validatedConfig.NODE_ENV !== 'test') {
      logger.info('Configuration loaded successfully', {
        nodeEnv: validatedConfig.NODE_ENV,
        port: validatedConfig.PORT,
        frontendUrl: validatedConfig.FRONTEND_URL,
        logLevel: validatedConfig.LOG_LEVEL,
        maxRooms: validatedConfig.MAX_ROOMS_PER_SERVER,
        turnTimeLimit: validatedConfig.TURN_TIME_LIMIT,
        roomInactivityTimeout: validatedConfig.ROOM_INACTIVITY_TIMEOUT,
        wsHeartbeatInterval: validatedConfig.WS_HEARTBEAT_INTERVAL,
        wsConnectionTimeout: validatedConfig.WS_CONNECTION_TIMEOUT,
        rateLimitWindow: validatedConfig.RATE_LIMIT_WINDOW,
        rateLimitMaxRequests: validatedConfig.RATE_LIMIT_MAX_REQUESTS,
        messageBatchSize: validatedConfig.MESSAGE_BATCH_SIZE,
        messageBatchTimeout: validatedConfig.MESSAGE_BATCH_TIMEOUT,
        enableHelmet: validatedConfig.ENABLE_HELMET,
        healthCheckTimeout: validatedConfig.HEALTH_CHECK_TIMEOUT,
        convexConfigured: !!validatedConfig.CONVEX_URL,
        clerkConfigured: !!validatedConfig.CLERK_SECRET_KEY,
      });
    }
    
    return validatedConfig;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error('\n❌ Configuration Error:');
      console.error(error.message);
      
      if (process.env['NODE_ENV'] !== 'test') {
        process.exit(1);
      } else {
        // In test environment, provide a minimal config to prevent crashes
        return {
          NODE_ENV: 'test',
          PORT: 3001,
          FRONTEND_URL: 'http://localhost:5173',
          CLERK_SECRET_KEY: 'test-key',
          CLERK_PUBLISHABLE_KEY: 'test-key',
          CONVEX_URL: 'https://test.convex.cloud',
          WS_HEARTBEAT_INTERVAL: 30000,
          WS_CONNECTION_TIMEOUT: 60000,
          ROOM_INACTIVITY_TIMEOUT: 1800000,
          MAX_ROOMS_PER_SERVER: 100,
          TURN_TIME_LIMIT: 90000,
          RATE_LIMIT_WINDOW: 60000,
          RATE_LIMIT_MAX_REQUESTS: 100,
          LOG_LEVEL: 'ERROR',
          MESSAGE_BATCH_SIZE: 10,
          MESSAGE_BATCH_TIMEOUT: 100,
          ENABLE_HELMET: true,
          HEALTH_CHECK_TIMEOUT: 5000,
        } as Config;
      }
    } else {
      console.error('\n❌ Unexpected configuration error:', error);
      if (process.env['NODE_ENV'] !== 'test') {
        process.exit(1);
      }
      throw error;
    }
  }
}

// Initialize config
config = initializeConfig();

export { config, ConfigurationError };

// Helper functions for configuration
export function isDevelopment(): boolean {
  return config.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return config.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return config.NODE_ENV === 'test';
}

export function getCorsOrigins(): string[] {
  if (config.CORS_ORIGINS) {
    return config.CORS_ORIGINS.split(',').map(origin => origin.trim());
  }
  return [config.FRONTEND_URL];
}

export function getConvexConfig() {
  return {
    url: config.CONVEX_URL,
    deployKey: config.CONVEX_DEPLOY_KEY,
  };
}

export function getClerkConfig() {
  return {
    secretKey: config.CLERK_SECRET_KEY,
    publishableKey: config.CLERK_PUBLISHABLE_KEY,
  };
}

export function getWebSocketConfig() {
  return {
    heartbeatInterval: config.WS_HEARTBEAT_INTERVAL,
    connectionTimeout: config.WS_CONNECTION_TIMEOUT,
  };
}

export function getRoomConfig() {
  return {
    inactivityTimeout: config.ROOM_INACTIVITY_TIMEOUT,
    maxRoomsPerServer: config.MAX_ROOMS_PER_SERVER,
    turnTimeLimit: config.TURN_TIME_LIMIT,
  };
}

export function getRateLimitConfig() {
  return {
    window: config.RATE_LIMIT_WINDOW,
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
  };
}

export function getMessageBatchConfig() {
  return {
    batchSize: config.MESSAGE_BATCH_SIZE,
    batchTimeout: config.MESSAGE_BATCH_TIMEOUT,
  };
}