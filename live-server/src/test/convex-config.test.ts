import { describe, it, expect } from 'vitest';
import { createConvexClient, getConvexClient, checkConvexConnection, closeConvexClient } from '../config/convex';

describe('Convex Configuration', () => {
  describe('Basic Functionality', () => {
    it('should create and return a Convex client', () => {
      const client = createConvexClient();
      expect(client).toBeDefined();
      expect(typeof client).toBe('object');
    });

    it('should return the same client instance', () => {
      const client1 = getConvexClient();
      const client2 = getConvexClient();
      expect(client1).toBe(client2);
    });

    it('should handle connection health check', async () => {
      const result = await checkConvexConnection();
      expect(typeof result).toBe('boolean');
    });

    it('should handle client cleanup', () => {
      expect(() => closeConvexClient()).not.toThrow();
    });
  });
});