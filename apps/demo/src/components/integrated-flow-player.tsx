import React, { useState, useCallback, useEffect } from 'react';
import { ZFFlow, ExecutionStep, AnnotatedNode } from '@zflo/core';
import { FlowPlayer } from '@zflo/ui-react-tw';
import { FlowViz } from '@zflo/viz-reactflow';

interface IntegratedFlowPlayerProps {
  flowchart: ZFFlow;
  showFlowchart?: boolean;
  onComplete?: (finalState: Record<string, unknown>) => void;
  enableTypingAnimation?: boolean;
}

export const IntegratedFlowPlayer: React.FC<IntegratedFlowPlayerProps> = ({
  flowchart,
  showFlowchart = true,
  onComplete,
  enableTypingAnimation = false,
}) => {
  // State to hold execution information for Mermaid visualization
  const [executionState, setExecutionState] = useState<{
    currentNode?: AnnotatedNode | null;
    history?: ExecutionStep[];
  }>({});

  useEffect(() => {
    console.log('IntegrationFlowPlayer mounted');
    return () => {
      console.log('IntegrationFlowPlayer unmounted');
    };
  }, []);

  // Handle execution state changes from FlowPlayer - memoized to prevent re-render loops
  const handleExecutionStateChange = useCallback(
    (state: { currentNode: any; history: any[] }) => {
      setExecutionState({
        currentNode: state.currentNode,
        history: state.history,
      });
    },
    []
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Flow Player */}
      <div className="flex-1 overflow-auto">
        <FlowPlayer
          flowchart={flowchart}
          autoStart={true}
          onComplete={onComplete}
          onExecutionStateChange={handleExecutionStateChange}
          options={{
            showDisabledChoices: true,
            enableHistory: true,
          }}
          enableTypingAnimation={enableTypingAnimation}
          typingInterval={enableTypingAnimation ? 50 : 0}
          typingSpeed={enableTypingAnimation ? 2 : 0}
        />
      </div>

      {/* Flow Visualization */}
      {showFlowchart && (
        <FlowViz
          flow={flowchart}
          currentNodeId={executionState.currentNode?.node.id}
          history={executionState.history}
          className="h-full flex-1 lg:max-w-md overflow-auto relative"
          style={{ minHeight: '400px' }}
          maxContentLength={120}
          fitViewOnCurrentNode={true}
        />
      )}
    </div>
  );
};
