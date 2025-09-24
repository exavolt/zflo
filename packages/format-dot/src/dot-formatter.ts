import { FlowDefinition } from '@zflo/core';
import { FormatFormatter } from '@zflo/api-format';

/**
 * DOT formatter that converts ZFlo FlowDefinition to Graphviz DOT format
 */
export class DotFormatter implements FormatFormatter<Record<string, unknown>> {
  format(flow: FlowDefinition, _options?: Record<string, unknown>): string {
    const graphName = this.sanitizeId(flow.title || flow.id || 'flowchart');
    const lines: string[] = [];

    lines.push(`digraph ${graphName} {`);
    lines.push('  rankdir=TB;');
    lines.push('  node [shape=box, style=rounded];');
    lines.push('');

    // Add graph label if title exists
    if (flow.title) {
      lines.push(`  label="${this.escapeLabel(flow.title)}";`);
      lines.push('  labelloc=t;');
      lines.push('');
    }

    // Add nodes
    for (const node of flow.nodes) {
      const nodeId = this.sanitizeId(node.id);
      const label = this.escapeLabel(node.title || node.content || node.id);
      lines.push(`  ${nodeId} [label="${label}"];`);
    }

    if (flow.nodes.length > 0) {
      lines.push('');
    }

    // Add edges
    for (const node of flow.nodes) {
      if (node.outlets && node.outlets.length > 0) {
        for (const outlet of node.outlets) {
          const fromId = this.sanitizeId(node.id);
          const toId = this.sanitizeId(outlet.to);
          const edgeLabel = outlet.label
            ? ` [label="${this.escapeLabel(outlet.label)}"]`
            : '';
          lines.push(`  ${fromId} -> ${toId}${edgeLabel};`);
        }
      }
    }

    lines.push('}');

    return lines.join('\n');
  }

  private sanitizeId(id: string): string {
    // Replace invalid characters with underscores and ensure valid DOT identifier
    return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
  }

  private escapeLabel(text: string): string {
    // Escape quotes and newlines for DOT labels
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  }
}
