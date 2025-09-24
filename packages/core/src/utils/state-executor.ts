import { ExpressionEngine } from '../types/expression-types';
import { StateAction } from '../types/flow-types';
import {
  createStateActionError,
  createConditionEvaluationError,
} from './error-handler';

export interface StateExecutorOptions {
  engine: ExpressionEngine;
  enableLogging?: boolean;
}

export interface StateExecutionResult<
  TState extends object = Record<string, unknown>,
> {
  success: boolean;
  newState: TState;
  errors: string[];
}

export class StateActionExecutor<
  TState extends object = Record<string, unknown>,
> {
  private engine: ExpressionEngine;
  private enableLogging: boolean;

  constructor(options: StateExecutorOptions) {
    this.engine = options.engine;
    this.enableLogging = options.enableLogging ?? false;
  }

  async executeAction(
    action: StateAction,
    state: TState
  ): Promise<StateExecutionResult<TState>> {
    const newState = { ...state };
    const errors: string[] = [];

    try {
      const { type, target, value, expression } = action;

      switch (type) {
        case 'set':
          if (expression) {
            const evaluatedValue = await this.evaluateExpression(
              expression,
              newState
            );
            this.setNestedValue(newState, target, evaluatedValue);
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
        newState: state,
        errors,
      };
    }
  }

  async executeActions(
    actions: StateAction[],
    initialState: TState
  ): Promise<StateExecutionResult<TState>> {
    let currentState = { ...initialState };
    const allErrors: string[] = [];

    for (const action of actions) {
      const result = await this.executeAction(action, currentState);
      if (result.success) {
        currentState = result.newState;
      } else {
        allErrors.push(...result.errors);
      }
    }

    return {
      success: allErrors.length === 0,
      newState: currentState,
      errors: allErrors,
    };
  }

  async evaluateCondition(expression: string, state: TState): Promise<boolean> {
    try {
      const expr = (expression || '').trim();
      if (!expr) return true;
      return await this.engine.evaluateCondition(expr, state);
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

  private async evaluateExpression(
    expression: string,
    state: TState
  ): Promise<unknown> {
    return this.engine.evaluateExpression(expression, state);
  }

  private setNestedValue(state: TState, path: string, value: unknown): void {
    if (!(typeof state === 'object' && state !== null)) {
      throw new Error('State must be an object');
    }
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) {
      throw new Error(`Invalid path: ${path}`);
    }
    const target = keys.reduce((obj: any, key: string) => {
      if (!(key in obj)) obj[key] = {};
      return obj[key];
    }, state);
    target[lastKey] = value;
  }
}
