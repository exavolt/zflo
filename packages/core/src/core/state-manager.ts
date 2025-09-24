import { EventEmitter } from 'eventemitter3';
import type { JSONSchema7 } from 'json-schema';
import { StateAction, StateRule } from '../types/flow-types';
import { ExpressionEngine } from '../types/expression-types';
import { IStateManager, StateManagerOptions } from '../types/execution-types';
import { StateActionExecutor } from '../utils/state-executor';
import {
  globalSchemaValidator,
  SchemaValidator,
} from '../utils/schema-validator';
import { createExpressionEngine } from '../expressions/engine-factory';

export class StateManager<TState extends object = Record<string, unknown>>
  extends EventEmitter
  implements IStateManager<TState>
{
  private state: TState;
  private rules: StateRule[];
  private engine: ExpressionEngine;
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
    this.engine = createExpressionEngine(options.expressionLanguage);
    this.stateSchema = options.stateSchema;
    this.schemaValidator = globalSchemaValidator;
    this.validateOnChange = options.validateOnChange ?? true;

    this.validateState(initialState, 'Initial state validation failed');
    this.state = { ...initialState };

    this.actionExecutor = new StateActionExecutor<TState>({
      engine: this.engine,
      enableLogging: true,
    });
  }

  getState(): TState {
    return JSON.parse(JSON.stringify(this.state));
  }

  async setState(newState: Partial<TState>): Promise<void> {
    const oldState = this.getState();
    const updatedState = { ...this.state, ...newState };

    this.validateState(updatedState, 'State update validation failed');

    this.state = updatedState as TState;
    this.emit('stateChange', { oldState, newState: this.getState() });
    await this.evaluateRules();
  }

  async executeActions(actions: StateAction[]): Promise<void> {
    const oldState = this.getState();
    const result = await this.actionExecutor.executeActions(
      actions,
      this.state
    );

    this.validateState(result.newState, 'Action execution validation failed');

    this.state = result.newState;
    this.emit('stateChange', { oldState, newState: this.getState() });
    await this.evaluateRules();
  }

  async evaluateCondition(expression: string): Promise<boolean> {
    return this.actionExecutor.evaluateCondition(expression, this.state);
  }

  private async evaluateRules(): Promise<void> {
    for (const rule of this.rules) {
      if (await this.evaluateCondition(rule.condition)) {
        await this.executeRule(rule);
      }
    }
  }

  private async executeRule(rule: StateRule): Promise<void> {
    switch (rule.action) {
      case 'forceTransition':
        this.emit('error', {
          error: new Error(`Force transition to ${rule.target}`),
          context: { rule, type: 'forceTransition' },
        });
        break;
      case 'setState':
        if (rule.target && rule.value !== undefined) {
          const result = await this.actionExecutor.executeAction(
            { type: 'set', target: rule.target, value: rule.value },
            this.state
          );
          if (result.success) {
            this.state = result.newState;
          }
        }
        break;
    }
  }

  async reset(newState: Partial<TState> = {}): Promise<void> {
    const oldState = this.getState();
    const resetState = JSON.parse(JSON.stringify(newState));

    this.validateState(resetState, 'State reset validation failed');

    this.state = resetState;
    this.emit('stateChange', { oldState, newState: this.getState() });
    await this.evaluateRules();
  }

  private validateState(state: unknown, errorPrefix: string): void {
    if (!this.stateSchema || !this.validateOnChange) return;

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
      if (error instanceof Error) throw error;
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
