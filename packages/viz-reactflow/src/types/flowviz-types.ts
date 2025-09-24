import type { Node } from '@xyflow/react';
import type { NodeType, NodeDefinition } from '@zflo/core';
import type { FullVizProps } from '@zflo/api-viz';

export interface FlowVizNode extends Node {
  data: {
    xfNode: NodeDefinition;
    nodeType?: NodeType;
    isCurrentNode: boolean;
    isTraversed: boolean;
    truncatedContent?: string;
  };
}

export interface FlowVizEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  data?: {
    outletId: string;
    label?: string;
    isTraversed: boolean;
  };
}

export interface FlowVizProps extends FullVizProps {
  /** React Flow specific options */
  reactFlowOptions?: {
    /** Connection mode */
    connectionMode?: 'strict' | 'loose';
    /** Minimum zoom level */
    minZoom?: number;
    /** Maximum zoom level */
    maxZoom?: number;
    /** Default viewport */
    defaultViewport?: { x: number; y: number; zoom: number };
  };
}

export interface FlowLayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacing: number;
  rankSpacing: number;
}

export interface FlowVizTheme {
  node: {
    default: {
      background: string;
      border: string;
      color: string;
    };
    current: {
      background: string;
      border: string;
      color: string;
      shadow: string;
    };
    traversed: {
      background: string;
      border: string;
      color: string;
    };
  };
  edge: {
    default: {
      stroke: string;
      strokeWidth: number;
    };
    traversed: {
      stroke: string;
      strokeWidth: number;
    };
  };
}
