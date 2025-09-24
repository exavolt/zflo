import { readFile } from 'fs/promises';
import { FlowDefinition } from '@zflo/core';
import {
  getFormatRegistry,
  createFormatImplementation,
} from '@zflo/api-format';
// Import format packages to trigger auto-registration
import '@zflo/format-dot';
import '@zflo/format-plantuml';
import '@zflo/format-zflojson';
// Import Mermaid components directly and register manually
import {
  MermaidDetector,
  MermaidParser,
  MermaidFormatter,
} from '@zflo/format-mermaid';

export class FlowLoader {
  private registry = getFormatRegistry();

  constructor() {
    // Manually register Mermaid format to ensure it uses the same registry instance
    this.ensureMermaidFormatRegistered();
  }

  private ensureMermaidFormatRegistered() {
    if (!this.registry.hasFormat('mermaid')) {
      try {
        const mermaidFormat = createFormatImplementation({
          formatId: 'mermaid',
          name: 'Mermaid',
          detector: MermaidDetector,
          parser: new MermaidParser(),
          formatter: new MermaidFormatter(),
        });
        this.registry.register(mermaidFormat, 'FlowLoader');
      } catch (error) {
        console.warn(
          'Failed to register Mermaid format in FlowLoader:',
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  /**
   * Load and parse a flow file from disk
   */
  async loadFlow(filePath: string): Promise<FlowDefinition> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return this.parseFlow(content, filePath);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new Error(`Flow file not found: ${filePath}`);
      }
      throw new Error(
        `Failed to read flow file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse flow content using the format registry
   */
  private parseFlow(content: string, filePath: string): FlowDefinition {
    const result = this.registry.parse(content);

    if (!result.success) {
      throw new Error(`Failed to parse flow file ${filePath}: ${result.error}`);
    }

    if (!result.flowchart) {
      throw new Error(`No flowchart data found in ${filePath}`);
    }

    return result.flowchart;
  }

  /**
   * Validate a flow file without fully loading it
   */
  async validateFlow(
    filePath: string
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const detection = this.registry.detectFormat(content);

      if (detection.format === 'unknown') {
        return {
          isValid: false,
          errors: ['Unable to detect flow format'],
          warnings: [],
        };
      }

      const result = this.registry.parse(content);
      return {
        isValid: result.success,
        errors: result.success ? [] : [result.error || 'Parse failed'],
        warnings: result.warnings || [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
      };
    }
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats(): string[] {
    return this.registry.getRegisteredFormats();
  }
}
