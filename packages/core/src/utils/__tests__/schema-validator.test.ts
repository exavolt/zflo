import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaValidator, globalSchemaValidator } from '../schema-validator';
import type { JSONSchema7 } from 'json-schema';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  describe('Basic Validation', () => {
    it('should validate valid data against schema', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
        },
        required: ['name'],
      };

      const validData = { name: 'John', age: 30 };
      const result = validator.validate(validData, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid data with detailed errors', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
        },
        required: ['name'],
      };

      const invalidData = { age: -5 }; // Missing required name, negative age
      const result = validator.validate(invalidData, schema);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((err) =>
          err.includes('Missing required property: name')
        )
      ).toBe(true);
      expect(result.errors.some((err) => err.includes('below minimum'))).toBe(
        true
      );
    });

    it('should handle type validation errors', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          count: { type: 'number' },
        },
      };

      const invalidData = { count: 'not-a-number' };
      const result = validator.validate(invalidData, schema);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(
          (err) =>
            err.includes('Invalid type') && err.includes('expected number')
        )
      ).toBe(true);
    });
  });

  describe('Game State Schema Validation', () => {
    const gameStateSchema: JSONSchema7 = {
      type: 'object',
      properties: {
        health: { type: 'number', minimum: 0, maximum: 100 },
        level: { type: 'integer', minimum: 1 },
        inventory: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 10,
        },
        player: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            class: { type: 'string', enum: ['warrior', 'mage', 'rogue'] },
          },
          required: ['name', 'class'],
        },
      },
      required: ['health', 'level', 'player'],
      additionalProperties: false,
    };

    it('should validate complete game state', () => {
      const gameState = {
        health: 85,
        level: 5,
        inventory: ['sword', 'potion'],
        player: {
          name: 'Hero',
          class: 'warrior',
        },
      };

      const result = validator.validate(gameState, gameStateSchema);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid health values', () => {
      const gameState = {
        health: 150, // Above maximum
        level: 5,
        player: { name: 'Hero', class: 'warrior' },
      };

      const result = validator.validate(gameState, gameStateSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((err) => err.includes('above maximum'))).toBe(
        true
      );
    });

    it('should reject invalid player class', () => {
      const gameState = {
        health: 100,
        level: 5,
        player: { name: 'Hero', class: 'invalid-class' },
      };

      const result = validator.validate(gameState, gameStateSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((err) => err.includes('player'))).toBe(true);
    });

    it('should reject additional properties', () => {
      const gameState = {
        health: 100,
        level: 5,
        player: { name: 'Hero', class: 'warrior' },
        invalidProperty: 'should not be here',
      };

      const result = validator.validate(gameState, gameStateSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Unexpected property 'invalidProperty' at root"
      );
    });
  });

  describe('Schema Compilation and Caching', () => {
    it('should cache compiled schemas', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: { test: { type: 'string' } },
      };

      const schemaId = 'test-schema';

      // First compilation
      const validator1 = validator.compileSchema(schema, schemaId);

      // Second compilation should return cached version
      const validator2 = validator.compileSchema(schema, schemaId);

      expect(validator1).toBe(validator2);

      const stats = validator.getCacheStats();
      expect(stats.schemas).toContain(schemaId);
    });

    it('should clear cache when requested', () => {
      const schema: JSONSchema7 = { type: 'string' };
      validator.compileSchema(schema, 'test');

      expect(validator.getCacheStats().size).toBe(1);

      validator.clearCache();
      expect(validator.getCacheStats().size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid schemas gracefully', () => {
      const invalidSchema = { type: 'invalid-type' } as unknown as JSONSchema7;

      expect(() => {
        validator.compileSchema(invalidSchema);
      }).toThrow('Failed to compile schema');
    });

    it('should throw validation errors when using validateOrThrow', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        required: ['name'],
      };

      expect(() => {
        validator.validateOrThrow({}, schema);
      }).toThrow('Schema validation failed');
    });

    it('should not throw for valid data when using validateOrThrow', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      };

      expect(() => {
        validator.validateOrThrow({ name: 'test' }, schema);
      }).not.toThrow();
    });
  });

  describe('Format Validation', () => {
    it('should validate email format', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      };

      const validData = { email: 'test@example.com' };
      const invalidData = { email: 'not-an-email' };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });

    it('should validate date format', () => {
      const schema: JSONSchema7 = {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date' },
        },
      };

      const validData = { date: '2023-12-25' };
      const invalidData = { date: 'not-a-date' };

      expect(validator.validate(validData, schema).isValid).toBe(true);
      expect(validator.validate(invalidData, schema).isValid).toBe(false);
    });
  });

  describe('Global Validator Instance', () => {
    it('should provide a global validator instance', () => {
      expect(globalSchemaValidator).toBeInstanceOf(SchemaValidator);
    });

    it('should maintain state across uses', () => {
      const schema: JSONSchema7 = { type: 'string' };
      globalSchemaValidator.compileSchema(schema, 'global-test');

      expect(globalSchemaValidator.getCacheStats().schemas).toContain(
        'global-test'
      );
    });
  });
});
