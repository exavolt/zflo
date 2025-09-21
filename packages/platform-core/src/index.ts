// Supabase integration
export {
  initializeSupabase,
  getSupabaseClient,
  isSupabaseInitialized,
  supabase,
} from './supabase/client';
export {
  SharedFlowsService,
  UserFlowsService,
  saveSharedFlow,
  getSharedFlow,
  saveUserFlow,
  updateUserFlow,
  getUserFlows,
  getUserFlow,
  deleteUserFlow,
  getUserSharedFlows,
  updateSharedFlowVisibility,
  deleteSharedFlow,
  getPublicFlows,
} from './supabase/flows';

// React hooks (optional peer dependency)
export {
  useSharedFlow,
  useUserFlows,
  useUserSharedFlows,
  usePublicFlows,
  usePopularTags,
} from './react/hooks';

// Types
export type {
  Database,
  Json,
  SharedFlow,
  SharedFlowInsert,
  SharedFlowUpdate,
  UserFlow,
  UserFlowInsert,
  UserFlowUpdate,
  FlowFilter,
  EditorData,
} from './types';
export type { SupabaseConfig } from './supabase/client';

// Re-export Supabase types for convenience
export type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
