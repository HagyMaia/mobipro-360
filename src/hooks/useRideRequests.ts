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

        const supabase = createClient();

        // Escuta novos registros na tabela de corridas com status SEARCHING
        const channel = supabase
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
                    setCurrentOffer({
                        id: newRide.id,
                        passengerName: 'Passageiro',
                        passengerRating: 5.0,
                        pickupAddress: newRide.pickup_address,
                        pickupLocation: { latitude: newRide.pickup_lat, longitude: newRide.pickup_lng },
                        dropoffAddress: newRide.dropoff_address,
                        dropoffLocation: { latitude: newRide.dropoff_lat, longitude: newRide.dropoff_lng },
                        fareAmount: newRide.fare_amount,
                        distanceKm: newRide.distance_km,
                        estimatedMinutes: Math.round(newRide.distance_km * 2), // Estimativa simples
                        expiresInSeconds: 15, // Motorista tem 15s para aceitar
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOnline]);

    return { currentOffer, clearOffer: () => setCurrentOffer(null) };
}