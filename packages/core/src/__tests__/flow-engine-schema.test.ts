import { describe, it, expect, vi } from 'vitest';
import { FlowEngine } from '../core/flow-engine';
import type { ZFFlow } from '../types';
import type { JSONSchema7 } from 'json-schema';

describe('FlowEngine Schema Validation Integration', () => {
  const gameStateSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      health: { type: 'number', minimum: 0, maximum: 100 },
      level: { type: 'integer', minimum: 1 },
      score: { type: 'number', minimum: 0 },
      inventory: {
        type: 'array',
        items: { type: 'string' },
        maxItems: 5,
      },
    },
    required: ['health', 'level'],
    additionalProperties: false,
  };

  const createTestFlow = (
    globalState: { [key: string]: unknown },
    stateSchema?: JSONSchema7
  ): ZFFlow => ({
    id: 'test-flow',
    title: 'Test Flow with Schema',
    nodes: [
      {
        id: 'start',
        title: 'Start',
        content: 'Welcome to the game!',
        outlets: [{ id: 'to-action', to: 'action', label: 'Continue' }],
      },
      {
        id: 'action',
        title: 'Action Node',
        content: 'Take an action',
        actions: [
          { type: 'set', target: 'score', expression: 'score + 10' },
          { type: 'set', target: 'health', expression: 'health - 5' },
        ],
        outlets: [{ id: 'to-end', to: 'end', label: 'Finish' }],
      },
      {
        id: 'end',
        title: 'End',
        content: 'Game over!',
      },
    ],
    startNodeId: 'start',
    globalState,
    stateSchema,
  });

  describe('Flow Initialization with Schema', () => {
    it('should initialize successfully with valid state and schema', async () => {
      const validState = {
        health: 100,
        level: 1,
        score: 0,
        inventory: ['sword'],
      };

      const flow = createTestFlow(validState, gameStateSchema);

      expect(() => {
        new FlowEngine(flow);
      }).not.toThrow();
    });

    it('should reject invalid initial state during flow creation', () => {
      const invalidState = {
        health: 150, // Above maximum
        level: 0, // Below minimum
        invalidProperty: 'not allowed',
      };

      const flow = createTestFlow(invalidState, gameStateSchema);

      expect(() => {
        new FlowEngine(flow);
      }).toThrow('Initial state validation failed');
    });

    it('should work without schema validation', async () => {
      const anyState = { anything: 'goes', when: 'no schema' };
      const flow = createTestFlow(anyState); // No schema

      expect(() => {
        new FlowEngine(flow);
      }).not.toThrow();
    });
  });

  describe('State Validation During Flow Execution', () => {
    it('should validate state changes during node actions', async () => {
      const validState = {
        health: 100,
        level: 1,
        score: 0,
      };

      const flow = createTestFlow(validState, gameStateSchema);
      const engine = new FlowEngine(flow);

      await engine.start();

      // This should work - valid state change
      expect(async () => {
        await engine.next('to-action');
      }).not.toThrow();
    });

    it('should reject invalid state changes from actions', async () => {
      const validState = {
        health: 5, // Low health
        level: 1,
        score: 0,
      };

      // Create flow with action that would make health negative
      const flowWithInvalidAction: ZFFlow = {
        ...createTestFlow(validState, gameStateSchema),
        nodes: [
          {
            id: 'start',
            title: 'Start',
            outlets: [{ id: 'to-damage', to: 'damage', label: 'Take Damage' }],
          },
          {
            id: 'damage',
            title: 'Damage Node',
            actions: [
              { type: 'set', target: 'health', expression: 'health - 10' }, // Would make health -5
            ],
            outlets: [{ id: 'to-end', to: 'end', label: 'Continue' }],
          },
          {
            id: 'end',
            title: 'End',
          },
        ],
      };

      const engine = new FlowEngine(flowWithInvalidAction);
      await engine.start();

      expect(async () => {
        await engine.next('to-damage');
      }).rejects.toThrow('Action execution validation failed');
    });

    it('should emit error events for validation failures', async () => {
      const validState = {
        health: 1,
        level: 1,
        score: 0,
      };

      const flowWithInvalidAction: ZFFlow = {
        ...createTestFlow(validState, gameStateSchema),
        nodes: [
          {
            id: 'start',
            title: 'Start',
            outlets: [
              { id: 'to-invalid', to: 'invalid', label: 'Invalid Action' },
            ],
          },
          {
            id: 'invalid',
            title: 'Invalid Action',
            actions: [
              { type: 'set', target: 'health', value: -50 }, // Invalid negative health
            ],
          },
        ],
      };

      const engine = new FlowEngine(flowWithInvalidAction);
      const errorSpy = vi.fn();
      engine.on('error', errorSpy);

      await engine.start();

      try {
        await engine.next('to-invalid');
      } catch (error) {
        // Expected to throw
        expect(error).toBeInstanceOf(Error);
      }

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          context: expect.objectContaining({
            type: 'schemaValidation',
          }),
        })
      );
    });
  });

  describe('Complex Schema Scenarios', () => {
    it('should validate array constraints', async () => {
      const state = {
        health: 100,
        level: 1,
        inventory: ['item1', 'item2', 'item3', 'item4'], // 4 items, max is 5
      };

      const flow = createTestFlow(state, gameStateSchema);

      // Should work - adding one more item (total 5, within limit)
      const validFlow: ZFFlow = {
        ...flow,
        nodes: [
          {
            id: 'start',
            title: 'Start',
            actions: [
              {
                type: 'set',
                target: 'inventory',
                expression: 'inventory + ["new-item"]',
              },
            ],
            outlets: [{ id: 'to-end', to: 'end', label: 'Continue' }],
          },
          {
            id: 'end',
            title: 'End',
          },
        ],
      };

      const validEngine = new FlowEngine(validFlow);
      await validEngine.start();

      expect(validEngine.getState().inventory).toHaveLength(5);
    });

    it('should reject schema violations in complex nested updates', async () => {
      const complexSchema: JSONSchema7 = {
        type: 'object',
        properties: {
          player: {
            type: 'object',
            properties: {
              stats: {
                type: 'object',
                properties: {
                  strength: { type: 'number', minimum: 1, maximum: 100 },
                },
                required: ['strength'],
              },
            },
            required: ['stats'],
          },
        },
        required: ['player'],
      };

      const state = {
        player: {
          stats: {
            strength: 50,
          },
        },
      };

      const invalidFlow: ZFFlow = {
        id: 'complex-test',
        title: 'Complex Schema Test',
        nodes: [
          {
            id: 'start',
            title: 'Start',
            actions: [
              { type: 'set', target: 'player.stats.strength', value: 150 }, // Above max
            ],
          },
        ],
        startNodeId: 'start',
        globalState: state,
        stateSchema: complexSchema,
      };

      const engine = new FlowEngine(invalidFlow);

      await expect(async () => {
        await engine.start();
      }).rejects.toThrow('Action execution validation failed');
    });
  });

  describe('Schema Validation with Custom StateManager', () => {
    it('should respect custom StateManager validation settings', async () => {
      const state = { health: 100, level: 1 };
      const flow = createTestFlow(state, gameStateSchema);

      // Create engine with custom StateManager that has validation disabled
      const customStateManager = new (
        await import('../core/state-manager')
      ).StateManager(state, [], {
        stateSchema: gameStateSchema,
        validateOnChange: false, // Disable validation
      });

      const engine = new FlowEngine(flow, {
        stateManager: customStateManager,
      });

      // This should not throw even with invalid state because validation is disabled
      customStateManager.setState({ health: -100 }); // Invalid but allowed

      expect(engine.getState().health).toBe(-100);
    });
  });

  describe('Performance and Caching', () => {
    it('should handle multiple flows with same schema efficiently', () => {
      const state1 = { health: 100, level: 1 };
      const state2 = { health: 80, level: 2 };

      const flow1 = createTestFlow(state1, gameStateSchema);
      const flow2 = createTestFlow(state2, gameStateSchema);

      // Both should use cached schema validator
      expect(() => {
        new FlowEngine(flow1);
        new FlowEngine(flow2);
      }).not.toThrow();
    });
  });

  describe('Real-world Game Flow Example', () => {
    it('should handle complete RPG-style game flow with validation', async () => {
      const rpgSchema: JSONSchema7 = {
        type: 'object',
        properties: {
          health: { type: 'number', minimum: 0, maximum: 100 },
          mana: { type: 'number', minimum: 0, maximum: 50 },
          level: { type: 'integer', minimum: 1, maximum: 99 },
          experience: { type: 'number', minimum: 0 },
          gold: { type: 'number', minimum: 0 },
          equipment: {
            type: 'object',
            properties: {
              weapon: { type: 'string' },
              armor: { type: 'string' },
            },
          },
        },
        required: ['health', 'mana', 'level', 'experience', 'gold'],
        additionalProperties: false,
      };

      const rpgFlow: ZFFlow = {
        id: 'rpg-game',
        title: 'RPG Adventure',
        nodes: [
          {
            id: 'start',
            title: 'Begin Adventure',
            content: 'Your adventure begins!',
            outlets: [{ id: 'to-battle', to: 'battle', label: 'Enter Battle' }],
          },
          {
            id: 'battle',
            title: 'Battle',
            content: 'You face a monster!',
            actions: [
              { type: 'set', target: 'health', expression: 'health - 20' },
              { type: 'set', target: 'mana', expression: 'mana - 10' },
              {
                type: 'set',
                target: 'experience',
                expression: 'experience + 50',
              },
              { type: 'set', target: 'gold', expression: 'gold + 25' },
            ],
            outlets: [{ id: 'to-victory', to: 'victory', label: 'Victory!' }],
          },
          {
            id: 'victory',
            title: 'Victory',
            content: 'You won the battle!',
            actions: [
              { type: 'set', target: 'level', expression: 'level + 1' },
              { type: 'set', target: 'health', value: 100 }, // Full heal
            ],
          },
        ],
        startNodeId: 'start',
        globalState: {
          health: 100,
          mana: 50,
          level: 1,
          experience: 0,
          gold: 0,
          equipment: { weapon: 'sword', armor: 'leather' },
        },
        stateSchema: rpgSchema,
      };

      const engine = new FlowEngine(rpgFlow);

      await engine.start();
      expect(engine.getCurrentNode()?.node.id).toBe('start');

      await engine.next('to-battle');
      expect(engine.getState().health).toBe(80); // 100 - 20
      expect(engine.getState().experience).toBe(50);

      await engine.next('to-victory');
      expect(engine.getState().level).toBe(2);
      expect(engine.getState().health).toBe(100); // Healed to full
    });
  });
});
