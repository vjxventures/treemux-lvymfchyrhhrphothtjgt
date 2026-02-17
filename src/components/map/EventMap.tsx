'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppStore } from '@/store/app-store';
import { EVENT_CATEGORIES } from '@/types';
import type { Event } from '@/types';

// Free public token for demo — this is a restricted public token
mapboxgl.accessToken = 'pk.eyJ1IjoibWlnZ29vZGVtbyIsImEiOiJjbTdkMHhyMzEwMnR4Mm1zOGR6bWRycTB6In0.placeholder';

const CATEGORY_COLORS: Record<string, string> = {};
EVENT_CATEGORIES.forEach(c => { CATEGORY_COLORS[c.value] = c.color; });

function getMarkerColor(event: Event): string {
  if (event.is_active) return '#39FF14'; // neon green for active
  return CATEGORY_COLORS[event.category] || '#00F0FF';
}

export default function EventMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { events, mapCenter, fetchEventDetail, trackEvent } = useAppStore();

  const handleMarkerClick = useCallback((event: Event) => {
    fetchEventDetail(event.id);
    trackEvent('event_viewed', { event_id: event.id, source: 'map' });
  }, [fetchEventDetail, trackEvent]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Use a dark style — we'll use a free style that works without a valid token
    // For the demo, we use an OSM-based style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [mapCenter.lng, mapCenter.lat],
      zoom: 15,
      pitch: 30,
      bearing: -10,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    trackEvent('map_opened', {});

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    events.forEach((event) => {
      const color = getMarkerColor(event);
      const isActive = event.is_active;
      const size = isActive ? 40 : 32;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = `event-marker ${isActive ? 'event-marker-active' : 'event-marker-upcoming'}`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      const catInfo = EVENT_CATEGORIES.find(c => c.value === event.category);
      const emoji = catInfo?.emoji || '✨';

      el.innerHTML = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color}22;
          border: 2px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isActive ? '18px' : '14px'};
          position: relative;
          ${isActive ? `box-shadow: 0 0 12px ${color}66, 0 0 24px ${color}33;` : ''}
        ">
          ${emoji}
          ${isActive ? `<div style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px solid ${color}44;
            animation: pulse-neon 2s ease-in-out infinite;
          "></div>` : ''}
        </div>
      `;

      el.addEventListener('click', () => handleMarkerClick(event));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([event.lng, event.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [events, handleMarkerClick]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
