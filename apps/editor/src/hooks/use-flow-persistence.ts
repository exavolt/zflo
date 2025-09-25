import { useCallback, useState, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import type { FlowMetadata } from '@zflo/core';
import { v4 as uuidv4 } from 'uuid';
import { NodeData } from '@/types';
import { flowDb } from '@/lib/storage/flow-database';
import { FlowRecord, EditorSettings } from '@/lib/storage/storage-schema';

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

export function useFlowPersistence() {
  const [activeFlowId, setActiveFlowId] = useState<string>('');
  const [flows, setFlows] = useState<Record<string, FlowRecord>>({});
  const [flowOrder, setFlowOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<EditorSettings | null>(null);

  // Session ID for tracking related changes
  const sessionId = useRef(uuidv4());

  // Keep track of the last saved state for change detection
  const lastSavedStateRef = useRef<Record<string, string>>({});

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

      // Check if migration is needed
      const flowCount = await flowDb.flows.count();
      if (flowCount === 0) {
        await flowDb.migrateFromLocalStorage();
      }

      // Load settings
      const loadedSettings = await flowDb.getSettings();
      setSettings(loadedSettings);
      setActiveFlowId(loadedSettings.activeFlowId);
      setFlowOrder(loadedSettings.flowOrder);

      // Load all flows
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

      setFlows(flowsMap);
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

        // Update local state
        const createdFlow = await flowDb.flows.get(flowId);
        if (createdFlow) {
          setFlows((prev) => ({ ...prev, [flowId]: createdFlow }));
          setActiveFlowId(flowId);
          setFlowOrder(newFlowOrder);

          // Initialize hash
          lastSavedStateRef.current[flowId] = createFlowStateHash(newFlowState);
        }

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
          setActiveFlowId(flowId);
          await flowDb.updateSettings({ activeFlowId: flowId });
        }
      } catch (error) {
        console.error('Failed to switch active flow:', error);
      }
    },
    [flows]
  );

  // Get current active flow
  const getActiveFlow = useCallback((): FlowState | null => {
    const flow = flows[activeFlowId];
    return flow ? flowRecordToState(flow) : null;
  }, [flows, activeFlowId, flowRecordToState]);

  // Get all flows for UI display
  const getAllFlows = useCallback(() => {
    return flowOrder
      .map((id) => flows[id])
      .filter((flow): flow is FlowRecord => !!flow)
      .map(flowRecordToState);
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
