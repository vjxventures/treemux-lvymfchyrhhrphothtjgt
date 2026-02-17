'use client';

import { useAppStore } from '@/store/app-store';
import { EVENT_CATEGORIES } from '@/types';
import type { EventCategory } from '@/types';
import EventCard from './EventCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap } from 'lucide-react';

export default function EventList() {
  const { events, eventFilter, setEventFilter, loadingEvents } = useAppStore();

  const activeEvents = events.filter(e => e.is_active);
  const upcomingEvents = events.filter(e => !e.is_active);

  return (
    <div className="flex flex-col h-full">
      {/* Filter chips */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setEventFilter('all')}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0
              ${eventFilter === 'all'
                ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/40'
                : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] border border-white/[0.06]'
              }
            `}
          >
            All Events
          </button>
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setEventFilter(cat.value as EventCategory)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0
                ${eventFilter === cat.value
                  ? 'text-white'
                  : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] border border-white/[0.06]'
                }
              `}
              style={eventFilter === cat.value ? {
                backgroundColor: `${cat.color}25`,
                color: cat.color,
                border: `1px solid ${cat.color}50`,
              } : {}}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loadingEvents ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-2xl mb-2">🗺️</div>
              <p className="text-muted-foreground text-sm">No events right now</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Be the first to create one!</p>
            </div>
          ) : (
            <>
              {/* Active NOW */}
              {activeEvents.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Zap className="w-3.5 h-3.5 text-neon-green" />
                    <span className="text-xs font-semibold text-neon-green uppercase tracking-wider">
                      Happening Now
                    </span>
                    <span className="text-[10px] text-neon-green/60 bg-neon-green/10 px-2 py-0.5 rounded-full">
                      {activeEvents.length}
                    </span>
                  </div>
                  {activeEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              )}

              {/* Upcoming */}
              {upcomingEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-xs font-semibold text-neon-cyan uppercase tracking-wider">
                      Coming Up
                    </span>
                    <span className="text-[10px] text-neon-cyan/60 bg-neon-cyan/10 px-2 py-0.5 rounded-full">
                      {upcomingEvents.length}
                    </span>
                  </div>
                  {upcomingEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i + activeEvents.length} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
