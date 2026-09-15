// src/hooks/useActiveRideSync.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { showRideCancelledNotification } from '@/lib/notifications';
import { RideService } from '@/services/ride/RideService';
import type { Ride } from '@/lib/types';

function isCancelledStatus(status?: string | null): boolean {
    if (!status) return false;
    const s = String(status).trim().toUpperCase();
    return (
        s === 'CANCELLED' ||
        s === 'CANCELADA' ||
        s === 'CANCELED' ||
        s === 'CANCELADO' ||
        s === 'CANCEL' ||
        s === 'REJECTED' ||
        s === 'RECUSADA' ||
        s === 'ABORTED'
    );
}

const LOCAL_HISTORY_STORAGE_KEY = 'mobipro_ride_history_v2';

function saveCancelledRideLocally(ride: Ride) {
    if (typeof window === 'undefined' || !ride?.id) return;
    try {
        const raw = window.localStorage.getItem(LOCAL_HISTORY_STORAGE_KEY);
        let list: Ride[] = [];
        if (raw) {
            try {
                list = JSON.parse(raw);
            } catch (_) {}
        }
        if (!Array.isArray(list)) list = [];
        list = [ride, ...list.filter((r) => r.id !== ride.id)];
        window.localStorage.setItem(LOCAL_HISTORY_STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
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

    const activeRideRef = useRef(activeRide);
    activeRideRef.current = activeRide;

    const activeRideIdRef = useRef(activeRideId);
    activeRideIdRef.current = activeRideId;

    const isProcessingRef = useRef(false);

    const handleRideCancelled = useCallback(
        (passengerName?: string, reason?: string, rawData?: any) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            const current = activeRideRef.current;
            const pName = passengerName || current?.passengerName || 'Passageiro';
            const cancelReason = reason || rawData?.cancel_reason || rawData?.motivo_cancelamento || 'Cancelada pelo passageiro';

            console.warn('[useActiveRideSync] Cancelamento detectado para corrida:', activeRideIdRef.current, {
                pName,
                cancelReason,
            });

            const cancelledRideObj: Ride = current
                ? {
                      ...current,
                      status: 'cancelled',
                      cancelledAt: new Date().toISOString(),
                      cancelledBy: 'passenger',
                      cancelReason,
                  }
                : {
                      id: String(activeRideIdRef.current || `ride-${Date.now()}`),
                      passengerName: pName,
                      passengerRating: 5.0,
                      passengerAccountMonths: 6,
                      passengerTrips: 18,
                      pickup: rawData?.pickup_address || rawData?.origem_endereco || 'Ponto de Embarque',
                      dropoff: rawData?.dropoff_address || rawData?.destino_endereco || 'Destino',
                      distanceKm: Number(rawData?.distance_km || 4.2),
                      estimatedMinutes: 12,
                      fare: Number(rawData?.fare_amount || rawData?.valor || 20.0),
                      paymentMethod: 'pix',
                      status: 'cancelled',
                      requestedAt: rawData?.created_at || new Date().toISOString(),
                      cancelledAt: new Date().toISOString(),
                      cancelledBy: 'passenger',
                      cancelReason,
                      source: 'app',
                  };

            // Salva no armazenamento local permanente para garantir aparição no histórico
            saveCancelledRideLocally(cancelledRideObj);

            // Toca aviso sonoro e notificação de push
            showRideCancelledNotification(pName, cancelReason);

            // Abre modal informativo
            setCancellationState({
                isOpen: true,
                passengerName: pName,
                reason: cancelReason,
            });

            // Limpa corrida ativa no store e adiciona ao histórico
            dispatch({
                type: 'CANCEL_RIDE',
                ride: cancelledRideObj,
                reason: cancelReason,
                cancelledBy: 'passenger',
            });

            // Notifica abas secundárias via BroadcastChannel
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                try {
                    const bc = new BroadcastChannel(`mobipro_ride_sync_${activeRideIdRef.current}`);
                    bc.postMessage({ type: 'RIDE_CANCELLED', ride: cancelledRideObj });
                    bc.close();
                } catch (_) {}
            }

            setTimeout(() => {
                isProcessingRef.current = false;
            }, 2000);
        },
        [dispatch]
    );

    useEffect(() => {
        if (!activeRideId) return;

        const supabase = createClient();
        let ridesChannel: any = null;
        let corridasChannel: any = null;
        let broadcastChannel: any = null;
        let localBc: BroadcastChannel | null = null;

        // 1. Ouvinte Realtime postgres_changes na tabela 'rides'
        try {
            ridesChannel = supabase
                .channel(`sync_rides_${activeRideId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'rides',
                    },
                    (payload: any) => {
                        const row = payload.new || payload.old;
                        if (!row) return;
                        if (String(row.id) !== String(activeRideId)) return;

                        if (payload.eventType === 'DELETE' || isCancelledStatus(row.status)) {
                            handleRideCancelled(
                                row.passenger_name || row.cliente_nome,
                                row.cancel_reason || row.motivo_cancelamento,
                                row
                            );
                        }
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn('[useActiveRideSync] Erro ao assinar ridesChannel:', err);
        }

        // 2. Ouvinte Realtime postgres_changes na tabela 'corridas'
        try {
            corridasChannel = supabase
                .channel(`sync_corridas_${activeRideId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'corridas',
                    },
                    (payload: any) => {
                        const row = payload.new || payload.old;
                        if (!row) return;
                        if (String(row.id) !== String(activeRideId)) return;

                        if (payload.eventType === 'DELETE' || isCancelledStatus(row.status)) {
                            handleRideCancelled(
                                row.cliente_nome || row.passenger_name,
                                row.motivo_cancelamento || row.cancel_reason,
                                row
                            );
                        }
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn('[useActiveRideSync] Erro ao assinar corridasChannel:', err);
        }

        // 3. Ouvinte Realtime Broadcast dos canais da corrida (zero latência)
        try {
            broadcastChannel = supabase
                .channel(`passenger-ride-${activeRideId}`)
                .on('broadcast', { event: 'ride_cancelled' }, (payload: any) => {
                    const data = payload?.payload || payload;
                    handleRideCancelled(data?.passenger_name, data?.reason, data);
                })
                .on('broadcast', { event: 'status_update' }, (payload: any) => {
                    const data = payload?.payload || payload;
                    if (isCancelledStatus(data?.status)) {
                        handleRideCancelled(data?.passenger_name, data?.reason, data);
                    }
                })
                .subscribe();
        } catch (_) {}

        // 4. BroadcastChannel nativo entre abas
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            try {
                localBc = new BroadcastChannel(`mobipro_ride_sync_${activeRideId}`);
                localBc.onmessage = (ev) => {
                    if (ev.data?.type === 'RIDE_CANCELLED') {
                        handleRideCancelled(
                            ev.data?.ride?.passengerName,
                            ev.data?.ride?.cancelReason,
                            ev.data?.ride
                        );
                    }
                };
            } catch (_) {}
        }

        // 5. Polling ativo a cada 1.5s para garantia absoluta em redes móveis 3G/4G
        const pollInterval = setInterval(async () => {
            const currentId = activeRideIdRef.current;
            if (!currentId) return;

            try {
                // Tenta tabela rides
                const { data: rideData, error: rideErr } = await supabase
                    .from('rides')
                    .select('*')
                    .eq('id', currentId)
                    .maybeSingle();

                if (!rideErr && rideData) {
                    if (isCancelledStatus(rideData.status)) {
                        handleRideCancelled(
                            rideData.passenger_name || rideData.cliente_nome,
                            rideData.cancel_reason || rideData.motivo_cancelamento,
                            rideData
                        );
                        return;
                    }
                }

                // Tenta tabela corridas
                const { data: corridaData, error: corridaErr } = await supabase
                    .from('corridas')
                    .select('*')
                    .eq('id', currentId)
                    .maybeSingle();

                if (!corridaErr && corridaData) {
                    if (isCancelledStatus(corridaData.status)) {
                        handleRideCancelled(
                            corridaData.cliente_nome || corridaData.passenger_name,
                            corridaData.motivo_cancelamento || corridaData.cancel_reason,
                            corridaData
                        );
                        return;
                    }
                }
            } catch (_) {
                // silencia erros normais de conexão
            }
        }, 1500);

        return () => {
            clearInterval(pollInterval);
            if (ridesChannel) {
                try {
                    supabase.removeChannel(ridesChannel);
                } catch (_) {}
            }
            if (corridasChannel) {
                try {
                    supabase.removeChannel(corridasChannel);
                } catch (_) {}
            }
            if (broadcastChannel) {
                try {
                    supabase.removeChannel(broadcastChannel);
                } catch (_) {}
            }
            if (localBc) {
                try {
                    localBc.close();
                } catch (_) {}
            }
        };
    }, [activeRideId, handleRideCancelled]);

    const closeCancellationModal = useCallback(() => {
        setCancellationState({ isOpen: false });
    }, []);

    return {
        cancellationState,
        closeCancellationModal,
    };
}
