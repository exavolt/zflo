import { initializeSupabase } from '@zflo/platform-core';

// Initialize Supabase if environment variables are available
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

let isInitialized = false;

if (supabaseUrl && supabaseAnonKey) {
  try {
    initializeSupabase({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    });
    isInitialized = true;
    console.log('Supabase initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Supabase:', error);
  }
} else {
  console.warn(
    'Supabase environment variables not found. Public flows will not be available.'
  );
}

export { isInitialized as isSupabaseAvailable };
