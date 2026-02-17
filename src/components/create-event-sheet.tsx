"use client";

import { useState } from "react";
import { createEvent } from "@/lib/actions";
import { useAppStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/categories";
import type { User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, MapPin } from "lucide-react";

interface CreateEventSheetProps {
  user: User;
  onCreated: () => void;
}

export function CreateEventSheet({ user, onCreated }: CreateEventSheetProps) {
  const { setShowCreateEvent, createEventLocation, setCreateEventLocation, mapCenter } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("social");

  const defaultLat = createEventLocation?.[0] || mapCenter[0] + (Math.random() - 0.5) * 0.005;
  const defaultLng = createEventLocation?.[1] || mapCenter[1] + (Math.random() - 0.5) * 0.005;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await createEvent({
      title: form.get("title") as string,
      description: form.get("description") as string,
      category,
      lat: defaultLat,
      lng: defaultLng,
      location_name: form.get("location_name") as string,
      starts_at: new Date(form.get("starts_at") as string).toISOString(),
      ends_at: form.get("ends_at") ? new Date(form.get("ends_at") as string).toISOString() : undefined,
      vibe: form.get("vibe") as string,
      max_attendees: form.get("max_attendees") ? parseInt(form.get("max_attendees") as string) : undefined,
    });

    setLoading(false);
    if (!("error" in result)) {
      setShowCreateEvent(false);
      setCreateEventLocation(null);
      onCreated();
    }
  }

  function close() {
    setShowCreateEvent(false);
    setCreateEventLocation(null);
  }

  // Default start time: nearest future 30min block
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
  const defaultStart = now.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={close}>
      <div
        className="w-full max-w-lg bg-card rounded-t-3xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-bricolage)" }}>
            Create Event
          </h2>
          <button onClick={close} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              What&apos;s happening?
            </label>
            <Input
              name="title"
              placeholder="Rooftop hangout, pickup basketball, study session..."
              required
              className="mt-1 bg-secondary/50 border-border/50 h-12 text-base"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`p-2 rounded-xl text-center transition-all border ${
                    category === key
                      ? "bg-primary/20 border-primary text-foreground"
                      : "bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-lg block">{cat.emoji}</span>
                  <span className="text-[10px] font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea
              name="description"
              placeholder="Tell people what to expect..."
              rows={3}
              className="mt-1 bg-secondary/50 border-border/50 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <MapPin className="w-3 h-3 inline mr-1" />
              Location name
            </label>
            <Input
              name="location_name"
              placeholder="Building name, room number..."
              required
              className="mt-1 bg-secondary/50 border-border/50"
            />
            {createEventLocation && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Pin placed at {createEventLocation[0].toFixed(4)}, {createEventLocation[1].toFixed(4)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Starts at</label>
              <Input
                name="starts_at"
                type="datetime-local"
                defaultValue={defaultStart}
                required
                className="mt-1 bg-secondary/50 border-border/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ends at <span className="text-muted-foreground">(optional)</span></label>
              <Input
                name="ends_at"
                type="datetime-local"
                className="mt-1 bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vibe</label>
              <Input
                name="vibe"
                placeholder="chill, loud, cozy..."
                className="mt-1 bg-secondary/50 border-border/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max people</label>
              <Input
                name="max_attendees"
                type="number"
                placeholder="No limit"
                min={2}
                className="mt-1 bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </div>
    </div>
  );
}
