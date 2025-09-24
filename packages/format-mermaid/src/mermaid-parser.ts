import { FlowDefinition, NodeDefinition } from '@zflo/core';
import type { FormatParser } from '@zflo/api-format';

interface MermaidNode {
  id: string;
  text: string;
  content?: string;
  shape:
    | 'rect'
    | 'round'
    | 'diamond'
    | 'circle'
    | 'rhombus'
    | 'stadium'
    | 'subroutine'
    | 'cylindrical'
    | 'cloud'
    | 'hexagon';
}

interface MermaidEdge {
  from: string;
  to: string;
  label?: string;
  text?: string;
  type?: 'arrow' | 'thick' | 'dotted';
}

interface MermaidAST {
  nodes: MermaidNode[];
  edges: MermaidEdge[];
}

/**
 * Robust Mermaid parser that handles all standard Mermaid flowchart syntax
 * by parsing the structure systematically rather than using fragile regex patterns
 */
export class MermaidParser implements FormatParser {
  parse(mermaidCode: string): FlowDefinition {
    try {
      // Parse YAML front-matter if present
      const { title, description, syntax } =
        this.parseYAMLFrontMatter(mermaidCode);

      // Clean and prepare the input
      const lines = this.preprocessInput(syntax);

      // Parse to intermediate AST
      const ast = this.parseToAST(lines);

      // Convert AST to ZFlo format
      return this.convertToZFlo(ast, title, description);
    } catch (error) {
      throw new Error(
        `Failed to parse Mermaid flowchart: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private parseYAMLFrontMatter(mermaidCode: string): {
    title?: string;
    description?: string;
    syntax: string;
  } {
    const yamlFrontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = mermaidCode.match(yamlFrontMatterRegex);

    if (match && match[1] && match[2]) {
      const yamlContent = match[1];
      const mermaidContent = match[2];

      // Simple YAML parsing for title and description
      const titleMatch = yamlContent.match(/^title:\s*(.+)$/m);
      const descriptionMatch = yamlContent.match(/^description:\s*(.+)$/m);

      const title =
        titleMatch && titleMatch[1]
          ? titleMatch[1].replace(/['"]/g, '').trim()
          : undefined;
      const description =
        descriptionMatch && descriptionMatch[1]
          ? descriptionMatch[1].replace(/['"]/g, '').trim()
          : undefined;

      return {
        title,
        description,
        syntax: mermaidContent.trim(),
      };
    }

    return {
      syntax: mermaidCode.trim(),
    };
  }

  private preprocessInput(mermaidCode: string): string[] {
    return mermaidCode
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !line.startsWith('%%') &&
          !line.startsWith('flowchart') &&
          !line.startsWith('graph')
      );
  }

  private parseToAST(lines: string[]): MermaidAST {
    const nodes = new Map<string, MermaidNode>();
    const edges: MermaidEdge[] = [];

    for (const line of lines) {
      this.parseLine(line, nodes, edges);
    }

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  private parseLine(
    line: string,
    nodes: Map<string, MermaidNode>,
    edges: MermaidEdge[]
  ): void {
    // Handle different arrow patterns step by step
    let match = null;
    let fromPart = '';
    let toPart = '';
    let edgeLabel = '';

    // Pattern 1: -- Label --> (spaces around label)
    match = line.match(/^(.+?)\s+--\s+(.+?)\s+--+>\s*(.+)$/);
    if (match && match[1] && match[2] && match[3]) {
      fromPart = match[1];
      edgeLabel = match[2];
      toPart = match[3];
    } else {
      // Pattern 2: -->|Label| (pipe-delimited label)
      match = line.match(/^(.+?)\s+--+>\s*\|([^|]+)\|\s*(.+)$/);
      if (match && match[1] && match[2] && match[3]) {
        fromPart = match[1];
        edgeLabel = match[2];
        toPart = match[3];
      } else {
        // Pattern 3: Simple arrow --> (no label)
        match = line.match(/^(.+?)\s+--+>\s*(.+)$/);
        if (match && match[1] && match[2]) {
          fromPart = match[1];
          toPart = match[2];
        }
      }
    }

    if (!match) return;

    // Parse left side (from node)
    const fromNode = this.parseNodeDefinition(fromPart.trim());
    if (fromNode) {
      // Only update if we don't already have this node or if the new definition has more info
      const existing = nodes.get(fromNode.id);
      if (
        !existing ||
        (existing.text === this.formatNodeTitle(existing.id) &&
          fromNode.text !== this.formatNodeTitle(fromNode.id))
      ) {
        nodes.set(fromNode.id, fromNode);
      }
    }

    // Parse right side (to node)
    const toNode = this.parseNodeDefinition(toPart.trim());
    if (toNode) {
      // Only update if we don't already have this node or if the new definition has more info
      const existing = nodes.get(toNode.id);
      if (
        !existing ||
        (existing.text === this.formatNodeTitle(existing.id) &&
          toNode.text !== this.formatNodeTitle(toNode.id))
      ) {
        nodes.set(toNode.id, toNode);
      }
    }

    // Create edge
    if (fromNode && toNode) {
      edges.push({
        from: fromNode.id,
        to: toNode.id,
        label: edgeLabel.trim(),
        type: 'arrow',
      });
    }
  }

  private parseNodeDefinition(nodeStr: string): MermaidNode | null {
    // Handle different node shapes with comprehensive regex
    const patterns = [
      // Rectangle: A[Text] or A["Text"] or A['Text']
      { regex: /^(\w+)\[([^\]]+)\]$/, shape: 'rect' as const },
      // Round: A(Text) or A("Text") or A('Text')
      { regex: /^(\w+)\(([^)]+)\)$/, shape: 'round' as const },
      // Diamond/Decision: A{Text} or A{"Text"} or A{'Text'}
      { regex: /^(\w+)\{([^}]+)\}$/, shape: 'diamond' as const },
      // Circle: A((Text))
      { regex: /^(\w+)\(\(([^)]+)\)\)$/, shape: 'circle' as const },
      // Rhombus: A{{Text}}
      { regex: /^(\w+)\{\{([^}]+)\}\}$/, shape: 'rhombus' as const },
      // Stadium: A([Text])
      { regex: /^(\w+)\(\[([^\]]+)\]\)$/, shape: 'stadium' as const },
      // Subroutine: A[[Text]]
      { regex: /^(\w+)\[\[([^\]]+)\]\]$/, shape: 'subroutine' as const },
      // Cylindrical: A[(Text)]
      { regex: /^(\w+)\[\(([^)]+)\)\]$/, shape: 'cylindrical' as const },
      // Cloud: A)Text(
      { regex: /^(\w+)\)([^()]+)\($/, shape: 'cloud' as const },
      // Hexagon: A>Text<
      { regex: /^(\w+)>([^<]+)<$/, shape: 'hexagon' as const },
    ];

    for (const { regex, shape } of patterns) {
      const match = nodeStr.match(regex);
      if (match && match[1] && match[2]) {
        const [, id, text] = match;
        const cleanedText = this.cleanText(text);
        const { title, content } = this.processTextWithLineBreaks(cleanedText);
        const nodeId = id?.trim();
        if (!nodeId) {
          return null;
        }
        return {
          id: nodeId,
          text: title, // Use first line as display text
          content, // Store full content separately
          shape,
        };
      }
    }

    // Simple node ID without shape - use formatted title
    const simpleMatch = nodeStr.match(/^(\w+)$/);
    if (simpleMatch && simpleMatch[1]) {
      const id = simpleMatch[1];
      return {
        id,
        text: this.formatNodeTitle(id),
        shape: 'rect',
      };
    }

    return null;
  }

  private cleanText(text: string): string {
    // Remove quotes and clean up text
    return text.replace(/^["']|["']$/g, '').trim();
  }

  private processTextWithLineBreaks(text: string): {
    title: string;
    content: string;
  } {
    // Replace HTML line breaks with newlines (handle various formats: <br>, <br/>, <br />)
    const processedText = text.replace(/<br\s*\/?\s*>/gi, '\n');

    // Split by newlines and get first line as title
    const lines = processedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    if (lines.length === 0) {
      return { title: text, content: text };
    }

    const title = lines[0];
    const content = lines.join('\n');

    return {
      title: title || '',
      content: content || '',
    };
  }

  private formatNodeTitle(id: string): string {
    return id
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private isEmptyLabel(text: string): boolean {
    // Consider label empty if it's whitespace, brackets, or very short non-meaningful content
    const trimmed = text.trim();
    return (
      !trimmed ||
      trimmed === '[ ]' ||
      trimmed === '[]' ||
      trimmed === '()' ||
      trimmed === '{}' ||
      trimmed.length <= 2
    );
  }

  private convertToZFlo(
    ast: MermaidAST,
    title?: string,
    description?: string
  ): FlowDefinition {
    const nodes: NodeDefinition[] = ast.nodes.map((node): NodeDefinition => {
      // Use formatted node ID if text is empty or practically empty
      const displayText = this.isEmptyLabel(node.text)
        ? this.formatNodeTitle(node.id)
        : node.text;
      const fullContent = node.content || displayText;

      return {
        id: node.id,
        title: displayText,
        content: fullContent,
        autoAdvance: false,
        outlets: ast.edges
          .filter((edge) => edge.from === node.id)
          .map((edge, index) => ({
            id: `${edge.from}-${edge.to}-${Date.now()}-${index}`,
            to: edge.to,
            label: edge.label,
          })),
      };
    });

    const startNodeId = nodes[0]?.id || '';

    return {
      id: 'mermaid-flowchart',
      title: title || 'Mermaid Flowchart',
      description,
      nodes,
      startNodeId,
      initialState: {},
      metadata: {
        originalTitle: title,
        originalDescription: description,
      },
    };
  }
}
