import type { FormatFormatter } from '@zflo/api-format';
import type { ZFFlow } from '@zflo/core';
import { zfloToMermaid, type ExecutionHighlight } from './mermaid-export';

export interface MermaidFormatOptions extends Record<string, unknown> {
  executionState?: ExecutionHighlight;
}

/**
 * Mermaid formatter that converts ZFFlow to Mermaid syntax
 */
export class MermaidFormatter implements FormatFormatter<MermaidFormatOptions> {
  format(flow: ZFFlow, options?: MermaidFormatOptions): string {
    return zfloToMermaid(flow, options?.executionState);
  }

  getDefaultOptions(): MermaidFormatOptions {
    return {};
  }
}
