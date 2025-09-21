import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTypingAnimationOptions {
  text: string;
  speed?: number; // characters per interval
  interval?: number; // milliseconds between updates
  enabled?: boolean;
  onComplete?: () => void;
}

export interface UseTypingAnimationReturn {
  displayedText: string;
  isTyping: boolean;
  isComplete: boolean;
  skipToEnd: () => void;
  reset: () => void;
}

type AnimationState = 'idle' | 'typing' | 'complete';

export function useTypingAnimation({
  text,
  speed = 1,
  interval = 50,
  enabled = true,
  onComplete,
}: UseTypingAnimationOptions): UseTypingAnimationReturn {
  const [displayedText, setDisplayedText] = useState('');
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  // Use a cross-platform timer type compatible with both DOM and Node/RN
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(0);
  const previousTextRef = useRef('');

  const clearAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const skipToEnd = useCallback(() => {
    clearAnimation();
    setDisplayedText(text);
    setAnimationState('complete');
    currentIndexRef.current = text.length;
    onComplete?.();
  }, [text, onComplete, clearAnimation]);

  const reset = useCallback(() => {
    clearAnimation();
    setDisplayedText('');
    setAnimationState('idle');
    currentIndexRef.current = 0;
  }, [clearAnimation]);

  // Handle text changes and animation start
  useEffect(() => {
    // If disabled, show full text immediately
    if (!enabled) {
      setDisplayedText(text);
      setAnimationState('complete');
      currentIndexRef.current = text.length;
      return;
    }

    // If text changed, reset and start new animation
    if (text !== previousTextRef.current) {
      clearAnimation();
      setDisplayedText('');
      setAnimationState('typing');
      currentIndexRef.current = 0;
      previousTextRef.current = text;

      // Handle empty text
      if (text.length === 0) {
        setAnimationState('complete');
        onComplete?.();
        return;
      }

      // Start typing animation
      intervalRef.current = setInterval(() => {
        currentIndexRef.current += speed;
        const nextIndex = Math.min(currentIndexRef.current, text.length);
        const newDisplayedText = text.slice(0, nextIndex);

        setDisplayedText(newDisplayedText);

        if (nextIndex >= text.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setAnimationState('complete');
          onComplete?.();
        }
      }, interval);
    }

    return clearAnimation;
  }, [text, enabled, speed, interval, onComplete, clearAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return clearAnimation;
  }, [clearAnimation]);

  return {
    displayedText: enabled ? displayedText : text,
    isTyping: enabled && animationState === 'typing',
    isComplete: !enabled || animationState === 'complete',
    skipToEnd,
    reset,
  };
}
