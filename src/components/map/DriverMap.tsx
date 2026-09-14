// src/components/map/DriverMap.tsx
'use client';

import { useEffect, useMemo } from 'react';
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

interface DriverMapProps {
    location: LocationCoordinates | null;
    pickupLocation?: MapPoint | null;
    dropoffLocation?: MapPoint | null;
    showRoute?: boolean;
}

// Ícones personalizados em CSS/SVG puro (não dependem de URLs externas)
const createCarIcon = () =>
    L.divIcon({
        className: 'custom-leaflet-car-marker',
        html: `
            <div style="
                width: 38px;
                height: 38px;
                background: #0f172a;
                border: 2.5px solid #eab308;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 14px rgba(0,0,0,0.45);
                position: relative;
            ">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fef08a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                    <circle cx="7" cy="17" r="2"/>
                    <path d="M9 17h6"/>
                    <circle cx="17" cy="17" r="2"/>
                </svg>
                <span style="
                    position: absolute;
                    top: -3px;
                    right: -3px;
                    width: 10px;
                    height: 10px;
                    background: #22c55e;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                "></span>
            </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
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
                    padding: 2px 7px;
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
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.4);
                "></div>
            </div>
        `,
        iconSize: [80, 42],
        iconAnchor: [40, 36],
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
                    padding: 2px 7px;
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
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.4);
                "></div>
            </div>
        `,
        iconSize: [80, 42],
        iconAnchor: [40, 36],
    });

// Controlador de foco e enquadramento dinâmico do mapa
function MapBoundsController({
    location,
    pickupLocation,
    dropoffLocation,
}: {
    location: LocationCoordinates | null;
    pickupLocation?: MapPoint | null;
    dropoffLocation?: MapPoint | null;
}) {
    const map = useMap();

    useEffect(() => {
        const points: [number, number][] = [];

        if (location?.latitude && location?.longitude) {
            points.push([location.latitude, location.longitude]);
        }
        if (pickupLocation?.latitude && pickupLocation?.longitude) {
            points.push([pickupLocation.latitude, pickupLocation.longitude]);
        }
        if (dropoffLocation?.latitude && dropoffLocation?.longitude) {
            points.push([dropoffLocation.latitude, dropoffLocation.longitude]);
        }

        if (points.length >= 2) {
            // Ajusta o zoom para enquadrar motorista, embarque e destino
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, {
                padding: [60, 60],
                maxZoom: 16,
                animate: true,
            });
        } else if (location?.latitude && location?.longitude) {
            // Se a corrida foi cancelada ou não há rota, foca suavemente na localização do carro
            map.setView([location.latitude, location.longitude], 16, { animate: true });
        }
    }, [location, pickupLocation, dropoffLocation, map]);

    return null;
}

export default function DriverMap({
    location,
    pickupLocation,
    dropoffLocation,
    showRoute = true,
}: DriverMapProps) {
    // Posição padrão: Manaus - AM
    const defaultPosition: [number, number] = [-3.119028, -60.021731];
    const center: [number, number] = location
        ? [location.latitude, location.longitude]
        : defaultPosition;

    const carIcon = useMemo(() => createCarIcon(), []);
    const pickupIcon = useMemo(() => createPickupIcon(pickupLocation?.label), [pickupLocation?.label]);
    const dropoffIcon = useMemo(() => createDropoffIcon(dropoffLocation?.label), [dropoffLocation?.label]);

    // Monta coordenadas do trajeto apenas se houver pontos válidos
    const routeCoordinates: [number, number][] = useMemo(() => {
        if (!showRoute) return [];
        const coords: [number, number][] = [];

        if (location?.latitude && location?.longitude) {
            coords.push([location.latitude, location.longitude]);
        }
        if (pickupLocation?.latitude && pickupLocation?.longitude) {
            coords.push([pickupLocation.latitude, pickupLocation.longitude]);
        }
        if (dropoffLocation?.latitude && dropoffLocation?.longitude) {
            coords.push([dropoffLocation.latitude, dropoffLocation.longitude]);
        }

        return coords.length >= 2 ? coords : [];
    }, [location, pickupLocation, dropoffLocation, showRoute]);

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
                />

                {/* Marcador do Carro do Motorista */}
                {location && (
                    <Marker
                        position={[location.latitude, location.longitude]}
                        icon={carIcon}
                    >
                        <Popup>
                            <span className="font-bold text-xs">Sua Localização</span>
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

                {/* Linha do Trajeto (Trajeto / Polyline) */}
                {routeCoordinates.length >= 2 && (
                    <>
                        {/* Linha de fundo / brilho */}
                        <Polyline
                            positions={routeCoordinates}
                            pathOptions={{
                                color: '#1e293b',
                                weight: 7,
                                opacity: 0.6,
                                lineCap: 'round',
                                lineJoin: 'round',
                            }}
                        />
                        {/* Linha frontal iluminada */}
                        <Polyline
                            positions={routeCoordinates}
                            pathOptions={{
                                color: '#eab308',
                                weight: 4,
                                opacity: 0.95,
                                dashArray: '10, 8',
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