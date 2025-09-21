import React, { memo, useMemo, useCallback } from 'react';
import type { AnnotatedNode, Choice } from '@zflo/core';
import { StateDisplay } from './state-display';
import { useFlowchartKeyboard } from '../hooks/use-flowchart-keyboard';
import { useTypingAnimation } from '@zflo/react';

export interface NodeRendererProps {
  node: AnnotatedNode;
  choices: Choice[];
  onChoice: (choiceId: string) => void;
  canGoBack: boolean;
  onGoBack: () => void;
  isLoading?: boolean;
  isComplete?: boolean;
  state?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  theme?: 'light' | 'dark';
  showStateDisplay?: boolean;
  compactStateDisplay?: boolean;
  hiddenStateVariables?: string[];
  changesOnly?: boolean;
  // Typing animation options
  enableTypingAnimation?: boolean;
  typingSpeed?: number;
  typingInterval?: number;
}

export const NodeRenderer: React.FC<NodeRendererProps> = memo(
  ({
    node,
    choices,
    onChoice,
    canGoBack,
    onGoBack,
    isLoading = false,
    isComplete = false,
    state = {},
    previousState = {},
    theme = 'light',
    showStateDisplay = true,
    compactStateDisplay = false,
    hiddenStateVariables = [],
    changesOnly = false,
    enableTypingAnimation = false,
    typingSpeed = 2,
    typingInterval = 30,
  }) => {
    const handleChoiceClick = useCallback(
      (choiceId: string) => {
        if (!isLoading) {
          onChoice(choiceId);
        }
      },
      [isLoading, onChoice]
    );

    const nodeIcon = useMemo(() => {
      switch (node.type) {
        case 'start':
          return '🚀';
        case 'decision':
          return '🤔';
        case 'end':
          return '🎯';
        default:
          return '📖';
      }
    }, [node.type]);

    const nodeTypeClass = useMemo(() => {
      return `zflo-node-${node.type}`;
    }, [node.type]);

    const shouldShowStateDisplay = useMemo(() => {
      return showStateDisplay && Object.keys(state).length > 0;
    }, [showStateDisplay, state]);

    const { displayedText, isTyping, skipToEnd } = useTypingAnimation({
      text: node.node.content || '',
      speed: typingSpeed,
      interval: typingInterval,
      enabled: enableTypingAnimation,
    });

    const { getChoiceProps } = useFlowchartKeyboard({
      choices,
      onChoice,
      onGoBack,
      canGoBack,
      disabled: isLoading || isTyping,
    });

    return (
      <div className={`zflo-node-renderer ${theme} ${nodeTypeClass}`}>
        <div className="zflo-node-header">
          <span className="zflo-node-icon">{nodeIcon}</span>
          <h2 className="zflo-node-title">{node.node.title}</h2>
        </div>

        {node.node.content && (
          <div
            className="zflo-node-content"
            onClick={isTyping ? skipToEnd : undefined}
            style={{ cursor: isTyping ? 'pointer' : 'default' }}
            title={isTyping ? 'Click to show full text' : undefined}
          >
            <p>{displayedText}</p>
          </div>
        )}

        {shouldShowStateDisplay && (
          <StateDisplay
            state={state}
            previousState={previousState}
            theme={theme}
            compactStateDisplay={compactStateDisplay}
            hiddenStateVariables={hiddenStateVariables}
            changesOnly={changesOnly}
          />
        )}

        {choices.length > 0 && !isTyping && (
          <div
            className="zflo-choices"
            role="group"
            aria-labelledby="choices-heading"
          >
            {choices.length > 1 && (
              <h3 id="choices-heading">What's your choice?</h3>
            )}
            <div className="zflo-choice-buttons">
              {choices.map((choice, index) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceClick(choice.id)}
                  disabled={isLoading || choice.disabled || isTyping}
                  className="zflo-choice-button"
                  title={choice.description}
                  {...getChoiceProps(choice, index)}
                >
                  <span aria-hidden="true">{index + 1}. </span>
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isComplete && (
          <div className="zflo-completion">
            <h3>🎉 Adventure Complete!</h3>
            <p>You have reached the end of this journey.</p>
          </div>
        )}

        <div className="zflo-navigation">
          {canGoBack && (
            <button
              onClick={onGoBack}
              disabled={isLoading}
              className="zflo-back-button"
            >
              ← Go Back
            </button>
          )}
        </div>

        {isLoading && (
          <div className="zflo-loading-overlay">
            <div className="zflo-spinner"></div>
          </div>
        )}
      </div>
    );
  }
);
