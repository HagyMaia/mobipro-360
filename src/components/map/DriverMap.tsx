// src/components/map/DriverMap.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationCoordinates } from '@/types';

export interface MapPoint {
    latitude: number;
    longitude: number;
    label?: string;
    address?: string;
}

export interface DriverMapProps {
    location: LocationCoordinates | null;
    pickupLocation?: MapPoint | null;
    dropoffLocation?: MapPoint | null;
    showRoute?: boolean;
    routeMode?: 'to-pickup' | 'to-dropoff' | 'full';
}

// Cache local de trajetos em memória para evitar chamadas repetidas
const routeGeometryCache = new Map<string, [number, number][]>();

// Ícones personalizados em CSS/SVG puro (não dependem de URLs externas)
const createCarIcon = () =>
    L.divIcon({
        className: 'custom-leaflet-car-marker',
        html: `
            <div style="
                width: 40px;
                height: 40px;
                background: #0f172a;
                border: 2.5px solid #eab308;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
                position: relative;
            ">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fef08a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                    <circle cx="7" cy="17" r="2"/>
                    <path d="M9 17h6"/>
                    <circle cx="17" cy="17" r="2"/>
                </svg>
                <span style="
                    position: absolute;
                    top: -3px;
                    right: -3px;
                    width: 11px;
                    height: 11px;
                    background: #22c55e;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #22c55e;
                "></span>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });

const createPickupIcon = (label?: string) =>
    L.divIcon({
        className: 'custom-leaflet-pickup-marker',
        html: `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
            ">
                <div style="
                    background: #10b981;
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 800;
                    padding: 3px 8px;
                    border-radius: 12px;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    border: 1.5px solid #ffffff;
                    letter-spacing: 0.05em;
                ">
                    ${label || 'EMBARQUE'}
                </div>
                <div style="
                    width: 18px;
                    height: 18px;
                    background: #10b981;
                    border: 3px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.4);
                "></div>
            </div>
        `,
        iconSize: [90, 44],
        iconAnchor: [45, 38],
    });

const createDropoffIcon = (label?: string) =>
    L.divIcon({
        className: 'custom-leaflet-dropoff-marker',
        html: `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
            ">
                <div style="
                    background: #ef4444;
                    color: #ffffff;
                    font-size: 10px;
                    font-weight: 800;
                    padding: 3px 8px;
                    border-radius: 12px;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    border: 1.5px solid #ffffff;
                    letter-spacing: 0.05em;
                ">
                    ${label || 'DESTINO'}
                </div>
                <div style="
                    width: 18px;
                    height: 18px;
                    background: #ef4444;
                    border: 3px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.4);
                "></div>
            </div>
        `,
        iconSize: [90, 44],
        iconAnchor: [45, 38],
    });

// Controlador de foco e enquadramento dinâmico do mapa
function MapBoundsController({
    location,
    pickupLocation,
    dropoffLocation,
    roadPath,
    routeMode,
}: {
    location: LocationCoordinates | null;
    pickupLocation?: MapPoint | null;
    dropoffLocation?: MapPoint | null;
    roadPath?: [number, number][];
    routeMode?: 'to-pickup' | 'to-dropoff' | 'full';
}) {
    const map = useMap();

    useEffect(() => {
        const points: [number, number][] = [];

        if (roadPath && roadPath.length > 2) {
            // Se tiver trajeto real da rota pelas ruas, enquadra todos os pontos do trajeto
            const bounds = L.latLngBounds(roadPath);
            map.fitBounds(bounds, {
                padding: [60, 60],
                maxZoom: 16,
                animate: true,
            });
            return;
        }

        if (routeMode === 'to-pickup') {
            if (location?.latitude && location?.longitude) points.push([location.latitude, location.longitude]);
            if (pickupLocation?.latitude && pickupLocation?.longitude) points.push([pickupLocation.latitude, pickupLocation.longitude]);
        } else if (routeMode === 'to-dropoff') {
            if (location?.latitude && location?.longitude) points.push([location.latitude, location.longitude]);
            if (dropoffLocation?.latitude && dropoffLocation?.longitude) points.push([dropoffLocation.latitude, dropoffLocation.longitude]);
        } else {
            if (location?.latitude && location?.longitude) points.push([location.latitude, location.longitude]);
            if (pickupLocation?.latitude && pickupLocation?.longitude) points.push([pickupLocation.latitude, pickupLocation.longitude]);
            if (dropoffLocation?.latitude && dropoffLocation?.longitude) points.push([dropoffLocation.latitude, dropoffLocation.longitude]);
        }

        if (points.length >= 2) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, {
                padding: [60, 60],
                maxZoom: 16,
                animate: true,
            });
        } else if (location?.latitude && location?.longitude) {
            map.setView([location.latitude, location.longitude], 16, { animate: true });
        }
    }, [location, pickupLocation, dropoffLocation, roadPath, routeMode, map]);

    return null;
}

export default function DriverMap({
    location,
    pickupLocation,
    dropoffLocation,
    showRoute = true,
    routeMode = 'full',
}: DriverMapProps) {
    // Posição padrão: Manaus - AM
    const defaultPosition: [number, number] = [-3.119028, -60.021731];
    const center: [number, number] = location
        ? [location.latitude, location.longitude]
        : defaultPosition;

    const carIcon = useMemo(() => createCarIcon(), []);
    const pickupIcon = useMemo(() => createPickupIcon(pickupLocation?.label), [pickupLocation?.label]);
    const dropoffIcon = useMemo(() => createDropoffIcon(dropoffLocation?.label), [dropoffLocation?.label]);

    const [roadGeometry, setRoadGeometry] = useState<[number, number][]>([]);

    // Identifica coordenadas de origem e destino da rota com base no modo
    const routeEndpoints = useMemo(() => {
        let startLat: number | null = null;
        let startLng: number | null = null;
        let endLat: number | null = null;
        let endLng: number | null = null;

        if (routeMode === 'to-pickup') {
            // Rota: Carro do motorista -> Ponto de Embarque
            startLat = location?.latitude ?? pickupLocation?.latitude ?? null;
            startLng = location?.longitude ?? pickupLocation?.longitude ?? null;
            endLat = pickupLocation?.latitude ?? null;
            endLng = pickupLocation?.longitude ?? null;
        } else if (routeMode === 'to-dropoff') {
            // Rota: Carro do motorista (ou embarque) -> Destino Final
            startLat = location?.latitude ?? pickupLocation?.latitude ?? null;
            startLng = location?.longitude ?? pickupLocation?.longitude ?? null;
            endLat = dropoffLocation?.latitude ?? null;
            endLng = dropoffLocation?.longitude ?? null;
        } else {
            // Rota completa: Embarque -> Destino
            startLat = pickupLocation?.latitude ?? location?.latitude ?? null;
            startLng = pickupLocation?.longitude ?? location?.longitude ?? null;
            endLat = dropoffLocation?.latitude ?? null;
            endLng = dropoffLocation?.longitude ?? null;
        }

        return { startLat, startLng, endLat, endLng };
    }, [routeMode, location, pickupLocation, dropoffLocation]);

    // Busca o trajeto real seguindo as ruas via OSRM Routing API
    useEffect(() => {
        const { startLat, startLng, endLat, endLng } = routeEndpoints;

        if (!showRoute || !startLat || !startLng || !endLat || !endLng) {
            setRoadGeometry([]);
            return;
        }

        // Se origem e destino forem praticamente idênticos
        if (Math.abs(startLat - endLat) < 0.0001 && Math.abs(startLng - endLng) < 0.0001) {
            setRoadGeometry([]);
            return;
        }

        const cacheKey = `${startLat.toFixed(5)},${startLng.toFixed(5)}_${endLat.toFixed(5)},${endLng.toFixed(5)}`;
        if (routeGeometryCache.has(cacheKey)) {
            setRoadGeometry(routeGeometryCache.get(cacheKey)!);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        async function fetchRoadRoute() {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
                const response = await fetch(url, { signal: controller.signal });
                if (!response.ok) throw new Error(`OSRM Status: ${response.status}`);
                const data = await response.json();

                if (data?.routes?.[0]?.geometry?.coordinates && Array.isArray(data.routes[0].geometry.coordinates)) {
                    // GeoJSON retorna [longitude, latitude], Leaflet Polyline precisa de [latitude, longitude]
                    const latLngs: [number, number][] = data.routes[0].geometry.coordinates.map(
                        ([lng, lat]: [number, number]) => [lat, lng]
                    );

                    if (isMounted && latLngs.length > 0) {
                        routeGeometryCache.set(cacheKey, latLngs);
                        setRoadGeometry(latLngs);
                        return;
                    }
                }
            } catch (err) {
                // Fallback para linha direta caso offline ou erro na API OSRM
                if (isMounted && startLat && startLng && endLat && endLng) {
                    setRoadGeometry([
                        [startLat, startLng],
                        [endLat, endLng],
                    ]);
                }
            }
        }

        fetchRoadRoute();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [routeEndpoints, showRoute]);

    // Coordenadas finais da rota a desenhar
    const polylinePositions: [number, number][] = useMemo(() => {
        if (!showRoute) return [];
        if (roadGeometry.length >= 2) return roadGeometry;

        const { startLat, startLng, endLat, endLng } = routeEndpoints;
        if (startLat && startLng && endLat && endLng) {
            return [
                [startLat, startLng],
                [endLat, endLng],
            ];
        }
        return [];
    }, [roadGeometry, routeEndpoints, showRoute]);

    return (
        <div className="w-full h-full z-0 relative">
            <MapContainer
                center={center}
                zoom={16}
                zoomControl={false}
                className="w-full h-full"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                <MapBoundsController
                    location={location}
                    pickupLocation={pickupLocation}
                    dropoffLocation={dropoffLocation}
                    roadPath={polylinePositions}
                    routeMode={routeMode}
                />

                {/* Marcador do Carro do Motorista (Sempre visível se tiver GPS) */}
                {location && (
                    <Marker
                        position={[location.latitude, location.longitude]}
                        icon={carIcon}
                    >
                        <Popup>
                            <span className="font-bold text-xs">
                                {routeMode === 'to-pickup' ? 'Você (A caminho do passageiro)' : 'Sua Localização'}
                            </span>
                        </Popup>
                    </Marker>
                )}

                {/* Marcador de Embarque (Origem) */}
                {pickupLocation?.latitude && pickupLocation?.longitude && (
                    <Marker
                        position={[pickupLocation.latitude, pickupLocation.longitude]}
                        icon={pickupIcon}
                    >
                        <Popup>
                            <div className="text-xs">
                                <strong className="text-emerald-600 block">Embarque</strong>
                                <span>{pickupLocation.address || 'Local de Embarque'}</span>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Marcador de Desembarque (Destino) */}
                {dropoffLocation?.latitude && dropoffLocation?.longitude && (
                    <Marker
                        position={[dropoffLocation.latitude, dropoffLocation.longitude]}
                        icon={dropoffIcon}
                    >
                        <Popup>
                            <div className="text-xs">
                                <strong className="text-red-600 block">Destino Final</strong>
                                <span>{dropoffLocation.address || 'Local de Desembarque'}</span>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Linha do Trajeto Real pelas Ruas (Polyline) */}
                {polylinePositions.length >= 2 && (
                    <>
                        {/* Linha de fundo / borda para contraste */}
                        <Polyline
                            positions={polylinePositions}
                            pathOptions={{
                                color: routeMode === 'to-pickup' ? '#065f46' : '#0f172a',
                                weight: 7,
                                opacity: 0.8,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                        {/* Linha frontal iluminada seguindo as curvas do asfalto */}
                        <Polyline
                            positions={polylinePositions}
                            pathOptions={{
                                color: routeMode === 'to-pickup' ? '#10b981' : '#eab308',
                                weight: 4.5,
                                opacity: 0.95,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                    </>
                )}
            </MapContainer>
        </div>
    );
}