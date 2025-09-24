import type { FormatFormatter } from '@zflo/api-format';
import type { FlowDefinition } from '@zflo/core';
import { zfloToMermaid, type ExecutionHighlight } from './mermaid-export';

export interface MermaidFormatOptions extends Record<string, unknown> {
  executionState?: ExecutionHighlight;
}

/**
 * Mermaid formatter that converts ZFlo FlowDefinition to Mermaid syntax
 */
export class MermaidFormatter implements FormatFormatter<MermaidFormatOptions> {
  format(flow: FlowDefinition, options?: MermaidFormatOptions): string {
    return zfloToMermaid(flow, options?.executionState);
  }

  getDefaultOptions(): MermaidFormatOptions {
    return {};
  }
}
