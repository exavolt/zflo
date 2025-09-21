// Main component
export { FlowViz } from './components/flow-viz';

// Custom node and edge components
export { FlowVizNode } from './components/flow-viz-node';
export { FlowVizEdge } from './components/flow-viz-edge';

// Hooks
export { useFlowViz } from './hooks/use-flow-viz';

// Types
export type {
  FlowVizProps,
  FlowVizNode as FlowVizNodeType,
  FlowVizEdge as FlowVizEdgeType,
  FlowLayoutOptions,
  FlowVizTheme,
} from './types/flowviz-types';

export type { DagreLayoutOptions } from './utils/dagre-layout';

// Utilities
export { convertFlowToReactFlow, getTraversedPath } from './utils/flow-layout';

export {
  truncateContent,
  estimateTextWidth,
  calculateNodeDimensions,
} from './utils/content-truncation';

// Re-export useful React Flow types for convenience
export type {
  Node,
  Edge,
  NodeProps,
  EdgeProps,
  ReactFlowInstance,
} from '@xyflow/react';
