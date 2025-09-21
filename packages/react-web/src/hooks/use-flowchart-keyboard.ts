import { useEffect, useCallback } from 'react';
import type { Choice } from '@zflo/core';

export interface UseFlowchartKeyboardOptions {
  choices: Choice[];
  onChoice: (choiceId: string) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  disabled?: boolean;
}

export function useFlowchartKeyboard({
  choices,
  onChoice,
  onGoBack,
  canGoBack = false,
  disabled = false,
}: UseFlowchartKeyboardOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      if (event.key >= '1' && event.key <= '9') {
        const choiceIndex = parseInt(event.key) - 1;
        if (choiceIndex < choices.length && !choices[choiceIndex]?.disabled) {
          event.preventDefault();
          onChoice(choices[choiceIndex]!.id);
        }
        return;
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const buttons = document.querySelectorAll('[data-choice-button]');
        const currentIndex = Array.from(buttons).findIndex(
          (button) => button === document.activeElement
        );

        let nextIndex;
        if (event.key === 'ArrowUp') {
          nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= buttons.length - 1 ? 0 : currentIndex + 1;
        }

        (buttons[nextIndex] as HTMLElement)?.focus();
        return;
      }

      if (event.key === 'Enter') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.dataset.choiceButton) {
          event.preventDefault();
          activeElement.click();
        }
        return;
      }

      if (
        (event.key === 'Escape' || event.key === 'Backspace') &&
        canGoBack &&
        onGoBack
      ) {
        event.preventDefault();
        onGoBack();
        return;
      }
    },
    [choices, onChoice, onGoBack, canGoBack, disabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    getChoiceProps: (choice: Choice, index: number) => ({
      'data-choice-button': true,
      'aria-label': `Choice ${index + 1}: ${choice.label}${choice.description ? ` - ${choice.description}` : ''}`,
      'aria-disabled': choice.disabled,
      tabIndex: choice.disabled ? -1 : 0,
    }),
  };
}
