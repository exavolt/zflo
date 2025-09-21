import type { ZFFlow, ExecutionStep } from '../../../core/dist';
import type { CSSProperties } from 'react';

/**
 * Base interface that all visualization components should implement
 */
export interface BaseVizProps {
  /** The flow to visualize */
  flow: ZFFlow;
  /** ID of the currently active/executing node */
  currentNodeId?: string;
  /** Execution history for highlighting traversed paths */
  history?: ExecutionStep[];
  /** Callback when a node is clicked */
  onNodeClick?: (nodeId: string) => void;
  /** Callback when an edge is clicked */
  onEdgeClick?: (edgeId: string) => void;
  /** CSS class name for the container */
  className?: string;
  /** Inline styles for the container */
  style?: CSSProperties;
}

/**
 * Extended interface for visualizations that support content truncation
 */
export interface ContentTruncationVizProps extends BaseVizProps {
  /** Maximum length for node content before truncation */
  maxContentLength?: number;
}

/**
 * Extended interface for visualizations that support viewport control
 */
export interface ViewportVizProps extends BaseVizProps {
  /** Whether to automatically fit view to current node */
  fitViewOnCurrentNode?: boolean;
}

/**
 * Extended interface for visualizations that support layout configuration
 */
export interface LayoutVizProps extends BaseVizProps {
  /** Layout configuration options */
  layoutOptions?: Partial<{
    direction: 'TB' | 'BT' | 'LR' | 'RL';
    nodeSpacing: number;
    rankSpacing: number;
    nodeWidth: number;
    nodeHeight: number;
    marginX: number;
    marginY: number;
  }>;
}

/**
 * Full-featured visualization props combining all extensions
 */
export interface FullVizProps
  extends ContentTruncationVizProps,
    ViewportVizProps,
    LayoutVizProps {}

/**
 * Generic theme configuration for visualizations
 */
export interface VizTheme {
  node: {
    default: {
      background: string;
      border: string;
      color: string;
    };
    current: {
      background: string;
      border: string;
      color: string;
      shadow?: string;
    };
    traversed: {
      background: string;
      border: string;
      color: string;
    };
  };
  edge: {
    default: {
      stroke: string;
      strokeWidth: number;
    };
    traversed: {
      stroke: string;
      strokeWidth: number;
    };
  };
}
