import { parse, evaluate, Failure, Success } from 'cel-js';
import { ExpressionEngine } from '../types/expression-types';

/**
 * An implementation of the ExpressionEngine interface that uses the CEL (Common Expression Language).
 * It also handles the `${...}` string interpolation format that is specific to the CEL implementation.
 */
export class CelExpressionEngine implements ExpressionEngine {
  private cache: Map<string, Success['cst']> = new Map();

  async evaluateCondition(
    expression: string,
    context: object
  ): Promise<boolean> {
    const result = this.evaluate(expression, context);
    return !!result;
  }

  async evaluateExpression(expression: string, context: object): Promise<any> {
    return this.evaluate(expression, context);
  }

  async interpolate(template: string, context: object): Promise<string> {
    if (!template || typeof template !== 'string') {
      return template || '';
    }

    const interpolationRegex = /\${([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;

    const interpolatedContent = template.replace(
      interpolationRegex,
      (_match, expression) => {
        try {
          const result = this.evaluate(expression.trim(), context);

          if (result === undefined || result === null) {
            return ''; // Replace undefined/null with empty string
          }

          return this.formatValue(result);
        } catch (error) {
          // In case of an error, return an empty string.
          return '';
        }
      }
    );

    return interpolatedContent;
  }

  private evaluate(expression: string, context: unknown): unknown {
    if (!expression || typeof expression !== 'string') return undefined;

    try {
      let cst = this.cache.get(expression);
      if (!cst) {
        const parsed = parse(expression);
        if (parsed.isSuccess) {
          cst = parsed.cst;
          this.cache.set(expression, cst);
        } else {
          throw new Error((parsed as Failure).errors.join(', '));
        }
      }

      const result = evaluate(
        cst,
        context && typeof context === 'object'
          ? { ...(context as Record<string, unknown>) }
          : {}
      );

      return result;
    } catch (err) {
      // Propagate the error for the caller to handle.
      throw err;
    }
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
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

  clearCache(): void {
    this.cache.clear();
  }
}
