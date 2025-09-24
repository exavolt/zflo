import { type ExecutionStep, inferNodeTypes, FlowDefinition } from '@zflo/core';
import type { FlowVizNode, FlowVizEdge } from '../types/flowviz-types';
import { truncateContent, calculateNodeDimensions } from './content-truncation';
import { applyDagreLayout, type DagreLayoutOptions } from './dagre-layout';

/**
 * Converts ZFlo FlowDefinition to React Flow nodes and edges
 */
export function convertFlowToReactFlow(
  flow: FlowDefinition,
  currentNodeId?: string,
  history: ExecutionStep[] = [],
  maxContentLength: number = 100,
  layoutOptions: DagreLayoutOptions = {
    direction: 'TB',
    nodeSpacing: 150,
    rankSpacing: 200,
  }
): { nodes: FlowVizNode[]; edges: FlowVizEdge[] } {
  const traversedNodeIds = new Set(history.map((step) => step.nodeId));
  const traversedEdges = new Set<string>();

  // Build traversed edges from history
  for (let i = 0; i < history.length - 1; i++) {
    const currentStep = history[i];
    const nextStep = history[i + 1];
    if (currentStep && nextStep) {
      const edgeId = `${currentStep.nodeId}-${nextStep?.nodeId}`;
      traversedEdges.add(edgeId);
    }
  }

  const nodeTypes = inferNodeTypes(flow.nodes);

  // Convert nodes (without positioning - will be done by Dagre)
  const nodes: FlowVizNode[] = flow.nodes.map((xfNode) => {
    const isCurrentNode = xfNode.id === currentNodeId;
    const isTraversed = traversedNodeIds.has(xfNode.id);
    const truncatedContent = truncateContent(xfNode.content, maxContentLength);
    const dimensions = calculateNodeDimensions(truncatedContent);

    return {
      id: xfNode.id,
      type: 'flowVizNode',
      position: { x: 0, y: 0 }, // Will be set by Dagre layout
      data: {
        xfNode,
        nodeType: nodeTypes[xfNode.id],
        isCurrentNode,
        isTraversed,
        truncatedContent,
      },
      style: {
        width: dimensions.width,
        height: dimensions.height,
      },
    };
  });

  // Convert edges
  const edges: FlowVizEdge[] = [];

  flow.nodes.forEach((node) => {
    if (node.outlets) {
      node.outlets.forEach((outlet) => {
        const edgeId = `${node.id}-${outlet.to}`;
        const isTraversed = traversedEdges.has(edgeId);

        edges.push({
          id: edgeId,
          source: node.id,
          target: outlet.to,
          type: 'flowVizEdge',
          label: outlet.label || '',
          data: {
            outletId: outlet.id,
            label: outlet.label,
            isTraversed,
          },
        });
      });
    }
  });

  // Apply Dagre layout to position nodes
  const layoutedNodes = applyDagreLayout(nodes, edges, layoutOptions);

  return { nodes: layoutedNodes, edges };
}

/**
 * Finds the traversed path from history
 */
export function getTraversedPath(history: ExecutionStep[]): {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
} {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  history.forEach((step, index) => {
    nodeIds.add(step.nodeId);

    if (index < history.length - 1 && step.choiceId) {
      const nextStep = history[index + 1];
      if (nextStep) {
        const edgeId = `${step.nodeId}-${nextStep.nodeId}`;
        edgeIds.add(edgeId);
      }
    }
  });

  return { nodeIds, edgeIds };
}
