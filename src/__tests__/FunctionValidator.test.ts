import { describe, it, expect } from 'vitest';
import { FunctionValidator } from '@/math/FunctionValidator';
import { Difficulty } from '@/config';

describe('FunctionValidator', () => {
  describe('Easy mode', () => {
    it('should accept polynomial: x^2 + 2*x + 1', () => {
      const result = FunctionValidator.validate('x^2 + 2*x + 1', Difficulty.Easy);
      expect(result.valid).toBe(true);
    });

    it('should accept simple: x', () => {
      const result = FunctionValidator.validate('x', Difficulty.Easy);
      expect(result.valid).toBe(true);
    });

    it('should accept constants: 5', () => {
      const result = FunctionValidator.validate('5', Difficulty.Easy);
      expect(result.valid).toBe(true);
    });

    it('should reject sin(x) in Easy mode', () => {
      const result = FunctionValidator.validate('sin(x)', Difficulty.Easy);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sin');
    });

    it('should reject sqrt(x) in Easy mode', () => {
      const result = FunctionValidator.validate('sqrt(x)', Difficulty.Easy);
      expect(result.valid).toBe(false);
    });
  });

  describe('Medium mode', () => {
    it('should accept polynomials', () => {
      const result = FunctionValidator.validate('x^2', Difficulty.Medium);
      expect(result.valid).toBe(true);
    });

    it('should accept sin(x)', () => {
      const result = FunctionValidator.validate('sin(x)', Difficulty.Medium);
      expect(result.valid).toBe(true);
    });

    it('should accept cos(x) + log(x)', () => {
      const result = FunctionValidator.validate('cos(x) + log(x)', Difficulty.Medium);
      expect(result.valid).toBe(true);
    });

    it('should accept sqrt(x)', () => {
      const result = FunctionValidator.validate('sqrt(x)', Difficulty.Medium);
      expect(result.valid).toBe(true);
    });

    it('should reject unknown functions', () => {
      const result = FunctionValidator.validate('foo(x)', Difficulty.Medium);
      expect(result.valid).toBe(false);
    });
  });

  describe('Hard mode', () => {
    it('should reject pure polynomial (no special function)', () => {
      const result = FunctionValidator.validate('x^2 + 1', Difficulty.Hard);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('special function');
    });

    it('should accept expression with sin', () => {
      const result = FunctionValidator.validate('sin(x) + x', Difficulty.Hard);
      expect(result.valid).toBe(true);
    });

    it('should accept expression with sqrt', () => {
      const result = FunctionValidator.validate('sqrt(x) + 1', Difficulty.Hard);
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid syntax', () => {
    it('should reject invalid expression', () => {
      const result = FunctionValidator.validate('+++', Difficulty.Easy);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('syntax');
    });

    it('should reject unknown symbols', () => {
      const result = FunctionValidator.validate('y + 1', Difficulty.Easy);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('y');
    });
  });

  describe('Allowed symbols', () => {
    it('should accept pi', () => {
      const result = FunctionValidator.validate('pi * x', Difficulty.Easy);
      expect(result.valid).toBe(true);
    });

    it('should accept e', () => {
      const result = FunctionValidator.validate('e * x', Difficulty.Easy);
      expect(result.valid).toBe(true);
    });
  });
});
