# Storage Migration Guide

This guide explains how to migrate from localStorage to IndexedDB and how to remove the migration system when no longer needed.

## Overview

The ZFlo editor now supports two storage backends:

- **localStorage** (existing): Simple, synchronous, ~5-10MB limit
- **IndexedDB** (new): Advanced, asynchronous, ~50MB+ limit with history tracking

## Architecture

### Isolated Migration System

The migration system is designed to be **easily removable** with minimal code changes:

```
src/lib/storage/
├── migration-manager.ts     # ← Remove this file when done
├── feature-flags.ts         # ← Remove this file when done
├── storage-schema.ts        # Keep - defines IndexedDB schema
├── flow-database.ts         # Keep - IndexedDB implementation
└── ...
```

### Feature Flags

Control the rollout via `feature-flags.ts`:

```typescript
const DEFAULT_FLAGS = {
  useIndexedDB: true, // Enable IndexedDB
  enableMigration: true, // Enable automatic migration
  enableHistory: true, // Enable edit history
  fallbackToLocalStorage: true, // Fallback on errors
};
```

## Integration Steps

### Step 1: Install Dependencies

```bash
cd apps/editor
pnpm install  # Dexie is already added to package.json
```

### Step 2: Update Flow Editor

Replace the persistence hook in `flow-editor.tsx`:

```typescript
// OLD
import { useEditorPersistence } from '@/hooks/use-editor-persistence';

// NEW
import { useUnifiedPersistence } from '@/hooks/use-unified-persistence';

export function FlowEditor() {
  // OLD
  const {
    activeFlowId,
    getActiveFlow,
    // ... other methods
  } = useEditorPersistence();

  // NEW
  const {
    activeFlowId,
    getActiveFlow,
    storageBackend, // 'localStorage' | 'indexedDB'
    supportsHistory, // boolean
    getFlowHistory, // only available with IndexedDB
    // ... other methods (same interface)
  } = useUnifiedPersistence();

  // Optional: Show storage backend info
  console.log(`Using ${storageBackend} storage backend`);
}
```

### Step 3: Test Migration

1. **Create test data** in localStorage (current system)
2. **Enable IndexedDB** via feature flags
3. **Reload the app** - migration should run automatically
4. **Verify data** is migrated correctly
5. **Check browser DevTools** → Application → IndexedDB → ZFloEditor

### Step 4: Development Testing

Use the development utilities in browser console:

```javascript
// Enable IndexedDB
window.zfloDevUtils.enableIndexedDB();

// Disable IndexedDB (fallback to localStorage)
window.zfloDevUtils.disableIndexedDB();

// Show current flags
window.zfloDevUtils.showFlags();

// Reset to defaults
window.zfloDevUtils.resetFlags();
```

## Migration Process

### Automatic Migration

When a user first loads the app with IndexedDB enabled:

1. **Check** if migration is needed (`MigrationUtils.shouldRunMigration()`)
2. **Load** legacy data from localStorage
3. **Create backup** of legacy data with timestamp
4. **Convert** flows and settings to new format
5. **Save** to IndexedDB in a transaction
6. **Mark** migration as complete
7. **Clean up** legacy localStorage data

### Manual Migration

For testing or troubleshooting:

```typescript
import { flowDb } from '@/lib/storage/flow-database';

// Force migration
await flowDb.migrateFromLocalStorage();
```

## Rollback Strategy

### Quick Rollback (Feature Flag)

```typescript
// In feature-flags.ts
const DEFAULT_FLAGS = {
  useIndexedDB: false, // ← Disable IndexedDB
  // ...
};
```

### Emergency Rollback (Code Change)

```typescript
// In flow-editor.tsx - bypass unified persistence
import { useEditorPersistence } from '@/hooks/use-editor-persistence';

export function FlowEditor() {
  const persistence = useEditorPersistence(); // Direct localStorage usage
  // ...
}
```

## Data Recovery

### Backup Locations

Migration creates automatic backups:

