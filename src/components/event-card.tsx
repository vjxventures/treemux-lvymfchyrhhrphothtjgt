"use client";

import { getCategoryInfo, formatEventTime } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock } from "lucide-react";

interface EventData {
  id: string;
  title: string;
  description: string;
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
}

interface EventCardProps {
  event: never;
  onClick: () => void;
}

export function EventCard({ event: rawEvent, onClick }: EventCardProps) {
  const event = rawEvent as unknown as EventData;
  const cat = getCategoryInfo(event.category);
  const isLive = event.status === "live";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] border ${
        isLive
          ? "bg-live/5 border-live/20 hover:border-live/40"
          : "bg-card border-border/50 hover:border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${cat.color}20` }}
        >
          {cat.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{event.title}</h3>
            {isLive && (
              <Badge className="shrink-0 text-[9px] font-semibold bg-live/20 text-live border-live/30 px-1.5 py-0 gap-0.5">
                <span className="w-1 h-1 rounded-full bg-live animate-pulse" />
                LIVE
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatEventTime(event.starts_at)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {event.location_name}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Users className="w-3 h-3" />
              {event.attendee_count}
            </span>
          </div>

          {event.vibe && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {event.vibe.split(",").slice(0, 3).map((v) => (
                <span
                  key={v}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                >
                  {v.trim()}
                </span>
              ))}
            </div>
          )}

          {event.community_name && (
            <div className="mt-2 text-[10px] text-muted-foreground">
              via <span className="text-foreground font-medium">{event.community_name}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
