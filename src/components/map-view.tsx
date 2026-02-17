"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_CONFIG, type Event, type EventCategory } from "@/lib/types";

interface MapViewProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  selectedEventId?: string | null;
  center?: [number, number];
}

function createMarkerIcon(event: Event): L.DivIcon {
  const cat = CATEGORY_CONFIG[event.category as EventCategory] || CATEGORY_CONFIG.other;
  const isNow = event.is_happening_now;
  const count = event.attendee_count || 0;

  return L.divIcon({
    className: "event-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        ${isNow ? '<div class="pulse-marker" style="position:absolute;inset:-6px;border-radius:50%;"></div>' : ""}
        <div style="
          width:44px;height:44px;border-radius:50%;
          background:${isNow ? cat.color : "#fff"};
          border:3px solid ${cat.color};
          display:flex;align-items:center;justify-content:center;
          font-size:20px;
          box-shadow:0 4px 12px ${isNow ? cat.color + "60" : "rgba(0,0,0,0.15)"};
          transition: transform 0.2s ease;
        ">${cat.icon}</div>
        ${count > 0 ? `
          <div style="
            position:absolute;top:-6px;right:-6px;
            background:${isNow ? "#ef4444" : cat.color};
            color:white;font-size:11px;font-weight:700;
            min-width:20px;height:20px;border-radius:10px;
            display:flex;align-items:center;justify-content:center;
            padding:0 4px;
            border:2px solid white;
          ">${count}</div>
        ` : ""}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

export function MapView({ events, onEventSelect, selectedEventId, center }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: center || [37.4275, -122.1697],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // Use CartoDB Voyager tiles — clean, modern look
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      subdomains: "abcd",
    }).addTo(map);

    // Add zoom control to bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [center]);

  // Update markers when events change
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;
    const currentIds = new Set(events.map((e) => e.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    events.forEach((event) => {
      const existing = markersRef.current.get(event.id);
      if (existing) {
        existing.setIcon(createMarkerIcon(event));
      } else {
        const marker = L.marker([event.lat, event.lng], {
          icon: createMarkerIcon(event),
        });
        marker.on("click", () => onEventSelect(event));
        marker.addTo(map);
        markersRef.current.set(event.id, marker);
      }
    });
  }, [events, onEventSelect, mapReady]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Highlight selected event
  useEffect(() => {
    if (!mapRef.current || !selectedEventId) return;
    const marker = markersRef.current.get(selectedEventId);
    if (marker) {
      mapRef.current.flyTo(marker.getLatLng(), 17, { duration: 0.5 });
    }
  }, [selectedEventId]);

  return (
    <div ref={mapContainer} className="w-full h-full" style={{ minHeight: "100vh" }} />
  );
}
