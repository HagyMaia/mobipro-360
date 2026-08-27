'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type DemoUser = Pick<User, 'id' | 'email'> & { [key: string]: unknown };

interface AuthContextType {
  user: User | DemoUser | null;
  loading: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isLoading: true,
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: any } }) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const subRes = supabase.auth.onAuthStateChange((_: unknown, session: any) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const unsubscribe = subRes && (subRes as any).data && (subRes as any).data.subscription && (subRes as any).data.subscription.unsubscribe;

    return () => {
      mounted = false;
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch (_) {
        // ignore
      }
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, isLoading: loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: null, loading: false, isLoading: false, signOut: async () => { } };
  }
  return context;
}