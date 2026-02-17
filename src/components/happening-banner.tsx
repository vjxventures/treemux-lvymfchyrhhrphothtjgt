"use client";

import { type Event } from "@/lib/types";

interface HappeningBannerProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
}

export function HappeningBanner({ events, onEventSelect }: HappeningBannerProps) {
  const liveEvents = events.filter((e) => e.is_happening_now);

  if (liveEvents.length === 0) return null;

  return (
    <div className="bg-green-500/10 backdrop-blur-md border border-green-500/20 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
          Happening Now
        </span>
        <span className="text-xs text-green-600 font-semibold ml-auto">
          {liveEvents.length} active
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {liveEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => onEventSelect(event)}
            className="flex-shrink-0 bg-white/80 rounded-xl px-3 py-2 border border-green-500/20 hover:border-green-500/40 transition-all group min-w-0"
          >
            <p className="text-xs font-bold truncate max-w-[160px] group-hover:text-green-700 transition-colors">
              {event.title}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {event.attendee_count || 0} there now
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
