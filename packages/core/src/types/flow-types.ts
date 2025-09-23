//

import { JSONSchema7 } from 'json-schema';
import { ExpressionLanguage } from './expression-types';

// ===== DEFINITION TYPES (Immutable, Serializable) =====

/**
 * Complete flow definition - immutable blueprint of a flow
 */
export interface FlowDefinition<
  TState extends object = Record<string, unknown>,
> {
  id: string;
  title: string;
  description?: string;
  version?: string;
  metadata?: Record<string, unknown>;

  // Flow structure
  nodes: NodeDefinition[];
  startNodeId: string;

  // State configuration
  initialState?: TState;
  stateSchema?: JSONSchema7;
  stateRules?: StateRule[];

  // Execution configuration
  expressionLanguage?: ExpressionLanguage;
  autoAdvanceMode?: AutoAdvanceMode;
}

/**
 * Node definition - immutable blueprint of a node
 */
export interface NodeDefinition {
  id: string;
  title: string;
  content?: string;
  metadata?: Record<string, unknown>;

  // Behavior definitions
  actions?: StateAction[];
  outlets?: OutletDefinition[];

  // Node-specific configuration
  autoAdvance?: boolean;
}

/**
 * Outlet definition - immutable blueprint of a path/edge
 */
export interface OutletDefinition {
  id: string;
  to: string;
  label?: string;
  condition?: string;
  actions?: StateAction[];
  metadata?: Record<string, unknown>;
}

// ===== CONFIGURATION TYPES =====

export type AutoAdvanceMode = 'always' | 'default' | 'never';

export type NodeType = 'start' | 'action' | 'decision' | 'end' | 'isolated';

export interface StateAction {
  type: 'set';
  target: string;
  value?: unknown;
  expression?: string;
}

export interface StateRule {
  condition: string;
  action: 'forceTransition' | 'setState' | 'triggerEvent';
  target?: string;
  value?: unknown;
}

// ===== LEGACY TYPE ALIASES (for gradual migration) =====
// TODO: Remove these once all consumers are updated

/** @deprecated Use FlowDefinition instead */
export type ZFFlow<TState extends object = Record<string, unknown>> =
  FlowDefinition<TState>;

/** @deprecated Use NodeDefinition instead */
export type ZFNode = NodeDefinition;

/** @deprecated Use OutletDefinition instead */
export type XFOutlet = OutletDefinition;

/** @deprecated Use FlowDefinition instead */
export type XFFlowMetadata<TState extends object = Record<string, unknown>> =
  Omit<FlowDefinition<TState>, 'nodes' | 'startNodeId'>;
