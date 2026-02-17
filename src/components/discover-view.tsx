"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import type { User } from "@/lib/auth";
import { getCategoryInfo, CATEGORIES, type Category } from "@/lib/categories";
import { EventMap } from "./event-map";
import { EventCard } from "./event-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Map, List, Search, X } from "lucide-react";
import { Input } from "./ui/input";

interface EventData {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  location_name: string;
  starts_at: string;
  ends_at?: string;
  status: string;
  creator_name: string;
  creator_avatar: string;
  attendee_count: number;
  community_name?: string;
  vibe: string;
  description: string;
}

interface DiscoverViewProps {
  events: never[];
  user: User;
}

export function DiscoverView({ events, user }: DiscoverViewProps) {
  const {
    viewMode, setViewMode, categoryFilter, setCategoryFilter,
    setShowCreateEvent, setSelectedEventId,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const typedEvents = events as unknown as EventData[];

  const filteredEvents = useMemo(() => {
    let result = typedEvents;
    if (categoryFilter) {
      result = result.filter((e) => e.category === categoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location_name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [typedEvents, categoryFilter, searchQuery]);

  const liveCount = filteredEvents.filter((e) => e.status === "live").length;

  return (
    <div className="h-full flex flex-col relative">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pb-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            {showSearch ? (
              <div className="flex items-center gap-2 bg-card/90 backdrop-blur-xl rounded-xl border border-border/50 px-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="border-0 bg-transparent focus-visible:ring-0 h-10 px-0"
                  autoFocus
                />
                <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-bricolage)" }}>
                  miggoo
                </h1>
                <Badge variant="outline" className="text-[10px] font-medium border-border/50 bg-card/60 backdrop-blur">
                  {user.campus}
                </Badge>
                {liveCount > 0 && (
                  <Badge className="text-[10px] font-semibold bg-live/20 text-live border-live/30 gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                    {liveCount} live
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {!showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl bg-card/60 backdrop-blur border border-border/50"
                onClick={() => setShowSearch(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-xl border border-border/50 ${
                viewMode === "map" ? "bg-primary/20 text-primary" : "bg-card/60 backdrop-blur"
              }`}
              onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
            >
              {viewMode === "map" ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              !categoryFilter
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/60 backdrop-blur text-muted-foreground border-border/50 hover:text-foreground"
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1 ${
                categoryFilter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/60 backdrop-blur text-muted-foreground border-border/50 hover:text-foreground"
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === "map" ? (
        <EventMap events={filteredEvents as never[]} />
      ) : (
        <div className="h-full pt-28">
          <ScrollArea className="h-full">
            <div className="p-4 pt-2 space-y-3 pb-8">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <p className="text-lg font-medium">No events found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or create one!</p>
                </div>
              ) : (
                filteredEvents.map((event, i) => (
                  <div
                    key={event.id}
                    className="animate-float-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <EventCard
                      event={event as never}
                      onClick={() => setSelectedEventId(event.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreateEvent(true)}
        className="absolute bottom-6 right-4 z-[1000] w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
