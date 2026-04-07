import { parse, type MathNode } from 'mathjs';
import { Difficulty } from '../config';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// math.js function names considered "special" for Hard mode
const SPECIAL_FUNCTIONS = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs']);

// Allowed identifiers across all difficulties (the variable + constants)
const ALLOWED_SYMBOLS = new Set(['x', 'pi', 'e']);

/**
 * Validates user-input expressions based on the selected difficulty level.
 *
 * - Easy: polynomials only (operators + numbers + x)
 * - Medium: polynomials + trig/log/sqrt
 * - Hard: MUST contain at least one special function
 */
export class FunctionValidator {
  static validate(expression: string, difficulty: Difficulty): ValidationResult {
    let node: MathNode;
    try {
      node = parse(expression);
    } catch {
      return { valid: false, error: 'Invalid expression syntax.' };
    }

    const usedFunctions = new Set<string>();
    const errors: string[] = [];

    this.walkNode(node, difficulty, usedFunctions, errors);

    if (errors.length > 0) {
      return { valid: false, error: errors[0] };
    }

    // Hard mode: must contain at least one special function
    if (difficulty === Difficulty.Hard) {
      const hasSpecial = [...usedFunctions].some((fn) => SPECIAL_FUNCTIONS.has(fn));
      if (!hasSpecial) {
        return {
          valid: false,
          error:
            'Hard mode requires at least one special function (sin, cos, tan, log, ln, sqrt, abs).',
        };
      }
    }

    return { valid: true };
  }

  private static walkNode(
    node: MathNode,
    difficulty: Difficulty,
    usedFunctions: Set<string>,
    errors: string[],
  ): void {
    switch (node.type) {
      case 'ConstantNode':
      case 'ParenthesisNode':
        break;

      case 'SymbolNode': {
        const name = (node as MathNode & { name: string }).name;
        if (!ALLOWED_SYMBOLS.has(name)) {
          errors.push(`Unknown symbol: "${name}".`);
        }
        break;
      }

      case 'OperatorNode': {
        const op = (node as MathNode & { op: string }).op;
        const allowedOps = ['+', '-', '*', '/', '^'];
        if (!allowedOps.includes(op)) {
          errors.push(`Operator "${op}" is not allowed.`);
        }
        break;
      }

      case 'FunctionNode': {
        const fnNode = node as MathNode & { fn: { name: string }; args: MathNode[] };
        const fnName = fnNode.fn.name;
        usedFunctions.add(fnName);

        if (difficulty === Difficulty.Easy) {
          errors.push(`Easy mode only allows polynomials. Function "${fnName}" is not permitted.`);
        } else if (!SPECIAL_FUNCTIONS.has(fnName)) {
          errors.push(`Function "${fnName}" is not allowed.`);
        }

        // Only recurse into args — skip the fn SymbolNode to avoid false "Unknown symbol" errors
        for (const arg of fnNode.args) {
          this.walkNode(arg, difficulty, usedFunctions, errors);
        }
        return;
      }

      default:
        break;
    }

    // Recurse into children
    node.forEach((child: MathNode) => {
      this.walkNode(child, difficulty, usedFunctions, errors);
    });
  }
}