- `zflo-legacy-backup-{timestamp}` in localStorage
- Original data preserved until manual cleanup

### Recovery Process

```typescript
// Restore from backup
const backupKey = 'zflo-legacy-backup-1640995200000';
const backup = localStorage.getItem(backupKey);
if (backup) {
  localStorage.setItem('zflo-editor-flows', backup);
  // Disable IndexedDB and reload
}
```

## Monitoring & Debugging

### Storage Statistics

```typescript
import { flowDb } from '@/lib/storage/flow-database';

const stats = await flowDb.getStorageStats();
console.log(stats);
// {
//   flowCount: 15,
//   historyEntryCount: 234,
//   templateCount: 5,
//   estimatedSize: "~2.3MB"
// }
```

### Migration Logs

Check browser console for migration messages:

- `"Starting migration of X flows (YKB)"`
- `"Successfully migrated X flows to IndexedDB"`
- `"Created legacy backup: zflo-legacy-backup-{timestamp}"`

## Removal Instructions

### When to Remove

Remove the migration system when:

- ✅ All users have migrated (check analytics)
- ✅ No rollback needed for 30+ days
- ✅ IndexedDB is stable in production

### Step 1: Remove Migration Files

```bash
rm src/lib/storage/migration-manager.ts
rm src/lib/storage/feature-flags.ts
rm src/hooks/use-unified-persistence.ts
rm src/hooks/use-flow-persistence.ts  # Old IndexedDB implementation
```

### Step 2: Update Flow Editor

```typescript
// Replace unified persistence with direct IndexedDB
import { useIndexedDBPersistence } from '@/hooks/use-indexeddb-persistence';

export function FlowEditor() {
  const persistence = useIndexedDBPersistence();
  // Remove storageBackend, supportsHistory checks
}
```

### Step 3: Clean Up Database

```typescript
// Remove migration method from flow-database.ts
export class FlowDatabase extends Dexie {
  // Remove this method:
  // async migrateFromLocalStorage(): Promise<void> { ... }
}
```

### Step 4: Update Package.json

Remove migration-related dependencies if no longer needed:

```json
{
  "dependencies": {
    // Keep dexie - it's the main IndexedDB library
    "dexie": "^4.0.8"
  }
}
```

## Performance Comparison

| Feature              | localStorage            | IndexedDB       |
| -------------------- | ----------------------- | --------------- |
| **Storage Limit**    | ~5-10MB                 | ~50MB+          |
| **Performance**      | Synchronous (blocks UI) | Asynchronous    |
| **Query Support**    | Manual parsing          | Indexed queries |
| **History Tracking** | ❌                      | ✅              |
| **Offline Support**  | Basic                   | Advanced        |
| **Browser Support**  | Universal               | Modern browsers |

## Troubleshooting

### Common Issues

**Migration fails with "QuotaExceededError"**

- User's storage is full
- Fallback to localStorage automatically

**IndexedDB not supported**

- Older browsers
- Private/incognito mode restrictions
- Fallback to localStorage automatically

**Data corruption during migration**

- Automatic backup available in localStorage
- Manual recovery process documented above

### Debug Commands

```javascript
// Check IndexedDB support
console.log('IndexedDB supported:', !!window.indexedDB);

// Check migration status
console.log(
  'Migration complete:',
  localStorage.getItem('zflo-migration-complete')
);

// List all localStorage keys
console.log(
  'LocalStorage keys:',
  Object.keys(localStorage).filter((k) => k.includes('zflo'))
);
```

## Future Enhancements

With IndexedDB foundation in place, future features become possible:

- **Edit History**: Full undo/redo with change tracking ✅
- **Templates**: Built-in and user-created flow templates
- **Search & Tags**: Organize and find flows quickly
- **Export/Import**: Backup and share individual flows
- **Collaboration**: Multi-user editing capabilities
- **Offline Sync**: Sync between devices when online

The migration system provides a clean path to these advanced features while maintaining backward compatibility.
