import Ajv, { type ValidateFunction, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import type { JSONSchema7 } from 'json-schema';

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  data?: unknown;
}

export interface SchemaValidationError extends Error {
  validationErrors: string[];
  data: unknown;
}

/**
 * Utility class for JSON Schema validation using Ajv
 */
export class SchemaValidator {
  private ajv: Ajv;
  private compiledSchemas = new Map<string, ValidateFunction>();

  constructor() {
    this.ajv = new Ajv({
      allErrors: true, // Collect all validation errors
      removeAdditional: false, // Don't remove additional properties
      useDefaults: true, // Apply default values from schema
      coerceTypes: false, // Don't coerce types automatically
    });

    // Add format validators (email, date, uri, etc.)
    addFormats(this.ajv);
  }

  /**
   * Compile and cache a JSON schema for validation
   */
  compileSchema(schema: JSONSchema7, schemaId?: string): ValidateFunction {
    const id = schemaId || JSON.stringify(schema);

    let validator = this.compiledSchemas.get(id);
    if (!validator) {
      try {
        validator = this.ajv.compile(schema);
        this.compiledSchemas.set(id, validator);
      } catch (error) {
        throw new Error(
          `Failed to compile schema: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return validator;
  }

  /**
   * Validate data against a JSON schema
   */
  validate(
    data: unknown,
    schema: JSONSchema7,
    schemaId?: string
  ): SchemaValidationResult {
    try {
      const validator = this.compileSchema(schema, schemaId);
      const isValid = validator(data);

      if (isValid) {
        return {
          isValid: true,
          errors: [],
          data,
        };
      }

      const errors = this.formatValidationErrors(validator.errors || []);
      return {
        isValid: false,
        errors,
        data,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
        data,
      };
    }
  }

  /**
   * Validate data and throw an error if validation fails
   */
  validateOrThrow(data: unknown, schema: JSONSchema7, schemaId?: string): void {
    const result = this.validate(data, schema, schemaId);

    if (!result.isValid) {
      const error = new Error(
        `Schema validation failed: ${result.errors.join(', ')}`
      ) as SchemaValidationError;
      error.validationErrors = result.errors;
      error.data = data;
      throw error;
    }
  }

  /**
   * Format Ajv validation errors into human-readable messages
   */
  private formatValidationErrors(errors: ErrorObject[]): string[] {
    return errors.map((error) => {
      const path = error.instancePath || 'root';
      const message = error.message || 'validation failed';

      switch (error.keyword) {
        case 'required':
          return `Missing required property: ${error.params?.missingProperty} at ${path}`;
        case 'type':
          return `Invalid type at ${path}: expected ${error.params?.type}, got ${typeof error.data}`;
        case 'minimum':
          return `Value at ${path} (${error.data}) is below minimum ${error.params?.limit}`;
        case 'maximum':
          return `Value at ${path} (${error.data}) is above maximum ${error.params?.limit}`;
        case 'minLength':
          return `String at ${path} is too short (minimum length: ${error.params?.limit})`;
        case 'maxLength':
          return `String at ${path} is too long (maximum length: ${error.params?.limit})`;
        case 'pattern':
          return `String at ${path} does not match required pattern`;
        case 'format':
          return `Invalid format at ${path}: expected ${error.params?.format}`;
        case 'additionalProperties':
          return `Unexpected property '${error.params?.additionalProperty}' at ${path}`;
        default:
          return `Validation error at ${path}: ${message}`;
      }
    });
  }

  /**
   * Clear compiled schema cache
   */
  clearCache(): void {
    this.compiledSchemas.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; schemas: string[] } {
    return {
      size: this.compiledSchemas.size,
      schemas: Array.from(this.compiledSchemas.keys()),
    };
  }
}

// Global instance for reuse across the application
export const globalSchemaValidator = new SchemaValidator();
