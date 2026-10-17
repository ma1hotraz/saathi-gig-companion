import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  continueAsGuest: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Maps Supabase auth errors to a short message key (translated by the caller). */
function errorKey(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'auth.err.invalid';
  if (m.includes('already registered')) return 'auth.err.exists';
  if (m.includes('password')) return 'auth.err.password';
  if (m.includes('email') && m.includes('confirm')) return 'auth.err.confirm';
  if (m.includes('anonymous')) return 'auth.err.guest';
  return 'auth.err.generic';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      loading,
      isGuest: session?.user?.is_anonymous ?? false,
      /** Each action resolves to null on success or a translation key describing the error. */
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? errorKey(error.message) : null;
      },
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return errorKey(error.message);
        return data.session ? null : 'auth.err.confirm';
      },
      continueAsGuest: async () => {
        const { error } = await supabase.auth.signInAnonymously();
        return error ? errorKey(error.message) : null;
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
