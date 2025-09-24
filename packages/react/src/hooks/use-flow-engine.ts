import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FlowEngine,
  ExecutionStep,
  EngineOptions,
  AutoAdvanceMode,
  RuntimeNode,
  RuntimeChoice,
  FlowDefinition,
} from '@zflo/core';

export interface UseFlowEngineOptions {
  initialState?: Record<string, unknown>;
  enableHistory?: boolean;
  maxHistorySize?: number;
  autoSave?: boolean;
  autoAdvance?: AutoAdvanceMode;
  showDisabledChoices?: boolean;
}

export interface UseFlowEngineReturn {
  currentNode: RuntimeNode | null;
  choices: RuntimeChoice[];
  isComplete: boolean;
  canGoBack: boolean;
  isLoading: boolean;
  error: Error | null;
  state: Record<string, unknown>;
  previousState: Record<string, unknown>;
  hasStateChanged: boolean;
  history: ExecutionStep[];
  makeChoice: (choiceId: string) => Promise<void>;
  goBack: () => Promise<void>;
  reset: () => void;
  start: () => Promise<void>;
}

export function useFlowEngine(
  flow: FlowDefinition,
  options?: EngineOptions
): UseFlowEngineReturn {
  const [engine, setEngine] = useState(() => new FlowEngine(flow, options));
  const [currentNode, setCurrentNode] = useState<RuntimeNode | null>(null);
  const [choices, setChoices] = useState<RuntimeChoice[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [state, setState] = useState<Record<string, unknown>>({});
  const [previousState, setPreviousState] = useState<Record<string, unknown>>(
    {}
  );
  const [hasStateChanged, setHasStateChanged] = useState(false);
  const [history, setHistory] = useState<ExecutionStep[]>([]);

  // Reset engine when flowchart changes (use ref to track previous flowchart)
  const prevFlowRef = useRef<FlowDefinition | null>(null);
  useEffect(() => {
    if (prevFlowRef.current && prevFlowRef.current !== flow) {
      const newEngine = new FlowEngine(flow, options);
      setEngine(newEngine);
      setCurrentNode(null);
      setChoices([]);
      setIsComplete(false);
      setCanGoBack(false);
      setError(null);
      setState({});
      setPreviousState({});
      setHasStateChanged(false);
      setHistory([]);
    }
    prevFlowRef.current = flow;
  }, [flow, options]);

  const updateState = useCallback(
    (skipStateChangeTracking = false) => {
      const newState = engine.getState();
      const stateChanged = JSON.stringify(state) !== JSON.stringify(newState);

      // Only update previousState if the state actually changed and we're not skipping tracking
      if (stateChanged && !skipStateChangeTracking) {
        setPreviousState(JSON.parse(JSON.stringify(state))); // Deep clone current state
        setHasStateChanged(true);
      } else if (skipStateChangeTracking) {
        setHasStateChanged(false);
      } else {
        setHasStateChanged(false);
      }

      engine.getCurrentContext().then((context) => {
        setCurrentNode(context?.currentNode || null);
        setChoices(context?.availableChoices || []);
        setIsComplete(context?.isComplete || false);
        setCanGoBack(context?.canGoBack || false);
      });
      setState(JSON.parse(JSON.stringify(newState))); // Deep clone new state
      setHistory(engine.getHistory());
    },
    [engine, state]
  );

  useEffect(() => {
    const handleNodeEnter = () => updateState();
    const handleNodeExit = () => updateState();
    const handleStateChange = () => updateState();
    const handleComplete = () => updateState();
    const handleError = ({ error }: { error: Error }) => {
      setError(error);
      setIsLoading(false);
    };

    engine.on('nodeEnter', handleNodeEnter);
    engine.on('nodeExit', handleNodeExit);
    engine.on('stateChange', handleStateChange);
    engine.on('complete', handleComplete);
    engine.on('error', handleError);

    return () => {
      engine.off('nodeEnter', handleNodeEnter);
      engine.off('nodeExit', handleNodeExit);
      engine.off('stateChange', handleStateChange);
      engine.off('complete', handleComplete);
      engine.off('error', handleError);
    };
  }, [engine, updateState]);

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await engine.start();
      updateState();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [engine, updateState]);

  const makeChoice = useCallback(
    async (choiceId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await engine.next(choiceId);
        updateState();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    },
    [engine, updateState]
  );

  const goBack = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await engine.goBack();
      updateState();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [engine, updateState]);

  const reset = useCallback(() => {
    // Clear state change tracking before reset
    setHasStateChanged(false);
    setPreviousState({});

    engine.reset();
    updateState(true); // Skip state change tracking for reset
    setError(null);
  }, [engine, updateState]);

  return {
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
  };
}
