import type { ZFFlow, ExecutionStep } from '../../../core/dist';

/**
 * Determines if a node has been traversed based on execution history
 * @param nodeId - The node ID to check
 * @param history - Execution history
 * @returns True if the node has been traversed
 */
export function isNodeTraversed(
  nodeId: string,
  history: ExecutionStep[] = []
): boolean {
  return history.some((step) => step.node?.node?.id === nodeId);
}

/**
 * Determines if an edge has been traversed based on execution history
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @param history - Execution history
 * @returns True if the edge has been traversed
 */
export function isEdgeTraversed(
  sourceId: string,
  targetId: string,
  history: ExecutionStep[] = []
): boolean {
  // Find if there's a sequence where sourceId is followed by targetId
  for (let i = 0; i < history.length - 1; i++) {
    const currentNodeId = history[i]?.node?.node?.id;
    const nextNodeId = history[i + 1]?.node?.node?.id;
    if (currentNodeId === sourceId && nextNodeId === targetId) {
      return true;
    }
  }
  return false;
}

/**
 * Gets all traversed node IDs from execution history
 * @param history - Execution history
 * @returns Set of traversed node IDs
 */
export function getTraversedNodes(history: ExecutionStep[] = []): Set<string> {
  return new Set(
    history.map((step) => step.node?.node?.id).filter(Boolean) as string[]
  );
}

/**
 * Gets all traversed edges from execution history
 * @param history - Execution history
 * @returns Array of traversed edge pairs [sourceId, targetId]
 */
export function getTraversedEdges(
  history: ExecutionStep[] = []
): Array<[string, string]> {
  const edges: Array<[string, string]> = [];

  for (let i = 0; i < history.length - 1; i++) {
    const currentNodeId = history[i]?.node?.node?.id;
    const nextNodeId = history[i + 1]?.node?.node?.id;
    if (currentNodeId && nextNodeId) {
      edges.push([currentNodeId, nextNodeId]);
    }
  }

  return edges;
}

/**
 * Finds the next nodes that should be highlighted based on current node
 * @param flow - The flow definition
 * @param currentNodeId - Current node ID
 * @returns Array of next node IDs
 */
export function getNextNodes(flow: ZFFlow, currentNodeId?: string): string[] {
  if (!currentNodeId) return [];

  const currentNode = flow.nodes.find((node) => node.id === currentNodeId);
  if (!currentNode || !currentNode.outlets) return [];

  return currentNode.outlets.map((outlet) => outlet.to);
}

/**
 * Finds the previous nodes that lead to the current node
 * @param flow - The flow definition
 * @param currentNodeId - Current node ID
 * @returns Array of previous node IDs
 */
export function getPreviousNodes(
  flow: ZFFlow,
  currentNodeId?: string
): string[] {
  if (!currentNodeId) return [];

  const previousNodes: string[] = [];

  for (const node of flow.nodes) {
    if (node.outlets) {
      for (const outlet of node.outlets) {
        if (outlet.to === currentNodeId) {
          previousNodes.push(node.id);
        }
      }
    }
  }

  return previousNodes;
}
