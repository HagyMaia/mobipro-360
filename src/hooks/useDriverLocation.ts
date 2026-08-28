// src/hooks/useDriverLocation.ts

import { useState, useEffect, useCallback } from 'react';
import { LocationCoordinates } from '@/types';
import { LocationService } from '@/services/location/LocationService';

export function useDriverLocation(isOnline: boolean = false) {
    const [location, setLocation] = useState<LocationCoordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchInitialLocation = useCallback(async () => {
        try {
            setIsLoading(true);
            const coords = await LocationService.getCurrentLocation();
            setLocation(coords);
            setError(null);
        } catch (err: any) {
            setError(err?.message || 'Erro ao obter localização');
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