import { describe, it, expect } from 'vitest';
import { 
  generateId, 
  getCurrentTimestamp, 
  isValidPosition, 
  calculateDistance,
  deepClone 
} from './index';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return current timestamp', () => {
      const timestamp = getCurrentTimestamp();
      const now = Date.now();
      
      expect(timestamp).toBeDefined();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeLessThanOrEqual(now);
      expect(timestamp).toBeGreaterThan(now - 1000); // Within last second
    });
  });

  describe('isValidPosition', () => {
    it('should validate positions correctly', () => {
      expect(isValidPosition(0, 0, 10, 10)).toBe(true);
      expect(isValidPosition(5, 5, 10, 10)).toBe(true);
      expect(isValidPosition(9, 9, 10, 10)).toBe(true);
      
      expect(isValidPosition(-1, 0, 10, 10)).toBe(false);
      expect(isValidPosition(0, -1, 10, 10)).toBe(false);
      expect(isValidPosition(10, 0, 10, 10)).toBe(false);
      expect(isValidPosition(0, 10, 10, 10)).toBe(false);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance correctly', () => {
      expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(calculateDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
      expect(calculateDistance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5);
    });
  });

  describe('deepClone', () => {
    it('should create deep copies of objects', () => {
      const original = { 
        a: 1, 
        b: { c: 2, d: [3, 4] },
        e: 'test'
      };
      
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);
      
      // Modify clone to ensure independence
      cloned.b.c = 999;
      expect(original.b.c).toBe(2);
    });
  });
});