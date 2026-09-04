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
        try {
            const supabase = createClient();

            // Escuta novos registros na tabela de corridas com status SEARCHING
            if (supabase?.channel) {
                channel = supabase
                    .channel('public:rides')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'rides',
                            filter: "status=eq.'SEARCHING'",
                        },
                        (payload: any) => {
                            const newRide = payload.new;
                            if (newRide) {
                                setCurrentOffer({
                                    id: newRide.id,
                                    passengerName: newRide.passenger_name || 'Passageiro',
                                    passengerRating: 5.0,
                                    pickupAddress: newRide.pickup_address || 'Av. Djalma Batista, 1000 - Manaus',
                                    pickupLocation: { latitude: newRide.pickup_lat || -3.1190, longitude: newRide.pickup_lng || -60.0217 },
                                    dropoffAddress: newRide.dropoff_address || 'Shopping Manauara - Adrianópolis',
                                    dropoffLocation: { latitude: newRide.dropoff_lat || -3.1072, longitude: newRide.dropoff_lng || -60.0125 },
                                    fareAmount: Number(newRide.fare_amount || 28.50),
                                    distanceKm: Number(newRide.distance_km || 5.2),
                                    estimatedMinutes: Math.round(Number(newRide.distance_km || 5.2) * 2.5),
                                    expiresInSeconds: 15,
                                });
                            }
                        }
                    )
                    .subscribe();
            }
        } catch (err) {
            console.warn('[useRideRequests] Erro ao conectar realtime:', err);
        }

        return () => {
            try {
                if (channel) {
                    const supabase = createClient();
                    if (supabase?.removeChannel) {
                        supabase.removeChannel(channel);
                    }
                }
            } catch (err) {
                console.warn('[useRideRequests] Erro ao remover channel:', err);
            }
        };
    }, [isOnline]);

    return { currentOffer, clearOffer: () => setCurrentOffer(null) };
}