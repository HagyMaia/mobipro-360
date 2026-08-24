'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface HeatZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  avgFare: number;
  events?: string[];
}

function HeatmapLayer({ zones }: { zones: HeatZone[] }) {
  const map = useMap();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Define L na janela do navegador
      (window as any).L = L;

      // 2. Importa o plugin de calor apenas após L estar disponível
      import('leaflet.heat').then(() => {
        setIsLoaded(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!map || !isLoaded || !zones || zones.length === 0) return;

    // Converte as zonas para o formato do heatmap: [lat, lng, intensidade]
    const points: [number, number, number][] = zones.map((z) => [
      z.lat,
      z.lng,
      z.intensity / 100,
    ]);

    // Cria a camada de calor
    const heatLayer = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, isLoaded, zones]);

  return null;
}

export default function HeatmapMap({ zones }: { zones: HeatZone[] }) {
  // Ponto central padrão baseado nas zonas enviadas
  const center: [number, number] = zones && zones.length > 0
    ? [zones[0].lat, zones[0].lng]
    : [-23.5505, -46.6333];

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer zones={zones} />
      </MapContainer>
    </div>
  );
}