'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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

    const verifyActiveSession = async () => {
      try {
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Se Supabase configurado e não for demo local, validar se motorista existe no banco
        if (isSupabaseConfigured && currentUser.email !== 'motorista@demo.local') {
          const { data: motorista } = await supabase
            .from('motoristas')
            .select('id, status')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (!motorista) {
            console.warn('[Auth] Motorista foi excluído ou não existe no banco de dados. Encerrando sessão...');
            await supabase.auth.signOut();
            if (typeof document !== 'undefined') {
              document.cookie = 'sb-demo-token=; path=/; max-age=0';
              document.cookie = 'mobipro-demo-session=; path=/; max-age=0';
            }
            if (typeof window !== 'undefined') {
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch (_) {}
            }
            if (mounted) {
              setUser(null);
              setLoading(false);
            }
            return;
          }
        }

        if (mounted) {
          setUser(currentUser);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    verifyActiveSession();

    const subRes = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (!mounted) return;
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (isSupabaseConfigured && session.user.email !== 'motorista@demo.local') {
          const { data: motorista } = await supabase
            .from('motoristas')
            .select('id, status')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!motorista) {
            await supabase.auth.signOut();
            if (typeof document !== 'undefined') {
              document.cookie = 'sb-demo-token=; path=/; max-age=0';
            }
            setUser(null);
            setLoading(false);
            return;
          }
        }
      }

      setUser(session.user);
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
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    if (typeof document !== 'undefined') {
      document.cookie = 'sb-demo-token=; path=/; max-age=0';
      document.cookie = 'mobipro-demo-session=; path=/; max-age=0';
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (_) {}
      window.location.href = '/login';
    }
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