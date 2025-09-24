import { Liquid } from 'liquidjs';
import { ExpressionEngine } from '../types/expression-types';

/**
 * An implementation of the ExpressionEngine interface that uses the Liquid templating engine.
 * It handles conditional evaluation, expression computation, and string interpolation using Liquid syntax.
 */
export class LiquidExpressionEngine implements ExpressionEngine {
  private liquid: Liquid;

  constructor() {
    this.liquid = new Liquid({
      // It's crucial to be strict to catch errors early.
      // `strictVariables` will throw an error if a variable doesn't exist.
      // `strictFilters` will do the same for filters.
      strictVariables: true,
      strictFilters: true,
    });
  }

  /**
   * Evaluates a Liquid expression and coerces the result into a boolean.
   * Liquid's truthiness (only false and nil are falsey) is used.
   */
  async evaluateCondition(
    expression: string,
    context: object
  ): Promise<boolean> {
    try {
      const result = await this.liquid.evalValue(expression, context);
      return !!result;
    } catch (error: any) {
      // Provide a more informative error message.
      throw new Error(
        `Failed to evaluate Liquid condition "${expression}": ${error.message}`
      );
    }
  }

  /**
   * Evaluates a Liquid expression and returns its computed value.
   */
  async evaluateExpression(expression: string, context: object): Promise<any> {
    try {
      return await this.liquid.evalValue(expression, context);
    } catch (error: any) {
      throw new Error(
        `Failed to evaluate Liquid expression "${expression}": ${error.message}`
      );
    }
  }

  /**
   * Renders a template string using Liquid syntax and the provided context.
   */
  async interpolate(template: string, context: object): Promise<string> {
    try {
      return await this.liquid.parseAndRender(template, context);
    } catch (error: any) {
      throw new Error(
        `Failed to interpolate Liquid template "${template}": ${error.message}`
      );
    }
  }
}
