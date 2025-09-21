import { describe, it, expect } from 'vitest';
import { FlowEngine } from '../core/flow-engine';
import { ZFFlow } from '../types';

describe('Expanded String Interpolation', () => {
  const testFlow: ZFFlow = {
    id: 'expanded-interpolation-test',
    title: 'Expanded Interpolation Test Flow',
    description: 'Test flow for expanded string interpolation functionality',
    startNodeId: 'start',
    nodes: [
      {
        id: 'start',
        title: 'Welcome ${userName}!',
        content: 'Hello ${userName}, you have ${score} points.',
        outlets: [
          {
            id: 'start-to-choice',
            to: 'choice-node',
            label: 'Continue with ${score} points',
          },
        ],
      },
      {
        id: 'choice-node',
        title: 'Choose Your Path (Score: ${score})',
        content: 'What would you like to do next?',
        outlets: [
          {
            id: 'choice-to-high',
            to: 'high-score',
            label: 'View high score (${score} pts)',
            condition: 'score >= 100',
          },
          {
            id: 'choice-to-low',
            to: 'low-score',
            label: 'Practice more (${score} pts)',
            condition: 'score < 100',
          },
        ],
      },
      {
        id: 'high-score',
        title: 'High Score Achievement',
        content: 'Congratulations on your high score of ${score}!',
      },
      {
        id: 'low-score',
        title: 'Keep Trying',
        content: 'Your current score is ${score}. Keep practicing!',
      },
    ],
    expressionLanguage: 'cel',
  };

  it('should interpolate node titles dynamically', async () => {
    const engine = new FlowEngine(testFlow, { enableLogging: true });

    // Set initial state
    engine.getStateManager().setState({ userName: 'Alice', score: 150 });

    // Start the flow
    const result = await engine.start();

    // Check that node title is interpolated
    expect(result.node.node.title).toBe('Welcome Alice!');
    expect(result.node.node.content).toBe('Hello Alice, you have 150 points.');
  });

  it('should interpolate path labels dynamically', async () => {
    const engine = new FlowEngine(testFlow, { enableLogging: true });

    // Set initial state
    engine.getStateManager().setState({ userName: 'Bob', score: 75 });

    // Start the flow
    const startResult = await engine.start();

    // Check that path labels are interpolated in the start node choices
    const choices = startResult.choices;
    expect(choices).toHaveLength(1);
    expect(choices[0].label).toBe('Continue with 75 points');

    // Move to choice node
    const choiceResult = await engine.next(choices[0].id);

    // Check that node title is interpolated
    expect(choiceResult.node.node.title).toBe('Choose Your Path (Score: 75)');

    // Check that choice node path labels are interpolated
    const choiceNodeChoices = choiceResult.choices;
    expect(choiceNodeChoices).toHaveLength(1); // Only low score path should be available
    expect(choiceNodeChoices[0].label).toBe('Practice more (75 pts)');
  });

  it('should update interpolated content when state changes', async () => {
    const engine = new FlowEngine(testFlow, { enableLogging: true });

    // Set initial state
    engine.getStateManager().setState({ userName: 'Charlie', score: 50 });

    // Start the flow
    let result = await engine.start();
    expect(result.node.node.title).toBe('Welcome Charlie!');
    expect(result.node.node.content).toBe('Hello Charlie, you have 50 points.');

    // Update state
    engine.getStateManager().setState({ userName: 'Charlie', score: 200 });

    // Move to next node to see updated interpolation
    const nextResult = await engine.next(result.choices[0].id);
    expect(nextResult.node.node.title).toBe('Choose Your Path (Score: 200)');
    expect(nextResult.choices[0].label).toBe('View high score (200 pts)'); // Now high score should be available
  });

  it('should handle interpolation in both enabled and disabled path labels', async () => {
    const engine = new FlowEngine(testFlow, {
      enableLogging: true,
      showDisabledChoices: true,
    });

    // Set state where score is low (< 100)
    engine.getStateManager().setState({ userName: 'David', score: 25 });

    // Start and move to choice node
    const startResult = await engine.start();
    const choiceResult = await engine.next(startResult.choices[0].id);

    // Check that both enabled and disabled choices have interpolated labels
    const choices = choiceResult.choices;
    expect(choices).toHaveLength(2);

    // Find the choices by their target nodes
    const highScoreChoice = choices.find((c) => c.id === 'choice-to-high');
    const lowScoreChoice = choices.find((c) => c.id === 'choice-to-low');

    expect(highScoreChoice?.label).toBe('View high score (25 pts)');
    expect(highScoreChoice?.disabled).toBe(true);

    expect(lowScoreChoice?.label).toBe('Practice more (25 pts)');
    expect(lowScoreChoice?.disabled).toBe(false);
  });

  it('should handle missing variables gracefully in titles and labels', async () => {
    const engine = new FlowEngine(testFlow, { enableLogging: true });

    // Start without setting any state
    const result = await engine.start();

    // Missing variables result in empty strings
    expect(result.node.node.title).toBe('Welcome !');
    expect(result.node.node.content).toBe('Hello , you have  points.');
  });

  it('should handle escaped interpolations in titles and labels', async () => {
    const flowWithEscaping: ZFFlow = {
      id: 'escaping-test',
      title: 'Escaping Test Flow',
      description: 'Test flow for escaped interpolation',
      startNodeId: 'start',
      nodes: [
        {
          id: 'start',
          title: 'Literal \\${variable} and interpolated ${userName}',
          content: 'This shows \\${escaped} and ${score} points.',
          outlets: [
            {
              id: 'start-to-next',
              to: 'next',
              label: 'Continue with \\${literal} and ${score} points',
            },
          ],
        },
        {
          id: 'next',
          title: 'Next Node',
          content: 'You made it!',
        },
      ],
      expressionLanguage: 'cel',
    };

    const engine = new FlowEngine(flowWithEscaping, { enableLogging: true });
    engine.getStateManager().setState({ userName: 'Eve', score: 100 });

    const result = await engine.start();

    // Check escaped and interpolated content
    expect(result.node.node.title).toBe(
      'Literal ${variable} and interpolated Eve'
    );
    expect(result.node.node.content).toBe(
      'This shows ${escaped} and 100 points.'
    );

    // Check path label escaping
    expect(result.choices).toHaveLength(1);
    expect(result.choices[0].label).toBe(
      'Continue with ${literal} and 100 points'
    );
  });
});
