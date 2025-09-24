import { FlowDefinition } from '@zflo/core';
import { getFormatRegistry } from '@zflo/api-format';

// Import format packages to trigger auto-registration
import '@zflo/format-mermaid';
import '@zflo/format-dot';
import '@zflo/format-plantuml';
import '@zflo/format-zflojson';

export interface ParseResult {
  success: boolean;
  flow?: FlowDefinition;
  error?: string;
  format?: string;
  confidence?: number;
}

/**
 * Unified parser that uses the format registry for automatic detection and parsing
 */
export class RegistryParser {
  private registry = getFormatRegistry();

  /**
   * Parse flowchart code with automatic format detection using the registry
   */
  parse(code: string): ParseResult {
    if (!code.trim()) {
      return {
        success: false,
        error: 'Empty input provided',
      };
    }

    try {
      // Use registry to parse with automatic detection
      const result = this.registry.parse(code);

      if (result.success) {
        // Get detection info for additional context
        const detection = this.registry.detectFormat(code);
        return {
          success: true,
          flow: result.flowchart,
          format: detection.format,
          confidence: detection.confidence,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Validate code syntax using the registry
   */
  validate(code: string): { isValid: boolean; errors: string[] } {
    const validation = this.registry.validate(code);
    return {
      isValid: validation.isValid,
      errors: validation.errors || [],
    };
  }

  /**
   * Detect format using the registry
   */
  detectFormat(code: string): { format: string; confidence: number } {
    const detection = this.registry.detectFormat(code);
    return {
      format: detection.format,
      confidence: detection.confidence,
    };
  }

  /**
   * Get all available formats from the registry
   */
  getAvailableFormats(): string[] {
    return this.registry.getRegisteredFormats();
  }

  /**
   * Get format information for debugging
   */
  getFormatInfo() {
    return this.registry.getAllFormats().map((entry) => ({
      formatId: entry.formatId,
      formatName: entry.formatName,
      hasParser: !!entry.parser,
      hasFormatter: !!entry.formatter,
      registeredAt: entry.registeredAt,
      registeredBy: entry.registeredBy,
    }));
  }
}
