import dagre from 'dagre';
import type { FlowVizNode, FlowVizEdge } from '../types/flowviz-types';

export interface DagreLayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacing?: number;
  rankSpacing?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  marginX?: number;
  marginY?: number;
}

/**
 * Apply Dagre layout to React Flow nodes and edges
 */
export function applyDagreLayout(
  nodes: FlowVizNode[],
  edges: FlowVizEdge[],
  options: DagreLayoutOptions = {}
): FlowVizNode[] {
  const {
    direction = 'TB',
    nodeSpacing = 150,
    rankSpacing = 200,
    nodeWidth = 250,
    nodeHeight = 100,
    marginX = 50,
    marginY = 50,
  } = options;

  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure the graph
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: marginX,
    marginy: marginY,
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    const width = node.style?.width || nodeWidth;
    const height = node.style?.height || nodeHeight;

    dagreGraph.setNode(node.id, {
      width: typeof width === 'string' ? parseFloat(width) : width,
      height: typeof height === 'string' ? parseFloat(height) : height,
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(dagreGraph);

  // Apply the calculated positions back to the nodes
  const layoutedNodes: FlowVizNode[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });

  return layoutedNodes;
}

/**
 * Get the bounding box of the layout
 */
export function getLayoutBounds(nodes: FlowVizNode[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const nodeWidth = (node.style?.width as number) || 250;
    const nodeHeight = (node.style?.height as number) || 100;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + nodeWidth);
    maxY = Math.max(maxY, node.position.y + nodeHeight);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
