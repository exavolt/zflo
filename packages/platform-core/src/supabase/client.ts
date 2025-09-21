import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let supabaseClient: SupabaseClient | null = null;

export function initializeSupabase(config: SupabaseConfig): SupabaseClient {
  supabaseClient = createClient(config.url, config.anonKey);
  return supabaseClient;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      'Supabase client not initialized. Call initializeSupabase() first.'
    );
  }
  return supabaseClient;
}

export function isSupabaseInitialized(): boolean {
  return supabaseClient !== null;
}

// Legacy export for backward compatibility - getter that returns current client
export const supabase = new Proxy({} as any, {
  get(_, prop) {
    const client = getSupabaseClient();
    return client[prop as keyof typeof client];
  },
});
