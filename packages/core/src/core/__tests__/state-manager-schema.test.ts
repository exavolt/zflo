import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateManager } from '../state-manager';
import type { JSONSchema7 } from 'json-schema';

describe('StateManager Schema Validation', () => {
  const gameStateSchema: JSONSchema7 = {
    type: 'object',
    properties: {
      health: { type: 'number', minimum: 0, maximum: 100 },
      level: { type: 'integer', minimum: 1 },
      score: { type: 'number', minimum: 0 },
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

  describe('Schema Validation on Initialization', () => {
    it('should accept valid initial state', () => {
      const validState = {
        health: 100,
        level: 1,
        score: 0,
        player: { name: 'Hero', class: 'warrior' },
      };

      expect(() => {
        new StateManager(validState, [], {
          stateSchema: gameStateSchema,
          validateOnChange: true,
        });
      }).not.toThrow();
    });

    it('should reject invalid initial state', () => {
      const invalidState = {
        health: 150, // Above maximum
        level: 0, // Below minimum
        player: { name: '', class: 'invalid' }, // Invalid values
      };

      expect(() => {
        new StateManager(invalidState, [], {
          stateSchema: gameStateSchema,
          validateOnChange: true,
        });
      }).toThrow('Initial state validation failed');
    });

    it('should work without schema validation', () => {
      const anyState = { anything: 'goes', when: 'no schema' };

      expect(() => {
        new StateManager(anyState, []);
      }).not.toThrow();
    });
  });

  describe('Schema Validation on setState', () => {
    let stateManager: StateManager<{ [key: string]: unknown }>;

    beforeEach(() => {
      const initialState = {
        health: 100,
        level: 1,
        player: { name: 'Hero', class: 'warrior' },
      };

      stateManager = new StateManager(initialState, [], {
        stateSchema: gameStateSchema,
        validateOnChange: true,
      });
    });

    it('should accept valid state updates', () => {
      expect(() => {
        stateManager.setState({ health: 85, score: 100 });
      }).not.toThrow();

      expect(stateManager.getState().health).toBe(85);
      expect(stateManager.getState().score).toBe(100);
    });

    it('should reject invalid state updates', () => {
      expect(() => {
        stateManager.setState({ health: -10 }); // Below minimum
      }).toThrow('State update validation failed');

      expect(() => {
        stateManager.setState({ level: 0 }); // Below minimum
      }).toThrow('State update validation failed');
    });

    it('should reject additional properties', () => {
      expect(() => {
        stateManager.setState({ invalidProperty: 'not allowed' });
      }).toThrow('State update validation failed');
    });

    it('should emit error events on validation failure', () => {
      const errorSpy = vi.fn();
      stateManager.on('error', errorSpy);

      expect(() => {
        stateManager.setState({ health: 200 });
      }).toThrow();

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

  describe('Schema Validation on executeActions', () => {
    let stateManager: StateManager<{ [key: string]: unknown }>;

    beforeEach(() => {
      const initialState = {
        health: 100,
        level: 1,
        score: 0,
        player: { name: 'Hero', class: 'warrior' },
      };

      stateManager = new StateManager(initialState, [], {
        stateSchema: gameStateSchema,
        validateOnChange: true,
      });
    });

    it('should validate state after action execution', () => {
      const validActions = [
        { type: 'set' as const, target: 'health', value: 90 },
        { type: 'set' as const, target: 'score', value: 150 },
      ];

      expect(() => {
        stateManager.executeActions(validActions);
      }).not.toThrow();
    });

    it('should reject actions that result in invalid state', () => {
      const invalidActions = [
        { type: 'set' as const, target: 'health', value: -50 }, // Below minimum
      ];

      expect(() => {
        stateManager.executeActions(invalidActions);
      }).toThrow('Action execution validation failed');
    });

    it('should validate complex nested updates', () => {
      const nestedActions = [
        { type: 'set' as const, target: 'player.name', value: 'Updated Hero' },
      ];

      expect(() => {
        stateManager.executeActions(nestedActions);
      }).not.toThrow();

      expect(
        (stateManager.getState() as { player: { name: string } }).player.name
      ).toBe('Updated Hero');
    });
  });

  describe('Schema Validation on reset', () => {
    let stateManager: StateManager<{ [key: string]: unknown }>;

    beforeEach(() => {
      const initialState = {
        health: 100,
        level: 1,
        player: { name: 'Hero', class: 'warrior' },
      };

      stateManager = new StateManager(initialState, [], {
        stateSchema: gameStateSchema,
        validateOnChange: true,
      });
    });

    it('should validate reset state', () => {
      const validResetState = {
        health: 50,
        level: 2,
        player: { name: 'New Hero', class: 'mage' },
      };

      expect(() => {
        stateManager.reset(validResetState);
      }).not.toThrow();

      expect(
        (stateManager.getState() as { player: { class: string } }).player.class
      ).toBe('mage');
    });

    it('should reject invalid reset state', () => {
      const invalidResetState = {
        health: 200, // Above maximum
        level: -1, // Below minimum
        player: { name: 'Hero', class: 'invalid' },
      };

      expect(() => {
        stateManager.reset(invalidResetState);
      }).toThrow('State reset validation failed');
    });
  });

  describe('Validation Configuration', () => {
    it('should skip validation when validateOnChange is false', () => {
      const initialState = {
        health: 100,
        level: 1,
        player: { name: 'Hero', class: 'warrior' },
      };

      const stateManager = new StateManager(initialState, [], {
        stateSchema: gameStateSchema,
        validateOnChange: false, // Disable validation
      });

      // This should not throw even though it's invalid
      expect(() => {
        stateManager.setState({ health: -100 });
      }).not.toThrow();
    });

    it('should skip validation when no schema is provided', () => {
      const stateManager = new StateManager({ anything: 'goes' }, []);

      expect(() => {
        stateManager.setState({ completely: 'invalid', but: 'allowed' } as {
          [key: string]: unknown;
        });
      }).not.toThrow();
    });
  });

  describe('Error Context and Messages', () => {
    let stateManager: StateManager<{ [key: string]: unknown }>;
    let errorSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      const initialState = {
        health: 100,
        level: 1,
        player: { name: 'Hero', class: 'warrior' },
      };

      stateManager = new StateManager(initialState, [], {
        stateSchema: gameStateSchema,
        validateOnChange: true,
      });

      errorSpy = vi.fn();
      stateManager.on('error', errorSpy);
    });

    it('should provide detailed error context', () => {
      expect(() => {
        stateManager.setState({ health: 'not-a-number' });
      }).toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          context: expect.objectContaining({
            type: 'schemaValidation',
            errors: expect.arrayContaining([
              expect.stringContaining('Invalid type at /health'),
            ]),
          }),
        })
      );
    });

    it('should include validation errors in thrown error message', () => {
      expect(() => {
        stateManager.setState({ level: 0 });
      }).toThrow(/State update validation failed.*below minimum/);
    });
  });

  describe('Real-world Game Scenarios', () => {
    let gameState: StateManager<{ [key: string]: unknown }>;

    beforeEach(() => {
      const initialState = {
        health: 100,
        level: 1,
        score: 0,
        inventory: ['sword'],
        player: { name: 'Adventurer', class: 'warrior' },
      };

      gameState = new StateManager(initialState, [], {
        stateSchema: gameStateSchema,
        validateOnChange: true,
      });
    });

    it('should handle level up scenario', () => {
      expect(() => {
        gameState.executeActions([
          { type: 'set', target: 'level', expression: 'level + 1' },
          { type: 'set', target: 'health', value: 100 }, // Full heal on level up
        ]);
      }).not.toThrow();

      expect(gameState.getState().level).toBe(2);
    });

    it('should prevent invalid inventory operations', () => {
      // Try to add too many items
      const tooManyItems = Array(15).fill('item'); // More than maxItems: 10

      expect(() => {
        gameState.setState({ inventory: tooManyItems });
      }).toThrow('State update validation failed');
    });

    it('should validate player class changes', () => {
      expect(() => {
        gameState.executeActions([
          { type: 'set', target: 'player.class', value: 'mage' },
        ]);
      }).not.toThrow();

      expect(() => {
        gameState.executeActions([
          { type: 'set', target: 'player.class', value: 'invalid-class' },
        ]);
      }).toThrow();
    });
  });
});
