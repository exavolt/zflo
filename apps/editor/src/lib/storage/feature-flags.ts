/**
 * Feature Flags for Storage System
 *
 * This module controls which storage backend to use.
 * Easy to modify for gradual rollout or quick rollback.
 */

export interface StorageFeatureFlags {
  useIndexedDB: boolean;
  enableMigration: boolean;
  enableHistory: boolean;
  fallbackToLocalStorage: boolean;
}

// Default feature flags - modify these to control rollout
const DEFAULT_FLAGS: StorageFeatureFlags = {
  useIndexedDB: true, // Enable IndexedDB by default
  enableMigration: true, // Enable automatic migration
  enableHistory: true, // Enable edit history tracking
  fallbackToLocalStorage: false, // Fallback to localStorage on IndexedDB errors
};

/**
 * Get feature flags with environment variable overrides
 */
export function getStorageFeatureFlags(): StorageFeatureFlags {
  // Check for environment variable overrides
  const envFlags: Partial<StorageFeatureFlags> = {};

  if (typeof window !== 'undefined') {
    // Browser environment - check localStorage for dev overrides
    try {
      const devFlags = localStorage.getItem('zflo-dev-flags');
      if (devFlags) {
        const parsed = JSON.parse(devFlags);
        Object.assign(envFlags, parsed);
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return { ...DEFAULT_FLAGS, ...envFlags };
}

/**
 * Check if IndexedDB should be used
 */
export function shouldUseIndexedDB(): boolean {
  const flags = getStorageFeatureFlags();
  // Check browser support
  if (typeof window === 'undefined' || !window.indexedDB) {
    return false;
  }

  return flags.useIndexedDB;
}

/**
 * Check if migration should be enabled
 */
export function shouldEnableMigration(): boolean {
  const flags = getStorageFeatureFlags();
  return flags.enableMigration && shouldUseIndexedDB();
}

/**
 * Check if history tracking should be enabled
 */
export function shouldEnableHistory(): boolean {
  const flags = getStorageFeatureFlags();
  return flags.enableHistory && shouldUseIndexedDB();
}

/**
 * Check if localStorage fallback should be used
 */
export function shouldFallbackToLocalStorage(): boolean {
  const flags = getStorageFeatureFlags();
  return flags.fallbackToLocalStorage;
}

/**
 * Development utilities for testing different configurations
 */
export const DevUtils = {
  /**
   * Enable IndexedDB for testing
   */
  enableIndexedDB() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'zflo-dev-flags',
        JSON.stringify({ useIndexedDB: true })
      );
      console.log('IndexedDB enabled - reload to take effect');
    }
  },

  /**
   * Disable IndexedDB (fallback to localStorage)
   */
  disableIndexedDB() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'zflo-dev-flags',
        JSON.stringify({ useIndexedDB: false })
      );
      console.log('IndexedDB disabled - reload to take effect');
    }
  },

  /**
   * Reset to default flags
   */
  resetFlags() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zflo-dev-flags');
      console.log('Feature flags reset - reload to take effect');
    }
  },

  /**
   * Show current flags
   */
  showFlags() {
    console.log('Current storage feature flags:', getStorageFeatureFlags());
  },

  /**
   * Clear IndexedDB data (for debugging)
   */
  async clearIndexedDB() {
    if (typeof window !== 'undefined' && shouldUseIndexedDB()) {
      try {
        const { flowDb } = await import('./flow-database');
        await flowDb.clearAllData();
        console.log('IndexedDB cleared - reload to see effect');
      } catch (error) {
        console.error('Failed to clear IndexedDB:', error);
      }
    } else {
      console.log('IndexedDB not available or not enabled');
    }
  },

  /**
   * Reset migration status (for testing)
   */
  resetMigration() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zflo-migration-complete');
      console.log('Migration status reset - reload to trigger migration');
    }
  },

  /**
   * Debug flow state (for troubleshooting)
   */
  async debugFlowState() {
    if (typeof window !== 'undefined' && shouldUseIndexedDB()) {
      try {
        const { flowDb } = await import('./flow-database');
        const [flows, settings, stats] = await Promise.all([
          flowDb.flows.toArray(),
          flowDb.getSettings(),
          flowDb.getStorageStats(),
        ]);

        console.group('🔍 Flow State Debug');
        console.log('📊 Storage Stats:', stats);
        console.log('⚙️ Settings:', settings);
        console.log(
          '📁 Flows:',
          flows.map((f) => ({
            id: f.id,
            title: f.title,
            nodeCount: f.nodes.length,
            lastModified: f.lastModified,
          }))
        );
        console.groupEnd();
      } catch (error) {
        console.error('Failed to debug flow state:', error);
      }
    } else {
      console.log('IndexedDB not available - cannot debug flow state');
    }
  },
};

// Expose dev utils globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).zfloDevUtils = DevUtils;
}
