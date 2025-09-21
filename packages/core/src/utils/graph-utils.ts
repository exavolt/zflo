//

import { ZFFlow, ZFNode, XFOutlet } from '../types/flow-types';
import { LRUCache } from './performance-cache';

/**
 * Shared graph traversal and analysis utilities for ZFlo flows.
 * Eliminates duplicated functionality across FlowValidator, FlowAnalyzer, and PathTester.
 */

export interface GraphTraversalResult {
  reachableNodes: Set<string>;
  visitedPaths: Set<string>;
  nodeDepths: Map<string, number>;
  pathsFromNode: Map<string, XFOutlet[]>;
}

export interface PathExplorationOptions {
  maxDepth?: number;
  maxPaths?: number;
  includeState?: boolean;
  conditionEvaluator?: (condition: string, state: unknown) => boolean;
}

export interface PathExplorationResult {
  allPaths: Array<{
    nodeIds: string[];
    pathIds: string[];
    depth: number;
    state?: unknown;
  }>;
  reachableNodes: Set<string>;
  unreachableNodes: Set<string>;
  maxDepth: number;
  hasCycles: boolean;
}

/**
 * Comprehensive graph utilities for ZFlo flow analysis
 */
export class FlowGraphUtils {
  private flow: ZFFlow;
  private nodeMap: Map<string, ZFNode>;
  private pathMap: Map<string, { path: XFOutlet; fromNodeId: string }>;
  private reachabilityCache: LRUCache<string, Set<string>>;
  private depthCache: LRUCache<string, Map<string, number>>;

  constructor(flow: ZFFlow) {
    this.flow = flow;
    this.nodeMap = new Map();
    this.pathMap = new Map();
    this.reachabilityCache = new LRUCache({ maxSize: 50, ttl: 300000 });
    this.depthCache = new LRUCache({ maxSize: 50, ttl: 300000 });

    // Build node lookup map
    for (const node of flow.nodes) {
      this.nodeMap.set(node.id, node);
    }

    // Build path lookup map
    for (const node of flow.nodes) {
      if (node.outlets) {
        for (const path of node.outlets) {
          this.pathMap.set(path.id, { path, fromNodeId: node.id });
        }
      }
    }
  }

  /**
   * Find a node by ID
   */
  findNode(nodeId: string): ZFNode | null {
    return this.nodeMap.get(nodeId) || null;
  }

  /**
   * Find a path by ID with its source node
   */
  findPath(pathId: string): { path: XFOutlet; fromNodeId: string } | null {
    return this.pathMap.get(pathId) || null;
  }

  /**
   * Get all outgoing paths from a node
   */
  getOutgoingPaths(nodeId: string): XFOutlet[] {
    const node = this.nodeMap.get(nodeId);
    return node?.outlets || [];
  }

  /**
   * Get all incoming paths to a node
   */
  getIncomingPaths(
    nodeId: string
  ): Array<{ path: XFOutlet; fromNodeId: string }> {
    const incoming: Array<{ path: XFOutlet; fromNodeId: string }> = [];

    for (const node of this.flow.nodes) {
      if (node.outlets) {
        for (const path of node.outlets) {
          if (path.to === nodeId) {
            incoming.push({ path, fromNodeId: node.id });
          }
        }
      }
    }

    return incoming;
  }

  /**
   * Find all nodes reachable from a given start node (cached)
   */
  findReachableNodes(startNodeId?: string): Set<string> {
    const start = startNodeId || this.flow.startNodeId;
    const cacheKey = `reachable:${start}`;

    // Check cache first
    const cached = this.reachabilityCache.get(cacheKey);
    if (cached) {
      return new Set(cached); // Return copy to prevent mutation
    }

    const reachable = new Set<string>();
    const queue = [start];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (!nodeId || reachable.has(nodeId)) continue;

      reachable.add(nodeId);

      const outgoingPaths = this.getOutgoingPaths(nodeId);
      for (const path of outgoingPaths) {
        if (!reachable.has(path.to)) {
          queue.push(path.to);
        }
      }
    }

