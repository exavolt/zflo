import type { FlowDefinition } from '@zflo/core';

/**
 * Standardized format identifier
 */
export type FormatId = string;

/**
 * Format detection result with normalized confidence
 */
export interface FormatDetectionResult {
  /** Format identifier */
  format: FormatId;
  /** Confidence level (0-1, where 1 is highest confidence) */
  confidence: number;
  /** Human-readable indicators that led to this detection */
  indicators: string[];
}

/**
 * Parse result from a format parser
 */
export interface ParseResult {
  success: boolean;
  flow?: FlowDefinition;
  error?: string;
  warnings?: string[];
}

/**
 * Format result from a format formatter
 */
export interface FormatResult {
  success: boolean;
  output?: string;
  error?: string;
  warnings?: string[];
}

/**
 * Validation result for format syntax
 */
export interface FormatValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Format parser interface - converts format-specific syntax to FlowDefinition
 */
export interface FormatParser<
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Parse format-specific code into FlowDefinition
   */
  parse(code: string, options?: TOptions): FlowDefinition;

  /**
   * Validate format syntax without full parsing
   */
  validate?(code: string, options?: TOptions): FormatValidationResult;

  /**
   * Get parser-specific options schema or defaults
   */
  getDefaultOptions?(): TOptions;
}

/**
 * Format formatter interface - converts FlowDefinition to format-specific syntax
 */
export interface FormatFormatter<
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Format FlowDefinition into format-specific syntax
   */
  format(flow: FlowDefinition, options?: TOptions): string;

  /**
   * Get formatter-specific options schema or defaults
   */
  getDefaultOptions?(): TOptions;
}

/**
 * Format detector interface - detects format from code with confidence
 */
export interface FormatDetector {
  /**
   * Detect format from code with confidence scoring
   */
  detect(code: string): FormatDetectionResult;

  /**
   * Get format identifier this detector handles
   */
  getFormatId(): FormatId;

  /**
   * Get human-readable format name
   */
  getFormatName(): string;
}

/**
 * Complete format implementation combining parser, formatter, and detector
 */
export interface FormatImplementation<
  TParseOptions extends Record<string, unknown> = Record<string, unknown>,
  TFormatOptions extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Format identifier */
  formatId: FormatId;
  /** Human-readable format name */
  formatName: string;
  /** Format detector */
  detector: FormatDetector;
  /** Format parser */
  parser: FormatParser<TParseOptions>;
  /** Format formatter (optional) */
  formatter?: FormatFormatter<TFormatOptions>;
}

/**
 * Registry entry for a format implementation
 */
export interface FormatRegistryEntry {
  formatId: FormatId;
  formatName: string;
  detector: FormatDetector;
  parser: FormatParser;
  formatter?: FormatFormatter;
  /** Registration metadata */
  registeredAt: Date;
  /** Package that registered this format */
  registeredBy?: string;
}
