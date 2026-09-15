// src/hooks/useDriverLocation.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationCoordinates } from '@/types';
import { LocationService } from '@/services/location/LocationService';
import { RideService } from '@/services/ride/RideService';

export const DEFAULT_MANAUS_LOCATION: LocationCoordinates = {
    latitude: -3.119028,
    longitude: -60.021731,
    heading: 0,
    speed: 0,
    accuracy: 10,
    timestamp: Date.now(),
};

export function useDriverLocation(
    isOnline: boolean = false,
    driverId?: string | null,
    activeRideId?: string | null
) {
    const [location, setLocation] = useState<LocationCoordinates | null>(DEFAULT_MANAUS_LOCATION);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const lastBroadcastRef = useRef<number>(0);

    const fetchInitialLocation = useCallback(async () => {
        try {
            setIsLoading(true);
            const coords = await LocationService.getCurrentLocation();
            setLocation(coords);
            setError(null);

            if (driverId || activeRideId) {
                RideService.updateDriverLiveLocation(driverId, coords, activeRideId);
            }
        } catch (err: any) {
            console.warn('[useDriverLocation] GPS não disponível, usando Manaus-AM:', err?.message);
            setLocation(DEFAULT_MANAUS_LOCATION);
            setError(null);
        } finally {
            setIsLoading(false);
        }
    }, [driverId, activeRideId]);

    useEffect(() => {
        fetchInitialLocation();

        if (isOnline || activeRideId) {
            LocationService.startTracking(
                (newCoords) => {
                    setLocation(newCoords);
                    setError(null);

                    // Transmite posição para o Supabase (máx 1x a cada 4 segundos)
                    const now = Date.now();
                    if (now - lastBroadcastRef.current >= 4000) {
                        lastBroadcastRef.current = now;
                        RideService.updateDriverLiveLocation(driverId, newCoords, activeRideId);
                    }
                },
                (err) => {
                    setError(err.message);
                }
            );
        } else {
            LocationService.stopTracking();
        }

        return () => {
            LocationService.stopTracking();
        };
    }, [isOnline, activeRideId, driverId, fetchInitialLocation]);

    return { location, coords: location, error, isLoading, refreshLocation: fetchInitialLocation };
}