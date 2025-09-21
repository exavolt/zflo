import { parse, evaluate, Failure, Success } from 'cel-js';
import type {
  ExpressionEvaluator,
  ExpressionEvaluationOptions,
  ExpressionCompilationOptions,
  ExpressionCompilationResult,
} from './expression-evaluator';

type CstType = Success['cst'];

/**
 * CelEvaluator compiles and evaluates CEL expressions against a state context.
 * It caches compiled runtimes per expression for performance.
 */
export class CelEvaluator implements ExpressionEvaluator {
  private cache: Map<string, CstType> = new Map();

  compile(
    expression: string,
    options?: ExpressionCompilationOptions
  ): ExpressionCompilationResult {
    const parsed = parse(expression);
    if (parsed.isSuccess && options?.cache) {
      this.cache.set(expression, parsed.cst);
    }
    return {
      success: parsed.isSuccess,
      error: !parsed.isSuccess
        ? (parsed as Failure).errors.join(', ')
        : undefined,
    };
  }

  evaluate(
    expression: string,
    context: unknown,
    { onError }: ExpressionEvaluationOptions = { onError: undefined }
  ): unknown {
    if (!expression || typeof expression !== 'string') return undefined;

    try {
      let cst = this.cache.get(expression);
      if (!cst) {
        const parsed = parse(expression);
        if (parsed.isSuccess) {
          cst = parsed.cst;
          this.cache.set(expression, cst);
        } else {
          onError?.(new Error((parsed as Failure).errors.join(', ')));
          return undefined;
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
      // Any evaluation failure is a false condition.
      // Callers can decide how to log/report.
      onError?.(err instanceof Error ? err : new Error(err as string));
      return undefined;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}
