/**
 * Content interpolation utilities for ZFlo
 * Supports ${expression} syntax for dynamic content
 */

import { EvaluatorFactory } from './evaluator-factory';
import { ExpressionLanguage } from '../types/expression-types';

export interface ContentInterpolationOptions {
  expressionLanguage?: ExpressionLanguage;
  enableLogging?: boolean;
}

export interface InterpolationResult {
  content: string;
  hasInterpolations: boolean;
  errors: string[];
}

/**
 * Content interpolator that processes ${expression} placeholders
 */
export class ContentInterpolator {
  private expressionLanguage: ExpressionLanguage;
  private enableLogging: boolean;
  private evaluators: ReturnType<typeof EvaluatorFactory.getDefaultEvaluators>;

  constructor(options: ContentInterpolationOptions = {}) {
    this.expressionLanguage = options.expressionLanguage ?? 'cel';
    this.enableLogging = options.enableLogging ?? false;
    this.evaluators = EvaluatorFactory.getDefaultEvaluators();
  }

  /**
   * Interpolate expressions in content string
   */
  interpolate(
    content: string,
    state: Record<string, unknown>
  ): InterpolationResult {
    if (!content || typeof content !== 'string') {
      return {
        content: content || '',
        hasInterpolations: false,
        errors: [],
      };
    }

    const errors: string[] = [];
    let hasInterpolations = false;

    // First, handle escaped interpolations by temporarily replacing them
    const escapedPlaceholder = '___ZFLO_ESCAPED_INTERPOLATION___';
    let escapedInterpolations: string[] = [];

    // Replace escaped ${...} with placeholders
    let processedContent = content.replace(
      /\\\$\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g,
      (_match, expression) => {
        escapedInterpolations.push(`\${${expression}}`);
        return `${escapedPlaceholder}${escapedInterpolations.length - 1}`;
      }
    );

    // Match ${...} patterns, supporting nested braces
    const interpolationRegex = /\$\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;

    const interpolatedContent = processedContent.replace(
      interpolationRegex,
      (_match, expression) => {
        hasInterpolations = true;

        try {
          const result = this.evaluateExpression(expression.trim(), state);

          // Handle undefined/null results
          if (result === undefined || result === null) {
            const errorMsg = `Variable "${expression}" is undefined`;
            errors.push(errorMsg);

            if (this.enableLogging) {
              console.warn('ZFlo Content Interpolation Warning:', errorMsg);
            }

            return '';
          }

          return this.formatValue(result);
        } catch (error) {
          const errorMsg = `Failed to interpolate "${expression}": ${
            error instanceof Error ? error.message : String(error)
          }`;

          errors.push(errorMsg);

          if (this.enableLogging) {
            console.warn('ZFlo Content Interpolation Error:', errorMsg);
          }

          // Return empty string for missing variables, original placeholder for syntax errors
          return '';
        }
      }
    );

    // Restore escaped interpolations
    const finalContent = interpolatedContent.replace(
      new RegExp(`${escapedPlaceholder}(\\d+)`, 'g'),
      (match, ...args) => {
        return escapedInterpolations[parseInt(args[0])] || match;
      }
    );

    return {
      content: finalContent,
      hasInterpolations,
      errors,
    };
  }

  /**
   * Check if content contains interpolation expressions
   */
  hasInterpolations(content: string): boolean {
    if (!content || typeof content !== 'string') return false;
    return /\$\{[^}]+\}/.test(content);
  }

  /**
   * Extract all interpolation expressions from content
   */
  extractExpressions(content: string): string[] {
    if (!content || typeof content !== 'string') return [];

    const expressions: string[] = [];
    const interpolationRegex = /\$\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
    let match;

    while ((match = interpolationRegex.exec(content)) !== null) {
      if (!match || !match[1]) {
        continue;
      }
      expressions.push(match[1].trim());
    }

    return expressions;
  }

  /**
   * Validate all expressions in content
   */
  validateExpressions(content: string): { valid: boolean; errors: string[] } {
    const expressions = this.extractExpressions(content);
    const errors: string[] = [];

    for (const expression of expressions) {
      try {
        const evaluator = this.evaluators[this.expressionLanguage];
        if (!evaluator) {
          errors.push(
            `Unsupported expression language: ${this.expressionLanguage}`
          );
          continue;
        }

        // Try to compile the expression to check syntax
        if (evaluator.compile) {
          const result = evaluator.compile(expression, { cache: false });
          if (!result.success && result.error) {
            errors.push(`Invalid expression "${expression}": ${result.error}`);
          }
        }
      } catch (error) {
        errors.push(
          `Expression validation failed for "${expression}": ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Evaluate a single expression
   */
  private evaluateExpression(
    expression: string,
    state: Record<string, unknown>
  ): unknown {
    const evaluator = this.evaluators[this.expressionLanguage];
    if (!evaluator) {
      throw new Error(
        `Unsupported expression language: ${this.expressionLanguage}`
      );
    }

    let evaluationError: Error | undefined;

    const result = evaluator.evaluate(expression, state, {
      onError: (err) => {
        evaluationError = err;
      },
    });

    if (evaluationError) {
      throw evaluationError;
    }

    return result;
  }

  /**
   * Format a value for display in content
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      // Format numbers nicely
      return Number.isInteger(value) ? value.toString() : value.toFixed(2);
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.formatValue(v)).join(', ');
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }

    return String(value);
  }
}

/**
 * Global content interpolator instance for convenience
 */
let globalInterpolator: ContentInterpolator | null = null;

/**
 * Get or create the global content interpolator
 */
export function getContentInterpolator(
  options?: ContentInterpolationOptions
): ContentInterpolator {
  if (!globalInterpolator || options) {
    globalInterpolator = new ContentInterpolator(options);
  }
  return globalInterpolator;
}

/**
 * Convenience function to interpolate content
 */
export function interpolateContent(
  content: string,
  state: Record<string, unknown>,
  options?: ContentInterpolationOptions
): string {
  const interpolator = getContentInterpolator(options);
  const result = interpolator.interpolate(content, state);
  return result.content;
}

/**
 * Convenience function to check if content has interpolations
 */
export function hasContentInterpolations(content: string): boolean {
  const interpolator = getContentInterpolator();
  return interpolator.hasInterpolations(content);
}
