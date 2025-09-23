import { NodeDefinition, NodeType } from '../types/flow-types';

/**
 * Infer node types based on their connections
 */
export function inferNodeTypes(
  nodes: NodeDefinition[]
): Record<string, NodeType> {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  // Count incoming and outgoing connections
  for (const node of nodes) {
    outgoing.set(node.id, node.outlets?.length ?? 0);
    for (const outlet of node.outlets ?? []) {
      incoming.set(outlet.to, (incoming.get(outlet.to) ?? 0) + 1);
    }
  }

  const typeMap: Record<string, NodeType> = {};

  // Determine node type based on connection patterns
  for (const node of nodes) {
    const outgoingCount = outgoing.get(node.id) ?? 0;
    const incomingCount = incoming.get(node.id) ?? 0;

    if (outgoingCount === 0 && incomingCount === 0) {
      typeMap[node.id] = 'isolated';
    } else if (incomingCount === 0 && outgoingCount > 0) {
      typeMap[node.id] = 'start';
    } else if (outgoingCount === 0 && incomingCount > 0) {
      typeMap[node.id] = 'end';
    } else if (outgoingCount > 1) {
      typeMap[node.id] = 'decision';
    } else {
      typeMap[node.id] = 'action';
    }
  }

  return typeMap;
}

/**
 * Get the type of a specific node
 */
export function getNodeType(nodeId: string, nodes: NodeDefinition[]): NodeType {
  const typeMap = inferNodeTypes(nodes);
  const nodeType = typeMap[nodeId];
  if (!nodeType) {
    throw new Error(`Node type not found for node: ${nodeId}`);
  }
  return nodeType;
}
