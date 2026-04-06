import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dev-placeholder";

/** True only when real env vars are present. When false, all hooks use localStorage. */
export const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL;

if (import.meta.env.DEV && !isSupabaseConfigured) {
  console.info(
    "[Supabase] VITE_SUPABASE_URL is not set — running in offline/localStorage mode."
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});