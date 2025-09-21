import { describe, it, expect } from 'vitest';
import { DotParser } from '../dot-parser';

describe('DotParser', () => {
  const parser = new DotParser();

  describe('Basic Digraph', () => {
    it('parses simple A -> B with labels and assigns types', () => {
      const code = `digraph G {
        A [label="Start"];
        A -> B [label="Next"];
        B [label="End"];
      }`;

      const flow = parser.parse(code);
      expect(flow.title).toBe('DOT Digraph');
      expect(flow.nodes.length).toBe(2);
      expect(flow.startNodeId).toBe('A');

      const A = flow.nodes.find((n) => n.id === 'A');
      const B = flow.nodes.find((n) => n.id === 'B');
      expect(A).toBeDefined();
      expect(B).toBeDefined();
      expect(A?.title).toBe('Start');
      expect(B?.title).toBe('End');

      expect(A?.outlets?.length).toBe(1);
      expect(A?.outlets?.[0].to).toBe('B');
      expect(A?.outlets?.[0].label).toBe('Next');
    });
  });

  describe('Decision detection', () => {
    it('marks node with >1 outgoing as decision', () => {
      const code = `digraph {
        A [label="Start"];
        A -> B;
        B -> C [label="Yes"];
        B -> D [label="No"];
      }`;
      const flow = parser.parse(code);
      const B = flow.nodes.find((n) => n.id === 'B');
      expect(B).toBeDefined();
      expect(B?.outlets?.length).toBe(2);
    });
  });

  describe('Edge chains', () => {
    it('handles chained edges a -> b -> c', () => {
      const code = `digraph {
        A -> B -> C;
      }`;
      const flow = parser.parse(code);
      const A = flow.nodes.find((n) => n.id === 'A');
      const B = flow.nodes.find((n) => n.id === 'B');
      const C = flow.nodes.find((n) => n.id === 'C');
      expect(A && B && C).toBeTruthy();
      expect(A?.outlets?.length).toBe(1);
      expect(A?.outlets?.[0].to).toBe('B');
      expect(B?.outlets?.length).toBe(1);
      expect(B?.outlets?.[0].to).toBe('C');
    });
  });

  describe('Graph attributes', () => {
    it('uses digraph label as flow title', () => {
      const code = `digraph G {
        label="My Flow\\nTitle";
        a -> b;
      }`;
      const flow = parser.parse(code);
      expect(flow.title).toBe('My Flow\nTitle');
    });
  });

  describe('Complex DOT with attributes and multiline labels', () => {
    it('parses nodes, decisions, end, and multiline labels correctly', () => {
      const code = `digraph G {
  node [fontname = "Handlee"];
  edge [fontname = "Handlee"];

  
  draw [ label = "Draw a picture" ];
  win [ label = "You win!" ];
  guess [ label = "Did they\\nguess it?" ];
  point [
    label = "Point repeatedly\\n to the same picture."
  ];

  draw -> guess;
  
  guess -> win [ label = "Yes" ];
  point -> guess;
  guess -> point [ label = "No" ];
}`;

      const flow = parser.parse(code);
      expect(flow.nodes.length).toBe(4);

      const draw = flow.nodes.find((n) => n.id === 'draw');
      const win = flow.nodes.find((n) => n.id === 'win');
      const guess = flow.nodes.find((n) => n.id === 'guess');
      const point = flow.nodes.find((n) => n.id === 'point');
      expect(draw && win && guess && point).toBeTruthy();

      // Titles should reflect labels
      expect(draw?.title).toBe('Draw a picture');
      expect(win?.title).toBe('You win!');
      // Normalize newlines for portability (parser may unescape or keep \\n)
      const norm = (s?: string) => s?.replace(/\n/g, '\\n');
      expect(norm(guess?.title)).toBe('Did they\\nguess it?');
      expect(norm(point?.title)?.startsWith('Point repeatedly\\n')).toBe(true);

      // Edges and labels
      const drawEdge = draw?.outlets?.[0];
      expect(drawEdge?.to).toBe('guess');
      expect(drawEdge?.label).toBeUndefined();

      const guessLabels = (guess?.outlets ?? []).map((p) => p.label).sort();
      expect(guessLabels).toEqual(['No', 'Yes']);
    });
  });

  describe('Validation', () => {
    it('throws for malformed DOT', () => {
      const bad = `digraph { A -> }`;
      expect(() => parser.parse(bad)).toThrow();
    });
  });
});
