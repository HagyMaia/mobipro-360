// src/hooks/useRideRequests.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { RideOffer } from '@/types';

// Chave para armazenar IDs recusados recentemente
const REJECTED_RIDES_KEY = 'mobipro_rejected_rides_v2';

function getRejectedRideIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = window.sessionStorage.getItem(REJECTED_RIDES_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            const now = Date.now();
            const validIds: string[] = [];
            for (const item of parsed) {
                if (typeof item === 'string') {
                    validIds.push(item);
                } else if (item && typeof item === 'object' && item.id) {
                    // Rejeições expiram em 90 segundos para não travar novos testes com a mesma corrida
                    if (!item.time || (now - item.time < 90 * 1000)) {
                        validIds.push(item.id);
                    }
                }
            }
            return new Set(validIds);
        }
    } catch {
        // fallback
    }
    return new Set();
}

function saveRejectedRideId(id: string) {
    if (typeof window === 'undefined' || !id) return;
    try {
        const ids = getRejectedRideIds();
        ids.add(id);
        const entries = Array.from(ids).map((id) => ({ id, time: Date.now() }));
        window.sessionStorage.setItem(REJECTED_RIDES_KEY, JSON.stringify(entries));
    } catch {
        // ignore
    }
}

/**
 * Retorna true se a corrida estiver aberta para recebimento de motorista
 */
function isRideSearching(status?: string | null): boolean {
    if (!status) return true;
    const s = String(status).trim().toUpperCase();
    const closedStatuses = [
        'ACCEPTED',
        'ACEITA',
        'IN_PROGRESS',
        'EM_ANDAMENTO',
        'COMPLETED',
        'FINALIZADA',
        'CONCLUIDA',
        'CANCELLED',
        'CANCELADA',
        'FINISHED'
    ];
    return !closedStatuses.includes(s);
}

/**
 * Toca um aviso sonoro nativo sintetizado pelo navegador (Web Audio API)
 */
function playRideNotificationSound() {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880.00, now + 0.12); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880.00, now);
        osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    } catch (err) {
        console.warn('[useRideRequests] Notificação sonora não disponível:', err);
    }
}

/**
 * Converte qualquer registro da tabela de corridas para RideOffer
 */
function parseRideToOffer(r: any): RideOffer {
    const dist = Number(
        r.distance_km ||
        r.distancia_km ||
        r.distance ||
        r.distancia ||
        4.5
    );

    const fareVal = Number(
        r.fare_amount ||
        r.valor ||
        r.fare ||
        r.preco ||
        r.price ||
        r.valor_total ||
        25.00
    );

    const pName =
        r.passenger_name ||
        r.cliente_nome ||
        r.nome_passageiro ||
        r.passageiro_nome ||
        r.passenger ||
        r.user_name ||
        'Passageiro';

    const pRating = Number(r.passenger_rating || r.nota_passageiro || 5.0);

    const pPickup =
        r.pickup_address ||
        r.endereco_origem ||
        r.origem ||
        r.pickup ||
        r.endereco_embarque ||
        r.embarque ||
        'Origem da solicitação';

    const pPickupLat = Number(
        r.pickup_lat ||
        r.latitude_origem ||
        r.origem_lat ||
        r.pickup_latitude ||
        -3.1190
    );

    const pPickupLng = Number(
        r.pickup_lng ||
        r.longitude_origem ||
        r.origem_lng ||
        r.pickup_longitude ||
        -60.0217
    );

    const pDropoff =
        r.dropoff_address ||
        r.endereco_destino ||
        r.destino ||
        r.dropoff ||
        r.destination_address ||
        r.destination ||
        r.endereco_desembarque ||
        r.desembarque ||
        'Destino da solicitação';

    const pDropoffLat = Number(
        r.dropoff_lat ||
        r.latitude_destino ||
        r.destino_lat ||
        r.dropoff_latitude ||
        -3.1072
    );

    const pDropoffLng = Number(
        r.dropoff_lng ||
        r.longitude_destino ||
        r.destino_lng ||
        r.dropoff_longitude ||
        -60.0125
    );

    const estMinutes = r.estimated_minutes
        ? Number(r.estimated_minutes)
        : Math.max(5, Math.round(dist * 2.5)) || 12;

    return {
        id: String(r.id),
        passengerName: pName,
        passengerRating: pRating,
        pickupAddress: pPickup,
        pickupLocation: {
            latitude: pPickupLat,
            longitude: pPickupLng,
        },
        dropoffAddress: pDropoff,
        dropoffLocation: {
            latitude: pDropoffLat,
            longitude: pDropoffLng,
        },
        fareAmount: fareVal,
        distanceKm: dist,
        estimatedMinutes: estMinutes,
        expiresInSeconds: 40,
    };
}

