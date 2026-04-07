import { parse, evaluate, type MathNode } from 'mathjs';

/**
 * Wrapper around math.js for parsing and evaluating user-input expressions.
 * All expressions are sandboxed — no access to window, eval, etc.
 */
export class FunctionParser {
  /**
   * Parse an expression string into a math.js node tree.
   * Returns null if the expression is invalid.
   */
  static parse(expression: string): MathNode | null {
    try {
      return parse(expression);
    } catch {
      return null;
    }
  }

  /**
   * Evaluate a parsed expression at a given x value.
   * Returns undefined if the result is not a finite number.
   */
  static evaluate(expression: string, x: number): number | undefined {
    try {
      const result = evaluate(expression, { x }) as unknown;
      if (typeof result === 'number' && Number.isFinite(result)) {
        return result;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Create a reusable evaluator function for a given expression.
   * The returned function takes x and returns y (or undefined on error).
   */
  static createEvaluator(expression: string): (x: number) => number | undefined {
    const node = this.parse(expression);
    if (!node) {
      return () => undefined;
    }

    const compiled = node.compile();

    return (x: number): number | undefined => {
      try {
        const result = compiled.evaluate({ x }) as unknown;
        if (typeof result === 'number' && Number.isFinite(result)) {
          return result;
        }
        return undefined;
      } catch {
        return undefined;
      }
    };
  }

  /**
   * Create a translated evaluator: f(x) is offset so that the function
   * always passes through the player's position (ox, oy).
   *
   * Given user input g(x), the translated function is:
   *   y = g(x - ox) - g(0) + oy
   *
   * This guarantees the curve goes through the player position regardless
   * of any constant term in g(x) (e.g. g(x)=5 → flat line through player).
   */
  static createTranslatedEvaluator(
    expression: string,
    originX: number,
    originY: number,
  ): (x: number) => number | undefined {
    const baseFn = this.createEvaluator(expression);

    // Evaluate f(0) once for normalization
    const f0 = baseFn(0);

    return (x: number): number | undefined => {
      const localX = x - originX;
      const localY = baseFn(localX);
      if (localY === undefined) return undefined;
      // Subtract f(0) so that at x=originX: localX=0 → f(0)-f(0)+oy = oy
      if (f0 !== undefined) {
        return localY - f0 + originY;
      }
      return localY + originY;
    };
  }
}
