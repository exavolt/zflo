//

/**
 * Supported expression languages. Currently 'cel' is the default and recommended.
 */
export type ExpressionLanguage = 'cel' | 'liquid' | undefined;

/**
 * Defines the contract for a pluggable expression and templating engine.
 * This allows ZFlo to support various syntaxes like Liquid, CEL, etc.
 */
export interface ExpressionEngine<TContext extends object = object> {
  /**
   * Evaluates a conditional expression to a boolean value.
   * Used for outlet conditions and state rules.
   * @param expression - The conditional expression to evaluate (e.g., "user.level > 10").
   * @param context - The state object to use as context for the evaluation.
   * @returns A promise that resolves to a boolean result.
   */
  evaluateCondition(expression: string, context: TContext): Promise<boolean>;

  /**
   * Evaluates an expression to compute a new value.
   * Used for 'set' state actions.
   * @param expression - The expression to evaluate (e.g., "user.health + 10").
   * @param context - The state object to use as context for the evaluation.
   * @returns A promise that resolves to the computed value.
   */
  evaluateExpression(expression: string, context: TContext): Promise<any>;

  /**
   * Interpolates a string template with context data.
   * Used for node titles, content, and other dynamic strings.
   * @param template - The template string to process (e.g., "Hello, {{ user.name }}!").
   * @param context - The state object to use as context for the interpolation.
   * @returns A promise that resolves to the final, interpolated string.
   */
  interpolate(template: string, context: TContext): Promise<string>;
}
