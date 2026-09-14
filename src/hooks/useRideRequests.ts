// src/hooks/useRideRequests.ts
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { RideOffer } from '@/types';

const REJECTED_RIDES_KEY = 'mobipro_rejected_rides_v1';
const MAX_STALE_RIDE_MS = 3 * 60 * 1000; // 3 minutos

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

    // Expiração automática por tempo da oferta atual (30s)
    useEffect(() => {
        if (!currentOffer) return;
        const durationSec = currentOffer.expiresInSeconds ?? 30;
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

        // 1. Busca corridas pendentes criadas recentemente com status SEARCHING
        const checkPendingRides = async () => {
            try {
                const rejected = getRejectedRideIds();
                const { data, error } = await supabase
                    .from('rides')
                    .select('*')
                    .eq('status', 'SEARCHING')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (!error && Array.isArray(data) && isMounted) {
                    const now = Date.now();
                    const candidate = data.find((r: any) => {
                        if (!r || !r.id) return false;
                        if (rejected.has(r.id)) return false;
                        if (r.created_at) {
                            const createdAtTime = new Date(r.created_at).getTime();
                            if (!isNaN(createdAtTime) && (now - createdAtTime > MAX_STALE_RIDE_MS)) {
                                return false;
                            }
                        }
                        return true;
                    });

                    if (candidate && isMounted) {
                        const dist = Number(candidate.distance_km || candidate.distancia_km || candidate.distance || 5.2);
                        const fareVal = Number(candidate.fare_amount || candidate.valor || candidate.fare || 28.50);
                        setCurrentOffer({
                            id: candidate.id,
                            passengerName: candidate.passenger_name || candidate.cliente_nome || 'Passageiro',
                            passengerRating: Number(candidate.passenger_rating || 5.0),
                            pickupAddress: candidate.pickup_address || candidate.origem || 'Av. Djalma Batista, 1000 - Manaus',
                            pickupLocation: { latitude: Number(candidate.pickup_lat || -3.1190), longitude: Number(candidate.pickup_lng || -60.0217) },
                            dropoffAddress: candidate.dropoff_address || candidate.destino || candidate.destination_address || 'Shopping Manauara - Adrianópolis',
                            dropoffLocation: { latitude: Number(candidate.dropoff_lat || -3.1072), longitude: Number(candidate.dropoff_lng || -60.0125) },
                            fareAmount: fareVal,
                            distanceKm: dist,
                            estimatedMinutes: candidate.estimated_minutes ? Number(candidate.estimated_minutes) : Math.round(dist * 2.5) || 12,
                            expiresInSeconds: 30,
                        });
                    }
                }
            } catch (err) {
                console.warn('[useRideRequests] Erro ao buscar corrida pendente:', err);
            }
        };

        checkPendingRides();

        // 2. Escuta novos registros e atualizações na tabela de corridas
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
                            if (newRide && newRide.status === 'SEARCHING' && isMounted) {
                                const rejected = getRejectedRideIds();
                                if (rejected.has(newRide.id)) return;

                                const dist = Number(newRide.distance_km || newRide.distancia_km || newRide.distance || 5.2);
                                const fareVal = Number(newRide.fare_amount || newRide.valor || newRide.fare || 28.50);
                                setCurrentOffer({
                                    id: newRide.id,
                                    passengerName: newRide.passenger_name || newRide.cliente_nome || 'Passageiro',
                                    passengerRating: Number(newRide.passenger_rating || 5.0),
                                    pickupAddress: newRide.pickup_address || newRide.origem || 'Av. Djalma Batista, 1000 - Manaus',
                                    pickupLocation: { latitude: Number(newRide.pickup_lat || -3.1190), longitude: Number(newRide.pickup_lng || -60.0217) },
                                    dropoffAddress: newRide.dropoff_address || newRide.destino || newRide.destination_address || 'Shopping Manauara - Adrianópolis',
                                    dropoffLocation: { latitude: Number(newRide.dropoff_lat || -3.1072), longitude: Number(newRide.dropoff_lng || -60.0125) },
                                    fareAmount: fareVal,
                                    distanceKm: dist,
                                    estimatedMinutes: newRide.estimated_minutes ? Number(newRide.estimated_minutes) : Math.round(dist * 2.5) || 12,
                                    expiresInSeconds: 30,
                                });
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
                                if (updatedRide.status === 'SEARCHING') {
                                    const rejected = getRejectedRideIds();
                                    if (rejected.has(updatedRide.id)) return;

                                    const dist = Number(updatedRide.distance_km || updatedRide.distancia_km || updatedRide.distance || 5.2);
                                    const fareVal = Number(updatedRide.fare_amount || updatedRide.valor || updatedRide.fare || 28.50);
                                    setCurrentOffer({
                                        id: updatedRide.id,
                                        passengerName: updatedRide.passenger_name || updatedRide.cliente_nome || 'Passageiro',
                                        passengerRating: Number(updatedRide.passenger_rating || 5.0),
                                        pickupAddress: updatedRide.pickup_address || updatedRide.origem || 'Av. Djalma Batista, 1000 - Manaus',
                                        pickupLocation: { latitude: Number(updatedRide.pickup_lat || -3.1190), longitude: Number(updatedRide.pickup_lng || -60.0217) },
                                        dropoffAddress: updatedRide.dropoff_address || updatedRide.destino || updatedRide.destination_address || 'Shopping Manauara - Adrianópolis',
                                        dropoffLocation: { latitude: Number(updatedRide.dropoff_lat || -3.1072), longitude: Number(updatedRide.dropoff_lng || -60.0125) },
                                        fareAmount: fareVal,
                                        distanceKm: dist,
                                        estimatedMinutes: updatedRide.estimated_minutes ? Number(updatedRide.estimated_minutes) : Math.round(dist * 2.5) || 12,
                                        expiresInSeconds: 30,
                                    });
                                } else {
                                    // Se a corrida atual foi aceita por outro ou cancelada, limpa a oferta
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