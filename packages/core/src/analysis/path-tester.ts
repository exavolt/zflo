//

import { ExpressionEvaluator } from '../core/expression-evaluator';
import { FlowEngine } from '../core/flow-engine';
import { ExpressionLanguage } from '../types/expression-types';
import { NodeType, ZFFlow, ZFNode, XFOutlet } from '../types/flow-types';
import { EvaluatorFactory } from '../utils/evaluator-factory';
import { inferNodeTypes } from '../utils/infer-node-types';
import { StateActionExecutor } from '../utils/state-executor';

export interface PathTestResult {
  isValid: boolean;
  totalPaths: number;
  completedPaths: number;
  errors: PathTestPointOfInterest[];
  warnings: PathTestPointOfInterest[];
  pathSummary: PathSummary[];
  coverage: CoverageReport;
}

export interface PathTestPointOfInterest {
  type:
    | 'missing_node'
    | 'unreachable_node'
    | 'infinite_loop'
    | 'missing_end'
    | 'invalid_transition'
    | 'state_error'
    | 'long_path'
    | 'unused_node'
    | 'complex_condition'
    | 'state_inconsistency';
  message: string;
  path?: string[];
  nodeId?: string;
  pathId?: string;
}

export interface PathSummary {
  id: string;
  path: string[];
  endType: 'completed' | 'error' | 'infinite_loop';
  steps: number;
  finalState: Record<string, unknown>;
  choices: string[];
}

export interface CoverageReport {
  nodesCovered: number;
  totalNodes: number;
  pathsCovered: number;
  totalPaths: number;
  uncoveredNodes: string[];
  uncoveredPaths: string[];
}

export class PathTester {
  private flow: ZFFlow;
  private nodeTypes: Record<string, NodeType>;
  private maxPaths: number;
  private maxSteps: number;
  private evaluators: Record<string, ExpressionEvaluator>;
  private defaultLanguage: ExpressionLanguage;
  private actionExecutor: StateActionExecutor;

  constructor(flow: ZFFlow, maxPaths: number = 1000, maxSteps: number = 100) {
    this.flow = flow;
    this.nodeTypes = inferNodeTypes(flow.nodes);
    this.maxPaths = maxPaths;
    this.maxSteps = maxSteps;
    this.defaultLanguage = flow.expressionLanguage ?? 'cel';
    this.evaluators = EvaluatorFactory.getDefaultEvaluators();

    // Initialize shared action executor
    this.actionExecutor = new StateActionExecutor({
      expressionLanguage: this.defaultLanguage,
      evaluators: this.evaluators,
      enableLogging: false,
    });
  }

  /**
   * Test all possible paths through the flow
   */
  async testAllPaths(): Promise<PathTestResult> {
    const errors: PathTestPointOfInterest[] = [];
    const warnings: PathTestPointOfInterest[] = [];
    const pathSummaries: PathSummary[] = [];
    const visitedNodes = new Set<string>();
    const visitedPaths = new Set<string>();

    // Start path exploration from the start node
    const pathQueue: {
      nodeId: string;
      path: string[];
      state: Record<string, unknown>;
      choices: string[];
    }[] = [
      {
        nodeId: this.flow.startNodeId,
        path: [this.flow.startNodeId],
        state: { ...this.flow.globalState },
        choices: [],
      },
    ];

    let pathCount = 0;
    let completedPaths = 0;

    while (pathQueue.length > 0 && pathCount < this.maxPaths) {
      const current = pathQueue.shift();
      if (!current) {
        errors.push({
          type: 'state_error',
          message: 'Path queue is empty',
        });
        continue;
      }
      pathCount++;

      // Check for infinite loops
      if (current.path.length > this.maxSteps) {
        errors.push({
          type: 'infinite_loop',
          message: `Path exceeded maximum steps (${this.maxSteps})`,
          path: current.path,
          nodeId: current.nodeId,
        });
        continue;
      }

      // Track visited nodes and paths
      visitedNodes.add(current.nodeId);
      const pathKey = current.path.join('->');
      visitedPaths.add(pathKey);

      const node = this.findNodeById(current.nodeId);
      if (!node) {
        errors.push({
          type: 'unreachable_node',
          message: `Node not found: ${current.nodeId}`,
          path: current.path,
          nodeId: current.nodeId,
        });
        continue;
      }

      // Check if this is an end node
      if (this.nodeTypes[node.id] === 'end') {
        completedPaths++;
        pathSummaries.push({
          id: `path-${pathCount}`,
          path: current.path,
          endType: 'completed',
          steps: current.path.length,
          finalState: current.state,
          choices: current.choices,
        });
        continue;
      }

      // Get available paths from this node
      const availablePaths = this.getAvailablePaths(node, current.state);

      if (availablePaths.length === 0) {
        errors.push({
          type: 'missing_end',
          message: `Node has no available paths and is not an end node: ${node.id}`,
          path: current.path,
          nodeId: node.id,
        });
        continue;
      }

      // Explore each available path
      for (const path of availablePaths) {
        const targetNode = this.findNodeById(path.to);
        if (!targetNode) {
          errors.push({
            type: 'invalid_transition',
            message: `Path references non-existent node: ${path.to}`,
            path: current.path,
            pathId: path.id,
          });
          continue;
        }

        // Apply node actions to state using shared executor
        const actionResult = node.actions
          ? this.actionExecutor.executeActions(node.actions, current.state)
          : { success: true, newState: current.state, errors: [] };
        const newState = actionResult.newState;

        // Check for cycles (but allow some repetition for complex flows)
        const newPath = [...current.path, path.to];
        const cycleCount = newPath.filter(
          (nodeId) => nodeId === path.to
        ).length;

        if (cycleCount > 3) {
          warnings.push({
            type: 'long_path',
            message: `Potential infinite loop detected: node ${path.to} visited ${cycleCount} times`,
            path: newPath,
            nodeId: path.to,
          });
          continue;
        }

        pathQueue.push({
          nodeId: path.to,
          path: newPath,
          state: newState,
          choices: [...current.choices, path.label || path.id],
        });
      }
    }

    // Generate coverage report
    const coverage = this.generateCoverageReport(visitedNodes, visitedPaths);

    // Add warnings for uncovered nodes
    for (const nodeId of coverage.uncoveredNodes) {
      warnings.push({
        type: 'unused_node',
        message: `Node is never reached: ${nodeId}`,
        nodeId,
      });
    }

    return {
      isValid: errors.length === 0,
      totalPaths: pathCount,
      completedPaths,
      errors,
      warnings,
      pathSummary: pathSummaries,
      coverage,
    };
  }

