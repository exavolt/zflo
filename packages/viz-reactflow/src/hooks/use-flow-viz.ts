import { useMemo } from 'react';
import type { FlowDefinition, ExecutionStep } from '@zflo/core';
import { convertFlowToReactFlow, getTraversedPath } from '../utils/flow-layout';
import type { FlowVizNode, FlowVizEdge } from '../types/flowviz-types';
import type { DagreLayoutOptions } from '../utils/dagre-layout';

export interface UseFlowVizOptions {
  maxContentLength?: number;
  layoutOptions?: Partial<DagreLayoutOptions>;
}

export interface UseFlowVizReturn {
  nodes: FlowVizNode[];
  edges: FlowVizEdge[];
  traversedNodeIds: Set<string>;
  traversedEdgeIds: Set<string>;
}

/**
 * Hook to convert ZFlo FlowDefinition to React Flow format with visualization enhancements
 */
export function useFlowViz(
  flow: FlowDefinition,
  currentNodeId?: string,
  history: ExecutionStep[] = [],
  options: UseFlowVizOptions = {}
): UseFlowVizReturn {
  const { maxContentLength = 100, layoutOptions = {} } = options;

  const defaultLayoutOptions: DagreLayoutOptions = {
    direction: 'TB',
    nodeSpacing: 150,
    rankSpacing: 200,
    ...layoutOptions,
  };

  const { nodes, edges } = useMemo(() => {
    return convertFlowToReactFlow(
      flow,
      currentNodeId,
      history,
      maxContentLength,
      defaultLayoutOptions
    );
  }, [flow, currentNodeId, history, maxContentLength, defaultLayoutOptions]);

  const { nodeIds: traversedNodeIds, edgeIds: traversedEdgeIds } =
    useMemo(() => {
      return getTraversedPath(history);
    }, [history]);

  return {
    nodes,
    edges,
    traversedNodeIds,
    traversedEdgeIds,
  };
}
