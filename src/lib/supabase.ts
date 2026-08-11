import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://example.supabase.co', 'sb_publishable_missing', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

export function authRedirectTo(): string {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.hash = '/';
  return url.toString();
}
