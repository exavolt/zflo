//

import { JSONSchema7 } from 'json-schema';
import { ExpressionLanguage } from './expression-types';

// ===== DEFINITION TYPES (Immutable, Serializable) =====

export interface FlowMetadataBase {
  id: string;
  title: string;
  description?: string;
  version?: string;
  metadata?: Record<string, unknown>;
}

export interface FlowStateConfiguration<
  TState extends object = Record<string, unknown>,
> {
  initialState?: TState;
  stateSchema?: JSONSchema7;
  stateRules?: StateRule[];
}

export interface FlowExecutionConfiguration {
  expressionLanguage?: ExpressionLanguage;
  autoAdvanceMode?: AutoAdvanceMode;
}

export interface FlowMetadata<TState extends object = Record<string, unknown>>
  extends FlowMetadataBase,
    FlowStateConfiguration<TState>,
    FlowExecutionConfiguration {}

/**
 * Complete flow definition - immutable blueprint of a flow
 */
export interface FlowDefinition<TState extends object = Record<string, unknown>>
  extends FlowMetadata<TState> {
  // Flow structure
  nodes: NodeDefinition[];
  startNodeId: string;
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
