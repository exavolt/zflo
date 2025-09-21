import React, { createContext, useContext } from 'react';
import { NodeData } from '../types';

interface NodeEditorContextType {
  openEditor: (nodeId: string, nodeData: NodeData) => void;
}

const NodeEditorContext = createContext<NodeEditorContextType | null>(null);

export function NodeEditorProvider({
  children,
  openEditor,
}: {
  children: React.ReactNode;
  openEditor: (nodeId: string, nodeData: NodeData) => void;
}) {
  return (
    <NodeEditorContext.Provider value={{ openEditor }}>
      {children}
    </NodeEditorContext.Provider>
  );
}

export function useNodeEditorContext() {
  const context = useContext(NodeEditorContext);
  if (!context) {
    throw new Error(
      'useNodeEditorContext must be used within a NodeEditorProvider'
    );
  }
  return context;
}
