//

import { JSONSchema7 } from 'json-schema';
import { ExpressionLanguage } from './expression-types';

export interface XFFlowMetadata<
  TState extends object = Record<string, unknown>,
> {
  id: string;
  title: string;
  description?: string;
  /**
   * Expression language used for all conditions and rules in this flow.
   * Defaults to 'cel'.
   */
  expressionLanguage?: ExpressionLanguage;
  globalState?: TState;
  /**
   * JSON Schema for validating the globalState structure.
   * When provided, all state changes will be validated against this schema.
   */
  stateSchema?: JSONSchema7;
  stateRules?: StateRule[];
  autoAdvance?: AutoAdvanceMode;
  metadata?: Record<string, unknown>;
}

export interface ZFFlow<TState extends object = Record<string, unknown>>
  extends XFFlowMetadata<TState> {
  nodes: ZFNode[];
  startNodeId: string;
}

export type AutoAdvanceMode = 'always' | 'default' | 'never';

export type NodeType = 'start' | 'action' | 'decision' | 'end' | 'isolated';

export interface ZFNode {
  id: string;
  title: string;
  content?: string;
  /**
   * Operations to perform when this node is entered
   */
  actions?: StateAction[];
  outlets?: XFOutlet[];
  isAutoAdvance?: boolean;
  metadata?: Record<string, unknown>;
}

export interface XFOutlet {
  id: string;
  to: string;
  label?: string;
  condition?: string;
  /**
   * Operations to perform when this outlet is traversed
   */
  actions?: StateAction[];
  metadata?: Record<string, unknown>;
}

export interface StateAction {
  type: 'set';
  target: string;
  value?: unknown;
  expression?: string;
}

export interface StateCondition {
  expression: string;
  targetEdge?: string;
}

export interface StateRule {
  condition: string;
  action: 'forceTransition' | 'setState' | 'triggerEvent';
  target?: string;
  value?: unknown;
}
