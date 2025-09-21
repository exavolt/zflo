//

import { ExpressionLanguage } from '../types/expression-types';
import { CelEvaluator } from '../core/cel-evaluator';
import { ExpressionEvaluator } from '../core/expression-evaluator';

/**
 * Factory for creating expression evaluators
 */
export class EvaluatorFactory {
  private static defaultEvaluators: Record<string, ExpressionEvaluator> | null =
    null;

  /**
   * Get the default set of evaluators (singleton pattern for performance)
   */
  static getDefaultEvaluators(): Record<string, ExpressionEvaluator> {
    if (!this.defaultEvaluators) {
      this.defaultEvaluators = {
        cel: new CelEvaluator(),
      };
    }
    return this.defaultEvaluators;
  }

  /**
   * Create evaluators with optional custom ones
   */
  static createEvaluators(
    customEvaluators?: Record<string, ExpressionEvaluator>
  ): Record<string, ExpressionEvaluator> {
    if (customEvaluators) {
      return { ...this.getDefaultEvaluators(), ...customEvaluators };
    }
    return this.getDefaultEvaluators();
  }

  /**
   * Get a specific evaluator by language
   */
  static getEvaluator(
    language: ExpressionLanguage,
    evaluators?: Record<string, ExpressionEvaluator>
  ): ExpressionEvaluator {
    const allEvaluators = evaluators ?? this.getDefaultEvaluators();
    const evaluator = allEvaluators[language];

    if (!evaluator) {
      throw new Error(`No evaluator found for language: ${language}`);
    }

    return evaluator;
  }
}
