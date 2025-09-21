//

import { JSONSchema7 } from 'json-schema';
import { ExpressionLanguage } from './expression-types';
import {
  AutoAdvanceMode,
  NodeType,
  StateAction,
  StateRule,
  ZFNode,
} from './flow-types';

export interface ExecutionResult<
  TState extends object = Record<string, unknown>,
> {
  node: AnnotatedNode;
  choices: Choice[];
  isComplete: boolean;
  canGoBack: boolean;
  autoAdvanced?: boolean;
  state: TState;
}

export interface Choice {
  id: string;
  label: string;
  description?: string;
  outletId: string;
  disabled?: boolean;
  disabledReason?: string;
  metadata?: Record<string, unknown>;
}

export interface AnnotatedNode {
  node: ZFNode;
  type: NodeType;
}

export interface ExecutionStep<
  TState extends object = Record<string, unknown>,
> {
  node: AnnotatedNode;
  choice?: string;
  timestamp: Date;
  state: TState;
}

export interface EngineOptions<
  TState extends object = Record<string, unknown>,
> {
  initialState?: Partial<TState>;
  enableHistory?: boolean;
  maxHistorySize?: number;
  autoSave?: boolean;
  autoAdvance?: AutoAdvanceMode;
  showDisabledChoices?: boolean;
  enableLogging?: boolean;
  stateManager?: IStateManager<TState>;
}

export type EngineEvent =
  | 'nodeEnter'
  | 'nodeExit'
  | 'stateChange'
  | 'autoAdvance'
  | 'complete'
  | 'error';

export interface EngineEventData<
  TState extends object = Record<string, unknown>,
> {
  nodeEnter: { node: ZFNode; state: TState };
  nodeExit: {
    node: ZFNode;
    choice?: string;
    state: TState;
  };
  stateChange: {
    oldState: TState;
    newState: TState;
  };
  autoAdvance: { from: ZFNode; to: ZFNode; condition: string };
  complete: {
    history: ExecutionStep<TState>[];
    finalState: TState;
  };
  error: { error: Error; context: unknown };
}

/**
 * Interface for state management with dependency injection support.
 * Generic type T represents the state shape (must be object-like).
 */
export interface StateManagerOptions {
  expressionLanguage?: ExpressionLanguage;
  stateSchema?: JSONSchema7;
  validateOnChange?: boolean;
}

export interface IStateManager<
  TState extends object = Record<string, unknown>,
> {
  /**
   * Get the current state
   */
  getState(): TState;

  /**
   * Update the state with new values
   */
  setState(newState: Partial<TState>): void;

  /**
   * Execute state actions
   */
  executeActions(actions: StateAction[]): void;

  /**
   * Evaluate a condition expression against the current state
   */
  evaluateCondition(expression: string): boolean;

  /**
   * Reset the state to a new initial state
   */
  reset(newState?: Partial<TState>): void;

  /**
   * Event emitter methods for state change notifications
   */
  on(
    event: 'stateChange',
    listener: (data: { oldState: TState; newState: TState }) => void
  ): this;
  on(
    event: 'error',
    listener: (data: {
      error: Error;
      context?: { type: string; rule?: StateRule };
    }) => void
  ): this;
  off(event: string, listener: (...args: unknown[]) => void): this;
  emit(event: string, ...args: unknown[]): boolean;
}
