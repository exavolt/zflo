import type {
  FormatImplementation,
  FormatDetector,
  FormatParser,
  FormatFormatter,
} from './types';
import { getFormatRegistry } from './registry';

/**
 * Auto-register a format implementation on import
 * This function should be called by format packages in their index files
 */
export function registerFormat<
  TParseOptions extends Record<string, unknown> = Record<string, unknown>,
  TFormatOptions extends Record<string, unknown> = Record<string, unknown>,
>(
  implementation: FormatImplementation<TParseOptions, TFormatOptions>,
  packageName?: string
): void {
  const registry = getFormatRegistry();

  try {
    registry.register(implementation, packageName);
  } catch (error) {
    // Log warning but don't throw to avoid breaking imports
    console.warn(
      `Failed to register format '${implementation.formatId}':`,
      error
    );
  }
}

/**
 * Create a format implementation from individual components
 */
export function createFormatImplementation<
  TParseOptions extends Record<string, unknown> = Record<string, unknown>,
  TFormatOptions extends Record<string, unknown> = Record<string, unknown>,
>(config: {
  formatId: string;
  name: string;
  description?: string;
  detector: FormatDetector;
  parser: FormatParser<TParseOptions>;
  formatter?: FormatFormatter<TFormatOptions>;
}): FormatImplementation<TParseOptions, TFormatOptions> {
  return {
    formatId: config.formatId,
    formatName: config.name,
    detector: config.detector,
    parser: config.parser,
    formatter: config.formatter,
  };
}

/**
 * Normalize confidence score to 0-1 range
 */
export function normalizeConfidence(confidence: number): number {
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Create a simple format detector from detection function
 */
export function createDetector(config: {
  formatId: string;
  detect: (code: string) => number;
}): FormatDetector {
  return {
    detect(code: string) {
      const confidence = config.detect(code);
      return {
        format: config.formatId,
        confidence: normalizeConfidence(confidence),
        indicators: [],
      };
    },
    getFormatId() {
      return config.formatId;
    },
    getFormatName() {
      return config.formatId;
    },
  };
}

/**
 * Auto-register a format implementation (alias for registerFormat)
 */
export const autoRegister = registerFormat;

/**
 * Get all available format information for debugging
 */
export function getFormatInfo() {
  const registry = getFormatRegistry();
  return {
    registeredFormats: registry.getRegisteredFormats(),
    formatDetails: registry.getAllFormats().map((entry) => ({
      formatId: entry.formatId,
      formatName: entry.formatName,
      hasParser: !!entry.parser,
      hasFormatter: !!entry.formatter,
      registeredAt: entry.registeredAt,
      registeredBy: entry.registeredBy,
    })),
  };
}