    // Cache the result
    this.reachabilityCache.set(cacheKey, reachable);
    return reachable;
  }

  /**
   * Find unreachable nodes
   */
  findUnreachableNodes(startNodeId?: string): Set<string> {
    const reachable = this.findReachableNodes(startNodeId);
    const unreachable = new Set<string>();

    for (const node of this.flow.nodes) {
      if (!reachable.has(node.id)) {
        unreachable.add(node.id);
      }
    }

    return unreachable;
  }

  /**
   * Check if a specific node is reachable from start
   */
  isNodeReachable(targetNodeId: string, startNodeId?: string): boolean {
    const start = startNodeId || this.flow.startNodeId;
    const visited = new Set<string>();
    const queue = [start];

    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (!nodeId || visited.has(nodeId)) continue;
      visited.add(nodeId);

      if (nodeId === targetNodeId) return true;

      const outgoingPaths = this.getOutgoingPaths(nodeId);
      for (const path of outgoingPaths) {
        if (!visited.has(path.to)) {
          queue.push(path.to);
        }
      }
    }

    return false;
  }

  /**
   * Calculate the maximum depth from start node
   */
  calculateMaxDepth(startNodeId?: string): number {
    const start = startNodeId || this.flow.startNodeId;
    const visited = new Set<string>();

    const dfs = (nodeId: string, depth: number): number => {
      if (visited.has(nodeId)) return depth;
      visited.add(nodeId);

      const node = this.findNode(nodeId);
      if (!node) return depth;

      let maxDepth = depth;
      const outgoingPaths = this.getOutgoingPaths(nodeId);

      for (const path of outgoingPaths) {
        maxDepth = Math.max(maxDepth, dfs(path.to, depth + 1));
      }

      return maxDepth;
    };

    return dfs(start, 1);
  }

  /**
   * Calculate node depths from start (cached)
   */
  calculateNodeDepths(startNodeId?: string): Map<string, number> {
    const start = startNodeId || this.flow.startNodeId;
    const cacheKey = `depths:${start}`;

    // Check cache first
    const cached = this.depthCache.get(cacheKey);
    if (cached) {
      return new Map(cached); // Return copy to prevent mutation
    }

    const depths = new Map<string, number>();
    const queue = [{ nodeId: start, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const { nodeId, depth } = current;

      if (depths.has(nodeId)) continue;
      depths.set(nodeId, depth);

      const outgoingPaths = this.getOutgoingPaths(nodeId);
      for (const path of outgoingPaths) {
        if (!depths.has(path.to)) {
          queue.push({ nodeId: path.to, depth: depth + 1 });
        }
      }
    }

    // Cache the result
    this.depthCache.set(cacheKey, depths);
    return depths;
  }

  /**
   * Detect cycles in the flow graph
   */
  hasCycles(startNodeId?: string): boolean {
    const start = startNodeId || this.flow.startNodeId;
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) return true; // Back edge found - cycle detected
      if (visited.has(nodeId)) return false;

      visiting.add(nodeId);

      const outgoingPaths = this.getOutgoingPaths(nodeId);
      for (const path of outgoingPaths) {
        if (dfs(path.to)) return true;
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };

    return dfs(start);
  }

  /**
   * Comprehensive graph traversal with detailed results
   */
  performTraversal(startNodeId?: string): GraphTraversalResult {
    const start = startNodeId || this.flow.startNodeId;
    const reachableNodes = this.findReachableNodes(start);
    const nodeDepths = this.calculateNodeDepths(start);
    const visitedPaths = new Set<string>();
    const pathsFromNode = new Map<string, XFOutlet[]>();

    // Collect all visited paths and organize by source node
    for (const nodeId of reachableNodes) {
      const outgoingPaths = this.getOutgoingPaths(nodeId);
      pathsFromNode.set(nodeId, outgoingPaths);

      for (const path of outgoingPaths) {
        if (reachableNodes.has(path.to)) {
          visitedPaths.add(path.id);
        }
      }
    }

    return {
      reachableNodes,
      visitedPaths,
      nodeDepths,
      pathsFromNode,
    };
  }

  /**
   * Explore all possible paths through the flow with optional state tracking
   */
  exploreAllPaths(options: PathExplorationOptions = {}): PathExplorationResult {
    const {
      maxDepth = 100,
      maxPaths = 1000,
      includeState = false,
      conditionEvaluator,
    } = options;

    const allPaths: Array<{
      nodeIds: string[];
      pathIds: string[];
      depth: number;
      state?: unknown;
    }> = [];

    const queue = [
      {
        nodeId: this.flow.startNodeId,
        path: [this.flow.startNodeId],
        pathIds: [] as string[],
        depth: 1,
        state: includeState ? { ...this.flow.globalState } : undefined,
      },
    ];

    const reachableNodes = new Set<string>();
    let currentMaxDepth = 0;
    let hasCycles = false;

    while (queue.length > 0 && allPaths.length < maxPaths) {
      const current = queue.shift();
      if (!current) break;

      reachableNodes.add(current.nodeId);
      currentMaxDepth = Math.max(currentMaxDepth, current.depth);

      // Check for cycles
      const nodeCount = current.path.filter(
        (id) => id === current.nodeId
      ).length;
      if (nodeCount > 1) {
        hasCycles = true;
      }

      const node = this.findNode(current.nodeId);
      if (!node) continue;

      const outgoingPaths = this.getOutgoingPaths(current.nodeId);

      // If no outgoing paths or max depth reached, this is a complete path
      if (outgoingPaths.length === 0 || current.depth >= maxDepth) {
        allPaths.push({
          nodeIds: current.path,
          pathIds: current.pathIds,
          depth: current.depth,
          state: current.state,
        });
        continue;
      }

      // Explore each outgoing path
      for (const path of outgoingPaths) {
        // Evaluate path condition if evaluator provided
        if (conditionEvaluator && path.condition && current.state) {
          try {
            if (!conditionEvaluator(path.condition, current.state)) {
              continue; // Skip this path
            }
          } catch {
            continue; // Skip on evaluation error
          }
        }

        const newPath = [...current.path, path.to];
        const newPathIds = [...current.pathIds, path.id];

        queue.push({
          nodeId: path.to,
          path: newPath,
          pathIds: newPathIds,
          depth: current.depth + 1,
          state: current.state ? { ...current.state } : undefined,
        });
      }
    }

    const allNodeIds = new Set(this.flow.nodes.map((n) => n.id));
    const unreachableNodes = new Set<string>();

    for (const nodeId of allNodeIds) {
      if (!reachableNodes.has(nodeId)) {
        unreachableNodes.add(nodeId);
      }
    }

    return {
      allPaths,
      reachableNodes,
      unreachableNodes,
      maxDepth: currentMaxDepth,
      hasCycles,
    };
  }

  /**
   * Get flow statistics
   */
  getFlowStats() {
    const traversal = this.performTraversal();
    const pathExploration = this.exploreAllPaths({ maxPaths: 100 });

    return {
      totalNodes: this.flow.nodes.length,
      reachableNodes: traversal.reachableNodes.size,
      unreachableNodes: this.flow.nodes.length - traversal.reachableNodes.size,
      totalPaths: traversal.visitedPaths.size,
      maxDepth: this.calculateMaxDepth(),
      hasCycles: this.hasCycles(),
      possiblePaths: pathExploration.allPaths.length,
    };
  }
}

