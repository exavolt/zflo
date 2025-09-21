import { Node, Edge, Position } from '@xyflow/react';
import { ZFFlow, ZFNode } from '@zflo/core';
// uuidv4 will be used for generating IDs in future enhancements

export interface ZFReactFlowNode extends Node {
  data: {
    zfloNode: ZFNode;
    outputCount: number;
  };
}

export interface ZFReactFlowEdge extends Edge {
  data: {
    pathId: string;
    label?: string;
    condition?: string;
  };
}

export function convertZFloToReactFlow(flow: ZFFlow): {
  nodes: ZFReactFlowNode[];
  edges: ZFReactFlowEdge[];
} {
  const nodes: ZFReactFlowNode[] = [];
  const edges: ZFReactFlowEdge[] = [];

  // Convert nodes with dynamic positioning
  flow.nodes.forEach((zfloNode, index) => {
    const outputCount = zfloNode.outlets?.length ?? 0;

    const reactFlowNode: ZFReactFlowNode = {
      id: zfloNode.id,
      type: getReactFlowNodeType(),
      position: calculateNodePosition(index, flow.nodes.length),
      data: {
        zfloNode,
        outputCount,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };

    nodes.push(reactFlowNode);
  });

  // Convert outlets to edges
  flow.nodes.forEach((zfloNode) => {
    zfloNode.outlets?.forEach((outlet, outletIndex) => {
      const edge: ZFReactFlowEdge = {
        id: `${zfloNode.id}-${outlet.to}-${outletIndex}`,
        source: zfloNode.id,
        target: outlet.to,
        sourceHandle: `output-${outletIndex}`,
        targetHandle: 'input-0',
        data: {
          pathId: outlet.id,
          label: outlet.label,
          condition: outlet.condition,
        },
        label: outlet.label,
      };

      edges.push(edge);
    });
  });

  return { nodes, edges };
}

function getReactFlowNodeType(): string {
  return `zfloNode`;
}

function calculateNodePosition(
  index: number,
  totalNodes: number
): { x: number; y: number } {
  // Simple grid layout - can be enhanced with auto-layout algorithms
  const cols = Math.ceil(Math.sqrt(totalNodes));
  const row = Math.floor(index / cols);
  const col = index % cols;

  return {
    x: col * 250,
    y: row * 150,
  };
}
