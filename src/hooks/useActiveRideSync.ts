// src/hooks/useActiveRideSync.ts
import { useEffect } from 'react';
import { useApp } from '@/lib/store';
import { createClient } from '@/lib/supabase';

/**
 * Hook para monitorar em tempo real se a corrida ativa do motorista
 * foi cancelada ou alterada remotamente pelo passageiro/admin.
 */
export function useActiveRideSync() {
    const { state, dispatch } = useApp();
    const activeRideId = state.activeRide?.id;

    useEffect(() => {
        if (!activeRideId) return;

        const supabase = createClient();
        let channel: any = null;

        try {
            channel = supabase
                .channel(`ride_active_${activeRideId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'rides',
                        filter: `id=eq.${activeRideId}`,
                    },
                    (payload: any) => {
                        const updated = payload.new;
                        if (!updated) return;

                        if (updated.status === 'CANCELLED') {
                            console.warn('[useActiveRideSync] Corrida cancelada remotamente:', updated.id);
                            alert('Atenção: A corrida foi cancelada pelo passageiro.');
                            dispatch({ type: 'CANCEL_RIDE' });
                        }
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn('[useActiveRideSync] Erro ao assinar canal da corrida ativa:', err);
        }

        return () => {
            if (channel) {
                try {
                    supabase.removeChannel(channel);
                } catch {
                    // ignore
                }
            }
        };
    }, [activeRideId, dispatch]);
}
