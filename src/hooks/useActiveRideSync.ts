// src/hooks/useActiveRideSync.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { showRideCancelledNotification } from '@/lib/notifications';

function isCancelledStatus(status?: string | null): boolean {
    if (!status) return false;
    const s = String(status).trim().toUpperCase();
    return (
        s === 'CANCELLED' ||
        s === 'CANCELADA' ||
        s === 'CANCELED' ||
        s === 'CANCELADO' ||
        s === 'REJECTED' ||
        s === 'RECUSADA'
    );
}

/**
 * Hook para monitorar em tempo real se a corrida ativa do motorista
 * foi cancelada ou alterada remotamente pelo passageiro/admin.
 */
export function useActiveRideSync() {
    const { state, dispatch } = useApp();
    const activeRide = state.activeRide;
    const activeRideId = activeRide?.id;

    const [cancellationState, setCancellationState] = useState<{
        isOpen: boolean;
        passengerName?: string;
        reason?: string;
    }>({
        isOpen: false,
    });

    const activeRideIdRef = useRef(activeRideId);
    activeRideIdRef.current = activeRideId;

    const handleRideCancelled = useCallback(
        (passengerName?: string, reason?: string) => {
            console.warn('[useActiveRideSync] Corrida cancelada detectada:', activeRideIdRef.current);
            showRideCancelledNotification(passengerName || activeRide?.passengerName, reason);
            setCancellationState({
                isOpen: true,
                passengerName: passengerName || activeRide?.passengerName,
                reason,
            });
            dispatch({ type: 'CANCEL_RIDE' });
        },
        [activeRide?.passengerName, dispatch]
    );

    useEffect(() => {
        if (!activeRideId) return;

        const supabase = createClient();
        let ridesChannel: any = null;
        let corridasChannel: any = null;

        // 1. Subscription em tempo real na tabela 'rides'
        try {
            ridesChannel = supabase
                .channel(`sync_rides_${activeRideId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'rides',
                        filter: `id=eq.${activeRideId}`,
                    },
                    (payload: any) => {
                        if (payload.eventType === 'DELETE') {
                            handleRideCancelled(activeRide?.passengerName, 'Corrida removida');
                            return;
                        }
                        const updated = payload.new;
                        if (!updated) return;

                        if (isCancelledStatus(updated.status)) {
                            handleRideCancelled(
                                updated.passenger_name || activeRide?.passengerName,
                                updated.cancel_reason || updated.motivo_cancelamento
                            );
                        }
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn('[useActiveRideSync] Erro ao assinar ridesChannel:', err);
        }

        // 2. Subscription em tempo real na tabela 'corridas' (compatibilidade dupla)
        try {
            corridasChannel = supabase
                .channel(`sync_corridas_${activeRideId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'corridas',
                        filter: `id=eq.${activeRideId}`,
                    },
                    (payload: any) => {
                        if (payload.eventType === 'DELETE') {
                            handleRideCancelled(activeRide?.passengerName, 'Corrida removida');
                            return;
                        }
                        const updated = payload.new;
                        if (!updated) return;

                        if (isCancelledStatus(updated.status)) {
                            handleRideCancelled(
                                updated.cliente_nome || updated.passenger_name || activeRide?.passengerName,
                                updated.motivo_cancelamento || updated.cancel_reason
                            );
                        }
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn('[useActiveRideSync] Erro ao assinar corridasChannel:', err);
        }

        // 3. Polling fallback a cada 3.5 segundos para garantir atualização em redes móveis instáveis
        const pollInterval = setInterval(async () => {
            if (!activeRideIdRef.current) return;
            try {
                // Tenta tabela rides
                const { data: rideData, error: rideErr } = await supabase
                    .from('rides')
                    .select('id, status, passenger_name, cancel_reason')
                    .eq('id', activeRideIdRef.current)
                    .maybeSingle();

                if (!rideErr && rideData) {
                    if (isCancelledStatus(rideData.status)) {
                        handleRideCancelled(rideData.passenger_name, rideData.cancel_reason);
                        return;
                    }
                }

                // Tenta tabela corridas
                const { data: corridaData, error: corridaErr } = await supabase
                    .from('corridas')
                    .select('id, status, cliente_nome, motivo_cancelamento')
                    .eq('id', activeRideIdRef.current)
                    .maybeSingle();

                if (!corridaErr && corridaData) {
                    if (isCancelledStatus(corridaData.status)) {
                        handleRideCancelled(corridaData.cliente_nome, corridaData.motivo_cancelamento);
                        return;
                    }
                }
            } catch (err) {
                // silencia erros normais de rede no polling
            }
        }, 3500);

        return () => {
            clearInterval(pollInterval);
            if (ridesChannel) {
                try {
                    supabase.removeChannel(ridesChannel);
                } catch {
                    // ignore
                }
            }
            if (corridasChannel) {
                try {
                    supabase.removeChannel(corridasChannel);
                } catch {
                    // ignore
                }
            }
        };
    }, [activeRideId, activeRide?.passengerName, handleRideCancelled]);

    const closeCancellationModal = useCallback(() => {
        setCancellationState({ isOpen: false });
    }, []);

    return {
        cancellationState,
        closeCancellationModal,
    };
}
