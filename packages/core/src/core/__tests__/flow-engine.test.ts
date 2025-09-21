import { describe, it, expect, beforeEach } from 'vitest';
import { FlowEngine } from '../flow-engine';
import { ZFFlow } from '../../types/flow-types';

describe('FlowEngine', () => {
  let simpleFlow: ZFFlow;
  let decisionFlow: ZFFlow;
  let stateFlow: ZFFlow;

  beforeEach(() => {
    simpleFlow = {
      id: 'simple-test',
      title: 'Simple Test Flow',
      startNodeId: 'start',
      globalState: {},
      nodes: [
        {
          id: 'start',
          title: 'Start',
          content: 'Welcome to the test',
          outlets: [{ id: 'start-to-end', to: 'end' }],
        },
        {
          id: 'end',
          title: 'End',
          content: 'Test complete',
          outlets: [],
        },
      ],
    };

    decisionFlow = {
      id: 'decision-test',
      title: 'Decision Test Flow',
      startNodeId: 'start',
      globalState: {},
      nodes: [
        {
          id: 'start',
          title: 'Start',
          outlets: [{ id: 'start-to-decision', to: 'decision' }],
        },
        {
          id: 'decision',
          title: 'Choose Path',
          content: 'Which way do you want to go?',
          outlets: [
            { id: 'left', to: 'left-end', label: 'Go Left' },
            { id: 'right', to: 'right-end', label: 'Go Right' },
          ],
        },
        {
          id: 'left-end',
          title: 'Left Path',
          content: 'You chose left',
          outlets: [],
        },
        {
          id: 'right-end',
          title: 'Right Path',
          content: 'You chose right',
          outlets: [],
        },
      ],
    };

    stateFlow = {
      id: 'state-test',
      title: 'State Test Flow',
      startNodeId: 'start',
      globalState: { score: 0, hasKey: false },
      nodes: [
        {
          id: 'start',
          title: 'Start',
          outlets: [{ id: 'start-to-action', to: 'action' }],
        },
        {
          id: 'action',
          title: 'Get Key',
          content: 'You found a key!',
          actions: [
            { type: 'set', target: 'hasKey', value: true },
            { type: 'set', target: 'score', expression: 'score + 1' },
          ],
          outlets: [{ id: 'action-to-end', to: 'end' }],
        },
        {
          id: 'end',
          title: 'End',
          content: 'Adventure complete',
          outlets: [],
        },
      ],
    };
  });

  describe('Basic Flow Execution', () => {
    it('should start a simple flow', async () => {
      const engine = new FlowEngine(simpleFlow);
      const result = await engine.start();

      expect(result.node.node.id).toBe('start');
      expect(result.node.type).toBe('start');
      expect(result.choices).toHaveLength(1);
      expect(result.choices[0].label).toBe('Continue');
      expect(result.isComplete).toBe(false);
    });

    it('should progress through a simple flow', async () => {
      const engine = new FlowEngine(simpleFlow);
      const startResult = await engine.start();

      // Get the choice ID from the start result
      const choiceId = startResult.choices[0].id;
      const result = await engine.next(choiceId);

      expect(result.node.node.id).toBe('end');
      expect(result.node.type).toBe('end');
      expect(result.choices).toHaveLength(0);
      expect(result.isComplete).toBe(true);
    });

    it('should handle decision nodes', async () => {
      const engine = new FlowEngine(decisionFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      const result = await engine.next(choiceId);

      expect(result.node.node.id).toBe('decision');
      expect(result.node.type).toBe('decision');
      expect(result.choices).toHaveLength(2);
      expect(result.choices[0].label).toBe('Go Left');
      expect(result.choices[1].label).toBe('Go Right');
      expect(result.isComplete).toBe(false);
    });

    it('should handle user choices', async () => {
      const engine = new FlowEngine(decisionFlow);
      const startResult = await engine.start();
      const startChoiceId = startResult.choices[0].id;
      await engine.next(startChoiceId); // Move to decision

      const result = await engine.next('left');

      expect(result.node.node.id).toBe('left-end');
      expect(result.node.node.title).toBe('Left Path');
      expect(result.isComplete).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should execute node actions', async () => {
      const engine = new FlowEngine(stateFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId); // Move to action node

      const state = engine.getState();
      expect(state.hasKey).toBe(true);
      expect(state.score).toBe(1);
    });

    it('should maintain state throughout execution', async () => {
      const engine = new FlowEngine(stateFlow);
      const startResult = await engine.start();

      let state = engine.getState();
      expect(state.hasKey).toBe(false);
      expect(state.score).toBe(0);

      const firstChoiceId = startResult.choices[0].id;
      await engine.next(firstChoiceId); // Move to action node

      // Explicitly advance from action node to next when single path exists
      await engine.next();

      state = engine.getState();
      expect(state.hasKey).toBe(true);
      expect(state.score).toBe(1);

      // Should be at end node now after explicit advance
      expect(engine.getCurrentNode()?.node.id).toBe('end');
    });
  });

  describe('History Management', () => {
    it('should track history by default', async () => {
      const engine = new FlowEngine(simpleFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId);

      const history = engine.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].node.node.id).toBe('start');
      expect(history[1].node.node.id).toBe('end');
    });

    it('should support going back', async () => {
      const engine = new FlowEngine(simpleFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId);

      expect(engine.canGoBack()).toBe(true);

      const result = await engine.goBack();
      expect(result.node.node.id).toBe('start');
    });

    it('should disable history when configured', async () => {
      const engine = new FlowEngine(simpleFlow, { enableHistory: false });
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId);

      expect(engine.canGoBack()).toBe(false);
      expect(engine.getHistory()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for missing start node', async () => {
      const invalidFlow = { ...simpleFlow, startNodeId: 'nonexistent' };
      const engine = new FlowEngine(invalidFlow);

      await expect(engine.start()).rejects.toThrow(
        'Start node with id "nonexistent" not found'
      );
    });

    it('should throw error for invalid choice', async () => {
      const engine = new FlowEngine(decisionFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId); // Move to decision

      await expect(engine.next('invalid-choice')).rejects.toThrow(
        'Invalid choice: invalid-choice'
      );
    });

    it('should throw error when calling next without starting', async () => {
      const engine = new FlowEngine(simpleFlow);

      await expect(engine.next()).rejects.toThrow(
        'No current node. Call start() first.'
      );
    });
  });

  describe('Engine Options', () => {
    it('should respect maxHistorySize option', async () => {
      const engine = new FlowEngine(simpleFlow, { maxHistorySize: 1 });
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId);

      const history = engine.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].node.node.id).toBe('end'); // Only keeps the latest
    });

    it('should handle initial state option', async () => {
      const engine = new FlowEngine(stateFlow, {
        initialState: { score: 10, hasKey: true },
      });
      await engine.start();

      const state = engine.getState();
      expect(state.score).toBe(10);
      expect(state.hasKey).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset engine state', async () => {
      const engine = new FlowEngine(stateFlow);
      const startResult = await engine.start();
      const firstChoiceId = startResult.choices[0].id;
      await engine.next(firstChoiceId); // Move to action node

      // Explicitly advance from action node to next when single path exists
      await engine.next();

      expect(engine.getState().hasKey).toBe(true);
      expect(engine.getCurrentNode()?.node.id).toBe('end');

      engine.reset();

      expect(engine.getCurrentNode()).toBe(null);
      expect(engine.getState().hasKey).toBe(false);
      expect(engine.getHistory()).toHaveLength(0);
    });
  });

  describe('Conditional outlets', () => {
    it('should evaluate path conditions', async () => {
      const conditionalFlow: ZFFlow = {
        id: 'conditional-test',
        title: 'Conditional Test',
        startNodeId: 'start',
        globalState: { hasKey: false },
        nodes: [
          {
            id: 'start',
            title: 'Start',
            outlets: [{ id: 'start-to-door', to: 'door' }],
          },
          {
            id: 'door',
            title: 'Locked Door',
            content: 'You see a locked door',
            isAutoAdvance: false, // Prevent auto-advance to ensure we stay at decision node
            outlets: [
              {
                id: 'open-door',
                to: 'success',
                label: 'Open door',
                condition: 'hasKey',
              },
              { id: 'no-key', to: 'failure', label: 'Try anyway' },
            ],
          },
          {
            id: 'success',
            title: 'Success',
            content: 'Door opened!',
            outlets: [],
          },
          {
            id: 'failure',
            title: 'Failure',
            content: 'Door is locked',
            outlets: [],
          },
        ],
      };

      const engine = new FlowEngine(conditionalFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId); // Move to door

      const currentNode = engine.getCurrentNode();
      expect(currentNode?.node.id).toBe('door');

      const choices = engine.getAvailableChoices();
      // Should only show the "Try anyway" option since hasKey is false
      expect(choices).toHaveLength(1);
      expect(choices[0].label).toBe('Try anyway');
    });
  });

  describe('Path Actions', () => {
    it('should execute path actions when transitioning via specific path', async () => {
      const pathActionsFlow: ZFFlow = {
        id: 'path-actions-test',
        title: 'Path Actions Test',
        startNodeId: 'start',
        globalState: { score: 0, coins: 0 },
        nodes: [
          {
            id: 'start',
            title: 'Start',
            outlets: [{ id: 'start-to-choice', to: 'choice' }],
          },
          {
            id: 'choice',
            title: 'Choose Your Path',
            content: 'Which path do you take?',
            outlets: [
              {
                id: 'treasure-path',
                to: 'end',
                label: 'Treasure Path',
                actions: [
                  { type: 'set', target: 'score', value: 100 },
                  { type: 'set', target: 'coins', expression: 'coins + 1' },
                ],
              },
              {
                id: 'danger-path',
                to: 'end',
                label: 'Danger Path',
                actions: [
                  { type: 'set', target: 'score', expression: 'score - 1' },
                ],
              },
            ],
          },
          {
            id: 'end',
            title: 'End',
            content: 'Journey complete',
            outlets: [],
          },
        ],
      };

      const engine = new FlowEngine(pathActionsFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId); // Move to choice

      // Take the treasure path
      await engine.next('treasure-path');

      const state = engine.getState();
      expect(state.score).toBe(100); // Set by path action
      expect(state.coins).toBe(1); // Incremented by path action
      expect(engine.getCurrentNode()?.node.id).toBe('end');
    });

    it('should execute different path actions based on choice', async () => {
      const pathActionsFlow: ZFFlow = {
        id: 'path-actions-test-2',
        title: 'Path Actions Test 2',
        startNodeId: 'start',
        globalState: { score: 10, health: 100 },
        nodes: [
          {
            id: 'start',
            title: 'Start',
            outlets: [{ id: 'start-to-choice', to: 'choice' }],
          },
          {
            id: 'choice',
            title: 'Choose Your Action',
            content: 'What do you do?',
            outlets: [
              {
                id: 'heal-path',
                to: 'end',
                label: 'Rest and Heal',
                actions: [
                  { type: 'set', target: 'health', value: 100 },
                  { type: 'set', target: 'score', expression: 'score + 1' },
                ],
              },
              {
                id: 'fight-path',
                to: 'end',
                label: 'Fight Monster',
                actions: [
                  { type: 'set', target: 'health', expression: 'health - 1' },
                  { type: 'set', target: 'score', value: 50 },
                ],
              },
            ],
          },
          {
            id: 'end',
            title: 'End',
            content: 'Adventure complete',
            outlets: [],
          },
        ],
      };

      const engine = new FlowEngine(pathActionsFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId); // Move to choice

      // Take the fight path
      await engine.next('fight-path');

      const state = engine.getState();
      expect(state.health).toBe(99); // Decremented by path action
      expect(state.score).toBe(50); // Set by path action
      expect(engine.getCurrentNode()?.node.id).toBe('end');
    });

    it('should execute both path actions and node actions in correct order', async () => {
      const combinedActionsFlow: ZFFlow = {
        id: 'combined-actions-test',
        title: 'Combined Actions Test',
        startNodeId: 'start',
        globalState: { value: 0 },
        nodes: [
          {
            id: 'start',
            title: 'Start',
            outlets: [
              {
                id: 'start-to-action',
                to: 'action',
                actions: [
                  { type: 'set', target: 'value', value: 10 }, // Path action: set to 10
                ],
              },
            ],
          },
          {
            id: 'action',
            title: 'Action Node',
            content: 'Processing...',
            actions: [
              { type: 'set', target: 'value', expression: 'value + 1' }, // Node action: increment (10 -> 11)
            ],
            outlets: [{ id: 'action-to-end', to: 'end' }],
          },
          {
            id: 'end',
            title: 'End',
            content: 'Complete',
            outlets: [],
          },
        ],
      };

      const engine = new FlowEngine(combinedActionsFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId); // Move to action node (path actions execute first)

      const state = engine.getState();
      expect(state.value).toBe(11); // Path action set to 10, then node action incremented to 11
    });

    it('should handle outlets without actions', async () => {
      const mixedOutletsFlow: ZFFlow = {
        id: 'mixed-outlets-test',
        title: 'Mixed Outlets Test',
        startNodeId: 'start',
        globalState: { counter: 0 },
        nodes: [
          {
            id: 'start',
            title: 'Start',
            outlets: [{ id: 'start-to-choice', to: 'choice' }],
          },
          {
            id: 'choice',
            title: 'Choose',
            content: 'Pick an option',
            outlets: [
              {
                id: 'action-path',
                to: 'end',
                label: 'Path with Actions',
                actions: [
                  { type: 'set', target: 'counter', expression: 'counter + 1' },
                ],
              },
              {
                id: 'no-action-path',
                to: 'end',
                label: 'Path without Actions',
                // No actions property
              },
            ],
          },
          {
            id: 'end',
            title: 'End',
            content: 'Done',
            outlets: [],
          },
        ],
      };

      const engine = new FlowEngine(mixedOutletsFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId); // Move to choice

      // Take path without actions
      await engine.next('no-action-path');

      const state = engine.getState();
      expect(state.counter).toBe(0); // Should remain unchanged
      expect(engine.getCurrentNode()?.node.id).toBe('end');
    });

    it('should handle expression-based path actions', async () => {
      const expressionPathFlow: ZFFlow = {
        id: 'expression-path-test',
        title: 'Expression Path Test',
        startNodeId: 'start',
        globalState: { base: 5, multiplier: 3 },
        nodes: [
          {
            id: 'start',
            title: 'Start',
            outlets: [
              {
                id: 'start-to-end',
                to: 'end',
                actions: [
                  {
                    type: 'set',
                    target: 'result',
                    expression: 'base * multiplier',
                  },
                ],
              },
            ],
          },
          {
            id: 'end',
            title: 'End',
            content: 'Calculation complete',
            outlets: [],
          },
        ],
      };

      const engine = new FlowEngine(expressionPathFlow);
      const startResult = await engine.start();
      const choiceId = startResult.choices[0].id;
      await engine.next(choiceId);

      const state = engine.getState();
      expect(state.result).toBe(15); // 5 * 3 = 15
      expect(engine.getCurrentNode()?.node.id).toBe('end');
    });
  });
});
