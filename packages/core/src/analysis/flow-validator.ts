//

import { ExpressionEvaluator } from '../core/expression-evaluator';
import {
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from '../types/analysis-types';
import {
  NodeType,
  FlowDefinition,
  NodeDefinition,
  OutletDefinition,
} from '../types/flow-types';
import { EvaluatorFactory } from '../utils/evaluator-factory';
import { FlowGraphUtils } from '../utils/graph-utils';
import { inferNodeTypes } from '../utils/infer-node-types';

interface ValidationContext {
  flow: FlowDefinition;
  nodeTypes: Record<string, NodeType>;
  graphUtils: FlowGraphUtils;
}

export class FlowValidator {
  private evaluators: Record<string, ExpressionEvaluator>;

  constructor(evaluators?: Record<string, ExpressionEvaluator>) {
    this.evaluators = evaluators ?? EvaluatorFactory.getDefaultEvaluators();
  }

  validate(flow: FlowDefinition): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const nodeTypes = inferNodeTypes(flow.nodes);
    const graphUtils = new FlowGraphUtils(flow);
    const context: ValidationContext = {
      flow: flow,
      nodeTypes,
      graphUtils,
    };

    // Check for start node
    const startNode = flow.nodes.find((node) => node.id === flow.startNodeId);
    if (!startNode) {
      errors.push({
        type: 'missing_node',
        message: `Start node with id "${flow.startNodeId}" not found`,
        nodeId: flow.startNodeId,
      });
    }

    // Check for at least one end node
    const endNodes = flow.nodes.filter((node) => nodeTypes[node.id] === 'end');
    if (endNodes.length === 0) {
      warnings.push({
        type: 'missing_end_node',
        message: 'No end nodes found in flow',
      });
    }

    // Validate paths within nodes
    for (const node of flow.nodes) {
      if (node.outlets) {
        for (const path of node.outlets) {
          const toNode = flow.nodes.find((n) => n.id === path.to);

          if (!toNode) {
            errors.push({
              type: 'missing_node',
              message: `Path references non-existent "to" node: ${path.to}`,
              edgeId: path.id,
              nodeId: path.to,
            });
          }
        }
      }
    }

    // Check for unreachable nodes using shared graph utilities
    const reachableNodes = context.graphUtils.findReachableNodes();
    const unreachableNodes = flow.nodes.filter(
      (node) => !reachableNodes.has(node.id)
    );
    for (const node of unreachableNodes) {
      warnings.push({
        type: 'unreachable_node',
        message: `Node "${node.id}" is unreachable from start node`,
        nodeId: node.id,
      });
    }

    // Check for circular dependencies using shared graph utilities
    if (context.graphUtils.hasCycles()) {
      warnings.push({
        type: 'circular_dependency',
        message: 'Potential circular dependencies detected',
      });
    }

    // Validate path condition expressions (syntax-level)
    for (const node of flow.nodes) {
      if (node.outlets) {
        for (const path of node.outlets) {
          if (
            path.condition !== undefined &&
            !this.isValidExpression(
              path.condition,
              flow.expressionLanguage ?? 'cel'
            )
          ) {
            errors.push({
              type: 'syntax_error',
              message: `Invalid path condition expression: ${path.condition}`,
              nodeId: node.id,
              edgeId: path.id,
            });
          }
        }
      }
    }

    // Validate auto-advance nodes follow if-else logic
    this.validateAutoAdvanceNodes(context, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates that auto-advance nodes follow proper if-else logic patterns.
   * Auto-advance nodes should have their outlets structured like if-else statements:
   * - Conditional outlets (if/else-if clauses) should be evaluated in order
   * - At most one default outlet (else clause) without conditions
   * - No unreachable outlets after a default outlet
   */
  private validateAutoAdvanceNodes(
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const node of context.flow.nodes) {
      // Check if node uses auto-advance
      if (!node.autoAdvance) continue;

      const autoAdvanceMode = context.flow.autoAdvanceMode || 'default';

      if (autoAdvanceMode === 'never') continue;

      // Only validate nodes that can auto-advance
      const canAutoAdvance = true;

      if (!canAutoAdvance || !node.outlets || node.outlets.length === 0)
        continue;

      this.validateIfElsePathStructure(node, errors, warnings);
    }
  }

  /**
   * Validates that a node's outlets follow proper if-else structure:
   * - Conditional outlets come first (if/else-if)
   * - At most one default outlet (else)
   * - Default outlet should be last
   */
  private validateIfElsePathStructure(
    node: NodeDefinition,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const outlets = node.outlets || [];
    const conditionalOutlets = outlets.filter(
      (outlet: OutletDefinition) => outlet.condition
    );
    const defaultOutlets = outlets.filter(
      (outlet: OutletDefinition) => !outlet.condition
    );
    const autoAdvanceFrom = node.autoAdvance ? 'node' : 'flow';

    // Check for multiple default outlets (multiple else clauses)
    if (defaultOutlets.length > 1) {
      errors.push({
        type: 'invalid_path_structure',
        message: `Auto-advance node "${node.id}" (${autoAdvanceFrom}) has multiple default outlets (else clauses). Only one default outlet is allowed.`,
        nodeId: node.id,
      });
    }

    // Check if default outlet is not at the end
    if (defaultOutlets.length === 1 && defaultOutlets[0]) {
      const defaultOutletIndex = outlets.indexOf(defaultOutlets[0]);
      const lastConditionalOutlet =
        conditionalOutlets[conditionalOutlets.length - 1];
      const lastConditionalIndex = lastConditionalOutlet
        ? outlets.indexOf(lastConditionalOutlet)
        : -1;

      if (
        lastConditionalIndex >= 0 &&
        defaultOutletIndex < lastConditionalIndex
      ) {
        warnings.push({
          type: 'suboptimal_path_order',
          message: `Auto-advance node "${node.id}" (${autoAdvanceFrom}) has default outlet before conditional outlets. Consider moving default outlet to the end for clarity.`,
          nodeId: node.id,
        });
      }
    }

    // Check for unreachable outlets (outlets after an always-true condition)
    for (let i = 0; i < conditionalOutlets.length - 1; i++) {
      const currentOutlet = conditionalOutlets[i];
      if (
        currentOutlet &&
        currentOutlet.condition &&
        this.isAlwaysTrueCondition(currentOutlet.condition)
      ) {
        warnings.push({
          type: 'unreachable_path',
          message: `Auto-advance node "${node.id}" (${autoAdvanceFrom}) has outlets after an always-true condition "${currentOutlet.condition}". These outlets will never be reached.`,
          nodeId: node.id,
          edgeId: currentOutlet.id,
        });
        break;
      }
    }

    // Warn if no default outlet and all conditions might be false
    if (defaultOutlets.length === 0 && conditionalOutlets.length > 0) {
      warnings.push({
        type: 'missing_default_path',
        message: `Auto-advance node "${node.id}" (${autoAdvanceFrom}) has only conditional outlets without a default outlet. Consider adding a default outlet (else clause) to handle cases where no conditions are met.`,
        nodeId: node.id,
      });
    }
  }

  /**
   * Checks if a condition expression is always true (basic heuristics)
   */
  private isAlwaysTrueCondition(condition: string): boolean {
    if (!condition) return false;

    const trimmed = condition.trim().toLowerCase();
    return (
      trimmed === 'true' ||
      trimmed === '1' ||
      trimmed === '1 == 1' ||
      trimmed === 'true == true'
    );
  }

  private isValidExpression(expression: string, language: 'cel'): boolean {
    try {
      // Normalize and support per-expression language override via prefix
      let expr = (expression || '').trim();
      let lang: 'cel' = language;

      // Check for basic syntax issues
      if (expr === '') return false;

      // Check for balanced parentheses
      let parenCount = 0;
      for (const char of expr) {
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        if (parenCount < 0) return false;
      }
      if (parenCount !== 0) return false;

      const evaluator = this.evaluators[lang];
      if (!evaluator) {
        return false;
      }
      // Try to compile the expression with CEL Runtime; errors mean invalid syntax
      try {
        const result = evaluator.compile(expr);
        return result.success;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }
}
