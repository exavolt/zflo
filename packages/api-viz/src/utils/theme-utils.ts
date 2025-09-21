import type { VizTheme } from '../types/base-viz-types';

/**
 * Default theme for visualizations
 */
export const defaultVizTheme: VizTheme = {
  node: {
    default: {
      background: '#ffffff',
      border: '#d1d5db',
      color: '#374151',
    },
    current: {
      background: '#dbeafe',
      border: '#3b82f6',
      color: '#1e40af',
      shadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    },
    traversed: {
      background: '#dcfce7',
      border: '#22c55e',
      color: '#15803d',
    },
  },
  edge: {
    default: {
      stroke: '#6b7280',
      strokeWidth: 1,
    },
    traversed: {
      stroke: '#22c55e',
      strokeWidth: 2,
    },
  },
};

/**
 * Dark theme for visualizations
 */
export const darkVizTheme: VizTheme = {
  node: {
    default: {
      background: '#1f2937',
      border: '#4b5563',
      color: '#f9fafb',
    },
    current: {
      background: '#1e3a8a',
      border: '#3b82f6',
      color: '#dbeafe',
      shadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
    },
    traversed: {
      background: '#14532d',
      border: '#22c55e',
      color: '#dcfce7',
    },
  },
  edge: {
    default: {
      stroke: '#9ca3af',
      strokeWidth: 1,
    },
    traversed: {
      stroke: '#22c55e',
      strokeWidth: 2,
    },
  },
};

/**
 * Merges a partial theme with the default theme
 * @param partialTheme - Partial theme to merge
 * @param baseTheme - Base theme to merge with (defaults to defaultVizTheme)
 * @returns Complete merged theme
 */
export function mergeTheme(
  partialTheme: Partial<VizTheme>,
  baseTheme: VizTheme = defaultVizTheme
): VizTheme {
  return {
    node: {
      default: {
        ...baseTheme.node.default,
        ...partialTheme.node?.default,
      },
      current: {
        ...baseTheme.node.current,
        ...partialTheme.node?.current,
      },
      traversed: {
        ...baseTheme.node.traversed,
        ...partialTheme.node?.traversed,
      },
    },
    edge: {
      default: {
        ...baseTheme.edge.default,
        ...partialTheme.edge?.default,
      },
      traversed: {
        ...baseTheme.edge.traversed,
        ...partialTheme.edge?.traversed,
      },
    },
  };
}

/**
 * Gets the appropriate node style based on its state
 * @param theme - The theme to use
 * @param isCurrentNode - Whether this is the current node
 * @param isTraversed - Whether this node has been traversed
 * @returns Node style object
 */
export function getNodeStyle(
  theme: VizTheme,
  isCurrentNode: boolean = false,
  isTraversed: boolean = false
) {
  if (isCurrentNode) {
    return theme.node.current;
  }
  if (isTraversed) {
    return theme.node.traversed;
  }
  return theme.node.default;
}

/**
 * Gets the appropriate edge style based on its state
 * @param theme - The theme to use
 * @param isTraversed - Whether this edge has been traversed
 * @returns Edge style object
 */
export function getEdgeStyle(theme: VizTheme, isTraversed: boolean = false) {
  return isTraversed ? theme.edge.traversed : theme.edge.default;
}
