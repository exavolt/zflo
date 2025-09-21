import React, { useEffect, useRef, useMemo, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDirectRendererProps {
  mermaidSyntax: string;
  className?: string;
}

export const MermaidDirectRenderer: React.FC<MermaidDirectRendererProps> = ({
  mermaidSyntax,
  className = '',
}) => {
  //const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate stable ID that only changes when syntax changes
  const mermaidId = useMemo(
    () =>
      `mermaid-direct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    [mermaidSyntax]
  );

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral', // theme === 'light' ? 'default' : 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    });
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !mermaidSyntax.trim() || !isInitialized)
      return;

    const renderMermaid = async () => {
      try {
        if (!containerRef.current) return;

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Add a small delay to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Render the mermaid diagram directly from syntax
        const { svg } = await mermaid.render(mermaidId, mermaidSyntax);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="error-message" style="padding: 20px; border: 1px solid #ff6b6b; border-radius: 8px; background: #ffe0e0; color: #d63031;">
              <h4>Error rendering flowchart</h4>
              <p>Unable to generate visual representation of the flowchart.</p>
              <details>
                <summary>Error details</summary>
                <pre style="margin-top: 10px; font-size: 12px;">${error}</pre>
              </details>
            </div>
          `;
        }
      }
    };

    renderMermaid();
  }, [mermaidSyntax, mermaidId, isInitialized]);

  return (
    <div className={`mermaid-direct-renderer ${className}`}>
      <div ref={containerRef} style={{ width: '100%', textAlign: 'center' }} />
    </div>
  );
};
