import { initializeSupabase } from '@zflo/platform-core';

// Initialize Supabase client with environment variables
const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
  initializeSupabase({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  });
} else {
  console.warn(
    'Supabase environment variables not found. Some features may not work.'
  );
}
