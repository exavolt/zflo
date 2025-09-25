/**
 * Unified Persistence Hook
 *
 * This hook provides a single interface that can use either:
 * - localStorage (existing optimized implementation)
 * - IndexedDB (new implementation with history)
 *
 * The choice is controlled by feature flags and can be easily switched.
 */

import { useCallback, useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import type { FlowMetadata } from '@zflo/core';
import {
  shouldUseIndexedDB,
  shouldFallbackToLocalStorage,
} from '@/lib/storage/feature-flags';

// Import both persistence implementations
import { useEditorPersistence } from './use-editor-persistence';
import { useIndexedDBPersistence } from './use-indexeddb-persistence';

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

interface UnifiedPersistenceReturn {
  // State
  isLoading?: boolean;
  activeFlowId: string;
  flows: Record<string, FlowState>;
  flowOrder: string[];
  settings?: any;

  // Flow operations
  saveFlowState: (
    flowState: Omit<FlowState, 'id' | 'lastModified'>,
    flowId?: string,
    forceUpdate?: boolean
  ) => Promise<void> | void;
  createFlow: (title?: string) => Promise<string> | string;
  deleteFlow: (flowId: string) => Promise<void> | void;
  switchToFlow: (flowId: string) => Promise<void> | void;
  getActiveFlow: () => FlowState | null;
  getAllFlows: () => FlowState[];
  clearAllFlows: () => Promise<void> | void;

  // History operations (only available with IndexedDB)
  getFlowHistory?: (flowId: string) => Promise<any[]>;

  // Utility functions
  createFlowStateHash: (
    flowState: Omit<FlowState, 'id' | 'lastModified'>
  ) => string;
  loadFromStorage?: () => Promise<void>;

  // Storage backend info
  storageBackend: 'localStorage' | 'indexedDB';
  supportsHistory: boolean;
}

export function useUnifiedPersistence(): UnifiedPersistenceReturn {
  const [storageBackend, setStorageBackend] = useState<
    'localStorage' | 'indexedDB'
  >('localStorage');
  const [initializationError, setInitializationError] = useState<Error | null>(
    null
  );

  // Initialize storage backend
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        if (shouldUseIndexedDB()) {
          // Test IndexedDB availability
          if (typeof window !== 'undefined' && window.indexedDB) {
            setStorageBackend('indexedDB');
            return;
          }
        }

        // Fallback to localStorage
        setStorageBackend('localStorage');
      } catch (error) {
        console.warn(
          'Failed to initialize IndexedDB, falling back to localStorage:',
          error
        );
        setInitializationError(error as Error);

        if (shouldFallbackToLocalStorage()) {
          setStorageBackend('localStorage');
        } else {
          throw error;
        }
      }
    };

    initializeStorage();
  }, []);

  // Use the appropriate persistence hook based on backend
  const localStoragePersistence = useEditorPersistence();
  const indexedDBPersistence = useIndexedDBPersistence();

  // Create unified interface
  const createUnifiedInterface = useCallback(
    (
      backend: 'localStorage' | 'indexedDB',
      localPersistence: ReturnType<typeof useEditorPersistence>,
      indexedPersistence: ReturnType<typeof useIndexedDBPersistence>
    ): UnifiedPersistenceReturn => {
      if (backend === 'indexedDB') {
        return {
          // State
          isLoading: indexedPersistence.isLoading,
          activeFlowId: indexedPersistence.activeFlowId,
          flows: indexedPersistence.flows,
          flowOrder: indexedPersistence.flowOrder,
          settings: indexedPersistence.settings,

          // Flow operations
          saveFlowState: indexedPersistence.saveFlowState,
          createFlow: indexedPersistence.createFlow,
          deleteFlow: indexedPersistence.deleteFlow,
          switchToFlow: indexedPersistence.switchToFlow,
          getActiveFlow: indexedPersistence.getActiveFlow,
          getAllFlows: indexedPersistence.getAllFlows,
          clearAllFlows: indexedPersistence.clearAllFlows,

          // History operations
          getFlowHistory: indexedPersistence.getFlowHistory,

          // Utility functions
          createFlowStateHash: indexedPersistence.createFlowStateHash,
          loadFromStorage: indexedPersistence.loadFromStorage,

          // Storage backend info
          storageBackend: 'indexedDB',
          supportsHistory: true,
        };
      } else {
        // localStorage backend - wrap sync methods to match async interface
        return {
          // State
          isLoading: false,
          activeFlowId: localPersistence.activeFlowId,
          flows: localPersistence.flows,
          flowOrder: localPersistence.flowOrder,

          // Flow operations - wrap sync methods in Promise.resolve for consistency
          saveFlowState: (flowState, flowId, forceUpdate) => {
            localPersistence.saveFlowState(flowState, flowId, forceUpdate);
            return Promise.resolve();
          },
          createFlow: (title) =>
            Promise.resolve(localPersistence.createFlow(title)),
          deleteFlow: (flowId) => {
            localPersistence.deleteFlow(flowId);
            return Promise.resolve();
          },
          switchToFlow: (flowId) => {
            localPersistence.switchToFlow(flowId);
            return Promise.resolve();
          },
          getActiveFlow: localPersistence.getActiveFlow,
          getAllFlows: localPersistence.getAllFlows,
          clearAllFlows: () => {
            localPersistence.clearAllFlows();
            return Promise.resolve();
          },

          // History operations - not available with localStorage
          getFlowHistory: undefined,

          // Utility functions
          createFlowStateHash: localPersistence.createFlowStateHash,

          // Storage backend info
          storageBackend: 'localStorage',
          supportsHistory: false,
        };
      }
    },
    []
  );

  // Return the unified interface
  const unifiedInterface = createUnifiedInterface(
    storageBackend,
    localStoragePersistence,
    indexedDBPersistence
  );

  // Add error information if initialization failed
  if (initializationError) {
    console.warn('Storage initialization error:', initializationError);
  }

  return unifiedInterface;
}
