import React, { useEffect, memo, useCallback, useMemo } from 'react';
import type {
  FlowDefinition,
  EngineOptions,
  ExecutionStep,
  RuntimeNode,
} from '@zflo/core';
import { useFlowEngine } from '@zflo/react';
import { NodeRenderer } from './node-renderer';
import { StatusBar } from './status-bar';
import { LoadingSpinner } from './loading-spinner';
import { ErrorDisplay } from './error-display';

export interface FlowPlayerProps {
  flow: FlowDefinition;
  options?: EngineOptions;
  onComplete?: (history: ExecutionStep[]) => void;
  onNodeChange?: (node: RuntimeNode) => void;
  onStateChange?: (state: Record<string, unknown>) => void;
  className?: string;
  theme?: 'light' | 'dark';
  autoStart?: boolean;
  // Typing animation options
  enableTypingAnimation?: boolean;
  typingSpeed?: number;
  typingInterval?: number;
}

export const FlowPlayer: React.FC<FlowPlayerProps> = memo(
  ({
    flow,
    options,
    onComplete,
    onNodeChange,
    onStateChange,
    className = '',
    theme = 'light',
    autoStart = true,
    enableTypingAnimation = false,
    typingSpeed = 2,
    typingInterval = 30,
  }) => {
    const {
      currentNode,
      choices,
      isComplete,
      canGoBack,
      isLoading,
      error,
      state,
      history,
      makeChoice,
      goBack,
      reset,
      start,
    } = useFlowEngine(flow, options);

    const previousState = useMemo(
      () =>
        history.length > 1 ? history[history.length - 2]?.state || {} : {},
      [history]
    );

    useEffect(() => {
      if (autoStart && !currentNode && !isLoading && !error) {
        start();
      }
    }, [autoStart, currentNode, isLoading, error, start]);

    useEffect(() => {
      if (isComplete && onComplete) {
        onComplete(history);
      }
    }, [isComplete, history, onComplete]);

    useEffect(() => {
      if (currentNode && onNodeChange) {
        onNodeChange(currentNode);
      }
    }, [currentNode, onNodeChange]);

    useEffect(() => {
      if (onStateChange) {
        onStateChange(state);
      }
    }, [state, onStateChange]);

    const handleChoice = useCallback(
      async (choiceId: string) => {
        await makeChoice(choiceId);
      },
      [makeChoice]
    );

    const handleGoBack = useCallback(async () => {
      await goBack();
    }, [goBack]);

    const handleRestart = useCallback(async () => {
      reset();
      await start();
    }, [reset, start]);

    if (error) {
      return (
        <ErrorDisplay
          error={error}
          onRetry={handleRestart}
          className={className}
          theme={theme}
        />
      );
    }

    if (isLoading && !currentNode) {
      return (
        <LoadingSpinner
          message="Loading flowchart..."
          className={className}
          theme={theme}
        />
      );
    }

    if (!currentNode) {
      return (
        <div className={className}>
          <div>
            <h3>Ready to start</h3>
            <button onClick={start}>Start</button>
          </div>
        </div>
      );
    }

    return (
      <div className={className}>
        <StatusBar state={state} theme={theme} />

        <NodeRenderer
          node={currentNode}
          choices={choices}
          onChoice={handleChoice}
          canGoBack={canGoBack && !isComplete}
          onGoBack={handleGoBack}
          isLoading={isLoading}
          isComplete={isComplete}
          state={state}
          previousState={previousState}
          theme={theme}
          showStateDisplay={true}
          changesOnly={true}
          enableTypingAnimation={enableTypingAnimation}
          typingSpeed={typingSpeed}
          typingInterval={typingInterval}
        />

        {isComplete && (
          <div>
            <button onClick={handleRestart}>Play Again</button>
          </div>
        )}
      </div>
    );
  }
);
