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
import {
  authRedirectTo,
  consumeAuthCallbackError,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

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
  const [error, setError] = useState(() => consumeAuthCallbackError());

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
      const raw = signInError.message;
      const lower = raw.toLowerCase();
      const message = lower.includes('email not confirmed')
        ? 'This account is ready. Use Sign in with your password — no email is needed.'
        : lower.includes('invalid login')
          ? 'No account found for that email, or the password is wrong.'
          : raw;
      setError(message);
      return { ok: false, message };
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
      const alreadyRegistered = signUpError.message.toLowerCase().includes('already');
      if (alreadyRegistered) {
        return signIn(email, password);
      }
      setError(signUpError.message);
      return { ok: false, message: signUpError.message };
    }
    if (!data.session) {
      const { error: followUpError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!followUpError) return { ok: true };
      const message =
        'This email already has an account. Switch to Sign in and use your password. No email will be sent.';
      setError(message);
      return { ok: false, message };
    }
    return { ok: true };
  }, [signIn]);

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
