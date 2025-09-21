import { useEffect, useMemo, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { zfloToMermaid } from '@zflo/format-mermaid';
import type {
  MermaidVizProps,
  ExecutionHighlight,
} from '../types/mermaid-viz-types';

export function MermaidViz({
  flow,
  currentNodeId,
  history = [],
  onNodeClick,
  onEdgeClick,
  className,
  style,
  mermaidOptions = {},
  showCard = false,
  title = 'Flowchart',
}: MermaidVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Generate stable ID that only changes when syntax changes
  const mermaidId = useMemo(
    () =>
      `mermaid-direct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    [flow]
  );

  useEffect(() => {
    // Initialize Mermaid with configuration
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidOptions.theme || 'neutral',
      securityLevel: mermaidOptions.securityLevel || 'loose',
      flowchart: {
        useMaxWidth: mermaidOptions.useMaxWidth ?? true,
        htmlLabels: mermaidOptions.htmlLabels ?? true,
        curve: mermaidOptions.curve || 'basis',
      },
    });
    setIsInitialized(true);
  }, [mermaidOptions]);

  useEffect(() => {
    if (!containerRef.current || !flow || !isInitialized) return;

    const renderMermaid = async () => {
      try {
        if (!containerRef.current) return;

        // Build execution highlight from current state
        const executionHighlight: ExecutionHighlight = {
          currentNodeId,
          history: history || [],
        };

        // Generate Mermaid code with execution highlighting
        const mermaidCode = zfloToMermaid(flow, executionHighlight);

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Render the Mermaid diagram
        const { svg } = await mermaid.render(mermaidId, mermaidCode);

        if (containerRef.current && !svg.includes('<g></g>')) {
          // Defer DOM write to the next animation frame to avoid layout thrashing
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.innerHTML = svg;

              // Add click handlers if provided
              if (onNodeClick || onEdgeClick) {
                addClickHandlers(
                  containerRef.current,
                  onNodeClick,
                  onEdgeClick
                );
              }
            }
          });
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-32 text-muted-foreground">
              <p>Error rendering flowchart visualization</p>
            </div>
          `;
        }
      }
    };

    renderMermaid();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    flow,
    currentNodeId,
    history,
    mermaidId,
    isInitialized,
    onNodeClick,
    onEdgeClick,
  ]);

  const content = (
    <div
      ref={containerRef}
      className="w-full"
      style={{ minHeight: '200px', ...style }}
    />
  );

  if (showCard) {
    return (
      <div className={`border rounded-lg ${className || ''}`}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4">{content}</div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

/**
 * Add click handlers to Mermaid SVG elements
 */
function addClickHandlers(
  container: HTMLElement,
  onNodeClick?: (nodeId: string) => void,
  onEdgeClick?: (edgeId: string) => void
) {
  if (!onNodeClick && !onEdgeClick) return;

  // Add click handlers for nodes
  if (onNodeClick) {
    const nodeElements = container.querySelectorAll('[id^="flowchart-"]');
    nodeElements.forEach((element) => {
      const nodeId = element.id.replace('flowchart-', '').replace('-', '');
      element.addEventListener('click', () => onNodeClick(nodeId));
      (element as HTMLElement).style.cursor = 'pointer';
    });
  }

  // Add click handlers for edges
  if (onEdgeClick) {
    const edgeElements = container.querySelectorAll('.edgePath');
    edgeElements.forEach((element, index) => {
      element.addEventListener('click', () => onEdgeClick(`edge-${index}`));
      (element as HTMLElement).style.cursor = 'pointer';
    });
  }
}
