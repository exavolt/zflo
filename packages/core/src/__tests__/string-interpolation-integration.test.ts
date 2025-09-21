import { describe, it, expect } from 'vitest';
import { FlowEngine } from '../core/flow-engine';
import { ZFFlow } from '../types';

describe('String Interpolation Integration', () => {
  const testFlow: ZFFlow = {
    id: 'coffee-temp-test',
    title: 'Coffee Temperature Test',
    description: 'Test string interpolation',
    startNodeId: 'welcome',
    globalState: {
      highTemp: 100,
      lowTemp: 80,
      midTemp: 90,
    },
    nodes: [
      {
        id: 'welcome',
        title: 'Welcome',
        content:
          'Temperature range: ${lowTemp}°C to ${highTemp}°C. Middle: ${(highTemp + lowTemp) / 2}°C',
        outlets: [{ id: 'welcome-to-brewing', to: 'brewing' }],
      },
      {
        id: 'brewing',
        title: 'Brewing',
        content:
          'Current temperature is ${midTemp}°C. Range is ${highTemp - lowTemp}°C wide.',
        outlets: [],
      },
    ],
  };

  it('should interpolate expressions in node content', async () => {
    const engine = new FlowEngine(testFlow);
    const result = await engine.start();

    expect(result.node.node.content).toBe(
      'Temperature range: 80°C to 100°C. Middle: 90°C'
    );
  });

  it('should interpolate dynamic expressions', async () => {
    const engine = new FlowEngine(testFlow);
    await engine.start();
    const nextResult = await engine.next('welcome-to-brewing');

    expect(nextResult.node.node.content).toBe(
      'Current temperature is 90°C. Range is 20°C wide.'
    );
  });

  it('should update interpolations when state changes', async () => {
    // Create a flow with state-dependent content
    const dynamicFlow: ZFFlow = {
      id: 'dynamic-test',
      title: 'Dynamic Content Test',
      description: 'Test dynamic state updates',
      startNodeId: 'dynamic',
      globalState: {
        temperature: 90,
      },
      nodes: [
        {
          id: 'dynamic',
          title: 'Dynamic Node',
          content: 'Current temperature: ${temperature}°C',
          outlets: [],
        },
      ],
    };

    const engine = new FlowEngine(dynamicFlow);
    const initialResult = await engine.start();

    expect(initialResult.node.node.content).toBe('Current temperature: 90°C');

    // Change the state
    engine.getStateManager().setState({ temperature: 85 });

    // Get the current node again to see updated interpolation
    const currentNode = engine.getCurrentNode();

    // The interpolation should reflect the updated state
    expect(currentNode?.node.content).toBe('Current temperature: 85°C');
  });

  it('should handle missing variables gracefully', async () => {
    const flowWithMissingVar: ZFFlow = {
      id: 'missing-var-test',
      title: 'Test Missing Var',
      description: 'Test missing variable handling',
      startNodeId: 'test',
      nodes: [
        {
          id: 'test',
          title: 'Test',
          content: 'Value: ${missingVar}, Known: ${knownVar}',
          outlets: [],
        },
      ],
      globalState: {
        knownVar: 'exists',
      },
    };

    const engine = new FlowEngine(flowWithMissingVar, { enableLogging: true });
    const result = await engine.start();

    // Missing variables should be replaced with empty string
    // Note: CEL evaluator returns undefined for missing variables, which gets converted to empty string
    expect(result.node.node.content).toBe('Value: , Known: exists');
  });

  it('should handle complex expressions', async () => {
    const complexFlow: ZFFlow = {
      id: 'complex-expressions-test',
      title: 'Complex Expressions',
      description: 'Test complex expression interpolation',
      startNodeId: 'complex',
      nodes: [
        {
          id: 'complex',
          title: 'Complex',
          content:
            'Result: ${a * 2 + b}, Boolean: ${a > b}, String: ${name + " World"}',
          outlets: [],
        },
      ],
      globalState: {
        a: 5,
        b: 3,
        name: 'Hello',
      },
    };

    const engine = new FlowEngine(complexFlow);
    const result = await engine.start();

    expect(result.node.node.content).toBe(
      'Result: 13, Boolean: true, String: Hello World'
    );
  });
});
