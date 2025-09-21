import { createDetector } from '@zflo/api-format';

/**
 * DOT format detector that identifies Graphviz DOT syntax
 */
export const dotDetector = createDetector({
  formatId: 'dot',
  detect: (code: string) => {
    const trimmed = code.trim();
    const lines = trimmed.split('\n').map((line) => line.trim());

    let confidence = 0;

    // Check for DOT graph declaration
    const graphDeclaration = /^(strict\s+)?(di)?graph\s+/i;
    if (graphDeclaration.test(trimmed)) {
      confidence += 0.4;
    }

    // Check for DOT-specific syntax patterns
    const dotPatterns = [
      /\s*->\s*/, // directed edge
      /\s*--\s*/, // undirected edge
      /\[\s*\w+\s*=/, // attribute syntax
      /^\s*\w+\s*\[/, // node with attributes
      /^\s*}\s*$/, // closing brace
      /^\s*{\s*$/, // opening brace
      /subgraph/i, // subgraph keyword
    ];

    let patternMatches = 0;
    for (const line of lines) {
      for (const pattern of dotPatterns) {
        if (pattern.test(line)) {
          patternMatches++;
          break;
        }
      }
    }

    if (patternMatches > 0) {
      confidence += Math.min(0.4, patternMatches * 0.1);
    }

    // Check for DOT keywords
    const dotKeywords = [
      'digraph',
      'graph',
      'subgraph',
      'node',
      'edge',
      'strict',
    ];
    const keywordCount = dotKeywords.reduce((count, keyword) => {
      return (
        count + (new RegExp(`\\b${keyword}\\b`, 'i').test(trimmed) ? 1 : 0)
      );
    }, 0);

    if (keywordCount > 0) {
      confidence += Math.min(0.2, keywordCount * 0.05);
    }

    // Bonus for proper structure (opening and closing braces)
    if (trimmed.includes('{') && trimmed.includes('}')) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  },
});
