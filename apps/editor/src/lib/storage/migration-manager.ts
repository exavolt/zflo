/**
 * Isolated Migration Manager
 *
 * This module handles migration from localStorage to IndexedDB.
 * It's designed to be easily removable once migration is complete.
 *
 * To remove this system:
 * 1. Delete this file
 * 2. Remove migration calls from persistence hooks
 * 3. Remove MIGRATION_ENABLED flag
 */

export interface LegacyFlowState {
  id: string;
  nodes: any[];
  edges: any[];
  flowTitle: string;
  nodeIdCounter: number;
  edgeIdCounter: number;
  flowMetadata?: any;
  lastModified: number;
}

export interface LegacyMultiFlowStorage {
  flows: Record<string, LegacyFlowState>;
  activeFlowId: string;
  flowOrder: string[];
}

export class MigrationManager {
  private static readonly LEGACY_STORAGE_KEY = 'zflo-editor-flows';
  private static readonly LEGACY_XSYS_KEY = 'xsys-editor-multi-flows';
  private static readonly MIGRATION_COMPLETE_KEY = 'zflo-migration-complete';

  /**
   * Check if migration has already been completed
   */
  static isMigrationComplete(): boolean {
    return localStorage.getItem(this.MIGRATION_COMPLETE_KEY) === 'true';
  }

  /**
   * Mark migration as complete
   */
  static markMigrationComplete(): void {
    localStorage.setItem(this.MIGRATION_COMPLETE_KEY, 'true');
  }

  /**
   * Check if legacy data exists that needs migration
   */
  static hasLegacyData(): boolean {
    return !!(
      localStorage.getItem(this.LEGACY_STORAGE_KEY) ||
      localStorage.getItem(this.LEGACY_XSYS_KEY)
    );
  }

  /**
   * Load and parse legacy data from localStorage
   */
  static loadLegacyData(): LegacyMultiFlowStorage | null {
    try {
      // Try new key first
      const saved = localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }

      // Fallback to old key
      const xsysSaved = localStorage.getItem(this.LEGACY_XSYS_KEY);
      if (xsysSaved) {
        return JSON.parse(xsysSaved);
      }
    } catch (error) {
      console.warn('Failed to load legacy data:', error);
    }

    return null;
  }

  /**
   * Create backup of legacy data before migration
   */
  static createLegacyBackup(): void {
    const legacyData = this.loadLegacyData();
    if (legacyData) {
      const backupKey = `zflo-legacy-backup-${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(legacyData));
      console.log(`Created legacy backup: ${backupKey}`);
    }
  }

  /**
   * Clean up legacy data after successful migration
   */
  static cleanupLegacyData(): void {
    localStorage.removeItem(this.LEGACY_STORAGE_KEY);
    localStorage.removeItem(this.LEGACY_XSYS_KEY);
    console.log('Cleaned up legacy localStorage data');
  }

  /**
   * Convert legacy flow state to new format
   */
  static convertLegacyFlow(legacyFlow: LegacyFlowState): {
    id: string;
    title: string;
    description?: string;
    nodes: any[];
    edges: any[];
    nodeIdCounter: number;
    edgeIdCounter: number;
    flowMetadata: any;
    createdAt: Date;
    lastModified: Date;
    version: number;
  } {
    return {
      id: legacyFlow.id,
      title: legacyFlow.flowTitle || 'Untitled Flow',
      description: legacyFlow.flowMetadata?.description,
      nodes: legacyFlow.nodes || [],
      edges: legacyFlow.edges || [],
      nodeIdCounter: legacyFlow.nodeIdCounter || 1,
      edgeIdCounter: legacyFlow.edgeIdCounter || 1,
      flowMetadata: legacyFlow.flowMetadata || {
        id: legacyFlow.id,
        title: legacyFlow.flowTitle || 'Untitled Flow',
        description: '',
        expressionLanguage: 'liquid',
        initialState: {},
        metadata: {},
      },
      createdAt: new Date(legacyFlow.lastModified || Date.now()),
      lastModified: new Date(legacyFlow.lastModified || Date.now()),
      version: 1,
    };
  }

  /**
   * Convert legacy settings to new format
   */
  static convertLegacySettings(legacyData: LegacyMultiFlowStorage): {
    id: 'settings';
    activeFlowId: string;
    flowOrder: string[];
    recentFlows: string[];
    preferences: {
      autoSave: boolean;
      autoSaveInterval: number;
      maxHistoryEntries: number;
      enableVersioning: boolean;
      defaultExpressionLanguage: 'liquid' | 'cel';
    };
  } {
    return {
      id: 'settings',
      activeFlowId: legacyData.activeFlowId || '',
      flowOrder: legacyData.flowOrder || [],
      recentFlows: [],
      preferences: {
        autoSave: true,
        autoSaveInterval: 1000,
        maxHistoryEntries: 100,
        enableVersioning: true,
        defaultExpressionLanguage: 'liquid',
      },
    };
  }

  /**
   * Get migration statistics
   */
  static getMigrationStats(legacyData: LegacyMultiFlowStorage | null): {
    flowCount: number;
    estimatedSize: string;
    hasData: boolean;
  } {
    if (!legacyData) {
      return { flowCount: 0, estimatedSize: '0KB', hasData: false };
    }

    const flowCount = Object.keys(legacyData.flows || {}).length;
    const dataStr = JSON.stringify(legacyData);
    const estimatedSize = `${Math.round(dataStr.length / 1024)}KB`;

    return { flowCount, estimatedSize, hasData: true };
  }
}

import { shouldEnableMigration } from './feature-flags';

/**
 * Migration utilities for easy removal
 */
export const MigrationUtils = {
  /**
   * Check if migration system should run
   */
  shouldRunMigration(): boolean {
    return (
      shouldEnableMigration() &&
      !MigrationManager.isMigrationComplete() &&
      MigrationManager.hasLegacyData()
    );
  },

  /**
   * No-op function for when migration is disabled
   */
  noopMigration(): Promise<void> {
    return Promise.resolve();
  },
};