export function useRideRequests(isOnline: boolean) {
    const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);
    const lastNotifiedOfferId = useRef<string | null>(null);

    const clearOffer = useCallback(() => {
        setCurrentOffer(null);
    }, []);

    const rejectOffer = useCallback((rideId?: string) => {
        const targetId = rideId || currentOffer?.id;
        if (targetId) {
            saveRejectedRideId(targetId);
        }
        setCurrentOffer(null);
    }, [currentOffer]);

    const acceptOffer = useCallback((_rideId?: string) => {
        setCurrentOffer(null);
    }, []);

    // Expiração automática por tempo da oferta atual (40s)
    useEffect(() => {
        if (!currentOffer) return;
        const durationSec = currentOffer.expiresInSeconds ?? 40;
        const timer = setTimeout(() => {
            console.info('[useRideRequests] Oferta expirada por tempo:', currentOffer.id);
            rejectOffer(currentOffer.id);
        }, durationSec * 1000);

        return () => clearTimeout(timer);
    }, [currentOffer, rejectOffer]);

    useEffect(() => {
        if (!isOnline) {
            setCurrentOffer(null);
            return;
        }

        let isMounted = true;
        let channel: any = null;
        let pollInterval: any = null;
        const supabase = createClient();

        // 1. Função unificada para verificar e processar corridas pendentes
        const processCandidateRides = (rides: any[]) => {
            if (!isMounted || !Array.isArray(rides) || rides.length === 0) return;
            const rejected = getRejectedRideIds();

            const candidate = rides.find((r: any) => {
                if (!r || !r.id) return false;
                if (rejected.has(String(r.id))) return false;
                if (!isRideSearching(r.status)) return false;

                // Se já tiver motorista atribuído e o status não estiver aberto
                if (
                    r.driver_id &&
                    r.driver_id !== '00000000-0000-0000-0000-000000000000' &&
                    String(r.status).toUpperCase() === 'ACCEPTED'
                ) {
                    return false;
                }

                return true;
            });

            if (candidate && isMounted) {
                const parsed = parseRideToOffer(candidate);
                setCurrentOffer((prev) => {
                    if (prev?.id === parsed.id) return prev;
                    if (lastNotifiedOfferId.current !== parsed.id) {
                        lastNotifiedOfferId.current = parsed.id;
                        playRideNotificationSound();
                    }
                    return parsed;
                });
            }
        };

        // 2. Busca inicial e periódica (Polling a cada 3.5 segundos como garantia)
        const fetchPendingRides = async () => {
            try {
                const { data, error } = await supabase
                    .from('rides')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(15);

                if (!error && data) {
                    processCandidateRides(data);
                } else if (error) {
                    console.warn('[useRideRequests] Aviso ao consultar rides:', error.message);
                }
            } catch (err) {
                console.warn('[useRideRequests] Erro ao buscar corrida pendente:', err);
            }
        };

        fetchPendingRides();
        pollInterval = setInterval(fetchPendingRides, 3500);

        // 3. Escuta em tempo real via Realtime WebSocket (Entrega instantânea)
        try {
            if (supabase?.channel) {
                channel = supabase
                    .channel('mobipro:rides_realtime_feed')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'rides',
                        },
                        (payload: any) => {
                            const newRide = payload.new;
                            if (newRide && isMounted) {
                                processCandidateRides([newRide]);
                            }
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'rides',
                        },
                        (payload: any) => {
                            const updatedRide = payload.new;
                            if (updatedRide && isMounted) {
                                const s = String(updatedRide.status).toUpperCase();
                                if (s === 'CANCELLED' || s === 'CANCELADA') {
                                    setCurrentOffer((prev) => (prev?.id === String(updatedRide.id) ? null : prev));
                                } else if (isRideSearching(updatedRide.status) && !updatedRide.driver_id) {
                                    processCandidateRides([updatedRide]);
                                }
                            }
                        }
                    )
                    .subscribe();
            }
        } catch (err) {
            console.warn('[useRideRequests] Erro ao conectar Realtime WebSocket:', err);
        }

        return () => {
            isMounted = false;
            if (pollInterval) clearInterval(pollInterval);
            if (channel) {
                try {
                    supabase.removeChannel(channel);
                } catch {
                    // ignore
                }
            }
        };
    }, [isOnline]);

    return {
        currentOffer,
        clearOffer,
        rejectOffer,
        acceptOffer,
    };
}