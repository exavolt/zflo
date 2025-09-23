//

import { JSONSchema7 } from 'json-schema';
import { ExpressionLanguage } from './expression-types';
import {
  AutoAdvanceMode,
  NodeType,
  StateAction,
  StateRule,
  FlowDefinition,
  NodeDefinition,
  OutletDefinition,
} from './flow-types';

// ===== RUNTIME TYPES (Mutable, Computed) =====

/**
 * Runtime flow - contains definition plus computed runtime state
 */
export interface RuntimeFlow<TState extends object = Record<string, unknown>> {
  definition: FlowDefinition<TState>;

  // Computed properties (cached)
  nodeTypes: Record<string, NodeType>;
  reachabilityMap: Map<string, Set<string>>;
  nodeMap: Map<string, NodeDefinition>;
  outletMap: Map<string, { outlet: OutletDefinition; fromNodeId: string }>;

  // Runtime state
  currentNodeId: string | null;
  executionHistory: ExecutionStep<TState>[];
  state: TState;
}

/**
 * Runtime node - contains definition plus computed runtime properties
 */
export interface RuntimeNode {
  definition: NodeDefinition;

  // Computed properties
  type: NodeType;
  isReachable: boolean;
  depth: number;

  // Runtime properties (interpolated content, etc.)
  interpolatedTitle?: string;
  interpolatedContent?: string;
}

/**
 * Runtime choice - user-facing choice with computed properties
 */
export interface RuntimeChoice {
  outletId: string;
  label: string;
  description?: string;
  isEnabled: boolean;
  disabledReason?: string;
  metadata?: Record<string, unknown>;
}

// ===== EXECUTION TYPES =====

/**
 * Complete execution context - everything needed for flow execution
 */
export interface ExecutionContext<
  TState extends object = Record<string, unknown>,
> {
  flow: RuntimeFlow<TState>;
  currentNode: RuntimeNode;
  availableChoices: RuntimeChoice[];
  canGoBack: boolean;
  isComplete: boolean;
  autoAdvanced?: boolean;
}

/**
 * Single step in execution history
 */
export interface ExecutionStep<
  TState extends object = Record<string, unknown>,
> {
  nodeId: string;
  choiceId?: string;
  timestamp: Date;
  state: TState;
}

// ===== ENGINE CONFIGURATION =====

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
  nodeEnter: { nodeId: string; node: RuntimeNode; state: TState };
  nodeExit: {
    nodeId: string;
    node: RuntimeNode;
    choiceId?: string;
    state: TState;
  };
  stateChange: {
    oldState: TState;
    newState: TState;
  };
  autoAdvance: {
    from: RuntimeNode;
    to: RuntimeNode;
    condition?: string;
    outletId: string;
  };
  complete: {
    history: ExecutionStep<TState>[];
    finalState: TState;
  };
  error: { error: Error; context: unknown };
}

// ===== STATE MANAGEMENT =====

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

// ===== LEGACY TYPE ALIASES (for gradual migration) =====
// TODO: Remove these once all consumers are updated

/** @deprecated Use ExecutionContext instead */
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

/** @deprecated Use RuntimeChoice instead */
export interface Choice {
  id: string;
  label: string;
  description?: string;
  outletId: string;
  disabled?: boolean;
  disabledReason?: string;
  metadata?: Record<string, unknown>;
}

/** @deprecated Use RuntimeNode instead */
export interface AnnotatedNode {
  node: NodeDefinition;
  type: NodeType;
}
