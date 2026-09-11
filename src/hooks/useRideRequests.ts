// src/hooks/useRideRequests.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { RideOffer } from '@/types';

export function useRideRequests(isOnline: boolean) {
    const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);

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
                const { data, error } = await supabase
                    .from('rides')
                    .select('*')
                    .eq('status', 'SEARCHING')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!error && data && isMounted) {
                    const dist = Number(data.distance_km || data.distancia_km || 5.2);
                    setCurrentOffer({
                        id: data.id,
                        passengerName: data.passenger_name || data.cliente_nome || 'Passageiro',
                        passengerRating: Number(data.passenger_rating || 5.0),
                        pickupAddress: data.pickup_address || data.origem || 'Av. Djalma Batista, 1000 - Manaus',
                        pickupLocation: { latitude: Number(data.pickup_lat || -3.1190), longitude: Number(data.pickup_lng || -60.0217) },
                        dropoffAddress: data.dropoff_address || data.destino || 'Shopping Manauara - Adrianópolis',
                        dropoffLocation: { latitude: Number(data.dropoff_lat || -3.1072), longitude: Number(data.dropoff_lng || -60.0125) },
                        fareAmount: Number(data.fare_amount || data.valor || 28.50),
                        distanceKm: dist,
                        estimatedMinutes: Math.round(dist * 2.5) || 12,
                        expiresInSeconds: 30,
                    });
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
                                const dist = Number(newRide.distance_km || newRide.distancia_km || 5.2);
                                setCurrentOffer({
                                    id: newRide.id,
                                    passengerName: newRide.passenger_name || newRide.cliente_nome || 'Passageiro',
                                    passengerRating: Number(newRide.passenger_rating || 5.0),
                                    pickupAddress: newRide.pickup_address || newRide.origem || 'Av. Djalma Batista, 1000 - Manaus',
                                    pickupLocation: { latitude: Number(newRide.pickup_lat || -3.1190), longitude: Number(newRide.pickup_lng || -60.0217) },
                                    dropoffAddress: newRide.dropoff_address || newRide.destino || 'Shopping Manauara - Adrianópolis',
                                    dropoffLocation: { latitude: Number(newRide.dropoff_lat || -3.1072), longitude: Number(newRide.dropoff_lng || -60.0125) },
                                    fareAmount: Number(newRide.fare_amount || newRide.valor || 28.50),
                                    distanceKm: dist,
                                    estimatedMinutes: Math.round(dist * 2.5) || 12,
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
                                    const dist = Number(updatedRide.distance_km || updatedRide.distancia_km || 5.2);
                                    setCurrentOffer({
                                        id: updatedRide.id,
                                        passengerName: updatedRide.passenger_name || updatedRide.cliente_nome || 'Passageiro',
                                        passengerRating: Number(updatedRide.passenger_rating || 5.0),
                                        pickupAddress: updatedRide.pickup_address || updatedRide.origem || 'Av. Djalma Batista, 1000 - Manaus',
                                        pickupLocation: { latitude: Number(updatedRide.pickup_lat || -3.1190), longitude: Number(updatedRide.pickup_lng || -60.0217) },
                                        dropoffAddress: updatedRide.dropoff_address || updatedRide.destino || 'Shopping Manauara - Adrianópolis',
                                        dropoffLocation: { latitude: Number(updatedRide.dropoff_lat || -3.1072), longitude: Number(updatedRide.dropoff_lng || -60.0125) },
                                        fareAmount: Number(updatedRide.fare_amount || updatedRide.valor || 28.50),
                                        distanceKm: dist,
                                        estimatedMinutes: Math.round(dist * 2.5) || 12,
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

    return { currentOffer, clearOffer: () => setCurrentOffer(null) };
}