/**
 * Utility functions for common graph operations
 */

/**
 * Create a FlowGraphUtils instance for a flow
 */
export function createFlowGraph(flow: ZFFlow): FlowGraphUtils {
  return new FlowGraphUtils(flow);
}

/**
 * Quick check if a node is reachable
 */
export function isNodeReachable(
  flow: ZFFlow,
  targetNodeId: string,
  startNodeId?: string
): boolean {
  const graph = new FlowGraphUtils(flow);
  return graph.isNodeReachable(targetNodeId, startNodeId);
}

/**
 * Quick find of all reachable nodes
 */
export function findReachableNodes(
  flow: ZFFlow,
  startNodeId?: string
): Set<string> {
  const graph = new FlowGraphUtils(flow);
  return graph.findReachableNodes(startNodeId);
}

/**
 * Quick find of unreachable nodes
 */
export function findUnreachableNodes(
  flow: ZFFlow,
  startNodeId?: string
): Set<string> {
  const graph = new FlowGraphUtils(flow);
  return graph.findUnreachableNodes(startNodeId);
}

/**
 * Quick cycle detection
 */
export function hasCycles(flow: ZFFlow, startNodeId?: string): boolean {
  const graph = new FlowGraphUtils(flow);
  return graph.hasCycles(startNodeId);
}
