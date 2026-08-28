// src/services/location/LocationService.ts

import { LocationCoordinates } from '@/types';

type LocationCallback = (location: LocationCoordinates) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;

export class LocationService {
    private static watchId: number | null = null;
    private static lastUpdateTimestamp: number = 0;
    private static THROTTLE_MS = 5000; // Envia atualização no máximo a cada 5 segundos

    /**
     * Obtém a localização atual única do motorista
     */
    public static getCurrentLocation(): Promise<LocationCoordinates> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não é suportada por este dispositivo.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                    });
                },
                (error) => reject(error),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
    }

    /**
     * Inicia o monitoramento contínuo da posição do motorista com throttling
     */
    public static startTracking(
        onLocationChange: LocationCallback,
        onError?: ErrorCallback
    ): void {
        if (this.watchId !== null) return;

        if (!navigator.geolocation) {
            if (onError) {
                onError({
                    code: 2,
                    message: 'Geolocalização não suportada',
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3,
                } as GeolocationPositionError);
            }
            return;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const now = Date.now();
                // Aplica o Throttling para economizar bateria e chamadas de API
                if (now - this.lastUpdateTimestamp >= this.THROTTLE_MS) {
                    this.lastUpdateTimestamp = now;
                    onLocationChange({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                    });
                }
            },
            (error) => {
                if (onError) onError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 2000,
            }
        );
    }

    /**
     * Para o rastreamento continuo
     */
    public static stopTracking(): void {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    /**
     * Calcula distância em quilômetros entre dois pontos usando a fórmula de Haversine
     */
    public static calculateDistanceKm(
        start: LocationCoordinates,
        end: LocationCoordinates
    ): number {
        const R = 6371; // Raio da Terra em KM
        const dLat = this.toRadians(end.latitude - start.latitude);
        const dLon = this.toRadians(end.longitude - start.longitude);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(start.latitude)) *
            Math.cos(this.toRadians(end.latitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(2));
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}