  /**
   * Test a specific path through the flow
   */
  async testPath(choices: string[]): Promise<PathSummary> {
    const engine = new FlowEngine(this.flow, { enableHistory: true });

    try {
      await engine.start();
      const path = [this.flow.startNodeId];

      for (const choice of choices) {
        const result = await engine.next(choice);
        path.push(result.node.node.id);

        if (result.isComplete) {
          break;
        }
      }

      return {
        id: 'manual-test',
        path,
        endType: engine.isComplete() ? 'completed' : 'error',
        steps: path.length,
        finalState: engine.getState(),
        choices,
      };
    } catch {
      return {
        id: 'manual-test',
        path: [this.flow.startNodeId],
        endType: 'error',
        steps: 1,
        finalState: {},
        choices,
      };
    }
  }

  /**
   * Generate a simple test report
   */
  generateReport(result: PathTestResult): string {
    const lines = [
      '# ZFlo Path Test Report',
      `**Flow:** ${this.flow.title}`,
      `**Status:** ${result.isValid ? '✅ PASS' : '❌ FAIL'}`,
      '',
      '## Summary',
      `- Total paths explored: ${result.totalPaths}`,
      `- Completed paths: ${result.completedPaths}`,
      `- Errors: ${result.errors.length}`,
      `- Warnings: ${result.warnings.length}`,
      '',
      '## Coverage',
      `- Nodes covered: ${result.coverage.nodesCovered}/${result.coverage.totalNodes} (${Math.round((result.coverage.nodesCovered / result.coverage.totalNodes) * 100)}%)`,
      `- Paths covered: ${result.coverage.pathsCovered}/${result.coverage.totalPaths} (${Math.round((result.coverage.pathsCovered / result.coverage.totalPaths) * 100)}%)`,
      '',
    ];

    if (result.errors.length > 0) {
      lines.push('## Errors');
      for (const error of result.errors) {
        lines.push(`- **${error.type}**: ${error.message}`);
        if (error.path) {
          lines.push(`  Path: ${error.path.join(' → ')}`);
        }
      }
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('## Warnings');
      for (const warning of result.warnings) {
        lines.push(`- **${warning.type}**: ${warning.message}`);
        if (warning.path) {
          lines.push(`  Path: ${warning.path.join(' → ')}`);
        }
      }
      lines.push('');
    }

    if (result.coverage.uncoveredNodes.length > 0) {
      lines.push('## Uncovered Nodes');
      for (const nodeId of result.coverage.uncoveredNodes) {
        lines.push(`- ${nodeId}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private findNodeById(id: string): ZFNode | null {
    return this.flow.nodes.find((node) => node.id === id) || null;
  }

  private getAvailablePaths(
    node: ZFNode,
    state: Record<string, unknown>
  ): XFOutlet[] {
    if (!node.outlets) return [];

    return node.outlets.filter((path) => {
      if (!path.condition) return true;

      try {
        // Simple condition evaluation (can be enhanced)
        return this.evaluateCondition(path.condition, state);
      } catch {
        return false;
      }
    });
  }

  private evaluateCondition(
    condition: string,
    state: Record<string, unknown>
  ): boolean {
    return this.actionExecutor.evaluateCondition(condition, state);
  }

  private generateCoverageReport(
    visitedNodes: Set<string>,
    visitedPaths: Set<string>
  ): CoverageReport {
    const totalNodes = this.flow.nodes.length;
    const uncoveredNodes = this.flow.nodes
      .filter((node) => !visitedNodes.has(node.id))
      .map((node) => node.id);

    // Count total paths
    let totalPaths = 0;
    const uncoveredPaths: string[] = [];

    for (const node of this.flow.nodes) {
      if (node.outlets) {
        for (const path of node.outlets) {
          totalPaths++;
          const pathKey = `${node.id}->${path.to}`;
          if (!visitedPaths.has(pathKey)) {
            uncoveredPaths.push(pathKey);
          }
        }
      }
    }

    return {
      nodesCovered: visitedNodes.size,
      totalNodes,
      pathsCovered: totalPaths - uncoveredPaths.length,
      totalPaths,
      uncoveredNodes,
      uncoveredPaths,
    };
  }
}
