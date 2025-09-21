import { useCallback, useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import type { ZFFlow } from '@zflo/core';
import { v4 as uuidv4 } from 'uuid';
import { NodeData } from '@/types';

interface FlowState {
  id: string;
  nodes: Node[];
  edges: Edge[];
  flowTitle: string;
  nodeIdCounter: number;
  edgeIdCounter: number;
  flowMetadata?: Partial<ZFFlow>;
  lastModified: number;
}

interface MultiFlowStorage {
  flows: Record<string, FlowState>;
  activeFlowId: string;
  flowOrder: string[];
}

const STORAGE_KEY = 'zflo-editor-flows';
const XSYS_STORAGE_KEY = 'xsys-editor-multi-flows';

export function useEditorPersistence() {
  const [activeFlowId, setActiveFlowId] = useState<string>('');
  const [flows, setFlows] = useState<Record<string, FlowState>>({});
  const [flowOrder, setFlowOrder] = useState<string[]>([]);

  // Load multi-flow data from localStorage
  const loadFromLocalStorage = useCallback((): MultiFlowStorage | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }

      const xsysSaved = localStorage.getItem(XSYS_STORAGE_KEY);
      if (xsysSaved) {
        const parsed = JSON.parse(xsysSaved);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        localStorage.removeItem(XSYS_STORAGE_KEY);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load multi-flow state from localStorage:', error);
    }

    return null;
  }, []);

  // Save current flow state
  const saveFlowState = useCallback(
    (flowState: Omit<FlowState, 'id' | 'lastModified'>, flowId?: string) => {
      try {
        const targetFlowId = flowId || activeFlowId;
        if (!targetFlowId) return;

        const updatedFlow: FlowState = {
          ...flowState,
          id: targetFlowId,
          lastModified: Date.now(),
        };

        const newFlows = { ...flows, [targetFlowId]: updatedFlow };
        const multiFlowData: MultiFlowStorage = {
          flows: newFlows,
          activeFlowId,
          flowOrder,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(multiFlowData));
        setFlows(newFlows);
      } catch (error) {
        console.warn('Failed to save flow state to localStorage:', error);
      }
    },
    [activeFlowId, flows, flowOrder]
  );

  // Create a new flow
  const createFlow = useCallback(
    (title: string = 'New Flow'): string => {
      const flowId = uuidv4();
      const newFlow: FlowState = {
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
          expressionLanguage: 'cel',
          globalState: {},
          stateSchema: undefined,
          metadata: {},
        },
        lastModified: Date.now(),
      };

      const newFlows = { ...flows, [flowId]: newFlow };
      const newFlowOrder = [...flowOrder, flowId];

      const multiFlowData: MultiFlowStorage = {
        flows: newFlows,
        activeFlowId: flowId,
        flowOrder: newFlowOrder,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(multiFlowData));
        setFlows(newFlows);
        setActiveFlowId(flowId);
        setFlowOrder(newFlowOrder);
      } catch (error) {
        console.warn('Failed to create new flow:', error);
      }

      return flowId;
    },
    [flows, flowOrder]
  );

  // Delete a flow
  const deleteFlow = useCallback(
    (flowId: string) => {
      if (Object.keys(flows).length <= 1) {
        console.warn('Cannot delete the last remaining flow');
        return;
      }

      const newFlows = { ...flows };
      delete newFlows[flowId];

      const newFlowOrder = flowOrder.filter((id) => id !== flowId);
      let newActiveFlowId = activeFlowId;

      if (activeFlowId === flowId) {
        const firstOrderedFlow = newFlowOrder[0];
        const firstAvailableFlow = Object.keys(newFlows)[0];
        newActiveFlowId = firstOrderedFlow || firstAvailableFlow || '';
      }

      const multiFlowData: MultiFlowStorage = {
        flows: newFlows,
        activeFlowId: newActiveFlowId,
        flowOrder: newFlowOrder,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(multiFlowData));
        setFlows(newFlows);
        setActiveFlowId(newActiveFlowId);
        setFlowOrder(newFlowOrder);
      } catch (error) {
        console.warn('Failed to delete flow:', error);
      }
    },
    [flows, flowOrder, activeFlowId]
  );

  // Switch active flow
  const switchToFlow = useCallback(
    (flowId: string) => {
      if (flows[flowId]) {
        setActiveFlowId(flowId);

        const multiFlowData: MultiFlowStorage = {
          flows,
          activeFlowId: flowId,
          flowOrder,
        };

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(multiFlowData));
        } catch (error) {
          console.warn('Failed to switch active flow:', error);
        }
      }
    },
    [flows, flowOrder]
  );

  // Get current active flow
  const getActiveFlow = useCallback((): FlowState | null => {
    return flows[activeFlowId] || null;
  }, [flows, activeFlowId]);

  // Get all flows for UI display
  const getAllFlows = useCallback(() => {
    return flowOrder.map((id) => flows[id]).filter(Boolean);
  }, [flows, flowOrder]);

  // Clear all flows
  const clearAllFlows = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setFlows({});
      setActiveFlowId('');
      setFlowOrder([]);
    } catch (error) {
      console.warn('Failed to clear all flows:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const multiFlowData = loadFromLocalStorage();
    if (multiFlowData) {
      setFlows(multiFlowData.flows);
      setActiveFlowId(multiFlowData.activeFlowId);
      setFlowOrder(multiFlowData.flowOrder);
    } else {
      // Create default flow if none exists
      createFlow('My First Flow');
    }
  }, []);

  return {
    // Legacy compatibility
    saveToLocalStorage: saveFlowState,
    loadFromLocalStorage,
    clearLocalStorage: clearAllFlows,

    // New multi-flow API
    activeFlowId,
    flows,
    flowOrder,
    saveFlowState,
    createFlow,
    deleteFlow,
    switchToFlow,
    getActiveFlow,
    getAllFlows,
    clearAllFlows,
  };
}
