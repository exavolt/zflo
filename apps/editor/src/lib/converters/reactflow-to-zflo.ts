import { ZFFlow, ZFNode, XFOutlet } from '@zflo/core';
import { v4 as uuidv4 } from 'uuid';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '@/types';

/**
 * Convert ReactFlow nodes and edges to ZFlo format
 */
export function convertReactFlowToZFlo(
  nodes: Node[],
  edges: Edge[],
  flowTitle: string = 'Untitled Flow',
  flowMetadata: Partial<ZFFlow> = {}
): ZFFlow {
  const zfloNodes: ZFNode[] = nodes.map((node): ZFNode => {
    const nodeData = node.data as unknown as NodeData;
    const nodeEdges = edges.filter((edge) => edge.source === node.id);

    const outlets: XFOutlet[] = nodeEdges.map((edge): XFOutlet => {
      const outlet = nodeData.outlets?.find(
        (o) => o.id === edge.sourceHandle || edge.sourceHandle === null
      );

      return {
        id: outlet?.id || edge.id,
        to: edge.target,
        label: String(outlet?.label || edge.label || ''),
        condition: outlet?.condition || '',
      };
    });

    // Sort outlets based on their order in the node data
    if (outlets?.length > 1) {
      outlets.sort((a, b) => {
        const indexA = nodeData.outlets?.findIndex((o) => o.id === a.id) ?? -1;
        const indexB = nodeData.outlets?.findIndex((o) => o.id === b.id) ?? -1;
        return indexA - indexB;
      });
    }

    const isAutoAdvance =
      nodeData.autoAdvance === undefined ? false : nodeData.autoAdvance;

    return {
      id: node.id,
      title: nodeData.title || 'Untitled',
      content: nodeData.content || '',
      isAutoAdvance,
      outlets,
      actions: nodeData.actions || [],
    };
  });

  // Find start node (should have no incoming edges)
  const incomingCounts = new Map<string, number>();
  edges.forEach((edge) => {
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) || 0) + 1);
  });

  const startNode = zfloNodes.find((node) => !incomingCounts.has(node.id));

  return {
    id: flowMetadata.id || uuidv4(),
    title: flowTitle,
    description: flowMetadata.description,
    nodes: zfloNodes,
    startNodeId: startNode?.id || zfloNodes[0]?.id || '',
    globalState: flowMetadata.globalState,
    stateRules: flowMetadata.stateRules,
    autoAdvance: flowMetadata.autoAdvance,
    expressionLanguage: flowMetadata.expressionLanguage,
    metadata: flowMetadata.metadata,
  };
}
