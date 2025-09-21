import { createDetector } from '@zflo/api-format';

export const ZFloJsonDetector = createDetector({
  formatId: 'zflojson',
  detect: (code: string) => {
    const trimmed = code.trim();
    let confidence = 0;

    // Must start and end with braces
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      return confidence;
    }

    try {
      const parsed = JSON.parse(trimmed);

      // Must be an object
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return confidence;
      }

      // Check for required ZFlo fields
      const hasId = typeof parsed.id === 'string' && parsed.id.length > 0;
      const hasNodes = Array.isArray(parsed.nodes);
      const hasStartNodeId =
        typeof parsed.startNodeId === 'string' && parsed.startNodeId.length > 0;

      if (hasId && hasNodes && hasStartNodeId) {
        confidence = 0.9; // Very high confidence for complete ZFlo structure
      } else if (hasId && hasNodes) {
        confidence = 0.7; // High confidence for partial ZFlo structure
      } else if (hasNodes) {
        confidence = 0.5; // Medium confidence for nodes array
      } else if (hasId) {
        confidence = 0.3; // Low confidence for just id field
      }

      // Bonus points for ZFlo-specific patterns
      if (parsed.title && typeof parsed.title === 'string') {
        confidence += 0.05;
      }

      // Check node structure
      if (hasNodes && parsed.nodes.length > 0) {
        const firstNode = parsed.nodes[0];
        if (firstNode && typeof firstNode === 'object') {
          if (firstNode.id && firstNode.type) {
            confidence += 0.05;
          }
          if (firstNode.outlets && Array.isArray(firstNode.outlets)) {
            confidence += 0.05;
          }
        }
      }

      return Math.min(1, confidence);
    } catch {
      // Not valid JSON
      return 0;
    }
  },
});
