//

import { ExpressionEvaluator } from '../core/expression-evaluator';
import { EvaluatorFactory } from './evaluator-factory';
import {
  createStateActionError,
  createConditionEvaluationError,
} from './error-handler';
import { ExpressionLanguage } from '../types/expression-types';
import { StateAction } from '../types/flow-types';

export interface StateExecutorOptions {
  expressionLanguage?: ExpressionLanguage;
  evaluators?: Record<string, ExpressionEvaluator>;
  enableLogging?: boolean;
}

export interface StateExecutionResult<
  TState extends object = Record<string, unknown>,
> {
  success: boolean;
  newState: TState;
  errors: string[];
}

/**
 * Shared state action executor that eliminates duplication between
 * StateManager and PathTester action execution logic.
 */
export class StateActionExecutor<
  TState extends object = Record<string, unknown>,
> {
  private evaluators: Record<string, ExpressionEvaluator>;
  private expressionLanguage: ExpressionLanguage;
  private enableLogging: boolean;

  constructor(options: StateExecutorOptions = {}) {
    this.expressionLanguage = options.expressionLanguage ?? 'cel';
    this.enableLogging = options.enableLogging ?? false;
    this.evaluators =
      options.evaluators ?? EvaluatorFactory.getDefaultEvaluators();
  }

  /**
   * Execute a single state action on the provided state
   */
  executeAction(
    action: StateAction,
    state: TState
  ): StateExecutionResult<TState> {
    const newState = { ...state };
    const errors: string[] = [];

    try {
      const { type, target, value, expression } = action;

      switch (type) {
        case 'set':
          if (expression) {
            const evaluatedValue = this.evaluateExpression(
              expression,
              newState
            );
            this.setNestedValue(newState, target, evaluatedValue);
            if (this.enableLogging) {
              console.log(`Setting ${target} to ${evaluatedValue}.`);
            }
          } else {
            this.setNestedValue(newState, target, value);
          }
          break;

        default:
          throw new Error(`Unknown action type: ${type}`);
      }

      return {
        success: true,
        newState,
        errors,
      };
    } catch (error) {
      const flowError = createStateActionError(
        `${action.type}:${action.target}`,
        error instanceof Error ? error : undefined
      );
      errors.push(flowError.message);

      return {
        success: false,
        newState: state, // Return original state on error
        errors,
      };
    }
  }

  /**
   * Execute multiple state actions in sequence
   */
  executeActions(
    actions: StateAction[],
    initialState: TState
  ): StateExecutionResult<TState> {
    let currentState = { ...initialState };
    const allErrors: string[] = [];

    for (const action of actions) {
      const result = this.executeAction(action, currentState);

      if (result.success) {
        currentState = result.newState;
      } else {
        allErrors.push(...result.errors);
        // Continue with other actions even if one fails
      }
    }

    return {
      success: allErrors.length === 0,
      newState: currentState,
      errors: allErrors,
    };
  }

  /**
   * Evaluate a condition expression
   */
  evaluateCondition(expression: string, state: TState): boolean {
    try {
      const expr = (expression || '').trim();
      if (!expr) return true;

      const evaluator = this.evaluators[this.expressionLanguage];
      if (!evaluator) {
        throw new Error(
          `Unsupported expression language: ${this.expressionLanguage}`
        );
      }

      const result = evaluator.evaluate(expr, state);

      if (typeof result === 'boolean') {
        return result;
      }

      if (this.enableLogging) {
        console.warn(
          `Condition ${expr} evaluated to ${result}`,
          'Expected boolean result'
        );
      }

      return false;
    } catch (error) {
      const flowError = createConditionEvaluationError(
        expression,
        error instanceof Error ? error : undefined
      );

      if (this.enableLogging) {
        console.warn('Flow Condition Evaluation Error:', flowError);
      }
      return false;
    }
  }

  /**
   * Evaluate an expression and return the result
   */
  private evaluateExpression(expression: string, state: TState): unknown {
    let evalError: Error | undefined;

    const evaluator = this.evaluators[this.expressionLanguage];
    if (!evaluator) {
      throw new Error(
        `Unsupported expression language: ${this.expressionLanguage}`
      );
    }

    const value = evaluator.evaluate(expression, state, {
      onError: (err) => {
        evalError = err;
      },
    });

    if (evalError) {
      throw evalError;
    }

    return value;
  }

  /**
   * Set nested value in state using dot notation
   */
  private setNestedValue(state: TState, path: string, value: unknown): void {
    if (!(typeof state === 'object' && state !== null)) {
      throw new Error('State must be an object');
    }

    const keys = path.split('.');
    const lastKey = keys.pop();

    if (!lastKey) {
      throw new Error(`Invalid path: ${path}`);
    }

    const target = keys.reduce(
      (obj: Record<string, unknown>, key: string) => {
        if (!(key in obj)) obj[key] = {};
        const prop = obj[key];

        if (!prop) {
          throw new Error(`Invalid path: ${path}`);
        }

        if (typeof prop !== 'object') {
          throw new Error(`Invalid path: ${path}`);
        }

        return prop as Record<string, unknown>;
      },
      state as Record<string, unknown>
    );

    target[lastKey] = value;
  }
}

/**
 * Create a default state action executor
 */
export function createStateExecutor(
  options: StateExecutorOptions = {}
): StateActionExecutor {
  return new StateActionExecutor(options);
}

/**
 * Utility function to execute actions on state
 */
export function executeStateActions<
  TState extends object = Record<string, unknown>,
>(
  actions: StateAction[],
  state: TState,
  options: StateExecutorOptions = {}
): StateExecutionResult<TState> {
  const executor = new StateActionExecutor<TState>(options);
  return executor.executeActions(actions, state);
}

/**
 * Utility function to evaluate a condition
 */
export function evaluateCondition<
  TState extends object = Record<string, unknown>,
>(
  expression: string,
  state: TState,
  options: StateExecutorOptions = {}
): boolean {
  const executor = new StateActionExecutor<TState>(options);
  return executor.evaluateCondition(expression, state);
}
