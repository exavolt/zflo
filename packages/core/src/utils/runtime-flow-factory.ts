//

import { FlowDefinition } from '../types/flow-types';
import { RuntimeFlow, RuntimeNode } from '../types/execution-types';
import { inferNodeTypes } from './infer-node-types';

/**
 * Factory for creating RuntimeFlow instances from FlowDefinition
 */
export class RuntimeFlowFactory {
  /**
   * Create a RuntimeFlow from a FlowDefinition
   */
  static create<TState extends object = Record<string, unknown>>(
    definition: FlowDefinition<TState>,
    initialState?: Partial<TState>
  ): RuntimeFlow<TState> {
    // Compute node types
    const nodeTypes = inferNodeTypes(definition.nodes);

    // Build node map for fast lookup
    const nodeMap = new Map();
    for (const node of definition.nodes) {
      nodeMap.set(node.id, node);
    }

    // Build outlet map for fast lookup
    const outletMap = new Map();
    for (const node of definition.nodes) {
      if (node.outlets) {
        for (const outlet of node.outlets) {
          outletMap.set(outlet.id, { outlet, fromNodeId: node.id });
        }
      }
    }

    // Compute reachability map
    const reachabilityMap = this.computeReachabilityMap<TState>(
      definition,
      nodeMap
    );

    // Merge initial state
    const state = {
      ...JSON.parse(JSON.stringify(definition.initialState || {})),
      ...JSON.parse(JSON.stringify(initialState || {})),
    } as TState;

    return {
      definition,
      nodeTypes,
      reachabilityMap,
      nodeMap,
      outletMap,
      currentNodeId: null,
      executionHistory: [],
      state,
    };
  }

  /**
   * Create a RuntimeNode from a node definition
   */
  static createRuntimeNode<TState extends object = Record<string, unknown>>(
    definition: FlowDefinition<TState>,
    nodeId: string,
    runtimeFlow: RuntimeFlow<TState>
  ): RuntimeNode {
    const nodeDef = runtimeFlow.nodeMap.get(nodeId);
    if (!nodeDef) {
      throw new Error(`Node with id "${nodeId}" not found`);
    }

    const nodeType = runtimeFlow.nodeTypes[nodeId];
    if (!nodeType) {
      throw new Error(`Node type not found for node: ${nodeId}`);
    }

    const reachableNodes =
      runtimeFlow.reachabilityMap.get(definition.startNodeId) || new Set();
    const isReachable = reachableNodes.has(nodeId);

    // Calculate depth (simplified - could be more sophisticated)
    const depth = this.calculateNodeDepth(
      nodeId,
      definition.startNodeId,
      runtimeFlow.nodeMap
    );

    return {
      definition: nodeDef,
      type: nodeType,
      isReachable,
      depth,
    };
  }

  /**
   * Compute reachability map for all nodes
   */
  private static computeReachabilityMap<
    TState extends object = Record<string, unknown>,
  >(
    definition: FlowDefinition<TState>,
    nodeMap: Map<string, any>
  ): Map<string, Set<string>> {
    const reachabilityMap = new Map<string, Set<string>>();

    // For each node, compute what nodes are reachable from it
    for (const node of definition.nodes) {
      const reachable = new Set<string>();
      const visited = new Set<string>();
      const queue = [node.id];

      while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId || visited.has(currentId)) continue;

        visited.add(currentId);
        reachable.add(currentId);

        const currentNode = nodeMap.get(currentId);
        if (currentNode?.outlets) {
          for (const outlet of currentNode.outlets) {
            if (!visited.has(outlet.to)) {
              queue.push(outlet.to);
            }
          }
        }
      }

      reachabilityMap.set(node.id, reachable);
    }

    return reachabilityMap;
  }

  /**
   * Calculate depth of a node from start
   */
  private static calculateNodeDepth(
    nodeId: string,
    startNodeId: string,
    nodeMap: Map<string, any>
  ): number {
    if (nodeId === startNodeId) return 0;

    const visited = new Set<string>();
    const queue = [{ id: startNodeId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current.id)) continue;

      visited.add(current.id);

      if (current.id === nodeId) {
        return current.depth;
      }

      const node = nodeMap.get(current.id);
      if (node?.outlets) {
        for (const outlet of node.outlets) {
          if (!visited.has(outlet.to)) {
            queue.push({ id: outlet.to, depth: current.depth + 1 });
          }
        }
      }
    }

    return -1; // Not reachable
  }
}
