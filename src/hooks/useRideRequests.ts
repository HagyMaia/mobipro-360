// src/hooks/useRideRequests.ts
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { RideOffer } from '@/types';

const REJECTED_RIDES_KEY = 'mobipro_rejected_rides_v1';
const MAX_STALE_RIDE_MS = 5 * 60 * 1000; // 5 minutos

function getRejectedRideIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = window.localStorage.getItem(REJECTED_RIDES_KEY) || window.sessionStorage.getItem(REJECTED_RIDES_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            const now = Date.now();
            const validIds: string[] = [];
            for (const item of parsed) {
                if (typeof item === 'string') {
                    validIds.push(item);
                } else if (item && typeof item === 'object' && item.id) {
                    if (!item.time || (now - item.time < 3600 * 1000)) {
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
        const json = JSON.stringify(entries);
        window.localStorage.setItem(REJECTED_RIDES_KEY, json);
        window.sessionStorage.setItem(REJECTED_RIDES_KEY, json);
    } catch {
        // ignore
    }
}

function isRideSearching(status?: string | null): boolean {
    if (!status) return true;
    const s = String(status).toUpperCase();
    return ['SEARCHING', 'AVAILABLE', 'SEARCHING_DRIVER', 'PENDING', 'SOLICITADA', 'ABERTA'].includes(s);
}

function parseRideToOffer(r: any): RideOffer {
    const dist = Number(r.distance_km || r.distancia_km || r.distance || 5.0);
    const fareVal = Number(r.fare_amount || r.valor || r.fare || r.preco || 25.00);
    return {
        id: r.id,
        passengerName: r.passenger_name || r.cliente_nome || r.passenger || 'Passageiro',
        passengerRating: Number(r.passenger_rating || 5.0),
        pickupAddress: r.pickup_address || r.pickup || r.origem || r.endereco_origem || 'Origem da solicitação',
        pickupLocation: {
            latitude: Number(r.pickup_lat || r.latitude_origem || -3.1190),
            longitude: Number(r.pickup_lng || r.longitude_origem || -60.0217),
        },
        dropoffAddress: r.dropoff_address || r.destination_address || r.dropoff || r.destino || r.endereco_destino || 'Destino da solicitação',
        dropoffLocation: {
            latitude: Number(r.dropoff_lat || r.latitude_destino || -3.1072),
            longitude: Number(r.dropoff_lng || r.longitude_destino || -60.0125),
        },
        fareAmount: fareVal,
        distanceKm: dist,
        estimatedMinutes: r.estimated_minutes ? Number(r.estimated_minutes) : Math.round(dist * 2.5) || 15,
        expiresInSeconds: 35,
    };
}

export function useRideRequests(isOnline: boolean) {
    const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);

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

    // Expiração automática por tempo da oferta atual (35s)
    useEffect(() => {
        if (!currentOffer) return;
        const durationSec = currentOffer.expiresInSeconds ?? 35;
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

        let channel: any = null;
        let isMounted = true;
        const supabase = createClient();

        // 1. Busca corridas pendentes criadas recentemente no Supabase
        const checkPendingRides = async () => {
            try {
                const rejected = getRejectedRideIds();
                const { data, error } = await supabase
                    .from('rides')
                    .select('*')
                    .or('status.eq.SEARCHING,status.eq.searching,status.eq.AVAILABLE,status.eq.available,status.eq.SEARCHING_DRIVER,status.eq.searching_driver,status.eq.PENDING,status.eq.pending,status.is.null')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!error && Array.isArray(data) && isMounted) {
                    const now = Date.now();
                    const candidate = data.find((r: any) => {
                        if (!r || !r.id) return false;
                        if (rejected.has(r.id)) return false;
                        // Não pode estar já com motorista vinculado
                        if (r.driver_id && r.status === 'ACCEPTED') return false;
                        if (r.created_at) {
                            const createdAtTime = new Date(r.created_at).getTime();
                            if (!isNaN(createdAtTime) && (now - createdAtTime > MAX_STALE_RIDE_MS)) {
                                return false;
                            }
                        }
                        return true;
                    });

                    if (candidate && isMounted) {
                        setCurrentOffer(parseRideToOffer(candidate));
                    }
                }
            } catch (err) {
                console.warn('[useRideRequests] Erro ao buscar corrida pendente:', err);
            }
        };

        checkPendingRides();

        // 2. Escuta novos registros e atualizações em tempo real na tabela de corridas
        try {
            if (supabase?.channel) {
                channel = supabase
                    .channel('public:rides:dispatch')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'rides',
                        },
                        (payload: any) => {
                            const newRide = payload.new;
                            if (newRide && isRideSearching(newRide.status) && isMounted) {
                                const rejected = getRejectedRideIds();
                                if (rejected.has(newRide.id)) return;
                                if (newRide.driver_id && newRide.status === 'ACCEPTED') return;

                                setCurrentOffer(parseRideToOffer(newRide));
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
                                if (isRideSearching(updatedRide.status) && !updatedRide.driver_id) {
                                    const rejected = getRejectedRideIds();
                                    if (rejected.has(updatedRide.id)) return;
                                    setCurrentOffer(parseRideToOffer(updatedRide));
                                } else if (updatedRide.status === 'CANCELLED') {
                                    setCurrentOffer((prev) => (prev?.id === updatedRide.id ? null : prev));
                                }
                            }
                        }
                    )
                    .subscribe();
            }
        } catch (err) {
            console.warn('[useRideRequests] Erro ao conectar realtime:', err);
        }

        return () => {
            isMounted = false;
            try {
                if (channel) {
                    supabase.removeChannel(channel);
                }
            } catch (err) {
                console.warn('[useRideRequests] Erro ao remover channel:', err);
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