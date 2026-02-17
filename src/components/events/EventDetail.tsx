'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EVENT_CATEGORIES } from '@/types';
import { getTimeLabel } from '@/lib/scoring';
import { MapPin, Users, Clock, X, MessageCircle, UserPlus, Check } from 'lucide-react';
import EventChat from '@/components/chat/EventChat';

export default function EventDetail() {
  const {
    selectedEvent, setShowEventDetail, attendEvent, leaveEvent,
    currentUserId, sendConnection, trackEvent,
  } = useAppStore();
  const [showChat, setShowChat] = useState(false);
  const [isAttending, setIsAttending] = useState(false);

  const event = selectedEvent;

  useEffect(() => {
    if (event?.attendees) {
      setIsAttending(event.attendees.some((a: { user_id: string }) => a.user_id === currentUserId));
    }
  }, [event, currentUserId]);

  if (!event) return null;

  const catInfo = EVENT_CATEGORIES.find(c => c.value === event.category);
  const timeLabel = getTimeLabel(event.starts_at, event.ends_at);
  const isActive = event.is_active;
  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowEventDetail(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] bg-surface-card border border-white/[0.08] rounded-t-2xl sm:rounded-2xl overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="relative p-5 pb-4">
          <button
            onClick={() => setShowEventDetail(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Status + Category */}
          <div className="flex items-center gap-2 mb-3">
            {isActive && (
              <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30 text-[11px] font-semibold">
                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neon-green" />
                </span>
                HAPPENING NOW
              </Badge>
            )}
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
          </div>

          <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="w-4 h-4 text-neon-cyan" />
            <span>{formatTime(startDate)} — {formatTime(endDate)}</span>
            <span className="text-neon-cyan text-xs font-medium">{timeLabel}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-neon-pink" />
            <span>{event.location_name}</span>
          </div>
        </div>

        <Separator className="bg-white/[0.06]" />

        {/* Description */}
        <div className="p-5">
          <p className="text-sm text-foreground/80 leading-relaxed">{event.description}</p>

          {event.community_name && (
            <div className="mt-3 text-xs text-neon-purple font-medium">
              Hosted by {event.community_name}
            </div>
          )}
        </div>

        <Separator className="bg-white/[0.06]" />

        {/* Attendees */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-neon-cyan" />
              Going ({event.attendee_count || 0}{event.max_attendees ? `/${event.max_attendees}` : ''})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {event.attendees?.map((a: { user_id: string; name: string; status: string }) => (
              <div key={a.user_id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-[10px] font-bold text-white">
                  {a.name[0]}
                </div>
                <span className="text-xs text-foreground">{a.name}</span>
                {a.user_id !== currentUserId && (
                  <button
                    onClick={() => { sendConnection(a.user_id); trackEvent('connection_sent', { target: a.user_id }); }}
                    className="p-0.5 hover:text-neon-cyan transition-colors"
                    title="Connect"
                  >
                    <UserPlus className="w-3 h-3 text-muted-foreground hover:text-neon-cyan" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-white/[0.06]" />

        {/* Actions */}
        <div className="p-5 flex gap-3">
          {isAttending ? (
            <Button
              variant="secondary"
              className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-foreground"
              onClick={() => leaveEvent(event.id)}
            >
              <Check className="w-4 h-4 mr-2 text-neon-green" />
              Going
            </Button>
          ) : (
            <Button
              className="flex-1 bg-neon-pink hover:bg-neon-pink/90 text-white font-semibold glow-pink"
              onClick={() => attendEvent(event.id, 'going')}
            >
              I&apos;m Going!
            </Button>
          )}
          <Button
            variant="secondary"
            className="bg-white/[0.06] hover:bg-white/[0.1]"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageCircle className="w-4 h-4 mr-2 text-neon-cyan" />
            Chat
          </Button>
        </div>

        {/* Chat section */}
        {showChat && (
          <div className="border-t border-white/[0.06]">
            <EventChat eventId={event.id} />
          </div>
        )}
      </div>
    </div>
  );
}
