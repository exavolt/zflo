import Dexie, { type Table } from 'dexie';
import {
  FlowRecord,
  FlowHistoryEntry,
  EditorSettings,
  FlowTemplate,
  ZFloDatabase,
} from './storage-schema';

export class FlowDatabase extends Dexie implements ZFloDatabase {
  flows!: Table<FlowRecord>;
  flowHistory!: Table<FlowHistoryEntry>;
  settings!: Table<EditorSettings>;
  templates!: Table<FlowTemplate>;

  constructor() {
    super('ZFloEditor');

    this.version(1).stores({
      flows:
        'id, title, lastModified, createdAt, *tags, isTemplate, parentFlowId',
      flowHistory: 'id, flowId, timestamp, changeType, sessionId, userId',
      settings: 'id',
      templates: 'id, name, category, isBuiltIn, usageCount',
    });

    // Add hooks for automatic timestamps and versioning
    this.flows.hook('creating', (_primKey: any, obj: any, _trans: any) => {
      obj.createdAt = new Date();
      obj.lastModified = new Date();
      obj.version = 1;
    });

    this.flows.hook(
      'updating',
      (modifications: any, _primKey: any, obj: any, _trans: any) => {
        modifications.lastModified = new Date();
        if (obj.version) {
          modifications.version = obj.version + 1;
        }
      }
    );
  }

  // Optimized flow operations
  async getFlowWithHistory(flowId: string): Promise<{
    flow: FlowRecord | undefined;
    history: FlowHistoryEntry[];
  }> {
    const [flow, history] = await Promise.all([
      this.flows.get(flowId),
      this.flowHistory
        .where('flowId')
        .equals(flowId)
        .reverse()
        .limit(50)
        .toArray(),
    ]);

    return { flow, history };
  }

  async createFlowWithHistory(
    flowData: Omit<FlowRecord, 'id' | 'createdAt' | 'lastModified' | 'version'>,
    sessionId: string
  ): Promise<string> {
    const flowId =
      self.crypto?.randomUUID?.() ||
      `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    return await this.transaction(
      'rw',
      this.flows,
      this.flowHistory,
      async () => {
        await this.flows.add({
          ...flowData,
          id: flowId,
          createdAt: now,
          lastModified: now,
          version: 1,
        } as FlowRecord);

        await this.flowHistory.add({
          id:
            self.crypto?.randomUUID?.() ||
            `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          flowId,
          changeType: 'create',
          changeDescription: `Created flow: ${flowData.title}`,
          timestamp: new Date(),
          sessionId,
        });

        return flowId;
      }
    );
  }

  async updateFlowWithHistory(
    flowId: string,
    updates: Partial<FlowRecord>,
    changeDescription: string,
    sessionId: string
  ): Promise<void> {
    const currentFlow = await this.flows.get(flowId);
    if (!currentFlow) throw new Error(`Flow ${flowId} not found`);

    await this.transaction('rw', this.flows, this.flowHistory, async () => {
      await this.flows.update(flowId, updates);

      await this.flowHistory.add({
        id:
          self.crypto?.randomUUID?.() ||
          `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        flowId,
        changeType: 'update',
        changeDescription,
        previousState: currentFlow,
        timestamp: new Date(),
        sessionId,
      });
    });
  }

  async deleteFlowWithHistory(
    flowId: string,
    sessionId: string
  ): Promise<void> {
    const flow = await this.flows.get(flowId);
    if (!flow) return;

    await this.transaction('rw', this.flows, this.flowHistory, async () => {
      await this.flows.delete(flowId);

      await this.flowHistory.add({
        id:
          self.crypto?.randomUUID?.() ||
          `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        flowId,
        changeType: 'delete',
        changeDescription: `Deleted flow: ${flow.title}`,
        previousState: flow,
        timestamp: new Date(),
        sessionId,
      });
    });
  }

  // Settings management
  async getSettings(): Promise<EditorSettings> {
    let settings = await this.settings.get('settings');

    if (!settings) {
      settings = {
        id: 'settings',
        activeFlowId: '',
        flowOrder: [],
        recentFlows: [],
        preferences: {
          autoSave: true,
          autoSaveInterval: 1000,
          maxHistoryEntries: 100,
          enableVersioning: true,
          defaultExpressionLanguage: 'liquid',
        },
      };
      await this.settings.put(settings);
    }

    return settings;
  }

  async updateSettings(updates: Partial<EditorSettings>): Promise<void> {
    await this.settings.update('settings', updates);
  }

  // Cleanup operations
  async cleanupOldHistory(
    maxAge: number = 30 * 24 * 60 * 60 * 1000
  ): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge);
    return await this.flowHistory.where('timestamp').below(cutoffDate).delete();
  }

  // Debug method to clear all data
  async clearAllData(): Promise<void> {
    await this.transaction(
      'rw',
      this.flows,
      this.settings,
      this.flowHistory,
      async () => {
        await this.flows.clear();
        await this.settings.clear();
        await this.flowHistory.clear();
      }
    );
    console.log('Cleared all IndexedDB data');
  }

  async getStorageStats(): Promise<{
    flowCount: number;
    historyEntryCount: number;
    templateCount: number;
    estimatedSize: string;
  }> {
    const [flowCount, historyEntryCount, templateCount] = await Promise.all([
      this.flows.count(),
      this.flowHistory.count(),
      this.templates.count(),
    ]);

    // Rough estimation - IndexedDB doesn't provide exact size
    const estimatedSize = `~${Math.round((flowCount * 50 + historyEntryCount * 5) / 1024)}KB`;

    return {
      flowCount,
      historyEntryCount,
      templateCount,
      estimatedSize,
    };
  }
}

// Singleton instance
export const flowDb = new FlowDatabase();
