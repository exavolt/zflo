import { describe, it, expect } from 'vitest';
import { FlowEngine } from '../core/flow-engine';
import { FlowDefinition } from '../types/flow-types';

describe('String Interpolation Demo', () => {
  it('should demonstrate working string interpolation with the coffee flow', async () => {
    const coffeeFlow: FlowDefinition = {
      id: 'coffee-demo',
      title: 'Coffee Temperature Demo',
      description: 'Demonstrates string interpolation',
      startNodeId: 'welcome',
      initialState: {
        highTemp: 100,
        lowTemp: 80,
        currentTemp: 90,
        userName: 'Coffee Lover',
      },
      nodes: [
        {
          id: 'welcome',
          title: 'Welcome',
          content:
            'Hello ${userName}! Temperature range: ${lowTemp}°C to ${highTemp}°C. Current: ${currentTemp}°C',
          outlets: [{ id: 'to-brewing', to: 'brewing' }],
        },
        {
          id: 'brewing',
          title: 'Brewing Instructions',
          content:
            'Brew at ${currentTemp}°C. Range width: ${highTemp - lowTemp}°C. Mid-point: ${(highTemp + lowTemp) / 2}°C',
          outlets: [],
        },
      ],
    };

    const engine = new FlowEngine(coffeeFlow);

    // Test initial node interpolation
    const startResult = await engine.start();
    expect(
      startResult.currentNode.interpolatedContent ||
        startResult.currentNode.definition.content
    ).toBe(
      'Hello Coffee Lover! Temperature range: 80°C to 100°C. Current: 90°C'
    );

    // Test next node with expressions
    const brewingResult = await engine.next('to-brewing');
    expect(
      brewingResult.currentNode.interpolatedContent ||
        brewingResult.currentNode.definition.content
    ).toBe('Brew at 90°C. Range width: 20°C. Mid-point: 90°C');
  });

  it('should handle complex mathematical expressions', async () => {
    const mathFlow: FlowDefinition = {
      id: 'math-demo',
      title: 'Math Demo',
      description: 'Complex math expressions',
      startNodeId: 'math',
      initialState: {
        a: 10,
        b: 3,
        multiplier: 2.5,
      },
      nodes: [
        {
          id: 'math',
          title: 'Math Results',
          content:
            'Sum: ${a + b}, Product: ${a * b}, Average: ${(a + b) / 2}, Max: ${a > b ? a : b}, Min: ${a < b ? a : b}, Complex: ${(a + b) * multiplier}',
          outlets: [],
        },
      ],
    };

    const engine = new FlowEngine(mathFlow);
    const result = await engine.start();

    expect(
      result.currentNode.interpolatedContent ||
        result.currentNode.definition.content
    ).toBe(
      'Sum: 13, Product: 30, Average: 6.50, Max: 10, Min: 3, Complex: 32.50'
    );
  });

  it('should handle string operations', async () => {
    const stringFlow: FlowDefinition = {
      id: 'string-demo',
      title: 'String Demo',
      description: 'String operations',
      startNodeId: 'strings',
      initialState: {
        firstName: 'John',
        lastName: 'Doe',
        greeting: 'Hello',
      },
      nodes: [
        {
          id: 'strings',
          title: 'String Operations',
          content:
            'Full name: ${firstName + " " + lastName}, Greeting: ${greeting + ", " + firstName}!',
          outlets: [],
        },
      ],
    };

    const engine = new FlowEngine(stringFlow);
    const result = await engine.start();

    expect(
      result.currentNode.interpolatedContent ||
        result.currentNode.definition.content
    ).toBe('Full name: John Doe, Greeting: Hello, John!');
  });
});
