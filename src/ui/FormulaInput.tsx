import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { FunctionParser } from '../math/FunctionParser';
import { FunctionValidator, type ValidationResult } from '../math/FunctionValidator';
import type { Difficulty } from '../config';
import { useDebounceValue } from '../common/hooks';

interface FormulaInputProps {
  difficulty: Difficulty;
  onSubmit: (expression: string) => void;
  onMove?: (expression: string) => void;
  onDirectionToggle?: () => void;
  onChange?: (expression: string, valid: boolean) => void;
  disabled?: boolean;
  canMove?: boolean;
  placeholder?: string;
}

/**
 * Text input for math expressions with real-time validation and KaTeX preview.
 */
export function FormulaInput({
  difficulty,
  onSubmit,
  onMove,
  onDirectionToggle,
  onChange,
  disabled = false,
  canMove = false,
  placeholder,
}: FormulaInputProps) {
  const { t } = useTranslation();
  const [expression, setExpression] = useState('');
  const [debouncedExpr] = useDebounceValue(expression, 150);
  const [validation, setValidation] = useState<ValidationResult>({ valid: true });
  const katexRef = useRef<HTMLDivElement>(null);

  // Validate on each keystroke
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setExpression(value);

      if (value.trim() === '') {
        setValidation({ valid: true });
        onChange?.(value, false);
        return;
      }

      // Check parse-ability first
      const node = FunctionParser.parse(value);
      if (!node) {
        setValidation({ valid: false, error: t('validation.parseError') });
        onChange?.(value, false);
        return;
      }

      // Validate against difficulty
      const result = FunctionValidator.validate(value, difficulty);
      setValidation(result);
      onChange?.(value, result.valid);
    },
    [difficulty, onChange, t],
  );

  // Render KaTeX preview (debounced to avoid thrashing during fast typing)
  useEffect(() => {
    if (!katexRef.current) return;

    if (debouncedExpr.trim() === '') {
      katexRef.current.innerHTML = '';
      return;
    }

    try {
      // Convert math.js syntax to rough LaTeX
      const latex = expressionToLatex(debouncedExpr);
      katex.render(`f(x) = ${latex}`, katexRef.current, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      katexRef.current.textContent = debouncedExpr;
    }
  }, [debouncedExpr]);

  const handleSubmit = useCallback(() => {
    if (!validation.valid || expression.trim() === '') return;
    onSubmit(expression.trim());
    setExpression('');
  }, [expression, validation, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        onDirectionToggle?.();
        return;
      }
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        if (canMove && validation.valid && expression.trim() !== '') {
          onMove?.(expression.trim());
          setExpression('');
        }
        return;
      }
      if (e.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit, onMove, onDirectionToggle, canMove, validation, expression],
  );

  const hasError = !validation.valid && !!validation.error;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor="formula" className="text-sm font-semibold whitespace-nowrap">
          {t('formula.label')}
        </label>
        <input
          id="formula"
          type="text"
          value={expression}
          autoFocus
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || t('formula.placeholder')}
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
          className="flex-1 px-2.5 py-1 text-sm font-mono bg-surface-input text-text-primary border border-border-input rounded outline-none focus:border-accent"
          title={hasError ? validation.error : undefined}
        />
      </div>
      {hasError && (
        <span className="text-xs text-danger pl-[3.25rem]">{validation.error}</span>
      )}
      {!hasError && debouncedExpr.trim() !== '' && (
        <div className="text-sm pl-[3.25rem]" ref={katexRef} />
      )}
    </div>
  );
}

/**
 * Basic math.js expression → LaTeX converter.
 * Handles common patterns; not exhaustive.
 */
function expressionToLatex(expr: string): string {
  let latex = expr;

  // Replace ** and ^ with LaTeX power
  latex = latex.replace(/\^(\d+)/g, '^{$1}');
  latex = latex.replace(/\^(\([^)]+\))/g, '^{$1}');

  // Replace function names with LaTeX commands
  latex = latex.replace(/\bsin\b/g, '\\sin');
  latex = latex.replace(/\bcos\b/g, '\\cos');
  latex = latex.replace(/\btan\b/g, '\\tan');
  latex = latex.replace(/\bsqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  latex = latex.replace(/\babs\(([^)]+)\)/g, '\\left|$1\\right|');
  latex = latex.replace(/\bln\b/g, '\\ln');
  latex = latex.replace(/\blog\b/g, '\\log');

  // Replace * with \cdot
  latex = latex.replace(/\*/g, ' \\cdot ');

  return latex;
}
