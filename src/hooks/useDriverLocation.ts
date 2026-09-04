// src/hooks/useDriverLocation.ts

import { useState, useEffect, useCallback } from 'react';
import { LocationCoordinates } from '@/types';
import { LocationService } from '@/services/location/LocationService';

export const DEFAULT_MANAUS_LOCATION: LocationCoordinates = {
    latitude: -3.119028,
    longitude: -60.021731,
    heading: 0,
    speed: 0,
    accuracy: 10,
    timestamp: Date.now(),
};

export function useDriverLocation(isOnline: boolean = false) {
    const [location, setLocation] = useState<LocationCoordinates | null>(DEFAULT_MANAUS_LOCATION);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchInitialLocation = useCallback(async () => {
        try {
            setIsLoading(true);
            const coords = await LocationService.getCurrentLocation();
            setLocation(coords);
            setError(null);
        } catch (err: any) {
            console.warn('[useDriverLocation] GPS não disponível, usando Manaus-AM:', err?.message);
            setLocation(DEFAULT_MANAUS_LOCATION);
            setError(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialLocation();

        if (isOnline) {
            LocationService.startTracking(
                (newCoords) => {
                    setLocation(newCoords);
                    setError(null);
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
    }, [isOnline, fetchInitialLocation]);

    return { location, error, isLoading, refreshLocation: fetchInitialLocation };
}