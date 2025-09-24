import { FlowDefinition } from '@zflo/core';
import type { FormatFormatter } from '@zflo/api-format';

export class ZFloJsonFormatter
  implements FormatFormatter<Record<string, unknown>>
{
  format(flow: FlowDefinition, options?: Record<string, unknown>): string {
    const indent = options?.indent || 2;
    const sortKeys = options?.sortKeys || false;

    // Create a clean copy of the flow
    const cleanFlow = this.cleanFlow(flow);

    if (sortKeys) {
      return JSON.stringify(
        this.sortObjectKeys(cleanFlow),
        null,
        indent as number
      );
    }

    return JSON.stringify(cleanFlow, null, indent as number);
  }

  private cleanFlow(flow: FlowDefinition): FlowDefinition {
    // Remove any undefined or null values and ensure consistent structure
    const cleaned: FlowDefinition = {
      id: flow.id,
      title: flow.title || 'Untitled Flow',
      startNodeId: flow.startNodeId,
      nodes: flow.nodes.map((node) => ({
        id: node.id,
        title: node.title,
        content: node.content,
        ...(node.outlets &&
          node.outlets.length > 0 && {
            outlets: node.outlets.map((outlet) => ({
              id: outlet.id,
              to: outlet.to,
              ...(outlet.label && { label: outlet.label }),
              ...(outlet.condition && { condition: outlet.condition }),
            })),
          }),
        // Include any additional node properties
        ...Object.fromEntries(
          Object.entries(node).filter(
            ([key]) => !['id', 'title', 'content', 'outlets'].includes(key)
          )
        ),
      })),
      // Include any additional flow properties
      ...Object.fromEntries(
        Object.entries(flow).filter(
          ([key]) => !['id', 'title', 'startNodeId', 'nodes'].includes(key)
        )
      ),
    };

    return cleaned;
  }

  private sortObjectKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObjectKeys(item));
    }

    if (obj && typeof obj === 'object') {
      const sorted: any = {};
      const keys = Object.keys(obj).sort();

      for (const key of keys) {
        sorted[key] = this.sortObjectKeys(obj[key]);
      }

      return sorted;
    }

    return obj;
  }
}
