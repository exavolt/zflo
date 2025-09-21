//

export interface ExpressionEvaluator {
  /**
   * Compile an expression into a function for evaluation.
   * @param expression The expression to compile.
   * @param options Optional options for the compiler.
   * @returns A compiled function that can be called to evaluate the expression.
   */
  compile(
    expression: string,
    options?: ExpressionCompilationOptions
  ): ExpressionCompilationResult;

  /**
   * Evaluate an expression.
   * @param expression The expression to evaluate.
   * @param context The context to evaluate the expression in.
   * @param options Optional options for the evaluator.
   * @returns The result of the evaluation.
   */
  evaluate(
    expression: string,
    context: unknown,
    options?: ExpressionEvaluationOptions
  ): unknown;

  /**
   * Clear the cache of compiled expressions.
   */
  clearCache?(): void;
}

export interface ExpressionEvaluationOptions {
  /**
   * Callback function to handle evaluation errors.
   *
   * If it is not provided, the error will be thrown as an exception.
   */
  onError?: (error: Error) => void;
}

export interface ExpressionCompilationOptions {
  /**
   * Whether to cache the compiled expression.
   */
  cache?: boolean;
}

export interface ExpressionCompilationResult {
  success: boolean;
  error?: unknown;
}
