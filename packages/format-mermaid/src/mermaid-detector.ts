import { createDetector } from '@zflo/api-format';

/**
 * Mermaid format detector with confidence scoring
 */
export const MermaidDetector = createDetector({
  formatId: 'mermaid',
  detect: (code: string) => {
    let confidence = 0;
    const lines = code
      .trim()
      .split('\n')
      .map((line) => line.trim());

    // Strong indicators
    if (code.match(/^(flowchart|graph)\s+(TD|TB|BT|RL|LR)/m)) {
      confidence += 0.8;
    }

    // YAML front matter
    if (code.startsWith('---') && code.includes('---\n')) {
      confidence += 0.3;
    }

    // Node patterns
    const nodePatterns = [
      /\w+\[.*?\]/, // Rectangle
      /\w+\(.*?\)/, // Round
      /\w+\{.*?\}/, // Diamond
      /\w+\(\(.*?\)\)/, // Circle
      /\w+\[\[.*?\]\]/, // Subroutine
      /\w+>.*?</, // Flag
      /\w+\[\(.*?\)\]/, // Stadium
    ];

    let nodeMatches = 0;
    for (const line of lines) {
      for (const pattern of nodePatterns) {
        if (pattern.test(line)) {
          nodeMatches++;
          break;
        }
      }
    }

    if (nodeMatches > 0) {
      confidence += Math.min(0.4, nodeMatches * 0.1);
    }

    // Arrow patterns
    const arrowPatterns = [
      /-->/,
      /---/,
      /-.->/,
      /-.-/,
      /==>/,
      /===/,
      /~~>/,
      /~~/,
    ];
    let arrowMatches = 0;
    for (const line of lines) {
      for (const pattern of arrowPatterns) {
        if (pattern.test(line)) {
          arrowMatches++;
          break;
        }
      }
    }

    if (arrowMatches > 0) {
      confidence += Math.min(0.3, arrowMatches * 0.05);
    }

    // Comments
    if (lines.some((line) => line.startsWith('%%'))) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  },
});
