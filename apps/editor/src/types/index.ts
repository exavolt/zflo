import type { StateAction, FlowMetadata } from '@zflo/core';
import { Node, Edge } from '@xyflow/react';

export interface NodeData {
  title: string;
  content: string;
  autoAdvance?: boolean;
  outputCount: number;
  outlets?: NodeOutlet[];
  actions?: StateAction[];
}

export interface NodeOutlet {
  id: string;
  label: string;
  condition?: string;
  actions?: StateAction[];
}

export interface EditorData {
  nodes: Node[];
  edges: Edge[];
  flowTitle: string;
  nodeIdCounter: number;
  edgeIdCounter: number;
  flowMetadata: FlowMetadata;
}
