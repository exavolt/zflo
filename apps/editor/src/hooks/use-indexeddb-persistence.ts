import { useCallback, useState, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import type { FlowMetadata } from '@zflo/core';
import { v4 as uuidv4 } from 'uuid';
import { NodeData } from '@/types';
import { flowDb } from '@/lib/storage/flow-database';
import type { EditorSettings, FlowRecord } from '@/lib/storage/storage-schema';

interface FlowState {
  id: string;
  nodes: Node[];
  edges: Edge[];
  flowTitle: string;
  nodeIdCounter: number;
  edgeIdCounter: number;
  flowMetadata?: FlowMetadata;
  lastModified: number;
}

export function useIndexedDBPersistence() {
  const [activeFlowId, setActiveFlowId] = useState<string>('');
  const [flows, setFlows] = useState<Record<string, FlowRecord>>({});
  const [flowOrder, setFlowOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<EditorSettings | null>(null);

  // Session ID for tracking related changes
  const sessionId = useRef(uuidv4());

  // Keep track of the last saved state for change detection
  const lastSavedStateRef = useRef<Record<string, string>>({});

  // Track if we've attempted to create a default flow to prevent infinite loops
  const hasAttemptedDefaultFlowRef = useRef(false);

  // Helper function to create a hash of the flow state for comparison
  const createFlowStateHash = useCallback(
    (flowState: Omit<FlowState, 'id' | 'lastModified'>) => {
      return JSON.stringify({
        nodes: flowState.nodes,
        edges: flowState.edges,
        flowTitle: flowState.flowTitle,
        nodeIdCounter: flowState.nodeIdCounter,
        edgeIdCounter: flowState.edgeIdCounter,
        flowMetadata: flowState.flowMetadata,
      });
    },
    []
  );

  // Convert FlowRecord to FlowState for backward compatibility
  const flowRecordToState = useCallback(
    (record: FlowRecord): FlowState => ({
      id: record.id,
      nodes: record.nodes,
      edges: record.edges,
      flowTitle: record.title,
      nodeIdCounter: record.nodeIdCounter,
      edgeIdCounter: record.edgeIdCounter,
      flowMetadata: record.flowMetadata,
      lastModified: record.lastModified.getTime(),
    }),
    []
  );

  // Convert FlowState to FlowRecord
  const flowStateToRecord = useCallback(
    (
      state: FlowState
    ): Omit<FlowRecord, 'createdAt' | 'lastModified' | 'version'> => ({
      id: state.id,
      title: state.flowTitle,
      description: state.flowMetadata?.description,
      nodes: state.nodes,
      edges: state.edges,
      nodeIdCounter: state.nodeIdCounter,
      edgeIdCounter: state.edgeIdCounter,
      flowMetadata: state.flowMetadata || {
        id: uuidv4(),
        title: state.flowTitle,
        description: '',
        expressionLanguage: 'liquid',
        initialState: {},
        metadata: {},
      },
    }),
    []
  );

  // Load all flows and settings from IndexedDB
  const loadFromStorage = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Load all flows first
      const allFlows = await flowDb.flows.toArray();
      const flowsMap = allFlows.reduce(
        (acc: Record<string, FlowRecord>, flow: FlowRecord) => {
          acc[flow.id] = flow;
          // Initialize hash for change detection
          const flowState = flowRecordToState(flow);
          lastSavedStateRef.current[flow.id] = createFlowStateHash(flowState);
          return acc;
        },
        {}
      );

      // Load settings
      const loadedSettings = await flowDb.getSettings();

      // Update state in the correct order to prevent race conditions
      setFlows(flowsMap);

      // Ensure flowOrder only contains flows that actually exist
      const validFlowOrder = loadedSettings.flowOrder.filter(
        (id) => flowsMap[id]
      );
      const allFlowIds = Object.keys(flowsMap);
      const missingFlowIds = allFlowIds.filter(
        (id) => !validFlowOrder.includes(id)
      );
      const correctedFlowOrder = [...validFlowOrder, ...missingFlowIds];

      setFlowOrder(correctedFlowOrder);
      setSettings(loadedSettings);

      // Update settings if flow order was corrected
      if (
        JSON.stringify(correctedFlowOrder) !==
        JSON.stringify(loadedSettings.flowOrder)
      ) {
        await flowDb.updateSettings({ flowOrder: correctedFlowOrder });
      }

      // Set active flow ID last, after flows are loaded
      if (
        loadedSettings.activeFlowId &&
        flowsMap[loadedSettings.activeFlowId]
      ) {
        // Case 2: Load the specified active flow
        setActiveFlowId(loadedSettings.activeFlowId);
      } else if (allFlows.length > 0) {
        // Case 3: If there's no active flow, pick the first stored flow
        const firstFlow = allFlows[0];
        if (firstFlow) {
          setActiveFlowId(firstFlow.id);
          await flowDb.updateSettings({ activeFlowId: firstFlow.id });
        }
      }
      // Case 4: If there's no flow at all, will be handled by the default flow creation effect
    } catch (error) {
      console.error('Failed to load flows from storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [flowRecordToState, createFlowStateHash]);

  // Save current flow state only if it has actually changed
  const saveFlowState = useCallback(
    async (
      flowState: Omit<FlowState, 'id' | 'lastModified'>,
      flowId?: string,
      forceUpdate = false
    ): Promise<void> => {
      try {
        const targetFlowId = flowId || activeFlowId;
        if (!targetFlowId) return;

        // Create hash of current state
        const currentStateHash = createFlowStateHash(flowState);
        const lastSavedHash = lastSavedStateRef.current[targetFlowId];

        // Only save if the state has actually changed or if forced
        if (!forceUpdate && currentStateHash === lastSavedHash) {
          return;
        }

        const updatedFlowState: FlowState = {
          ...flowState,
          id: targetFlowId,
          lastModified: Date.now(),
        };

        const flowRecord = flowStateToRecord(updatedFlowState);

        // Check if flow exists
        const existingFlow = await flowDb.flows.get(targetFlowId);

        if (existingFlow) {
          // Update existing flow with history
          await flowDb.updateFlowWithHistory(
            targetFlowId,
            flowRecord,
            'Flow updated',
            sessionId.current
          );
        } else {
          // Create new flow with history
          await flowDb.createFlowWithHistory(flowRecord, sessionId.current);
        }

        // Update local state
        const updatedFlow = await flowDb.flows.get(targetFlowId);
        if (updatedFlow) {
          setFlows((prev) => ({ ...prev, [targetFlowId]: updatedFlow }));
          lastSavedStateRef.current[targetFlowId] = currentStateHash;
        }
      } catch (error) {
        console.error('Failed to save flow state:', error);
      }
    },
    [activeFlowId, createFlowStateHash, flowStateToRecord]
  );

  // Create a new flow
  const createFlow = useCallback(
    async (title: string = 'New Flow'): Promise<string> => {
      try {
        const flowId = uuidv4();
        const newFlowState: FlowState = {
          id: flowId,
          nodes: [
            {
              id: 'zflo-n1',
              type: 'zfloNode',
              position: { x: 100, y: 100 },
              data: {
                title: 'Start',
                content: '',
                outputCount: 0,
                outlets: [],
              } as NodeData as unknown as Record<string, unknown>,
            },
          ],
          edges: [],
          flowTitle: title,
          nodeIdCounter: 1,
          edgeIdCounter: 1,
          flowMetadata: {
            id: uuidv4(),
            title,
            description: '',
            expressionLanguage: 'liquid',
            initialState: {},
            stateSchema: undefined,
            metadata: {},
          },
          lastModified: Date.now(),
        };

        const flowRecord = flowStateToRecord(newFlowState);
        await flowDb.createFlowWithHistory(flowRecord, sessionId.current);

        // Update settings
        const newFlowOrder = [...flowOrder, flowId];
        await flowDb.updateSettings({
          activeFlowId: flowId,
          flowOrder: newFlowOrder,
        });

        // Update local state using the flow record we already have
        const createdFlowRecord: FlowRecord = {
          ...flowRecord,
          id: flowId,
          createdAt: new Date(),
          lastModified: new Date(),
          version: 1,
        };

        // Update flows first, then activeFlowId to ensure proper state synchronization
        setFlows((prev) => {
          const updated = { ...prev, [flowId]: createdFlowRecord };
          return updated;
        });
        setFlowOrder(newFlowOrder);

        // Initialize hash
        lastSavedStateRef.current[flowId] = createFlowStateHash(newFlowState);

        // Set active flow ID after state is updated
        setActiveFlowId(flowId);

        return flowId;
      } catch (error) {
        console.error('Failed to create new flow:', error);
        throw error;
      }
    },
    [flowOrder, flowStateToRecord, createFlowStateHash]
  );

  // Delete a flow
  const deleteFlow = useCallback(
    async (flowId: string): Promise<void> => {
      try {
        if (Object.keys(flows).length <= 1) {
          console.warn('Cannot delete the last remaining flow');
          return;
        }

        await flowDb.deleteFlowWithHistory(flowId, sessionId.current);

        const newFlowOrder = flowOrder.filter((id) => id !== flowId);
        let newActiveFlowId = activeFlowId;

        if (activeFlowId === flowId) {
          const firstOrderedFlow = newFlowOrder[0];
          const firstAvailableFlow = Object.keys(flows).find(
            (id) => id !== flowId
          );
          newActiveFlowId = firstOrderedFlow || firstAvailableFlow || '';
        }

        // Update settings
        await flowDb.updateSettings({
          activeFlowId: newActiveFlowId,
          flowOrder: newFlowOrder,
        });

        // Update local state
        setFlows((prev) => {
          const newFlows = { ...prev };
          delete newFlows[flowId];
          return newFlows;
        });
        setActiveFlowId(newActiveFlowId);
        setFlowOrder(newFlowOrder);

        // Clean up hash
        delete lastSavedStateRef.current[flowId];
      } catch (error) {
        console.error('Failed to delete flow:', error);
      }
    },
    [flows, flowOrder, activeFlowId]
  );

  // Switch active flow
  const switchToFlow = useCallback(
    async (flowId: string): Promise<void> => {
      try {
        if (flows[flowId]) {
          // Update settings first, then local state
          await flowDb.updateSettings({ activeFlowId: flowId });
          setActiveFlowId(flowId);
        } else {
          console.warn(`Flow ${flowId} not found in flows state`);
        }
      } catch (error) {
        console.error('Failed to switch active flow:', error);
      }
    },
    [flows]
  );

  // Get current active flow
  const getActiveFlow = useCallback((): FlowState | null => {
    if (!activeFlowId || !flows[activeFlowId]) return null;
    return flowRecordToState(flows[activeFlowId]);
  }, [flows, activeFlowId, flowRecordToState]);

  // Get all flows for UI display
  const getAllFlows = useCallback(() => {
    const result = flowOrder
      .map((id) => flows[id])
      .filter((flow): flow is FlowRecord => !!flow)
      .map(flowRecordToState);
    return result;
  }, [flows, flowOrder, flowRecordToState]);

  // Clear all flows
  const clearAllFlows = useCallback(async (): Promise<void> => {
    try {
      await flowDb.flows.clear();
      await flowDb.settings.clear();
      await flowDb.flowHistory.clear();
      setFlows({});
      setActiveFlowId('');
      setFlowOrder([]);
      lastSavedStateRef.current = {};
    } catch (error) {
      console.error('Failed to clear all flows:', error);
    }
  }, []);

  // Get flow history
  const getFlowHistory = useCallback(async (flowId: string) => {
    try {
      const { history } = await flowDb.getFlowWithHistory(flowId);
      return history;
    } catch (error) {
      console.error('Failed to get flow history:', error);
      return [];
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Create default flow if no flows exist after loading (Case 4)
  useEffect(() => {
    const createDefaultFlowIfNeeded = async () => {
      if (
        !isLoading &&
        Object.keys(flows).length === 0 &&
        !activeFlowId &&
        !hasAttemptedDefaultFlowRef.current
      ) {
        hasAttemptedDefaultFlowRef.current = true;
        try {
          await createFlow('My First Flow');
        } catch (error) {
          hasAttemptedDefaultFlowRef.current = false; // Reset on error to allow retry
        }
      }
    };

    createDefaultFlowIfNeeded();
  }, [isLoading, flows, activeFlowId, createFlow]);

  return {
    // State
    isLoading,
    activeFlowId,
    flows: Object.fromEntries(
      Object.entries(flows).map(([id, flow]) => [id, flowRecordToState(flow)])
    ),
    flowOrder,
    settings,

    // Flow operations
    saveFlowState,
    createFlow,
    deleteFlow,
    switchToFlow,
    getActiveFlow,
    getAllFlows,
    clearAllFlows,

    // History operations
    getFlowHistory,

    // Utility functions
    createFlowStateHash,
    loadFromStorage,
  };
}
