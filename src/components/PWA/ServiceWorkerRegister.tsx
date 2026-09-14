'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useApp } from '@/lib/store';

export function ServiceWorkerRegister() {
  const { user } = useAuth();
  const { state } = useApp();
  const isOnline = Boolean(user) && (state.status === 'available' || !state.activeRide);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);
            
            // Ativa o monitoramento em segundo plano se o motorista estiver online
            if (registration.active) {
              registration.active.postMessage({
                type: isOnline ? 'ENABLE_BACKGROUND_DISPATCH_SYNC' : 'DISABLE_BACKGROUND_DISPATCH_SYNC',
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                driverId: user?.id,
              });
            }
          })
          .catch((error) => {
            console.warn('[PWA] Falha ao registrar Service Worker:', error);
          });
      });
    }
  }, []);

  // Sincroniza mudanças de status Online/Offline com o Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: isOnline ? 'ENABLE_BACKGROUND_DISPATCH_SYNC' : 'DISABLE_BACKGROUND_DISPATCH_SYNC',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        driverId: user?.id,
      });
    }
  }, [isOnline, user?.id]);

  return null;
}
