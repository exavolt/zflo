import { describe, it, expect } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import { convertReactFlowToZFlo } from '../reactflow-to-zflo';

describe('convertReactFlowToZFlo', () => {
  it('should convert simple flow with single node', () => {
    const nodes: Node[] = [
      {
        id: 'node-1',
        type: 'zfloNode',
        position: { x: 100, y: 100 },
        data: {
          title: 'Start Node',
          content: 'This is the start',
          nodeType: 'start',
          outputCount: 0,
          outlets: [],
        },
      },
    ];

    const edges: Edge[] = [];

    const result = convertReactFlowToZFlo(nodes, edges, 'Test Flow');

    expect(result.title).toBe('Test Flow');
    expect(result.nodes).toHaveLength(1);
    const firstNode = result.nodes[0];
    expect(firstNode).toBeDefined();
    expect(firstNode!.id).toBe('node-1');
    expect(firstNode!.title).toBe('Start Node');
    expect(firstNode!.content).toBe('This is the start');
    expect(firstNode!.isAutoAdvance).toBe(false);
    expect(firstNode!.outlets).toHaveLength(0);
    expect(result.startNodeId).toBe('node-1');
  });

  it('should convert flow with connected nodes', () => {
    const nodes: Node[] = [
      {
        id: 'start',
        type: 'zfloNode',
        position: { x: 0, y: 0 },
        data: {
          title: 'Start',
          content: 'Beginning',
          nodeType: 'start',
          outputCount: 1,
          outlets: [{ id: 'outlet-1', label: 'Continue', condition: '' }],
        },
      },
      {
        id: 'end',
        type: 'zfloNode',
        position: { x: 200, y: 0 },
        data: {
          title: 'End',
          content: 'Finish',
          nodeType: 'end',
          outputCount: 0,
          outlets: [],
        },
      },
    ];

    const edges: Edge[] = [
      {
        id: 'edge-1',
        source: 'start',
        target: 'end',
        sourceHandle: 'outlet-1',
        targetHandle: null,
      },
    ];

    const result = convertReactFlowToZFlo(nodes, edges, 'Connected Flow');

    expect(result.nodes).toHaveLength(2);
    expect(result.startNodeId).toBe('start');

    const startNode = result.nodes.find((n) => n.id === 'start');
    expect(startNode?.outlets).toHaveLength(1);
    const firstOutlet = startNode?.outlets?.[0];
    expect(firstOutlet).toBeDefined();
    expect(firstOutlet!.to).toBe('end');
    expect(firstOutlet!.label).toBe('Continue');

    const endNode = result.nodes.find((n) => n.id === 'end');
    expect(endNode?.outlets).toHaveLength(0);
  });

  it('should handle autoAdvance settings correctly', () => {
    const nodes: Node[] = [
      {
        id: 'auto-true',
        type: 'zfloNode',
        position: { x: 0, y: 0 },
        data: {
          title: 'Auto True',
          content: '',
          nodeType: 'action',
          autoAdvance: true,
          outputCount: 0,
          outlets: [],
        },
      },
      {
        id: 'auto-false',
        type: 'zfloNode',
        position: { x: 100, y: 0 },
        data: {
          title: 'Auto False',
          content: '',
          nodeType: 'action',
          autoAdvance: false,
          outputCount: 0,
          outlets: [],
        },
      },
      {
        id: 'auto-undefined',
        type: 'zfloNode',
        position: { x: 200, y: 0 },
        data: {
          title: 'Auto Undefined',
          content: '',
          nodeType: 'action',
          outputCount: 0,
          outlets: [],
        },
      },
    ];

    const result = convertReactFlowToZFlo(nodes, [], 'Auto Advance Test');

    const autoTrueNode = result.nodes.find((n) => n.id === 'auto-true');
    const autoFalseNode = result.nodes.find((n) => n.id === 'auto-false');
    const autoUndefinedNode = result.nodes.find(
      (n) => n.id === 'auto-undefined'
    );

    expect(autoTrueNode?.isAutoAdvance).toBe(true);
    expect(autoFalseNode?.isAutoAdvance).toBe(false);
    expect(autoUndefinedNode?.isAutoAdvance).toBe(false);
  });

  it('should handle outlets with conditions', () => {
    const nodes: Node[] = [
      {
        id: 'decision',
        type: 'zfloNode',
        position: { x: 0, y: 0 },
        data: {
          title: 'Decision',
          content: 'Make a choice',
          nodeType: 'decision',
          outputCount: 2,
          outlets: [
            { id: 'yes-outlet', label: 'Yes', condition: 'score > 10' },
            { id: 'no-outlet', label: 'No', condition: 'score <= 10' },
          ],
        },
      },
      {
        id: 'yes-node',
        type: 'zfloNode',
        position: { x: 200, y: 0 },
        data: {
          title: 'Yes Path',
          content: '',
          nodeType: 'action',
          outputCount: 0,
          outlets: [],
        },
      },
      {
        id: 'no-node',
        type: 'zfloNode',
        position: { x: 200, y: 100 },
        data: {
          title: 'No Path',
          content: '',
          nodeType: 'action',
          outputCount: 0,
          outlets: [],
        },
      },
    ];

    const edges: Edge[] = [
      {
        id: 'yes-edge',
        source: 'decision',
        target: 'yes-node',
        sourceHandle: 'yes-outlet',
        targetHandle: null,
      },
      {
        id: 'no-edge',
        source: 'decision',
        target: 'no-node',
        sourceHandle: 'no-outlet',
        targetHandle: null,
      },
    ];

    const result = convertReactFlowToZFlo(nodes, edges, 'Decision Flow');

    const decisionNode = result.nodes.find((n) => n.id === 'decision');
    expect(decisionNode?.outlets).toHaveLength(2);

    const yesOutlet = decisionNode?.outlets?.find((o) => o.to === 'yes-node');
    const noOutlet = decisionNode?.outlets?.find((o) => o.to === 'no-node');

    expect(yesOutlet?.label).toBe('Yes');
    expect(yesOutlet?.condition).toBe('score > 10');
    expect(noOutlet?.label).toBe('No');
    expect(noOutlet?.condition).toBe('score <= 10');
  });

  it('should handle empty flow', () => {
    const result = convertReactFlowToZFlo([], [], 'Empty Flow');

    expect(result.title).toBe('Empty Flow');
    expect(result.nodes).toHaveLength(0);
    expect(result.startNodeId).toBe('');
  });

  it('should include flow metadata', () => {
    const nodes: Node[] = [
      {
        id: 'test',
        type: 'zfloNode',
        position: { x: 0, y: 0 },
        data: {
          title: 'Test',
          content: '',
          nodeType: 'start',
          outputCount: 0,
          outlets: [],
        },
      },
    ];

    const metadata = {
      description: 'Test description',
      globalState: { testVar: 'value' },
    };

    const result = convertReactFlowToZFlo(nodes, [], 'Test Flow', metadata);

    expect(result.description).toBe('Test description');
    expect(result.globalState).toEqual({ testVar: 'value' });
    expect(result.id).toBeDefined();
  });
});
