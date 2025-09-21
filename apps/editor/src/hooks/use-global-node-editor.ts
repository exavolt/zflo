import { useState, useCallback } from 'react';
import { NodeData } from '../types';

interface GlobalNodeEditorState {
  isOpen: boolean;
  nodeId: string | null;
  nodeData: NodeData | null;
}

export function useGlobalNodeEditor() {
  const [editorState, setEditorState] = useState<GlobalNodeEditorState>({
    isOpen: false,
    nodeId: null,
    nodeData: null,
  });

  const openEditor = useCallback((nodeId: string, nodeData: NodeData) => {
    setEditorState({
      isOpen: true,
      nodeId,
      nodeData,
    });
  }, []);

  const closeEditor = useCallback(() => {
    setEditorState({
      isOpen: false,
      nodeId: null,
      nodeData: null,
    });
  }, []);

  const updateNodeData = useCallback((updates: Partial<NodeData>) => {
    setEditorState((prev) => ({
      ...prev,
      nodeData: prev.nodeData ? { ...prev.nodeData, ...updates } : null,
    }));
  }, []);

  return {
    isOpen: editorState.isOpen,
    nodeId: editorState.nodeId,
    nodeData: editorState.nodeData,
    openEditor,
    closeEditor,
    updateNodeData,
  };
}
