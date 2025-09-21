import type {
  FormatId,
  FormatImplementation,
  FormatRegistryEntry,
  FormatDetectionResult,
  ParseResult,
  FormatResult,
  FormatValidationResult,
} from './types';
import type { ZFFlow } from '../../core/dist';

/**
 * Format registry error types
 */
export class FormatRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormatRegistryError';
  }
}

export class FormatAlreadyRegisteredError extends FormatRegistryError {
  constructor(formatId: FormatId, existingPackage?: string) {
    const packageInfo = existingPackage
      ? ` (already registered by ${existingPackage})`
      : '';
    super(`Format '${formatId}' is already registered${packageInfo}`);
    this.name = 'FormatAlreadyRegisteredError';
  }
}

export class FormatNotFoundError extends FormatRegistryError {
  constructor(formatId: FormatId) {
    super(`Format '${formatId}' is not registered`);
    this.name = 'FormatNotFoundError';
  }
}

/**
 * Global format registry for parsers and formatters
 */
export class FormatRegistry {
  private static instance: FormatRegistry;
  private formats = new Map<FormatId, FormatRegistryEntry>();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): FormatRegistry {
    if (!FormatRegistry.instance) {
      FormatRegistry.instance = new FormatRegistry();
    }
    return FormatRegistry.instance;
  }

  /**
   * Register a format implementation
   */
  register<
    TParseOptions extends Record<string, unknown> = Record<string, unknown>,
    TFormatOptions extends Record<string, unknown> = Record<string, unknown>,
  >(
    implementation: FormatImplementation<TParseOptions, TFormatOptions>,
    registeredBy?: string
  ): void {
    const { formatId } = implementation;

    // Check for existing registration
    if (this.formats.has(formatId)) {
      const existing = this.formats.get(formatId)!;
      throw new FormatAlreadyRegisteredError(formatId, existing.registeredBy);
    }

    // Validate format ID
    if (!formatId || typeof formatId !== 'string' || formatId.trim() === '') {
      throw new FormatRegistryError('Format ID must be a non-empty string');
    }

    // Validate detector format ID matches
    if (implementation.detector.getFormatId() !== formatId) {
      throw new FormatRegistryError(
        `Detector format ID '${implementation.detector.getFormatId()}' does not match implementation format ID '${formatId}'`
      );
    }

    // Register the format
    const entry: FormatRegistryEntry = {
      formatId,
      formatName: implementation.formatName,
      detector: implementation.detector,
      parser: implementation.parser,
      formatter: implementation.formatter,
      registeredAt: new Date(),
      registeredBy,
    };

    this.formats.set(formatId, entry);
  }

  /**
   * Unregister a format (mainly for testing)
   */
  unregister(formatId: FormatId): boolean {
    return this.formats.delete(formatId);
  }

  /**
   * Get a registered format implementation
   */
  getFormat(formatId: FormatId): FormatRegistryEntry {
    const format = this.formats.get(formatId);
    if (!format) {
      throw new FormatNotFoundError(formatId);
    }
    return format;
  }

  /**
   * Check if a format is registered
   */
  hasFormat(formatId: FormatId): boolean {
    return this.formats.has(formatId);
  }

  /**
   * Get all registered format IDs
   */
  getRegisteredFormats(): FormatId[] {
    return Array.from(this.formats.keys());
  }

  /**
   * Get all registered format entries
   */
  getAllFormats(): FormatRegistryEntry[] {
    return Array.from(this.formats.values());
  }

  /**
   * Detect format from code using all registered detectors
   */
  detectFormat(code: string): FormatDetectionResult {
    if (!code.trim()) {
      return {
        format: 'unknown',
        confidence: 0,
        indicators: ['Empty input provided'],
      };
    }

    const results: FormatDetectionResult[] = [];

    // Run detection with all registered detectors
    for (const entry of this.formats.values()) {
      try {
        const result = entry.detector.detect(code);
        results.push(result);
      } catch (error) {
        // Skip detectors that fail
        console.warn(`Detector for ${entry.formatId} failed:`, error);
      }
    }

    if (results.length === 0) {
      return {
        format: 'unknown',
        confidence: 0,
        indicators: ['No detectors available'],
      };
    }

    // Return the result with highest confidence
    const best = results.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    return best.confidence > 0.3
      ? best
      : {
          format: 'unknown',
          confidence: 0,
          indicators: ['No clear format indicators found'],
        };
  }

  /**
   * Parse code with automatic format detection
   */
  parse(code: string): ParseResult {
    const detection = this.detectFormat(code);

    if (detection.format === 'unknown') {
      return {
        success: false,
        error:
          'Unable to detect format. Please ensure your syntax is valid for a supported format.',
      };
    }

    try {
      const format = this.getFormat(detection.format);
      const flowchart = format.parser.parse(code);

      return {
        success: true,
        flowchart,
      };
    } catch (error) {
      // Try fallback parsing with other formats
      const fallbackResult = this.tryFallbackParsing(code, detection.format);
      if (fallbackResult.success) {
        return fallbackResult;
      }

      return {
        success: false,
        error: `Failed to parse ${detection.format} format: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Parse code with specific format
   */
  parseWithFormat(
    code: string,
    formatId: FormatId,
    options?: Record<string, unknown>
  ): ParseResult {
    try {
      const format = this.getFormat(formatId);
      const flowchart = format.parser.parse(code, options);

      return {
        success: true,
        flowchart,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse ${formatId} format: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Format ZFFlow to specific format
   */
  format(
    flowchart: ZFFlow,
    formatId: FormatId,
    options?: Record<string, unknown>
  ): FormatResult {
    try {
      const format = this.getFormat(formatId);

      if (!format.formatter) {
        return {
          success: false,
          error: `Format '${formatId}' does not support formatting/export`,
        };
      }

      const output = format.formatter.format(flowchart, options);

      return {
        success: true,
        output,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to format to ${formatId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Validate code syntax
   */
  validate(code: string, formatId?: FormatId): FormatValidationResult {
    const targetFormatId = formatId || this.detectFormat(code).format;

    if (targetFormatId === 'unknown') {
      return {
        isValid: false,
        errors: ['Unable to detect format for validation'],
        warnings: [],
      };
    }

    try {
      const format = this.getFormat(targetFormatId);

      if (format.parser.validate) {
        return format.parser.validate(code);
      }

      // Fallback: try parsing to validate
      format.parser.parse(code);
      return {
        isValid: true,
        errors: [],
        warnings: [],
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
   * Try parsing with other formats if primary detection fails
   */
  private tryFallbackParsing(
    code: string,
    primaryFormat: FormatId
  ): ParseResult {
    const otherFormats = Array.from(this.formats.values()).filter(
      (f) => f.formatId !== primaryFormat
    );

    for (const format of otherFormats) {
      try {
        const flowchart = format.parser.parse(code);
        if (flowchart && flowchart.nodes && flowchart.nodes.length > 0) {
          return {
            success: true,
            flowchart,
            warnings: [
              `Parsed as ${format.formatId} instead of detected ${primaryFormat}`,
            ],
          };
        }
      } catch {
        // Continue to next format
      }
    }

    return { success: false };
  }

  /**
   * Clear all registrations (mainly for testing)
   */
  clear(): void {
    this.formats.clear();
  }
}

/**
 * Get the global format registry instance
 */
export const getFormatRegistry = (): FormatRegistry =>
  FormatRegistry.getInstance();
