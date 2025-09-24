import { FlowDefinition } from '@zflo/core';
import type { FormatParser } from '@zflo/api-format';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ZFloJsonParser implements FormatParser<Record<string, unknown>> {
  parse(code: string, _options?: Record<string, unknown>): FlowDefinition {
    try {
      const parsed = JSON.parse(code.trim());

      // Validate basic structure
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid JSON structure - must be an object');
      }

      if (!parsed.id || typeof parsed.id !== 'string') {
        throw new Error(
          'Missing or invalid "id" field - must be a non-empty string'
        );
      }

      if (!Array.isArray(parsed.nodes)) {
        throw new Error('Missing or invalid "nodes" field - must be an array');
      }

      if (!parsed.startNodeId || typeof parsed.startNodeId !== 'string') {
        throw new Error(
          'Missing or invalid "startNodeId" field - must be a non-empty string'
        );
      }

      // Validate nodes structure
      for (let i = 0; i < parsed.nodes.length; i++) {
        const node = parsed.nodes[i];
        if (!node || typeof node !== 'object') {
          throw new Error(`Node at index ${i} is not a valid object`);
        }
        if (!node.id || typeof node.id !== 'string') {
          throw new Error(`Node at index ${i} missing or invalid "id" field`);
        }
      }

      // Validate startNodeId exists in nodes
      const nodeIds = parsed.nodes.map((node: any) => node.id);
      if (!nodeIds.includes(parsed.startNodeId)) {
        throw new Error(
          `startNodeId "${parsed.startNodeId}" not found in nodes`
        );
      }

      // Ensure required fields exist with defaults
      const flow: FlowDefinition = {
        id: parsed.id,
        title: parsed.title || 'Untitled Flow',
        nodes: parsed.nodes || [],
        startNodeId: parsed.startNodeId,
        ...parsed, // Include any additional fields
      };

      return flow;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON syntax: ${error.message}`);
      }
      throw new Error(
        `Failed to parse ZFlo JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  validate(code: string): ValidationResult {
    try {
      this.parse(code);
      return {
        isValid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
      };
    }
  }
}
