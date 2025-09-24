import { describe, it, expect, beforeEach } from 'vitest';
import { FlowValidator } from '../flow-validator';
import { FlowDefinition, NodeDefinition } from '../../types/flow-types';

describe('FlowValidator', () => {
  let validator: FlowValidator;

  beforeEach(() => {
    validator = new FlowValidator();
  });

  const createBasicFlow = (
    nodes: NodeDefinition[],
    startNodeId: string = 'start'
  ): FlowDefinition => ({
    id: 'test-flow',
    title: 'Test Flow',
    description: 'Test flow for validation',
    nodes,
    startNodeId,
    metadata: {},
  });

  describe('start node validation', () => {
    it('should pass validation when start node exists', () => {
      const flow = createBasicFlow([
        { id: 'start', title: 'Start', outlets: [] },
        { id: 'end', title: 'End', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when start node is missing', () => {
      const flow = createBasicFlow(
        [{ id: 'other', title: 'Other', outlets: [] }],
        'missing-start'
      );

      const result = validator.validate(flow);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        type: 'missing_node',
        message: 'Start node with id "missing-start" not found',
        nodeId: 'missing-start',
      });
    });
  });

  describe('end node validation', () => {
    it('should pass validation when end nodes exist', () => {
      const flow = createBasicFlow([
        { id: 'start', title: 'Start', outlets: [] },
        { id: 'end1', title: 'End 1', outlets: [] },
        { id: 'end2', title: 'End 2', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(
        result.warnings.filter((w) => w.type === 'missing_end_node')
      ).toHaveLength(1);
    });

    it('should warn when no end nodes exist', () => {
      const flow = createBasicFlow([
        { id: 'start', title: 'Start', outlets: [] },
        { id: 'action', title: 'Action', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(result.warnings).toContainEqual({
        type: 'missing_end_node',
        message: 'No end nodes found in flow',
      });
    });
  });

  describe('path validation', () => {
    it('should pass validation when all path targets exist', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [{ id: 'path1', to: 'action', label: 'Go to action' }],
        },
        { id: 'action', title: 'Action', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when path targets missing nodes', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [
            { id: 'path1', to: 'missing-node', label: 'Go to missing' },
            {
              id: 'path2',
              to: 'another-missing',
              label: 'Go to another missing',
            },
          ],
        },
      ]);

      const result = validator.validate(flow);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContainEqual({
        type: 'missing_node',
        message: 'Path references non-existent "to" node: missing-node',
        edgeId: 'path1',
        nodeId: 'missing-node',
      });
      expect(result.errors).toContainEqual({
        type: 'missing_node',
        message: 'Path references non-existent "to" node: another-missing',
        edgeId: 'path2',
        nodeId: 'another-missing',
      });
    });
  });

  describe('reachability validation', () => {
    it('should pass validation when all nodes are reachable', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [{ id: 'path1', to: 'action' }],
        },
        {
          id: 'action',
          title: 'Action',
          outlets: [{ id: 'path2', to: 'end' }],
        },
        { id: 'end', title: 'End', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(
        result.warnings.filter((w) => w.type === 'unreachable_node')
      ).toHaveLength(0);
    });

    it('should warn about unreachable nodes', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [{ id: 'path1', to: 'end' }],
        },
        { id: 'end', title: 'End', outlets: [] },
        { id: 'orphan', title: 'Orphan', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(result.warnings).toContainEqual({
        type: 'unreachable_node',
        message: 'Node "orphan" is unreachable from start node',
        nodeId: 'orphan',
      });
    });

    it('should not warn about start node being unreachable', () => {
      const flow = createBasicFlow([
        { id: 'start', title: 'Start', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(
        result.warnings.filter((w) => w.type === 'unreachable_node')
      ).toHaveLength(0);
    });
  });

  describe('circular dependency validation', () => {
    it('should pass validation when no circular dependencies exist', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [{ id: 'path1', to: 'action' }],
        },
        {
          id: 'action',
          title: 'Action',
          outlets: [{ id: 'path2', to: 'end' }],
        },
        { id: 'end', title: 'End', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(
        result.warnings.filter((w) => w.type === 'circular_dependency')
      ).toHaveLength(0);
    });

    it('should warn about circular dependencies', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [{ id: 'path1', to: 'node1' }],
        },
        {
          id: 'node1',
          title: 'Node 1',
          outlets: [{ id: 'path2', to: 'node2' }],
        },
        {
          id: 'node2',
          title: 'Node 2',
          outlets: [{ id: 'path3', to: 'node1' }], // Creates cycle
        },
      ]);

      const result = validator.validate(flow);
      expect(result.warnings).toContainEqual({
        type: 'circular_dependency',
        message: 'Potential circular dependencies detected',
      });
    });

    it('should handle self-referencing nodes', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [{ id: 'path1', to: 'start' }], // Self-reference
        },
      ]);

      const result = validator.validate(flow);
      expect(result.warnings).toContainEqual({
        type: 'circular_dependency',
        message: 'Potential circular dependencies detected',
      });
    });
  });

  describe('condition expression validation', () => {
    it('should pass validation for valid condition expressions', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [
            { id: 'path1', to: 'end', condition: 'user.hasKey == true' },
            { id: 'path2', to: 'end', condition: 'score >= 100 && level > 5' },
            { id: 'path3', to: 'end', condition: '"sword" in items' },
          ],
        },
        { id: 'end', title: 'End', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(
        result.errors.filter((e) => e.type === 'syntax_error')
      ).toHaveLength(0);
    });

    it('should fail validation for invalid condition expressions', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [
            { id: 'path1', to: 'end', condition: 'user.hasKey === true)' }, // Unbalanced parens
            { id: 'path2', to: 'end', condition: '((score >= 100' }, // Unbalanced parens
            { id: 'path3', to: 'end', condition: '' }, // Empty condition
          ],
        },
        { id: 'end', title: 'End', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.filter((e) => e.type === 'syntax_error')
      ).toHaveLength(3);
    });

    it('should handle nodes without outlets', () => {
      const flow = createBasicFlow([
        { id: 'start', title: 'Start' }, // No outlets property
        { id: 'end', title: 'End', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(
        result.errors.filter((e) => e.type === 'syntax_error')
      ).toHaveLength(0);
    });

    it('should handle outlets without conditions', () => {
      const flow = createBasicFlow([
        {
          id: 'start',
          title: 'Start',
          outlets: [
            { id: 'path1', to: 'end' }, // No condition
          ],
        },
        { id: 'end', title: 'End', outlets: [] },
      ]);

      const result = validator.validate(flow);
      expect(
        result.errors.filter((e) => e.type === 'syntax_error')
      ).toHaveLength(0);
    });
  });

  describe('complex validation scenarios', () => {
    it('should handle complex flow with multiple issues', () => {
      const flow = createBasicFlow(
        [
          {
            id: 'start',
            title: 'Start',
            outlets: [
              { id: 'path1', to: 'missing-node', condition: 'invalid(' }, // Missing node + invalid condition
              { id: 'path2', to: 'action' },
            ],
          },
          {
            id: 'action',
            title: 'Action',
            outlets: [{ id: 'path3', to: 'start' }], // Creates cycle
          },
          { id: 'orphan', title: 'Orphan', outlets: [] }, // Unreachable
        ],
        'start'
      );

      const result = validator.validate(flow);

      // Should have errors
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.type === 'missing_node')).toBe(true);
      expect(result.errors.some((e) => e.type === 'syntax_error')).toBe(true);

      // Should have warnings
      expect(result.warnings.some((w) => w.type === 'missing_end_node')).toBe(
        true
      );
      expect(result.warnings.some((w) => w.type === 'unreachable_node')).toBe(
        true
      );
      expect(
        result.warnings.some((w) => w.type === 'circular_dependency')
      ).toBe(true);
    });

    it('should validate empty flow', () => {
      const flow = createBasicFlow([], 'start');

      const result = validator.validate(flow);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        type: 'missing_node',
        message: 'Start node with id "start" not found',
        nodeId: 'start',
      });
    });
  });

  describe('Auto-advance Path Validation', () => {
    it('should validate proper if-else path structure', () => {
      const flow: FlowDefinition = {
        id: 'test-flow',
        title: 'Test Flow',
        startNodeId: 'start',
        nodes: [
          {
            id: 'start',
            title: 'Start',
            content: 'Starting point',
            autoAdvance: true,
            outlets: [
              {
                id: 'path1',
                to: 'end1',
                condition: 'health > 50',
              },
              {
                id: 'path2',
                to: 'end2',
                condition: 'health <= 50 && health > 0',
              },
              {
                id: 'path3',
                to: 'end3', // default path (else clause)
              },
            ],
          },
          { id: 'end1', title: 'End 1', content: 'Good ending' },
          { id: 'end2', title: 'End 2', content: 'Bad ending' },
          {
            id: 'end3',
            title: 'End 3',
            content: 'Default ending',
          },
        ],
      };

      const result = validator.validate(flow);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should error on multiple default outlets', () => {
      const flow: FlowDefinition = {
        id: 'test-flow',
        title: 'Test Flow',
        startNodeId: 'start',
        nodes: [
          {
            id: 'start',
            title: 'Start',
            content: 'Starting point',
            autoAdvance: true,
            outlets: [
              {
                id: 'path1',
                to: 'end1',
                condition: 'health > 50',
              },
              {
                id: 'path2',
                to: 'end2', // first default path
              },
              {
                id: 'path3',
                to: 'end3', // second default path - ERROR
              },
            ],
          },
          { id: 'end1', title: 'End 1', content: 'Good ending' },
          {
            id: 'end2',
            title: 'End 2',
            content: 'Default ending 1',
          },
          {
            id: 'end3',
            title: 'End 3',
            content: 'Default ending 2',
          },
        ],
      };

      const result = validator.validate(flow);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_path_structure');
      expect(result.errors[0].message).toContain('multiple default outlets');
    });

    it('should warn about suboptimal path order', () => {
      const flow: FlowDefinition = {
        id: 'test-flow',
        title: 'Test Flow',
        startNodeId: 'start',
        nodes: [
          {
            id: 'start',
            title: 'Start',
            content: 'Starting point',
            autoAdvance: true,
            outlets: [
              {
                id: 'path1',
                to: 'end1',
                condition: 'health > 50',
              },
              {
                id: 'path2',
                to: 'end2', // default path in middle
              },
              {
                id: 'path3',
                to: 'end3',
                condition: 'health <= 0', // conditional after default
              },
            ],
          },
          { id: 'end1', title: 'End 1', content: 'Good ending' },
          {
            id: 'end2',
            title: 'End 2',
            content: 'Default ending',
          },
          { id: 'end3', title: 'End 3', content: 'Dead ending' },
        ],
      };

      const result = validator.validate(flow);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('suboptimal_path_order');
      expect(result.warnings[0].message).toContain(
        'default outlet before conditional outlets'
      );
    });

    it('should warn about unreachable outlets after always-true condition', () => {
      const flow: FlowDefinition = {
        id: 'test-flow',
        title: 'Test Flow',
        startNodeId: 'start',
        nodes: [
          {
            id: 'start',
            title: 'Start',
            content: 'Starting point',
            autoAdvance: true,
            outlets: [
              {
                id: 'path1',
                to: 'end1',
                condition: 'health > 50',
              },
              {
                id: 'path2',
                to: 'end2',
                condition: 'true', // always true condition
              },
              {
                id: 'path3',
                to: 'end3',
                condition: 'health <= 0', // unreachable
              },
            ],
          },
          { id: 'end1', title: 'End 1', content: 'Good ending' },
          { id: 'end2', title: 'End 2', content: 'Always ending' },
          {
            id: 'end3',
            title: 'End 3',
            content: 'Unreachable ending',
          },
        ],
      };

      const result = validator.validate(flow);
      expect(result.isValid).toBe(true);

      // Should have warnings about unreachable path and missing default path
      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      const unreachableWarning = result.warnings.find(
        (w) => w.type === 'unreachable_path'
      );
      expect(unreachableWarning).toBeDefined();
      expect(unreachableWarning?.message).toContain('always-true condition');
    });

    it('should warn about missing default path', () => {
      const flow: FlowDefinition = {
        id: 'test-flow',
        title: 'Test Flow',
        startNodeId: 'start',
        nodes: [
          {
            id: 'start',
            title: 'Start',
            content: 'Starting point',
            autoAdvance: true,
            outlets: [
              {
                id: 'path1',
                to: 'end1',
                condition: 'health > 50',
              },
              {
                id: 'path2',
                to: 'end2',
                condition: 'health <= 50 && health > 0',
              },
              // No default path - what if health <= 0?
            ],
          },
          { id: 'end1', title: 'End 1', content: 'Good ending' },
          { id: 'end2', title: 'End 2', content: 'Bad ending' },
        ],
      };

      const result = validator.validate(flow);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('missing_default_path');
      expect(result.warnings[0].message).toContain('without a default outlet');
    });

    it('should not validate non-auto-advance nodes', () => {
      const flow: FlowDefinition = {
        id: 'test-flow',
        title: 'Test Flow',
        startNodeId: 'start',
        nodes: [
          {
            id: 'start',
            title: 'Start',
            content: 'Starting point',
            autoAdvance: false, // explicitly disabled
            outlets: [
              {
                id: 'path1',
                to: 'end1', // multiple default outlets, but auto-advance is disabled
              },
              {
                id: 'path2',
                to: 'end2',
              },
            ],
          },
          { id: 'end1', title: 'End 1', content: 'Ending 1' },
          { id: 'end2', title: 'End 2', content: 'Ending 2' },
        ],
      };

      const result = validator.validate(flow);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate decision nodes with default auto-advance', () => {
      const flow: FlowDefinition = {
        id: 'test-flow',
        title: 'Test Flow',
        startNodeId: 'start',
        nodes: [
          {
            id: 'start',
            title: 'Start',
            content: 'Starting point',
            outlets: [{ id: 'path1', to: 'decision' }],
          },
          {
            id: 'decision',
            title: 'Decision Point',
            content: 'Make a choice',
            autoAdvance: true,
            outlets: [
              {
                id: 'path1',
                to: 'end1', // multiple default outlets - should error
              },
              {
                id: 'path2',
                to: 'end2',
              },
            ],
          },
          { id: 'end1', title: 'End 1', content: 'Ending 1' },
          { id: 'end2', title: 'End 2', content: 'Ending 2' },
        ],
      };

      const result = validator.validate(flow);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_path_structure');
      expect(result.isValid).toBe(false);
    });
  });
});
