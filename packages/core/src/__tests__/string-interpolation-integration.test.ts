import { describe, it, expect } from 'vitest';
import { FlowEngine } from '../core/flow-engine';
import { FlowDefinition } from '../types/flow-types';

describe('String Interpolation Integration', () => {
  const testFlow: FlowDefinition = {
    id: 'coffee-temp-test',
    title: 'Coffee Temperature Test',
    description: 'Test string interpolation',
    startNodeId: 'welcome',
    expressionLanguage: 'liquid',
    initialState: {
      highTemp: 100,
      lowTemp: 80,
      midTemp: 90,
    },
    nodes: [
      {
        id: 'welcome',
        title: 'Welcome',
        content:
          'Temperature range: {{lowTemp}}°C to {{highTemp}}°C. Middle: {{highTemp | plus: lowTemp | divided_by: 2}}°C',
        outlets: [{ id: 'welcome-to-brewing', to: 'brewing' }],
      },
      {
        id: 'brewing',
        title: 'Brewing',
        content:
          'Current temperature is {{midTemp}}°C. Range is {{ highTemp | minus: lowTemp }}°C wide.',
        outlets: [],
      },
    ],
  };

  it('should interpolate expressions in node content', async () => {
    const engine = new FlowEngine(testFlow);
    const result = await engine.start();

    expect(
      result.currentNode.interpolatedContent ||
        result.currentNode.definition.content
    ).toBe('Temperature range: 80°C to 100°C. Middle: 90°C');
  });

  it('should interpolate dynamic expressions', async () => {
    const engine = new FlowEngine(testFlow);
    await engine.start();
    const nextResult = await engine.next('welcome-to-brewing');

    expect(
      nextResult.currentNode.interpolatedContent ||
        nextResult.currentNode.definition.content
    ).toBe('Current temperature is 90°C. Range is 20°C wide.');
  });

  it('should update interpolations when state changes', async () => {
    // Create a flow with state-dependent content
    const dynamicFlow: FlowDefinition = {
      id: 'dynamic-test',
      title: 'Dynamic Content Test',
      description: 'Test dynamic state updates',
      startNodeId: 'dynamic',
      expressionLanguage: 'liquid',
      initialState: {
        temperature: 90,
      },
      nodes: [
        {
          id: 'dynamic',
          title: 'Dynamic Node',
          content: 'Current temperature: {{temperature}}°C',
          outlets: [],
        },
      ],
    };

    const engine = new FlowEngine(dynamicFlow);
    const initialResult = await engine.start();

    expect(
      initialResult.currentNode.interpolatedContent ||
        initialResult.currentNode.definition.content
    ).toBe('Current temperature: 90°C');

    // Change the state
    await engine.setState({ temperature: 85 });

    // Get the current context again to see updated interpolation
    const currentContext = await engine.getCurrentContext();

    // The interpolation should reflect the updated state
    expect(
      currentContext?.currentNode.interpolatedContent ||
        currentContext?.currentNode.definition.content
    ).toBe('Current temperature: 85°C');
  });

  it('should handle missing variables gracefully', async () => {
    const flowWithMissingVar: FlowDefinition = {
      id: 'missing-var-test',
      title: 'Test Missing Var',
      description: 'Test missing variable handling',
      startNodeId: 'test',
      expressionLanguage: 'liquid',
      nodes: [
        {
          id: 'test',
          title: 'Test',
          content: 'Value: {{missingVar}}, Known: {{knownVar}}',
          outlets: [],
        },
      ],
      initialState: {
        knownVar: 'exists',
      },
    };

    const engine = new FlowEngine(flowWithMissingVar, { enableLogging: true });
    const result = await engine.start();

    // LiquidJS in strict mode throws an error for missing variables, which our engine catches and returns as an empty string.
    expect(
      result.currentNode.interpolatedContent ||
        result.currentNode.definition.content
    ).toBe('Value: , Known: exists');
  });

  it('should handle complex expressions', async () => {
    const complexFlow: FlowDefinition = {
      id: 'complex-expressions-test',
      title: 'Complex Expressions',
      description: 'Test complex expression interpolation',
      startNodeId: 'complex',
      expressionLanguage: 'liquid',
      nodes: [
        {
          id: 'complex',
          title: 'Complex',
          content:
            "Result: {{ a | times: 2 | plus: b }}, Boolean: {% if a > b %}true{% else %}false{% endif %}, String: {{ name | append: ' World' }}",
          outlets: [],
        },
      ],
      initialState: {
        a: 5,
        b: 3,
        name: 'Hello',
      },
    };

    const engine = new FlowEngine(complexFlow);
    const result = await engine.start();

    expect(
      result.currentNode.interpolatedContent ||
        result.currentNode.definition.content
    ).toBe('Result: 13, Boolean: true, String: Hello World');
  });
});
