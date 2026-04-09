import { describe, it, expect } from 'vitest';
import { distance, clamp, lerp } from '@/utils/MathUtils';

describe('MathUtils', () => {
  describe('distance', () => {
    it('should return 0 for same point', () => {
      expect(distance({ x: 5, y: 3 }, { x: 5, y: 3 })).toBe(0);
    });

    it('should calculate distance between two points', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('should handle negative coordinates', () => {
      expect(distance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should clamp to min when below', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp to max when above', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  describe('lerp', () => {
    it('should return a when t=0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('should return b when t=1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('should return midpoint when t=0.5', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
    });
  });
});
