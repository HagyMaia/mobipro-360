// src/components/map/DriverMap.tsx
'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationCoordinates } from '@/types';

// Ícone customizado do carro (Você pode substituir a URL por um SVG local depois)
const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204933.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

// Componente para centralizar o mapa automaticamente
function MapController({ location }: { location: LocationCoordinates | null }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.setView([location.latitude, location.longitude], 16, { animate: true });
        }
    }, [location, map]);
    return null;
}

interface DriverMapProps {
    location: LocationCoordinates | null;
}

export default function DriverMap({ location }: DriverMapProps) {
    // Posição padrão: Manaus - AM (Centro / Adrianópolis / Djalma Batista)
    const defaultPosition: [number, number] = [-3.119028, -60.021731];
    const center: [number, number] = location
        ? [location.latitude, location.longitude]
        : defaultPosition;

    return (
        <div className="w-full h-full z-0">
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
                <MapController location={location} />
                {location && (
                    <Marker position={[location.latitude, location.longitude]} icon={carIcon} />
                )}
            </MapContainer>
        </div>
    );
}