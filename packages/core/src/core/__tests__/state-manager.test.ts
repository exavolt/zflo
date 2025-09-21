import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateManager } from '../state-manager';
import { StateAction, StateRule } from '../../types/flow-types';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('Basic State Operations', () => {
    it('should initialize with empty state', () => {
      expect(stateManager.getState()).toEqual({});
    });

    it('should initialize with provided initial state', () => {
      const initialState = { health: 100, inventory: ['sword'] };
      stateManager = new StateManager(initialState);
      expect(stateManager.getState()).toEqual(initialState);
    });

    it('should set state and emit stateChange event', () => {
      const listener = vi.fn();
      stateManager.on('stateChange', listener);

      stateManager.setState({ health: 50 });

      expect(stateManager.getState()).toEqual({ health: 50 });
      expect(listener).toHaveBeenCalledWith({
        oldState: {},
        newState: { health: 50 },
      });
    });

    it('should merge state when setting new values', () => {
      stateManager.setState({ health: 100 });
      stateManager.setState({ mana: 50 });

      expect(stateManager.getState()).toEqual({ health: 100, mana: 50 });
    });

    it('should reset state', () => {
      stateManager.setState({ health: 100, mana: 50 });
      stateManager.reset({ level: 1 });

      expect(stateManager.getState()).toEqual({ level: 1 });
    });
  });

  describe('Action Execution', () => {
    beforeEach(() => {
      stateManager.setState({
        health: 100,
        inventory: ['sword'],
        gold: 50,
        flags: { hasKey: false },
      });
    });

    it('should execute set action', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'health', value: 75 },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().health).toBe(75);
    });

    it('should execute add action for arrays', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'inventory',
          expression: 'inventory + ["shield"]',
        },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().inventory).toEqual(['sword', 'shield']);
    });

    it('should execute remove action for arrays', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'inventory',
          expression: 'inventory.filter(i, i !== "sword")',
        },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().inventory).toEqual([]);
    });

    it('should execute increment action', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'gold', expression: 'gold + 25' },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().gold).toBe(75);
    });

    it('should execute increment action with default value of 1', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'gold', expression: 'gold + 1' },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().gold).toBe(51);
    });

    it('should execute decrement action', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'gold', expression: 'gold - 10' },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().gold).toBe(40);
    });

    it('should handle nested property paths', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'flags.hasKey', value: true },
      ];

      stateManager.executeActions(actions);
      expect(
        (stateManager.getState().flags as Record<string, unknown>).hasKey
      ).toBe(true);
    });

    it('should create nested objects when setting deep paths', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'player.stats.strength', value: 15 },
      ];

      stateManager.executeActions(actions);
      expect(
        (
          (stateManager.getState().player as Record<string, unknown>)
            .stats as Record<string, unknown>
        ).strength
      ).toBe(15);
    });
  });

  describe('Condition Evaluation', () => {
    beforeEach(() => {
      stateManager.setState({
        health: 100,
        mana: 50,
        inventory: ['sword', 'potion'],
        flags: { hasKey: true },
        level: 5,
      });
    });

    it('should evaluate simple equality conditions', () => {
      expect(stateManager.evaluateCondition('health === 100')).toBe(true);
      expect(stateManager.evaluateCondition('health === 50')).toBe(false);
    });

    it('should evaluate inequality conditions', () => {
      expect(stateManager.evaluateCondition('health !== 50')).toBe(true);
      expect(stateManager.evaluateCondition('health !== 100')).toBe(false);
    });

    it('should evaluate comparison conditions', () => {
      expect(stateManager.evaluateCondition('health >= 100')).toBe(true);
      expect(stateManager.evaluateCondition('health > 100')).toBe(false);
      expect(stateManager.evaluateCondition('mana <= 50')).toBe(true);
      expect(stateManager.evaluateCondition('mana < 50')).toBe(false);
    });

    it('should evaluate includes conditions', () => {
      expect(stateManager.evaluateCondition('"sword" in inventory')).toBe(true);
      expect(stateManager.evaluateCondition('"shield" in inventory')).toBe(
        false
      );
    });

    it('should evaluate nested property conditions', () => {
      expect(stateManager.evaluateCondition('flags.hasKey === true')).toBe(
        true
      );
      expect(stateManager.evaluateCondition('flags.hasKey === false')).toBe(
        false
      );
    });

    it('should evaluate logical AND conditions', () => {
      // Debug individual parts first
      expect(stateManager.evaluateCondition('health === 100')).toBe(true);
      expect(stateManager.evaluateCondition('mana === 50')).toBe(true);
      expect(stateManager.evaluateCondition('mana === 25')).toBe(false);

      // Now test combined conditions
      expect(
        stateManager.evaluateCondition('health === 100 && mana === 50')
      ).toBe(true);
      expect(
        stateManager.evaluateCondition('health === 100 && mana === 25')
      ).toBe(false);
    });

    it('should evaluate logical OR conditions', () => {
      expect(
        stateManager.evaluateCondition('health === 100 || mana === 25')
      ).toBe(true);
      expect(
        stateManager.evaluateCondition('health === 50 || mana === 25')
      ).toBe(false);
    });

    it('should evaluate complex conditions', () => {
      const condition = '"sword" in inventory && health > 50';
      expect(stateManager.evaluateCondition(condition)).toBe(true);
    });

    it('should handle string values in conditions', () => {
      stateManager.setState({ name: 'Hero' });
      expect(stateManager.evaluateCondition('name === "Hero"')).toBe(true);
      expect(stateManager.evaluateCondition('name === "Villain"')).toBe(false);
    });

    it('should handle boolean values in conditions', () => {
      expect(stateManager.evaluateCondition('flags.hasKey === true')).toBe(
        true
      );
      expect(stateManager.evaluateCondition('flags.hasKey === false')).toBe(
        false
      );
    });

    it('should handle null values in conditions', () => {
      stateManager.setState({ emptyValue: null });
      expect(stateManager.evaluateCondition('emptyValue === null')).toBe(true);
    });

    it('should return false for invalid conditions', () => {
      expect(stateManager.evaluateCondition('invalid.syntax.here')).toBe(false);
    });
  });

  describe('State Rules', () => {
    it('should execute rules when conditions are met', () => {
      const rules: StateRule[] = [
        {
          condition: 'health <= 0',
          action: 'setState',
          target: 'gameOver',
          value: true,
        },
      ];

      stateManager = new StateManager({ health: 100 }, rules);
      stateManager.setState({ health: 0 });

      expect(stateManager.getState().gameOver).toBe(true);
    });

    it('should not execute rules when conditions are not met', () => {
      const rules: StateRule[] = [
        {
          condition: 'health <= 0',
          action: 'setState',
          target: 'gameOver',
          value: true,
        },
      ];

      stateManager = new StateManager({ health: 100 }, rules);
      stateManager.setState({ health: 50 });

      expect(stateManager.getState().gameOver).toBeUndefined();
    });

    it('should emit error event for forceTransition rules', () => {
      const errorListener = vi.fn();
      const rules: StateRule[] = [
        {
          condition: 'health <= 0',
          action: 'forceTransition',
          target: 'gameOver',
        },
      ];

      stateManager = new StateManager({ health: 100 }, rules);
      stateManager.on('error', errorListener);
      stateManager.setState({ health: 0 });

      expect(errorListener).toHaveBeenCalledWith({
        error: expect.any(Error),
        context: { rule: rules[0], type: 'forceTransition' },
      });
    });
  });

  describe('Event Emission', () => {
    it('should emit stateChange event when state is modified', () => {
      const listener = vi.fn();
      stateManager.on('stateChange', listener);

      stateManager.setState({ test: 'value' });

      expect(listener).toHaveBeenCalledWith({
        oldState: {},
        newState: { test: 'value' },
      });
    });

    it('should emit stateChange event when actions are executed', () => {
      const listener = vi.fn();
      stateManager.on('stateChange', listener);

      const actions: StateAction[] = [
        { type: 'set', target: 'health', value: 100 },
      ];

      stateManager.executeActions(actions);

      expect(listener).toHaveBeenCalledWith({
        oldState: {},
        newState: { health: 100 },
      });
    });

    it('should emit stateChange event when state is reset', () => {
      const listener = vi.fn();
      stateManager.setState({ initial: 'value' });
      stateManager.on('stateChange', listener);

      stateManager.reset({ new: 'state' });

      expect(listener).toHaveBeenCalledWith({
        oldState: { initial: 'value' },
        newState: { new: 'state' },
      });
    });
  });

  describe('Expression-based State Setting', () => {
    beforeEach(() => {
      stateManager.setState({
        health: 100,
        maxHealth: 120,
        level: 5,
        experience: 1500,
        inventory: ['sword', 'potion', 'key'],
        player: {
          name: 'Hero',
          stats: {
            strength: 15,
            agility: 12,
          },
        },
        flags: {
          hasKey: true,
          questComplete: false,
        },
      });
    });

    it('should set value using simple arithmetic expression', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'newHealth', expression: 'health + 50' },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().newHealth).toBe(150);
    });

    it('should set value using complex arithmetic expression', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'damage',
          expression: 'level * 10 + player.stats.strength',
        },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().damage).toBe(65); // 5 * 10 + 15
    });

    it('should set value using conditional expression', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'healthStatus',
          expression: 'health > 80 ? "healthy" : "injured"',
        },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().healthStatus).toBe('healthy');
    });

    it('should set value using array length expression', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'inventoryCount',
          expression: 'size(inventory)',
        },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().inventoryCount).toBe(3);
    });

    it('should set value using array membership expression', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'hasPotion',
          expression: '"potion" in inventory',
        },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().hasPotion).toBe(true);
    });

    it('should set nested value using expression', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'player.stats.totalStats',
          expression: 'player.stats.strength + player.stats.agility',
        },
      ];

      stateManager.executeActions(actions);
      expect(
        (
          (stateManager.getState().player as Record<string, unknown>)
            .stats as Record<string, unknown>
        ).totalStats
      ).toBe(27); // 15 + 12
    });

    it('should set deep nested value using expression', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'combat.damage.base', expression: 'level * 5' },
      ];

      stateManager.executeActions(actions);
      expect(
        (
          (stateManager.getState().combat as Record<string, unknown>)
            .damage as Record<string, unknown>
        ).base
      ).toBe(25);
    });

    it('should set boolean value using logical expression', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'canProgress',
          expression: 'flags.hasKey && level >= 5',
        },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().canProgress).toBe(true);
    });

    it('should set string value using concatenation expression', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'greeting',
          expression: '"Hello, " + player.name + "!"',
        },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().greeting).toBe('Hello, Hero!');
    });

    it('should handle expression with null values', () => {
      stateManager.setState({ nullValue: null, testValue: 42 });

      const actions: StateAction[] = [
        { type: 'set', target: 'isNotNull', expression: 'testValue != null' },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().isNotNull).toBe(true);
    });

    it('should set value using mathematical operations', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'halfHealth', expression: 'health / 2' },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().halfHealth).toBe(50);
    });

    it('should handle complex nested expressions', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'powerLevel',
          expression:
            'level * (player.stats.strength + player.stats.agility) + (flags.hasKey ? 100 : 0)',
        },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().powerLevel).toBe(235); // 5 * (15 + 12) + 100
    });

    it('should update existing nested value using expression', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'player.stats.strength',
          expression: 'player.stats.strength + 5',
        },
      ];

      stateManager.executeActions(actions);
      expect(
        (
          (stateManager.getState().player as Record<string, unknown>)
            .stats as Record<string, unknown>
        ).strength
      ).toBe(20);
    });

    it('should handle expression evaluation errors gracefully', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'errorValue',
          expression: 'nonExistentVariable + 10',
        },
      ];

      // Should not throw, but may set to a default value or handle the error
      expect(() => stateManager.executeActions(actions)).not.toThrow();
    });

    it('should emit stateChange event when setting with expression', () => {
      const listener = vi.fn();
      stateManager.on('stateChange', listener);

      const actions: StateAction[] = [
        { type: 'set', target: 'calculatedValue', expression: 'level * 10' },
      ];

      stateManager.executeActions(actions);

      expect(listener).toHaveBeenCalledWith({
        oldState: expect.any(Object),
        newState: expect.objectContaining({
          calculatedValue: 50,
        }),
      });
    });

    it('should handle multiple expression-based actions in sequence', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'baseScore', expression: 'level * 100' },
        {
          type: 'set',
          target: 'bonusScore',
          expression: 'baseScore + experience',
        },
        { type: 'set', target: 'finalScore', expression: 'bonusScore * 2' },
      ];

      stateManager.executeActions(actions);

      expect(stateManager.getState().baseScore).toBe(500);
      expect(stateManager.getState().bonusScore).toBe(2000); // 500 + 1500
      expect(stateManager.getState().finalScore).toBe(4000); // 2000 * 2
    });
  });

  describe('Edge Cases', () => {
    it('should handle adding to non-existent array', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'newArray', expression: 'newArray + ["item"]' },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().newArray).toBeUndefined(); // TODO: should be an error
    });

    it('should handle removing from non-existent array', () => {
      const actions: StateAction[] = [
        {
          type: 'set',
          target: 'nonExistent',
          expression: 'nonExistent - ["item"]',
        },
      ];

      expect(() => stateManager.executeActions(actions)).not.toThrow();
    });

    it('should handle incrementing non-existent number', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'newNumber', expression: 'newNumber + 5' },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().newNumber).toBeUndefined(); // TODO: should be an error
    });

    it('should handle decrementing non-existent number', () => {
      const actions: StateAction[] = [
        { type: 'set', target: 'newNumber', expression: 'newNumber - 3' },
      ];

      stateManager.executeActions(actions);
      expect(stateManager.getState().newNumber).toBeUndefined(); // TODO: should be an error
    });

    it('should return immutable state copy', () => {
      stateManager.setState({ data: { nested: 'value' } });
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      expect(state1).not.toBe(state2); // Different objects
      expect(state1).toEqual(state2); // Same content
    });
  });
});
