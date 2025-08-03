import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { isAdminUser } from '../middleware/adminAuth';
import { TRPCContext } from '../middleware/context';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('adminAuth middleware', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env['ADMIN_USER_IDS'];
    delete process.env['NODE_ENV'];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isAdminUser utility function', () => {
    beforeEach(() => {
      delete process.env['ADMIN_USER_IDS'];
      delete process.env['NODE_ENV'];
    });

    it('should return true for admin user in environment variable', () => {
      process.env['ADMIN_USER_IDS'] = 'admin-1,admin-2,test-user-1';

      const result = isAdminUser('test-user-1', 'org-1');

      expect(result).toBe(true);
    });

    it('should return true for admin user in development environment', () => {
      process.env['NODE_ENV'] = 'development';

      const result = isAdminUser('test-admin-user', 'org-1');

      expect(result).toBe(true);
    });

    it('should return true for admin user in test environment', () => {
      process.env['NODE_ENV'] = 'test';

      const result = isAdminUser('admin-test-user', 'org-1');

      expect(result).toBe(true);
    });

    it('should return false for non-admin user', () => {
      process.env['ADMIN_USER_IDS'] = 'admin-1,admin-2';
      process.env['NODE_ENV'] = 'production';

      const result = isAdminUser('regular-user', 'org-1');

      expect(result).toBe(false);
    });

    it('should return false when no admin configuration exists', () => {
      process.env['NODE_ENV'] = 'production';

      const result = isAdminUser('any-user', 'org-1');

      expect(result).toBe(false);
    });

    it('should handle undefined orgId', () => {
      process.env['ADMIN_USER_IDS'] = 'admin-1,test-user-1';

      const result = isAdminUser('test-user-1');

      expect(result).toBe(true);
    });

    it('should handle empty admin user IDs', () => {
      process.env['ADMIN_USER_IDS'] = '';
      process.env['NODE_ENV'] = 'production';

      const result = isAdminUser('any-user', 'org-1');

      expect(result).toBe(false);
    });

    it('should handle whitespace in admin user IDs', () => {
      process.env['ADMIN_USER_IDS'] = ' admin-1 , admin-2 , test-user-1 ';

      const result = isAdminUser('test-user-1'); // Exact match with trimmed value

      expect(result).toBe(true); // Should match after trimming
    });

    it('should handle case sensitivity', () => {
      process.env['ADMIN_USER_IDS'] = 'Admin-1,ADMIN-2,test-user-1';

      const result = isAdminUser('admin-1'); // Different case

      expect(result).toBe(false); // Case sensitive
    });
  });

  describe('environment variable parsing', () => {
    it('should handle comma-separated admin user IDs', () => {
      process.env['ADMIN_USER_IDS'] = 'user1,user2,user3';

      expect(isAdminUser('user1')).toBe(true);
      expect(isAdminUser('user2')).toBe(true);
      expect(isAdminUser('user3')).toBe(true);
      expect(isAdminUser('user4')).toBe(false);
    });

    it('should handle single admin user ID', () => {
      process.env['ADMIN_USER_IDS'] = 'single-admin';

      expect(isAdminUser('single-admin')).toBe(true);
      expect(isAdminUser('other-user')).toBe(false);
    });

    it('should handle undefined environment variable', () => {
      delete process.env['ADMIN_USER_IDS'];
      process.env['NODE_ENV'] = 'production';

      expect(isAdminUser('any-user')).toBe(false);
    });
  });

  describe('development environment behavior', () => {
    it('should allow users with "admin" in their ID in development', () => {
      process.env['NODE_ENV'] = 'development';

      expect(isAdminUser('admin-user')).toBe(true);
      expect(isAdminUser('user-admin')).toBe(true);
      expect(isAdminUser('admin')).toBe(true);
      expect(isAdminUser('regular-user')).toBe(false);
    });

    it('should allow users with "test-admin" in their ID in development', () => {
      process.env['NODE_ENV'] = 'development';

      expect(isAdminUser('test-admin-user')).toBe(true);
      expect(isAdminUser('user-test-admin')).toBe(true);
      expect(isAdminUser('test-admin')).toBe(true);
    });

    it('should work the same way in test environment', () => {
      process.env['NODE_ENV'] = 'test';

      expect(isAdminUser('admin-user')).toBe(true);
      expect(isAdminUser('test-admin-user')).toBe(true);
      expect(isAdminUser('regular-user')).toBe(false);
    });
  });
});