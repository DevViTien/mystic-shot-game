import { describe, it, expect } from 'vitest';
import { FunctionParser } from '@/math/FunctionParser';

describe('FunctionParser', () => {
  describe('parse', () => {
    it('should parse a valid expression', () => {
      const node = FunctionParser.parse('x^2 + 1');
      expect(node).not.toBeNull();
    });

    it('should return null for invalid expression', () => {
      const node = FunctionParser.parse('+++');
      expect(node).toBeNull();
    });
  });

  describe('evaluate', () => {
    it('should evaluate x^2 at x=3 as 9', () => {
      expect(FunctionParser.evaluate('x^2', 3)).toBe(9);
    });

    it('should evaluate 2*x+1 at x=4 as 9', () => {
      expect(FunctionParser.evaluate('2*x+1', 4)).toBe(9);
    });

    it('should return undefined for division by zero', () => {
      expect(FunctionParser.evaluate('1/0', 0)).toBeUndefined();
    });

    it('should return undefined for invalid expression', () => {
      expect(FunctionParser.evaluate('invalid!!!', 0)).toBeUndefined();
    });

    it('should handle sin(x)', () => {
      const result = FunctionParser.evaluate('sin(x)', 0);
      expect(result).toBeCloseTo(0);
    });
  });

  describe('createEvaluator', () => {
    it('should create a reusable function', () => {
      const fn = FunctionParser.createEvaluator('x^2');
      expect(fn(2)).toBe(4);
      expect(fn(3)).toBe(9);
      expect(fn(-1)).toBe(1);
    });

    it('should return undefined for invalid expression', () => {
      const fn = FunctionParser.createEvaluator('invalid!!!');
      expect(fn(0)).toBeUndefined();
    });
  });

  describe('createTranslatedEvaluator', () => {
    it('should pass through player origin for any expression', () => {
      // For any f(x), translated evaluator at x=originX should return originY
      const fn = FunctionParser.createTranslatedEvaluator('x^2', 5, 3);
      expect(fn(5)).toBeCloseTo(3); // at origin → returns originY
    });

    it('should translate x^2 correctly', () => {
      // f(x) = x^2, origin (0, 0)
      // translated: f(x-0) - f(0) + 0 = x^2
      const fn = FunctionParser.createTranslatedEvaluator('x^2', 0, 0);
      expect(fn(2)).toBeCloseTo(4);
    });

    it('should translate with non-zero origin', () => {
      // f(x) = x, origin (5, 3)
      // translated: f(x-5) - f(0) + 3 = (x-5) - 0 + 3 = x - 2
      const fn = FunctionParser.createTranslatedEvaluator('x', 5, 3);
      expect(fn(5)).toBeCloseTo(3); // origin
      expect(fn(7)).toBeCloseTo(5); // (7-5) - 0 + 3 = 5
    });

    it('should handle constant function', () => {
      // f(x) = 5, origin (3, 7)
      // translated: 5 - 5 + 7 = 7 (flat line at y=7)
      const fn = FunctionParser.createTranslatedEvaluator('5', 3, 7);
      expect(fn(0)).toBeCloseTo(7);
      expect(fn(10)).toBeCloseTo(7);
    });
  });
});
