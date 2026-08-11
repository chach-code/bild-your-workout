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

export const LIVE_APP_URL = 'https://chach-code.github.io/bild-your-workout/';

/** Prefer the live site so confirmation emails do not depend on localhost running. */
export function authRedirectTo(): string {
  const host = window.location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1';
  const base = local ? LIVE_APP_URL : new URL(import.meta.env.BASE_URL, window.location.origin).toString();
  return base;
}

export function consumeAuthCallbackError(): string {
  if (typeof window === 'undefined') return '';

  const rawHash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(rawHash.startsWith('/') ? rawHash.slice(1) : rawHash);
  const queryParams = new URLSearchParams(window.location.search);
  const errorCode = hashParams.get('error_code') ?? queryParams.get('error_code');
  const error = hashParams.get('error') ?? queryParams.get('error');
  const description = (
    hashParams.get('error_description') ??
    queryParams.get('error_description') ??
    ''
  ).replace(/\+/g, ' ');

  if (!error && !errorCode && !description) return '';

  if (rawHash.includes('error=') || rawHash.includes('error_code=')) {
    const { pathname, search } = window.location;
    window.history.replaceState(null, '', `${pathname}${search}#/`);
  }

  if (
    errorCode === 'otp_expired' ||
    description.toLowerCase().includes('expired') ||
    description.toLowerCase().includes('invalid')
  ) {
    return 'That email link expired. Sign in with your email and password instead — you do not need the email.';
  }

  return description || error || 'That email link did not work. Sign in with your password instead.';
}
