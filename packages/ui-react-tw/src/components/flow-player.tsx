import * as React from 'react';
import { useFlowEngine, useTypingAnimation } from '@zflo/react';
import { FlowDefinition } from '@zflo/core';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Play, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { StateChanges } from './state-changes';
import { StatusBar } from './status-bar';
import { AutoAdvanceMode } from '@zflo/core';

export interface FlowPlayerProps {
  flow: FlowDefinition;
  onStateChange?: (state: Record<string, unknown>) => void;
  onComplete?: (finalState: Record<string, unknown>) => void;
  onExecutionStateChange?: (executionState: {
    currentNode: any;
    history: any[];
  }) => void;
  className?: string;
  autoStart?: boolean;
  options?: {
    initialState?: Record<string, unknown>;
    enableHistory?: boolean;
    maxHistorySize?: number;
    autoSave?: boolean;
    autoAdvance?: AutoAdvanceMode;
    showDisabledChoices?: boolean;
  };
  // Typing animation options
  enableTypingAnimation?: boolean;
  typingSpeed?: number;
  typingInterval?: number;
}

export const FlowPlayer: React.FC<FlowPlayerProps> = ({
  flow,
  options,
  onComplete,
  onStateChange,
  onExecutionStateChange,
  className,
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
    previousState,
    hasStateChanged,
    history,
    makeChoice,
    goBack,
    reset,
    start,
  } = useFlowEngine(flow, options);

  // Auto-start the flowchart
  React.useEffect(() => {
    if (autoStart && !currentNode && !isLoading && !error) {
      start();
    }
  }, [autoStart, currentNode, isLoading, error, start]);

  // Handle completion callback
  React.useEffect(() => {
    if (isComplete && onComplete && history.length > 0) {
      const lastHistoryItem = history[history.length - 1];
      if (lastHistoryItem) {
        onComplete(lastHistoryItem.state);
      }
    }
  }, [isComplete, history, onComplete]);

  // Handle state change callback
  React.useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // Handle execution state change callback
  React.useEffect(() => {
    if (onExecutionStateChange) {
      onExecutionStateChange({
        currentNode,
        history,
      });
    }
  }, [currentNode, history, onExecutionStateChange]);

  const handleChoice = async (choiceId: string) => {
    await makeChoice(choiceId);
  };

  const handleGoBack = async () => {
    await goBack();
  };

  const handleRestart = () => {
    reset();
    start();
  };

  // Typing animation for node content
  const { displayedText, isTyping, skipToEnd } = useTypingAnimation({
    text: currentNode?.interpolatedContent || '',
    speed: typingSpeed,
    interval: typingInterval,
    enabled: enableTypingAnimation,
  });

  if (error) {
    return (
      <div className={cn('w-full max-w-2xl mx-auto', className)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {String(error)}
            </p>
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && !currentNode) {
    return (
      <div className={cn('w-full max-w-2xl mx-auto', className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading flowchart...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className={cn('w-full max-w-2xl mx-auto', className)}>
        <Card>
          <CardHeader>
            <CardTitle>{flow.title || 'Ready to start'}</CardTitle>
            {flow.description && (
              <p className="text-sm text-muted-foreground">
                {flow.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Button onClick={start} className="w-full">
              <Play />
              Start
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const showStateChanges = !isTyping && hasStateChanged && history.length > 1;

  return (
    <div
      className={cn('w-full max-w-2xl mx-auto flex flex-col gap-4', className)}
    >
      {/* Status Bar */}
      <StatusBar state={state} />

      {/* State Changes - only show when state has actually changed */}
      {showStateChanges && (
        <StateChanges previousState={previousState} currentState={state} />
      )}

      {/* Main Node Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {currentNode.definition.title ||
                `Node ${currentNode.definition.id}`}
            </CardTitle>
            {canGoBack && !isComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="ml-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {currentNode.definition.content && (
            <div
              className="whitespace-pre-line"
              onClick={isTyping ? skipToEnd : undefined}
              style={{ cursor: isTyping ? 'pointer' : 'default' }}
              title={isTyping ? 'Click to show full text' : undefined}
            >
              <p className="text-sm leading-relaxed">{displayedText}</p>
            </div>
          )}

          {choices.length > 0 && !isTyping && (
            <div className="flex flex-col gap-3">
              {choices.length > 1 && (
                <h4 className="font-medium">Your answer:</h4>
              )}
              <div className="grid gap-2">
                {choices.map((choice) => (
                  <Button
                    key={choice.outletId}
                    onClick={() => handleChoice(choice.outletId)}
                    disabled={isLoading || !choice.isEnabled || isTyping}
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left h-auto py-3 px-4',
                      !choice.isEnabled && 'opacity-50 cursor-not-allowed'
                    )}
                    title={
                      !choice.isEnabled
                        ? choice.disabledReason
                        : choice.description
                    }
                  >
                    {isLoading && <Loader2 className="w-4 h-4 nimate-spin" />}
                    <div className="flex flex-col items-start">
                      <span>{choice.label}</span>
                      {!choice.isEnabled && choice.disabledReason && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {choice.disabledReason}
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {isComplete && !isTyping && (
            <div className="mt-6 pt-6 border-t">
              <Button onClick={handleRestart} className="w-full">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
