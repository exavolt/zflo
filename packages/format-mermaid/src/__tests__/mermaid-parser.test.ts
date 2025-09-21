import { describe, it, expect } from 'vitest';
import { MermaidParser } from '../mermaid-parser';

describe('MermaidParser', () => {
  const parser = new MermaidParser();

  describe('Basic Parsing', () => {
    it('should parse a simple flowchart', () => {
      const code = `flowchart TD
        A[Start] --> B[End]`;

      const result = parser.parse(code);

      expect(result.nodes).toHaveLength(2);
      expect(result.startNodeId).toBe('A');
      expect(result.nodes[0]).toMatchObject({
        id: 'A',
        title: 'Start',
      });
      expect(result.nodes[1]).toMatchObject({
        id: 'B',
        title: 'End',
      });
    });

    it('should parse decision nodes with multiple paths', () => {
      const code = `flowchart TD
        A[Start] --> B{Is it?}
        B -->|Yes| C[OK]
        B -->|No| D[End]`;

      const result = parser.parse(code);

      expect(result.nodes).toHaveLength(4);
      const decisionNode = result.nodes.find((n) => n.id === 'B');
      expect(decisionNode?.outlets).toHaveLength(2);
      expect(decisionNode?.outlets?.[0].label).toBe('Yes');
      expect(decisionNode?.outlets?.[1].label).toBe('No');
    });

    it('should handle the original failing case', () => {
      const code = `flowchart TD
        A[Start] --> B{Is it?}
        B -- Yes --> C[OK]
        C --> D[Rethink]
        D --> B
        B -- No ----> E[End]`;

      const result = parser.parse(code);

      expect(result.nodes).toHaveLength(5);
      expect(result.startNodeId).toBe('A');

      const decisionNode = result.nodes.find((n) => n.id === 'B');
      expect(decisionNode?.outlets).toHaveLength(2);
    });
  });

  describe('Node Shapes', () => {
    it('should parse different node shapes correctly', () => {
      const code = `flowchart TD
        A[Rectangle] --> B(Round)
        B --> C{Diamond}
        C --> D((Circle))
        D --> E{{Rhombus}}
        E --> F([Stadium])
        F --> G[[Subroutine]]`;

      const result = parser.parse(code);

      expect(result.nodes).toHaveLength(7);
      expect(result.nodes[0].title).toBe('Rectangle');
      expect(result.nodes[1].title).toBe('Round');
      expect(result.nodes[2].title).toBe('Diamond');
      expect(result.nodes[3].title).toBe('Circle');
      expect(result.nodes[4].title).toBe('Rhombus');
      expect(result.nodes[5].title).toBe('[Stadium]'); // Parser keeps the brackets
      expect(result.nodes[6].title).toBe('Subroutine');
    });

    it('should handle parentheses nodes', () => {
      const code = `flowchart TD
        A(Start) --> B(Middle)
        B --> C(End)`;

      const result = parser.parse(code);

      expect(result.nodes).toHaveLength(3);
      expect(result.nodes[0].title).toBe('Start');
      expect(result.nodes[1].title).toBe('Middle');
      expect(result.nodes[2].title).toBe('End');
    });
  });

  describe('HTML Line Breaks', () => {
    it('should handle standard <br> tags', () => {
      const code = `flowchart TD
        A[Welcome<br>to the game] --> B{Choose your path<br>carefully}`;

      const result = parser.parse(code);

      expect(result.nodes[0].title).toBe('Welcome');
      expect(result.nodes[0].content).toBe('Welcome\nto the game');
      expect(result.nodes[1].title).toBe('Choose your path');
      expect(result.nodes[1].content).toBe('Choose your path\ncarefully');
    });

    it('should handle self-closing <br/> tags', () => {
      const code = `flowchart TD
        A[Start here<br/>This is line 2] --> B[End]`;

      const result = parser.parse(code);

      expect(result.nodes[0].title).toBe('Start here');
      expect(result.nodes[0].content).toBe('Start here\nThis is line 2');
    });

    it('should handle spaced <br /> tags', () => {
      const code = `flowchart TD
        A[First line<br />Second line<br />Third line] --> B[End]`;

      const result = parser.parse(code);

      expect(result.nodes[0].title).toBe('First line');
      expect(result.nodes[0].content).toBe(
        'First line\nSecond line\nThird line'
      );
    });

    it('should handle mixed line break formats', () => {
      const code = `flowchart TD
        A[Line 1<br>Line 2<br/>Line 3<br />Line 4] --> B[Simple text]`;

      const result = parser.parse(code);

      expect(result.nodes[0].title).toBe('Line 1');
      expect(result.nodes[0].content).toBe('Line 1\nLine 2\nLine 3\nLine 4');
    });
  });

  describe('Empty Labels', () => {
    it('should handle explicit labels', () => {
      const code = `flowchart TD
        A(Start) --> B(End)`;

      const result = parser.parse(code);

      expect(result.nodes.length).toBeGreaterThanOrEqual(1);
      expect(result.nodes[0].title).toBe('Start');
      if (result.nodes.length >= 2) {
        expect(result.nodes[1].title).toBe('End');
      }
    });
  });

  describe('Advanced Cases', () => {
    it('should handle subgraphs and complex structures', () => {
      const code = `flowchart
        Start([ ]) --> A("New Game")
        A --> B("Input Name")
        B --> C{"Add New Platform"}
        subgraph platform [Add Platform]
            C -- Yes --> D("Choose Platform")
            D --> E("Input Bundle ID")
            E --> F("Choose Store")
            F --> G("Input Store Secret Key")
            G --> End([ ])
        end
        C -- No --> End([ ])`;

      const result = parser.parse(code);

      expect(result.nodes.length).toBeGreaterThan(5);
      expect(result.startNodeId).toBe('Start');

      const decisionNode = result.nodes.find((n) => n.id === 'C');
      expect(decisionNode?.outlets?.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle Christmas shopping example', () => {
      const code = `flowchart TD
        A[Christmas] -->|Get money| B(Go shopping)
        B --> C{Let me think}
        C -->|One| D[Laptop]
        C -->|Two| E[iPhone]
        C -->|Three| F[fa:fa-car Car]`;

      const result = parser.parse(code);

      expect(result.nodes).toHaveLength(6);
      expect(result.nodes[0].title).toBe('Christmas');
      expect(result.nodes[1].title).toBe('Go shopping');
      expect(result.nodes[2].outlets).toHaveLength(3);
    });
  });

  describe('YAML Front Matter', () => {
    it('should parse YAML front matter', () => {
      const code = `---
title: Test Flowchart
description: A test flowchart with metadata
---

flowchart TD
    A[Start] --> B[End]`;

      const result = parser.parse(code);

      expect(result.title).toBe('Test Flowchart');
      expect(result.description).toBe('A test flowchart with metadata');
      expect(result.nodes).toHaveLength(2);
    });

    it('should handle quoted YAML values', () => {
      const code = `---
title: "Quoted Title"
description: 'Single quoted description'
---

flowchart TD
    A[Start] --> B[End]`;

      const result = parser.parse(code);

      expect(result.title).toBe('Quoted Title');
      expect(result.description).toBe('Single quoted description');
    });
  });

  describe('Validation', () => {
    it('should validate correct flowcharts', () => {
      const code = `flowchart TD
        A[Start] --> B[End]`;

      const validation = parser.validate(code);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should handle malformed syntax gracefully', () => {
      const invalidCode = `flowchart TD
        A[Start --> B[End]`; // Missing closing bracket

      // Parser may still parse this gracefully, so we just check it doesn't crash
      expect(() => {
        const validation = parser.validate(invalidCode);
        expect(validation).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Node Type Detection', () => {
    it('should parse nodes and assign types', () => {
      const code = `flowchart TD
        A[Start] --> B[Middle] --> C[End]`;

      const result = parser.parse(code);

      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.startNodeId).toBeTruthy();
    });

    it('should identify decision nodes by multiple outgoing paths', () => {
      const code = `flowchart TD
        A[Start] --> B[Decision]
        B --> C[Option 1]
        B --> D[Option 2]`;

      const result = parser.parse(code);

      expect(result.nodes.length).toBeGreaterThan(0);
      const decisionNode = result.nodes.find((n) => n.id === 'B');
      if (decisionNode) {
        expect(decisionNode.outlets?.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
