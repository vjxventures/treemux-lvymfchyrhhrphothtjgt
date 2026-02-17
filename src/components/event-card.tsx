"use client";

import { formatDistanceToNow, format, isPast, isFuture, differenceInMinutes } from "date-fns";
import { CATEGORY_CONFIG, type Event, type EventCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  event: Event;
  onSelect: (event: Event) => void;
  compact?: boolean;
}

function getTimeLabel(event: Event): { text: string; urgent: boolean } {
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;
  const now = new Date();

  if (isPast(start) && (!end || isFuture(end))) {
    if (end) {
      const minsLeft = differenceInMinutes(end, now);
      if (minsLeft <= 30) {
        return { text: `Ending in ${minsLeft}m`, urgent: true };
      }
    }
    return { text: "Happening Now", urgent: false };
  }

  if (isFuture(start)) {
    const minsUntil = differenceInMinutes(start, now);
    if (minsUntil <= 60) {
      return { text: `Starts in ${minsUntil}m`, urgent: false };
    }
    return { text: `Today at ${format(start, "h:mm a")}`, urgent: false };
  }

  return { text: formatDistanceToNow(start, { addSuffix: true }), urgent: false };
}

export function EventCard({ event, onSelect, compact }: EventCardProps) {
  const cat = CATEGORY_CONFIG[event.category as EventCategory] || CATEGORY_CONFIG.other;
  const timeLabel = getTimeLabel(event);
  const isNow = !!event.is_happening_now;

  if (compact) {
    return (
      <button
        onClick={() => onSelect(event)}
        className="flex items-center gap-3 w-full text-left p-3 rounded-xl hover:bg-accent/60 transition-colors group"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{ background: cat.color + "20", border: `2px solid ${cat.color}` }}
        >
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{event.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {event.location_name || "Nearby"}
          </p>
        </div>
        <div className="text-right shrink-0">
          {isNow && (
            <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-[10px] px-1.5 py-0">
              LIVE
            </Badge>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {event.attendee_count || 0} going
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onSelect(event)}
      className="w-full text-left group"
    >
      <div className="relative bg-card rounded-2xl border border-border/60 p-4 hover:border-primary/30 hover:shadow-lg transition-all duration-200">
        {/* Live indicator */}
        {isNow && (
          <div className="absolute -top-1.5 -right-1.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: cat.color + "15", border: `2px solid ${cat.color}40` }}
          >
            {cat.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[15px] leading-tight group-hover:text-primary transition-colors">
              {event.title}
            </h3>

            {event.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {event.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <Badge
                variant="secondary"
                className="text-[11px] font-medium"
                style={{ color: cat.color, background: cat.color + "12" }}
              >
                {cat.label}
              </Badge>

              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {event.location_name || "Nearby"}
              </span>

              <span className={`text-xs font-medium ${timeLabel.urgent ? "text-red-500" : isNow ? "text-green-600" : "text-muted-foreground"}`}>
                {timeLabel.text}
              </span>
            </div>
          </div>
        </div>

        {/* Social proof bar */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            {/* Stacked avatars placeholder */}
            <div className="flex -space-x-1.5">
              {Array.from({ length: Math.min(event.attendee_count || 0, 4) }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-card"
                  style={{
                    background: `hsl(${(i * 60 + 200) % 360}, 60%, 70%)`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {event.attendee_count || 0} going
            </span>
          </div>

          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10">
            View
          </Button>
        </div>
      </div>
    </button>
  );
}
