'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { HeatZone } from '@/lib/types';

const SPA_CENTER: [number, number] = [-3.1190, -60.0217];

export default function HeatmapMap({ zones }: { zones: HeatZone[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ map: unknown; layer: unknown } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;
      const heat = (await import('leaflet.heat')).default;

      if (cancelled || !containerRef.current) return;
      if (mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: SPA_CENTER,
        zoom: 13,
        zoomControl: false,
        attributionControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const points = zones.map(
        (z) => [z.lat, z.lng, z.intensity / 100] as L.LatLngTuple
      );

      const heatLayer = heat(points, {
        radius: 42,
        blur: 26,
        maxZoom: 13,
        minOpacity: 0.45,
        gradient: {
          0.2: '#1e3a8a',
          0.4: '#0ea5e9',
          0.6: '#f59e0b',
          0.8: '#ef4444',
          1.0: '#991b1b'
        }
      }).addTo(map);

      mapRef.current = { map, layer: heatLayer };

      const zoomIn = L.control.zoom({ position: 'bottomleft' });
      zoomIn.addTo(map);
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        (mapRef.current.map as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [zones]);

  return (
    <div
      ref={containerRef}
      className="w-full h-96 rounded-lg shadow-md z-0"
    />
  );
}
