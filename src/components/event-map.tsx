"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { getCategoryInfo } from "@/lib/categories";
import dynamic from "next/dynamic";

interface EventData {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  status: string;
  attendee_count: number;
}

// Dynamically import map to avoid SSR issues
const MapInner = dynamic(() => import("./map-inner").then((m) => m.MapInner), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-background">
      <div className="text-muted-foreground text-sm">Loading map...</div>
    </div>
  ),
});

interface EventMapProps {
  events: never[];
}

export function EventMap({ events }: EventMapProps) {
  return <MapInner events={events} />;
}
