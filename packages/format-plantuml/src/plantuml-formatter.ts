import { FlowDefinition, NodeDefinition } from '@zflo/core';
import { FormatFormatter } from '@zflo/api-format';

/**
 * PlantUML formatter that converts ZFlo FlowDefinition to PlantUML Activity diagram format
 */
export class PlantUMLFormatter
  implements FormatFormatter<Record<string, unknown>>
{
  format(flow: FlowDefinition, _options?: Record<string, unknown>): string {
    const lines: string[] = [];

    lines.push('@startuml');

    // Add title if present
    if (flow.title) {
      lines.push(`title ${flow.title}`);
    }

    lines.push('');
    lines.push('start');

    // Track processed nodes to avoid duplicates
    const processedNodes = new Set<string>();
    const nodeQueue: string[] = [];

    // Start with the start node
    if (flow.startNodeId) {
      nodeQueue.push(flow.startNodeId);
    }

    // Process nodes in flow order
    while (nodeQueue.length > 0) {
      const nodeId = nodeQueue.shift();
      if (!nodeId || processedNodes.has(nodeId)) continue;

      const node = flow.nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      processedNodes.add(nodeId);

      // Add the activity
      const content = this.escapeText(node.title || node.content || node.id);
      lines.push(`:${content};`);

      // Handle outlets
      if (node.outlets && node.outlets.length > 0) {
        if (node.outlets.length === 1) {
          // Single outlet - direct connection
          const outlet = node.outlets[0];
          if (outlet && !processedNodes.has(outlet.to)) {
            nodeQueue.push(outlet.to);
          }
        } else if (node.outlets.length > 1) {
          // Multiple outlets - decision point
          const condition = this.generateCondition(node);
          const thenLabel = node.outlets[0]?.label || 'yes';
          const elseLabel = node.outlets[1]?.label || 'no';

          lines.push(`if (${condition}) then (${thenLabel})`);

          // Add then branch
          if (node.outlets[0] && !processedNodes.has(node.outlets[0].to)) {
            nodeQueue.unshift(node.outlets[0].to);
          }

          lines.push(`else (${elseLabel})`);

          // Add else branch
          if (node.outlets[1] && !processedNodes.has(node.outlets[1].to)) {
            nodeQueue.unshift(node.outlets[1].to);
          }

          lines.push('endif');
        }
      }
    }

    lines.push('');
    lines.push('stop');
    lines.push('@enduml');

    return lines.join('\n');
  }

  private escapeText(text: string): string {
    // Escape special PlantUML characters
    return text.replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/:/g, '\\:');
  }

  private generateCondition(node: NodeDefinition): string {
    // Generate a condition based on node content
    const content = node.title || node.content || node.id;
    if (content.includes('?')) {
      return content.replace(/\?/g, '');
    }
    return `${content}?`;
  }
}
