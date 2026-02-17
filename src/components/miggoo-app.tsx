"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { type Event, type EventCategory, CATEGORY_CONFIG } from "@/lib/types";
import { EventCard } from "./event-card";
import { EventDetail } from "./event-detail";
import { CreateEvent } from "./create-event";
import { HappeningBanner } from "./happening-banner";
import { LoginModal } from "./login-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const MapView = dynamic(() => import("./map-view").then((m) => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-secondary/30">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

type ViewMode = "map" | "list";

export function MiggooApp() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ campus: "stanford" });
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  // Initial load
  useEffect(() => {
    fetchEvents();
    // Check if already logged in
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      });
  }, [fetchEvents]);

  // Auto-refresh events every 15s
  useEffect(() => {
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleRsvp = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (!selectedEvent) return;

    const res = await fetch(`/api/events/${selectedEvent.id}/rsvp`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      // Update the selected event
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              user_rsvp: data.status === "removed" ? null : "going",
              attendee_count: data.attendee_count ?? (prev.attendee_count || 0),
            }
          : null
      );
      // Refresh event list
      fetchEvents();
    }
  };

  const handleCreateEvent = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setShowCreateEvent(true);
  };

  const liveCount = events.filter((e) => e.is_happening_now).length;
  const upcomingCount = events.filter((e) => !e.is_happening_now).length;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map layer — always present */}
      <div className="absolute inset-0">
        <MapView
          events={events}
          onEventSelect={(e) => setSelectedEvent(e)}
          selectedEventId={selectedEvent?.id}
        />
      </div>

      {/* Top overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="p-4 space-y-3">
          {/* Logo + user bar */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="text-primary-foreground font-black text-lg">M</span>
              </div>
              <div>
                <h1 className="font-black text-lg leading-none tracking-tight">miggoo</h1>
                <p className="text-[10px] text-muted-foreground font-medium">Stanford Campus</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Live counter */}
              {liveCount > 0 && (
                <div className="flex items-center gap-1.5 bg-green-500/15 backdrop-blur-md rounded-full px-3 py-1.5 border border-green-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-xs font-bold text-green-700">{liveCount} live</span>
                </div>
              )}

              {/* View toggle */}
              <div className="flex bg-card/90 backdrop-blur-md rounded-xl border border-border/60 p-0.5">
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "map" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  List
                </button>
              </div>

              {/* Profile */}
              {user ? (
                <button className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {user.name.charAt(0)}
                  </span>
                </button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLogin(true)}
                  className="h-9 rounded-xl bg-card/90 backdrop-blur-md text-xs font-semibold"
                >
                  Sign in
                </Button>
              )}
            </div>
          </div>

          {/* Category filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide pointer-events-auto">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !categoryFilter
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card/90 backdrop-blur-md text-foreground border border-border/60 hover:bg-card"
              }`}
            >
              All ({events.length})
            </button>
            {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG.social][])
              .filter(([key]) => events.some((e) => e.category === key))
              .map(([key, val]) => {
                const count = events.filter((e) => e.category === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      categoryFilter === key
                        ? "shadow-sm"
                        : "bg-card/90 backdrop-blur-md border border-border/60 hover:bg-card"
                    }`}
                    style={
                      categoryFilter === key
                        ? { background: val.color, color: "white" }
                        : {}
                    }
                  >
                    <span>{val.icon}</span>
                    <span>{val.label}</span>
                    <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Bottom sheet — event list (when in list mode or as peek) */}
      {viewMode === "list" && (
        <div className="absolute bottom-0 left-0 right-0 z-10 max-h-[70vh] bg-card/95 backdrop-blur-xl rounded-t-3xl border-t border-border/60 shadow-2xl overflow-hidden slide-up-enter">
          <div className="p-4 pb-2">
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-lg">Around You</h2>
                <p className="text-xs text-muted-foreground">
                  {liveCount} happening now, {upcomingCount} upcoming
                </p>
              </div>
            </div>

            {/* Happening now banner */}
            <HappeningBanner events={events} onEventSelect={setSelectedEvent} />
          </div>

          <div className="overflow-auto max-h-[50vh] px-4 pb-24 space-y-2.5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-6 w-6 border-4 border-primary/30 border-t-primary rounded-full" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🌙</p>
                <p className="font-semibold text-lg">It&apos;s quiet around here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Be the first to start something!
                </p>
              </div>
            ) : (
              events.map((event) => (
                <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Map mode bottom peek */}
      {viewMode === "map" && events.length > 0 && !selectedEvent && (
        <div className="absolute bottom-24 left-0 right-0 z-10 px-4 pointer-events-none">
          <div className="pointer-events-auto">
            <HappeningBanner events={events} onEventSelect={setSelectedEvent} />
          </div>
        </div>
      )}

      {/* FAB — Create Event */}
      <button
        onClick={handleCreateEvent}
        className="absolute bottom-6 right-4 z-20 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5v14" />
        </svg>
      </button>

      {/* Trending indicator */}
      {events.length > 5 && !selectedEvent && viewMode === "map" && (
        <div className="absolute bottom-6 left-4 z-20">
          <div className="bg-card/90 backdrop-blur-md rounded-2xl border border-border/60 shadow-lg px-4 py-2.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Trending near you
            </p>
            <p className="text-xs font-semibold mt-0.5">
              {events.length} events on campus
            </p>
          </div>
        </div>
      )}

      {/* Event Detail Sheet */}
      <Sheet open={!!selectedEvent && !showCreateEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl max-h-[85vh] p-0 border-t border-border/60"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Event Details</SheetTitle>
          <SheetDescription className="sr-only">View event details, RSVP, and chat</SheetDescription>
          <div className="w-10 h-1 rounded-full bg-border mx-auto mt-3" />
          {selectedEvent && (
            <EventDetail
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onRsvp={handleRsvp}
              isLoggedIn={!!user}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Create Event Sheet */}
      <Sheet open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl max-h-[90vh] p-0 border-t border-border/60"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Create Event</SheetTitle>
          <SheetDescription className="sr-only">Create a new event on campus</SheetDescription>
          <div className="w-10 h-1 rounded-full bg-border mx-auto mt-3" />
          <CreateEvent
            onClose={() => setShowCreateEvent(false)}
            onCreated={fetchEvents}
          />
        </SheetContent>
      </Sheet>

      {/* Login modal */}
      {showLogin && (
        <LoginModal
          onLogin={(u) => {
            setUser(u);
            setShowLogin(false);
            fetchEvents();
          }}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
