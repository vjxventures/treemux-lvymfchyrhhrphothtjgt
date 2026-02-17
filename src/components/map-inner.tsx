"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "@/lib/store";
import { getCategoryInfo } from "@/lib/categories";
import { formatEventTime } from "@/lib/categories";

interface EventData {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  status: string;
  attendee_count: number;
  location_name: string;
  starts_at: string;
  creator_name: string;
}

function createEventIcon(event: EventData) {
  const cat = getCategoryInfo(event.category);
  const isLive = event.status === "live";
  const size = isLive ? 44 : 36;

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="event-marker ${isLive ? "event-marker-live" : ""}" style="
      width: ${size}px;
      height: ${size}px;
      background: ${cat.color};
      border: 2px solid ${isLive ? "oklch(0.72 0.2 145)" : "rgba(255,255,255,0.2)"};
      ${isLive ? `box-shadow: 0 0 0 4px oklch(0.72 0.2 145 / 25%), 0 2px 12px rgba(0,0,0,0.4);` : ""}
    ">${cat.emoji}</div>`,
  });
}

function MapEvents({ events }: { events: EventData[] }) {
  const map = useMap();
  const { setSelectedEventId, setCreateEventLocation, mapCenter, mapZoom } = useAppStore();

  useEffect(() => {
    map.setView(mapCenter, mapZoom);
  }, [map, mapCenter, mapZoom]);

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      setCreateEventLocation([e.latlng.lat, e.latlng.lng]);
    };
    map.on("contextmenu", handleClick);
    return () => { map.off("contextmenu", handleClick); };
  }, [map, setCreateEventLocation]);

  return null;
}

export function MapInner({ events }: { events: never[] }) {
  const { mapCenter, mapZoom, setSelectedEventId } = useAppStore();
  const typedEvents = events as unknown as EventData[];

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      className="h-full w-full"
      zoomControl={true}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents events={typedEvents} />
      {typedEvents.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lng]}
          icon={createEventIcon(event)}
          eventHandlers={{
            click: () => setSelectedEventId(event.id),
          }}
        >
          <Popup className="event-popup">
            <div className="p-1 min-w-[180px]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{getCategoryInfo(event.category).emoji}</span>
                <span className="font-semibold text-sm text-foreground">{event.title}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>{event.location_name}</div>
                <div>{formatEventTime(event.starts_at)}</div>
                <div>{event.attendee_count} going · by {event.creator_name}</div>
              </div>
              {event.status === "live" && (
                <div className="mt-1 text-xs font-semibold text-live flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                  Happening now
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
