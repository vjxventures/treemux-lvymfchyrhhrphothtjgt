"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_CONFIG, VIBE_OPTIONS, type EventCategory } from "@/lib/types";

interface CreateEventProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateEvent({ onClose, onCreated }: CreateEventProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("social");
  const [locationName, setLocationName] = useState("");
  const [vibe, setVibe] = useState("");
  const [startsAt, setStartsAt] = useState("now");
  const [customTime, setCustomTime] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [creating, setCreating] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [lat, setLat] = useState(37.4275);
  const [lng, setLng] = useState(-122.1697);
  const mapRef = useRef<HTMLDivElement>(null);

  // Mini map for location picking
  useEffect(() => {
    if (!pickingLocation || !mapRef.current) return;

    const L = require("leaflet");
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      subdomains: "abcd",
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setLat(pos.lat);
      setLng(pos.lng);
    });

    map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
      marker.setLatLng(e.latlng);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    });

    return () => map.remove();
  }, [pickingLocation, lat, lng]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);

    const now = new Date();
    let starts: string;
    if (startsAt === "now") {
      starts = now.toISOString();
    } else if (startsAt === "30min") {
      starts = new Date(now.getTime() + 30 * 60000).toISOString();
    } else if (startsAt === "1hr") {
      starts = new Date(now.getTime() + 60 * 60000).toISOString();
    } else {
      starts = customTime ? new Date(customTime).toISOString() : now.toISOString();
    }

    // Default 2hr duration
    const ends = new Date(new Date(starts).getTime() + 120 * 60000).toISOString();

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          lat,
          lng,
          location_name: locationName.trim() || null,
          starts_at: starts,
          ends_at: ends,
          max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
          vibe: vibe || null,
        }),
      });

      if (res.ok) {
        onCreated();
        onClose();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <h3 className="font-bold text-lg">Create Event</h3>
        <div className="w-8" />
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
        {/* Title */}
        <div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's happening? e.g. Pickup Basketball"
            className="h-12 text-base font-medium border-0 bg-secondary/50 rounded-xl px-4"
            maxLength={80}
          />
          <p className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/80</p>
        </div>

        {/* Description */}
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details... (optional)"
          className="min-h-[80px] border-0 bg-secondary/50 rounded-xl px-4 py-3 resize-none text-sm"
          maxLength={300}
        />

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG.social][]).map(
              ([key, val]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === key
                      ? "ring-2 ring-offset-1"
                      : "bg-secondary/60 hover:bg-secondary"
                  }`}
                  style={
                    category === key
                      ? { background: val.color + "20", color: val.color, borderColor: val.color }
                      : {}
                  }
                >
                  <span>{val.icon}</span>
                  <span>{val.label}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* When */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            When
          </label>
          <div className="flex gap-2">
            {[
              { key: "now", label: "Right Now" },
              { key: "30min", label: "In 30 min" },
              { key: "1hr", label: "In 1 hour" },
              { key: "custom", label: "Pick time" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStartsAt(opt.key)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  startsAt === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 hover:bg-secondary text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {startsAt === "custom" && (
            <Input
              type="datetime-local"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="mt-2 h-10"
            />
          )}
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Where
          </label>
          <Input
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Main Quad, Green Library"
            className="h-10 border-0 bg-secondary/50 rounded-xl px-4 text-sm mb-2"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickingLocation(!pickingLocation)}
            className="text-xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {pickingLocation ? "Hide map" : "Pick on map"}
          </Button>
          {pickingLocation && (
            <div ref={mapRef} className="w-full h-[180px] rounded-xl mt-2 border border-border overflow-hidden" />
          )}
        </div>

        {/* Vibe */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Vibe (optional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {VIBE_OPTIONS.map((v) => (
              <button
                key={v}
                onClick={() => setVibe(vibe === v ? "" : v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                  vibe === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 hover:bg-secondary"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Max attendees */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Max attendees (optional)
          </label>
          <Input
            type="number"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            placeholder="No limit"
            className="h-10 border-0 bg-secondary/50 rounded-xl px-4 text-sm w-32"
          />
        </div>
      </div>

      {/* Create button */}
      <div className="p-4 pt-2 border-t border-border/40">
        <Button
          onClick={handleCreate}
          disabled={!title.trim() || creating}
          className="w-full h-12 text-base font-bold rounded-xl bg-primary hover:bg-primary/90"
        >
          {creating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating...
            </span>
          ) : startsAt === "now" ? (
            "Drop it on the map!"
          ) : (
            "Create Event"
          )}
        </Button>
      </div>
    </div>
  );
}
