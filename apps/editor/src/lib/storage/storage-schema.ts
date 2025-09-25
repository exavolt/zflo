// Proposed IndexedDB schema with Dexie
import { Node, Edge } from '@xyflow/react';
import type { FlowMetadata } from '@zflo/core';

export interface FlowRecord {
  id: string; // Primary key
  title: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  nodeIdCounter: number;
  edgeIdCounter: number;
  flowMetadata: FlowMetadata;
  createdAt: Date;
  lastModified: Date;
  version: number; // For optimistic locking
  tags?: string[]; // For categorization
  isTemplate?: boolean; // Template flows
  parentFlowId?: string; // For flow derivation
}

export interface FlowHistoryEntry {
  id: string; // Primary key
  flowId: string; // Foreign key to FlowRecord
  changeType:
    | 'create'
    | 'update'
    | 'delete'
    | 'node_add'
    | 'node_edit'
    | 'edge_add'
    | 'edge_delete';
  changeDescription?: string;
  previousState?: Partial<FlowRecord>; // Delta or full state
  timestamp: Date;
  userId?: string; // For future multi-user support
  sessionId: string; // To group related changes
}

export interface EditorSettings {
  id: 'settings'; // Singleton record
  activeFlowId: string;
  flowOrder: string[];
  recentFlows: string[]; // Last 10 accessed flows
  preferences: {
    autoSave: boolean;
    autoSaveInterval: number;
    maxHistoryEntries: number;
    enableVersioning: boolean;
    defaultExpressionLanguage: 'liquid' | 'cel';
  };
  lastBackup?: Date;
}

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  flowData: Omit<FlowRecord, 'id' | 'createdAt' | 'lastModified'>;
  isBuiltIn: boolean;
  usageCount: number;
}

// Database schema - Dexie interface doesn't need to match table types exactly
export interface ZFloDatabase {
  flows: any;
  flowHistory: any;
  settings: any;
  templates: any;
}
