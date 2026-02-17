'use client';

import { Badge } from '@/components/ui/badge';
import { EVENT_CATEGORIES } from '@/types';
import type { Event } from '@/types';
import { getTimeLabel } from '@/lib/scoring';
import { MapPin, Users, Clock } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

export default function EventCard({ event, index = 0 }: { event: Event; index?: number }) {
  const { fetchEventDetail, trackEvent } = useAppStore();
  const catInfo = EVENT_CATEGORIES.find(c => c.value === event.category);
  const timeLabel = getTimeLabel(event.starts_at, event.ends_at);
  const isActive = event.is_active;

  return (
    <button
      onClick={() => {
        fetchEventDetail(event.id);
        trackEvent('event_viewed', { event_id: event.id, source: 'list' });
      }}
      className="w-full text-left group animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`
        relative p-4 rounded-xl border transition-all duration-200
        ${isActive
          ? 'border-neon-green/30 bg-neon-green/[0.03] hover:bg-neon-green/[0.06]'
          : 'border-white/[0.06] bg-surface-card hover:bg-surface-elevated'
        }
      `}>
        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
            </span>
            <span className="text-[11px] font-semibold text-neon-green uppercase tracking-wider">Live</span>
          </div>
        )}

        {/* Category + Time */}
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="secondary"
            className="text-[11px] px-2 py-0.5 font-medium"
            style={{
              backgroundColor: `${catInfo?.color}18`,
              color: catInfo?.color,
              border: `1px solid ${catInfo?.color}30`,
            }}
          >
            {catInfo?.emoji} {catInfo?.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[15px] text-foreground group-hover:text-white transition-colors mb-1 pr-16">
          {event.title}
        </h3>

        {/* Location + Attendees */}
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.location_name}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Users className="w-3 h-3" />
            {event.attendee_count}{event.max_attendees ? `/${event.max_attendees}` : ''}
          </span>
        </div>

        {/* Community tag */}
        {event.community_name && (
          <div className="mt-2 text-[11px] text-neon-purple font-medium">
            {event.community_name}
          </div>
        )}
      </div>
    </button>
  );
}
