import { EventEmitter } from 'eventemitter3';
import type { JSONSchema7 } from 'json-schema';
import { ExpressionEvaluator } from './expression-evaluator';
import { StateAction, StateRule } from '../types/flow-types';
import { ExpressionLanguage } from '../types/expression-types';
import { IStateManager, StateManagerOptions } from '../types/execution-types';
import { StateActionExecutor } from '../utils/state-executor';
import {
  globalSchemaValidator,
  SchemaValidator,
} from '../utils/schema-validator';
import { EvaluatorFactory } from '../utils/evaluator-factory';

export class StateManager<TState extends object = Record<string, unknown>>
  extends EventEmitter
  implements IStateManager<TState>
{
  private state: TState;
  private rules: StateRule[];
  private expressionLanguage: ExpressionLanguage;
  private evaluators: Record<string, ExpressionEvaluator>;
  private stateSchema: JSONSchema7 | undefined;
  private schemaValidator: SchemaValidator;
  private validateOnChange: boolean;
  private actionExecutor: StateActionExecutor<TState>;

  constructor(
    initialState: TState = {} as TState,
    rules: StateRule[] = [],
    options: StateManagerOptions = {}
  ) {
    super();
    this.rules = rules;
    this.expressionLanguage = options.expressionLanguage ?? 'cel';
    this.evaluators = EvaluatorFactory.getDefaultEvaluators();
    this.stateSchema = options.stateSchema;
    this.schemaValidator = globalSchemaValidator;
    this.validateOnChange = options.validateOnChange ?? true;

    // Validate and set initial state
    this.validateState(initialState, 'Initial state validation failed');
    this.state = { ...initialState };

    // Initialize shared action executor
    this.actionExecutor = new StateActionExecutor<TState>({
      expressionLanguage: this.expressionLanguage,
      evaluators: this.evaluators,
      enableLogging: true,
    });
  }

  getState(): TState {
    // Deep clone the state to avoid reference sharing for arrays/objects
    return JSON.parse(JSON.stringify(this.state)) as TState;
  }

  setState(newState: Partial<TState>): void {
    // Deep clone the state to avoid reference sharing for arrays/objects
    const oldState = JSON.parse(JSON.stringify(this.state)) as TState;
    const updatedState = { ...this.state, ...newState } as TState;

    // Validate new state if schema is provided
    this.validateState(updatedState, 'State update validation failed');

    this.state = updatedState;
    this.emit('stateChange', { oldState, newState: this.getState() });
    this.evaluateRules();
  }

  executeActions(actions: StateAction[]): void {
    // Deep clone the state to avoid reference sharing for arrays/objects
    const oldState = JSON.parse(JSON.stringify(this.state)) as TState;

    const result = this.actionExecutor.executeActions(actions, this.state);
    const newState = result.newState;

    // Validate new state if schema is provided
    this.validateState(newState, 'Action execution validation failed');

    this.state = newState;

    this.emit('stateChange', { oldState, newState: this.getState() });
    this.evaluateRules();
  }

  evaluateCondition(expression: string): boolean {
    return this.actionExecutor.evaluateCondition(expression, this.state);
  }

  private evaluateRules(): void {
    for (const rule of this.rules) {
      if (this.evaluateCondition(rule.condition)) {
        this.executeRule(rule);
      }
    }
  }

  private executeRule(rule: StateRule): void {
    switch (rule.action) {
      case 'forceTransition':
        this.emit('error', {
          error: new Error(`Force transition to ${rule.target}`),
          context: { rule, type: 'forceTransition' },
        });
        break;

      case 'setState':
        if (rule.target && rule.value !== undefined) {
          // Use the shared executor for state setting
          const result = this.actionExecutor.executeAction(
            { type: 'set', target: rule.target, value: rule.value },
            this.state
          );
          if (result.success) {
            this.state = result.newState;
          }
        }
        break;

      case 'triggerEvent':
        // Custom event handling can be implemented here
        break;
    }
  }

  reset(newState: Partial<TState> = {} as Partial<TState>): void {
    // Deep clone the old state to avoid reference sharing for arrays/objects
    const oldState = JSON.parse(JSON.stringify(this.state)) as TState;
    // Deep clone the new state to avoid reference sharing for arrays/objects
    const resetState = JSON.parse(JSON.stringify(newState)) as TState;

    // Validate new state if schema is provided
    this.validateState(resetState, 'State reset validation failed');

    this.state = resetState;
    this.emit('stateChange', { oldState, newState: this.getState() });
    this.evaluateRules();
  }

  /**
   * Validate state against the JSON schema if one is provided
   */
  private validateState(state: unknown, errorPrefix: string): void {
    if (!this.stateSchema || !this.validateOnChange) {
      return;
    }

    try {
      const result = this.schemaValidator.validate(state, this.stateSchema);

      if (!result.isValid) {
        const error = new Error(`${errorPrefix}: ${result.errors.join(', ')}`);
        this.emit('error', {
          error,
          context: { type: 'schemaValidation', errors: result.errors },
        });
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw validation errors
        throw error;
      }

      // Handle unexpected errors
      const validationError = new Error(
        `${errorPrefix}: Unexpected validation error`
      );
      this.emit('error', {
        error: validationError,
        context: { type: 'schemaValidation', originalError: error },
      });
      throw validationError;
    }
  }
}
