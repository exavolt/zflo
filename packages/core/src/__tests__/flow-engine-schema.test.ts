import { describe, it, expect, vi } from 'vitest';
import { FlowEngine } from '../core/flow-engine';
import type { FlowDefinition } from '../types/flow-types';
import type { JSONSchema7 } from 'json-schema';
import { StateManager } from '../core/state-manager';

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
    initialState: { [key: string]: unknown },
    stateSchema?: JSONSchema7
  ): FlowDefinition => ({
    id: 'test-flow',
    title: 'Test Flow with Schema',
    expressionLanguage: 'cel',
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
    initialState,
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
      expect(() => new FlowEngine(flow)).not.toThrow();
    });

    it('should reject invalid initial state during flow creation', async () => {
      const invalidState = {
        health: 150,
        level: 0,
        invalidProperty: 'not allowed',
      };
      const flow = createTestFlow(invalidState, gameStateSchema);
      expect(() => new FlowEngine(flow)).toThrow(
        'Initial state validation failed'
      );
    });

    it('should work without schema validation', async () => {
      const anyState = { anything: 'goes', when: 'no schema' };
      const flow = createTestFlow(anyState);
      expect(() => new FlowEngine(flow)).not.toThrow();
    });
  });

  describe('State Validation During Flow Execution', () => {
    it('should validate state changes during node actions', async () => {
      const validState = { health: 100, level: 1, score: 0 };
      const flow = createTestFlow(validState, gameStateSchema);
      const engine = new FlowEngine(flow);
      await engine.start();
      await expect(engine.next('to-action')).resolves.toBeDefined();
    });

    it('should reject invalid state changes from actions', async () => {
      const validState = { health: 5, level: 1, score: 0 };
      const flowWithInvalidAction: FlowDefinition = {
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
              { type: 'set', target: 'health', expression: 'health - 10' },
            ],
            outlets: [{ id: 'to-end', to: 'end', label: 'Continue' }],
          },
          { id: 'end', title: 'End' },
        ],
      };
      const engine = new FlowEngine(flowWithInvalidAction);
      await engine.start();
      await expect(engine.next('to-damage')).rejects.toThrow(
        'Action execution validation failed'
      );
    });

    it('should emit error events for validation failures', async () => {
      const validState = { health: 1, level: 1, score: 0 };
      const flowWithInvalidAction: FlowDefinition = {
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
            actions: [{ type: 'set', target: 'health', value: -50 }],
          },
        ],
      };
      const engine = new FlowEngine(flowWithInvalidAction);
      const errorSpy = vi.fn();
      engine.on('error', errorSpy);
      await engine.start();
      await expect(engine.next('to-invalid')).rejects.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          context: expect.objectContaining({ type: 'schemaValidation' }),
        })
      );
    });
  });

  describe('Complex Schema Scenarios', () => {
    it('should validate array constraints', async () => {
      const state = {
        health: 100,
        level: 1,
        inventory: ['item1', 'item2', 'item3', 'item4'],
      };
      const flow = createTestFlow(state, gameStateSchema);
      const validFlow: FlowDefinition = {
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
          { id: 'end', title: 'End' },
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
      const state = { player: { stats: { strength: 50 } } };
      const invalidFlow: FlowDefinition = {
        id: 'complex-test',
        title: 'Complex Schema Test',
        nodes: [
          {
            id: 'start',
            title: 'Start',
            actions: [
              { type: 'set', target: 'player.stats.strength', value: 150 },
            ],
          },
        ],
        startNodeId: 'start',
        initialState: state,
        stateSchema: complexSchema,
      };
      const engine = new FlowEngine(invalidFlow);
      await expect(engine.start()).rejects.toThrow(
        'Action execution validation failed'
      );
    });
  });

  describe('Schema Validation with Custom StateManager', () => {
    it('should respect custom StateManager validation settings', async () => {
      const state = { health: 100, level: 1 };
      const flow = createTestFlow(state, gameStateSchema);
      const customStateManager = new StateManager(state, [], {
        stateSchema: gameStateSchema,
        validateOnChange: false,
      });
      const engine = new FlowEngine(flow, {
        stateManager: customStateManager,
      });
      await customStateManager.setState({ health: -100 });
      expect(engine.getState().health).toBe(-100);
    });
  });

  describe('Performance and Caching', () => {
    it('should handle multiple flows with same schema efficiently', () => {
      const state1 = { health: 100, level: 1 };
      const state2 = { health: 80, level: 2 };
      const flow1 = createTestFlow(state1, gameStateSchema);
      const flow2 = createTestFlow(state2, gameStateSchema);
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

      const rpgFlow: FlowDefinition = {
        id: 'rpg-game',
        title: 'RPG Adventure',
        expressionLanguage: 'cel',
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
              { type: 'set', target: 'health', value: 100 },
            ],
          },
        ],
        startNodeId: 'start',
        initialState: {
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
      const context = await engine.start();
      expect(context.currentNode.definition.id).toBe('start');

      await engine.next('to-battle');
      expect(engine.getState().health).toBe(80);
      expect(engine.getState().experience).toBe(50);

      await engine.next('to-victory');
      expect(engine.getState().level).toBe(2);
      expect(engine.getState().health).toBe(100);
    });
  });
});
