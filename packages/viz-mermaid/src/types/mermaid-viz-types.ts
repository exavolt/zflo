import type { FlowDefinition, ExecutionStep } from '@zflo/core';
import type { CSSProperties } from 'react';

/**
 * Mermaid-specific configuration options
 */
export interface MermaidVizOptions {
  /** Mermaid theme */
  theme?: 'default' | 'neutral' | 'dark' | 'forest' | 'base';
  /** Security level for Mermaid */
  securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
  /** Whether to use max width */
  useMaxWidth?: boolean;
  /** Whether to use HTML labels */
  htmlLabels?: boolean;
  /** Curve type for flowchart */
  curve?: 'basis' | 'linear' | 'stepBefore' | 'stepAfter';
}

/**
 * Props for MermaidViz component
 */
export interface MermaidVizProps {
  /** The flow to visualize */
  flow: FlowDefinition;
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
  /** Mermaid-specific configuration options */
  mermaidOptions?: MermaidVizOptions;
  /** Whether to show the card wrapper */
  showCard?: boolean;
  /** Title for the card header */
  title?: string;
}

/**
 * Internal execution highlight interface for Mermaid formatting
 */
export interface ExecutionHighlight {
  currentNodeId?: string;
  executionPath?: string[];
  history?: import('@zflo/core').ExecutionStep[];
}
