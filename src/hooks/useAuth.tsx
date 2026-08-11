import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authRedirectTo, isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError('');
    if (!isSupabaseConfigured) {
      return { ok: false, message: 'Supabase is not configured yet.' };
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return { ok: false, message: signInError.message };
    }
    return { ok: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError('');
    if (!isSupabaseConfigured) {
      return { ok: false, message: 'Supabase is not configured yet.' };
    }
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authRedirectTo() },
    });
    if (signUpError) {
      setError(signUpError.message);
      return { ok: false, message: signUpError.message };
    }
    if (!data.session) {
      return {
        ok: true,
        message: 'Check your email to confirm your account, then sign in.',
      };
    }
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    setError('');
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      error,
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, error, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
