'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

// Single GPS pin on an OpenStreetMap tile layer. Raw Leaflet to dodge SSR.
export default function MapPin({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current).setView([lat, lng], 16);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      L.circleMarker([lat, lng], { radius: 9, color: '#0f766e', fillOpacity: 0.6 }).addTo(map);
    })();
    return () => {
      cancelled = true;
      // @ts-expect-error leaflet map remove
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return <div ref={ref} className="w-full h-56 rounded-lg" />;
}
