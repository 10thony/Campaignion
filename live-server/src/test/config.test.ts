import { describe, it, expect } from 'vitest';
import { config, isDevelopment, isProduction, isTest, getCorsOrigins, getConvexConfig, getClerkConfig, getWebSocketConfig, getRoomConfig, getRateLimitConfig, getMessageBatchConfig } from '../config/index';

describe('Configuration', () => {
  describe('Basic Configuration', () => {
    it('should have valid configuration loaded', () => {
      expect(config).toBeDefined();
      expect(config.NODE_ENV).toBeDefined();
      expect(config.PORT).toBeTypeOf('number');
      expect(config.FRONTEND_URL).toMatch(/^https?:\/\//);
      expect(config.CLERK_SECRET_KEY).toBeDefined();
      expect(config.CLERK_PUBLISHABLE_KEY).toBeDefined();
      expect(config.CONVEX_URL).toMatch(/^https?:\/\//);
    });

    it('should have valid numeric configurations', () => {
      expect(config.PORT).toBeGreaterThan(0);
      expect(config.WS_HEARTBEAT_INTERVAL).toBeGreaterThan(0);
      expect(config.WS_CONNECTION_TIMEOUT).toBeGreaterThan(0);
      expect(config.ROOM_INACTIVITY_TIMEOUT).toBeGreaterThan(0);
      expect(config.MAX_ROOMS_PER_SERVER).toBeGreaterThan(0);
      expect(config.TURN_TIME_LIMIT).toBeGreaterThan(0);
      expect(config.RATE_LIMIT_WINDOW).toBeGreaterThan(0);
      expect(config.RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
      expect(config.MESSAGE_BATCH_SIZE).toBeGreaterThan(0);
      expect(config.MESSAGE_BATCH_TIMEOUT).toBeGreaterThan(0);
      expect(config.HEALTH_CHECK_TIMEOUT).toBeGreaterThan(0);
    });

    it('should have valid enum configurations', () => {
      expect(['development', 'production', 'test']).toContain(config.NODE_ENV);
      expect(['DEBUG', 'INFO', 'WARN', 'ERROR']).toContain(config.LOG_LEVEL);
      expect(typeof config.ENABLE_HELMET).toBe('boolean');
    });
  });

  describe('Helper Functions', () => {
    it('should identify environment correctly', () => {
      const dev = isDevelopment();
      const prod = isProduction();
      const test = isTest();
      
      // Exactly one should be true
      expect([dev, prod, test].filter(Boolean)).toHaveLength(1);
      
      if (config.NODE_ENV === 'development') {
        expect(dev).toBe(true);
        expect(prod).toBe(false);
        expect(test).toBe(false);
      } else if (config.NODE_ENV === 'production') {
        expect(dev).toBe(false);
        expect(prod).toBe(true);
        expect(test).toBe(false);
      } else if (config.NODE_ENV === 'test') {
        expect(dev).toBe(false);
        expect(prod).toBe(false);
        expect(test).toBe(true);
      }
    });

    it('should return CORS origins', () => {
      const origins = getCorsOrigins();
      expect(Array.isArray(origins)).toBe(true);
      expect(origins.length).toBeGreaterThan(0);
      origins.forEach(origin => {
        expect(origin).toMatch(/^https?:\/\//);
      });
    });

    it('should return Convex configuration', () => {
      const convexConfig = getConvexConfig();
      expect(convexConfig).toHaveProperty('url');
      expect(convexConfig.url).toMatch(/^https?:\/\//);
      expect(convexConfig).toHaveProperty('deployKey');
    });

    it('should return Clerk configuration', () => {
      const clerkConfig = getClerkConfig();
      expect(clerkConfig).toHaveProperty('secretKey');
      expect(clerkConfig).toHaveProperty('publishableKey');
      expect(clerkConfig.secretKey).toBeDefined();
      expect(clerkConfig.publishableKey).toBeDefined();
    });

    it('should return WebSocket configuration', () => {
      const wsConfig = getWebSocketConfig();
      expect(wsConfig).toHaveProperty('heartbeatInterval');
      expect(wsConfig).toHaveProperty('connectionTimeout');
      expect(wsConfig.heartbeatInterval).toBeGreaterThan(0);
      expect(wsConfig.connectionTimeout).toBeGreaterThan(0);
    });

    it('should return room configuration', () => {
      const roomConfig = getRoomConfig();
      expect(roomConfig).toHaveProperty('inactivityTimeout');
      expect(roomConfig).toHaveProperty('maxRoomsPerServer');
      expect(roomConfig).toHaveProperty('turnTimeLimit');
      expect(roomConfig.inactivityTimeout).toBeGreaterThan(0);
      expect(roomConfig.maxRoomsPerServer).toBeGreaterThan(0);
      expect(roomConfig.turnTimeLimit).toBeGreaterThan(0);
    });

    it('should return rate limit configuration', () => {
      const rateLimitConfig = getRateLimitConfig();
      expect(rateLimitConfig).toHaveProperty('window');
      expect(rateLimitConfig).toHaveProperty('maxRequests');
      expect(rateLimitConfig.window).toBeGreaterThan(0);
      expect(rateLimitConfig.maxRequests).toBeGreaterThan(0);
    });

    it('should return message batch configuration', () => {
      const batchConfig = getMessageBatchConfig();
      expect(batchConfig).toHaveProperty('batchSize');
      expect(batchConfig).toHaveProperty('batchTimeout');
      expect(batchConfig.batchSize).toBeGreaterThan(0);
      expect(batchConfig.batchTimeout).toBeGreaterThan(0);
    });
  });
});