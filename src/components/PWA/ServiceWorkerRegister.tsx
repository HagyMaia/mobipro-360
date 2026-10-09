'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useApp } from '@/lib/store';

export function ServiceWorkerRegister() {
  const { user } = useAuth();
  const { state } = useApp();
  const isOnline = Boolean(user) && (state.status === 'available' || !state.activeRide);

  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);
            
            // Ativa o monitoramento em segundo plano se o motorista estiver online
            if (registration.active) {
              registration.active.postMessage({
                type: isOnlineRef.current ? 'ENABLE_BACKGROUND_DISPATCH_SYNC' : 'DISABLE_BACKGROUND_DISPATCH_SYNC',
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                driverId: userIdRef.current,
              });
            }
          })
          .catch((error) => {
            console.warn('[PWA] Falha ao registrar Service Worker:', error);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
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
