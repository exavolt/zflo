import {
  inferNodeTypes,
  NodeType,
  ZFFlow,
  ZFNode,
  XFOutlet,
  ExecutionStep,
} from '@zflo/core';

export interface ExecutionHighlight {
  currentNodeId?: string;
  executionPath?: string[];
  history?: ExecutionStep[];
}

/**
 * Converts an ZFlo flowchart to Mermaid syntax
 * Focuses on essential structure for visualization
 * Optionally highlights execution path and current node
 */
export function zfloToMermaid(
  flowchart: ZFFlow,
  executionState?: ExecutionHighlight
): string {
  const lines: string[] = [];

  // Add YAML front-matter if title/description exist
  if (flowchart.title || flowchart.description) {
    lines.push('---');
    if (flowchart.title) {
      // Escape quotes in title
      const title = flowchart.title.includes(':')
        ? `"${flowchart.title.replace(/"/g, '\\"')}"`
        : flowchart.title;
      lines.push(`title: ${title}`);
    }
    if (flowchart.description) {
      // Escape quotes in description
      const description = flowchart.description.includes(':')
        ? `"${flowchart.description.replace(/"/g, '\\"')}"`
        : flowchart.description;
      lines.push(`description: ${description}`);
    }
    lines.push('---');
    lines.push('');
  }

  lines.push('flowchart TD');

  // Extract execution information
  const executionPath =
    executionState?.executionPath ||
    executionState?.history?.map((step) => step.node.node.id) ||
    [];
  const currentNodeId = executionState?.currentNodeId;

  // Create sets for quick lookup
  const pathNodes = new Set(executionPath);
  const executedEdges = new Set<string>();

  // Build executed edges from history
  if (executionState?.history) {
    for (let i = 0; i < executionState.history.length - 1; i++) {
      const currentStep = executionState.history[i];
      const nextStep = executionState.history[i + 1];
      if (currentStep?.node?.node?.id && nextStep?.node?.node?.id) {
        const fromId = currentStep.node.node.id;
        const toId = nextStep.node.node.id;
        executedEdges.add(`${fromId}->${toId}`);
      }
    }
  }

  // Process nodes and create edges
  const processedNodes = new Set<string>();
  const nodeTypes = inferNodeTypes(flowchart.nodes);

  flowchart.nodes.forEach((node: ZFNode) => {
    // Add node definition if not already processed
    if (!processedNodes.has(node.id)) {
      const nodeDefinition = createNodeDefinition(node, nodeTypes);
      if (nodeDefinition) {
        lines.push(`    ${nodeDefinition}`);
      }
      processedNodes.add(node.id);
    }

    // Add edges from this node
    if (node.outlets) {
      node.outlets.forEach((path: XFOutlet) => {
        const targetNode = flowchart.nodes.find(
          (n: ZFNode) => n.id === path.to
        );
        if (targetNode) {
          // Ensure target node is defined
          if (!processedNodes.has(targetNode.id)) {
            const targetDefinition = createNodeDefinition(
              targetNode,
              nodeTypes
            );
            if (targetDefinition) {
              lines.push(`    ${targetDefinition}`);
            }
            processedNodes.add(targetNode.id);
          }

          // Create edge
          const edgeKey = `${node.id}->${path.to}`;
          const isExecuted = executedEdges.has(edgeKey);
          const edge = createEdge(node.id, path.to, path.label, isExecuted);
          lines.push(`    ${edge}`);
        }
      });
    }
  });

  // Add styling for execution highlighting
  if (executionState && (pathNodes.size > 0 || currentNodeId)) {
    lines.push('');
    //lines.push('    %%%% Execution highlighting');

    // Style executed nodes
    pathNodes.forEach((nodeId) => {
      if (nodeId !== currentNodeId) {
        const sanitizedId = sanitizeNodeId(nodeId);
        lines.push(
          `    classDef executed fill:#334155,stroke:#cbd5e1,stroke-width:2px,color:#cbd5e1`
        );
        lines.push(`    class ${sanitizedId} executed`);
      }
    });

    // Style current node
    if (currentNodeId) {
      const sanitizedId = sanitizeNodeId(currentNodeId);
      lines.push(
        `    classDef current fill:#f59e0b,stroke:#451a03,stroke-width:3px,color:#451a03`
      );
      lines.push(`    class ${sanitizedId} current`);
    }
  }

  return lines.join('\n');
}

function createNodeDefinition(
  node: ZFNode,
  nodeTypes: Record<string, NodeType>
): string | null {
  const nodeId = sanitizeNodeId(node.id);
  const nodeText = sanitizeNodeText(node.title);

  // Check if node has conditional paths
  const hasConditionalPaths =
    node.outlets && node.outlets.some((path: XFOutlet) => path.condition);
  const hasEvaluations = hasConditionalPaths;

  // Choose shape based on node type and evaluations
  switch (nodeTypes[node.id]) {
    case 'start':
      return `${nodeId}([${nodeText}])`;
    case 'decision':
      if (node.isAutoAdvance) {
        return `${nodeId}{{${nodeText}}}`;
      }
      return `${nodeId}{${nodeText}}`;
    case 'end':
      return `${nodeId}([${nodeText}])`;
    case 'action':
    default:
      // Use hexagon for nodes with evaluations/conditions
      if (hasEvaluations) {
        return `${nodeId}{{${nodeText}}}`;
      }
      return `${nodeId}[${nodeText}]`;
  }
}

function createEdge(
  fromId: string,
  toId: string,
  label?: string,
  isExecuted: boolean = false
): string {
  const from = sanitizeNodeId(fromId);
  const to = sanitizeNodeId(toId);

  // Use thick arrow for executed edges
  const arrow = isExecuted ? '==>' : '-->';

  if (label && label.trim()) {
    const sanitizedLabel = sanitizeEdgeLabel(label);
    return `${from} ${arrow}|${sanitizedLabel}| ${to}`;
  }

  return `${from} ${arrow} ${to}`;
}

function sanitizeNodeId(id: string): string {
  // Replace invalid characters with underscores
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function sanitizeNodeText(text: string): string {
  // Preserve original text but escape for Mermaid syntax
  const maxLength = 50;
  let sanitized = text
    .replace(/\n/g, '<br/>') // Convert newlines to HTML breaks for Mermaid
    .replace(/"/g, '&quot;') // Escape quotes
    .replace(/\|/g, '&#124;') // Escape pipes
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 3) + '...';
  }

  return sanitized.startsWith('(') && sanitized.endsWith(')')
    ? `"${sanitized}"`
    : sanitized || 'Node';
}

function sanitizeEdgeLabel(label: string): string {
  // Clean up edge labels for Mermaid
  const maxLength = 50;
  let sanitized = label
    .replace(/[|()[\]{}]/g, '') // Remove pipe, parentheses, brackets, braces
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/"/g, '&quot;') // Escape quotes with &quot;
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 3) + '...';
  }

  return sanitized;
}
