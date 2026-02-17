"use client";

import { useEffect, useState } from "react";
import { getEvent, joinEvent, leaveEvent, reportEvent } from "@/lib/actions";
import { getCategoryInfo, formatEventTime } from "@/lib/categories";
import type { User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MapPin, Users, Clock, Flag, UserPlus, Check } from "lucide-react";

interface EventDetailProps {
  eventId: string;
  user: User;
  onBack: () => void;
  onRefresh: () => void;
}

interface EventFull {
  id: string;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  location_name: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  attendee_count: number;
  community_name: string | null;
  max_attendees: number | null;
  vibe: string;
  campus: string;
}

interface Attendee {
  id: string;
  name: string;
  avatar_url: string;
  status: string;
}

interface EventResult {
  event: EventFull;
  attendees: Attendee[];
}

export function EventDetail({ eventId, user, onBack, onRefresh }: EventDetailProps) {
  const [eventData, setEventData] = useState<EventResult | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getEvent(eventId);
      const typed = data as unknown as EventResult;
      setEventData(typed);
      setIsJoined(typed.attendees.some((a) => a.id === user.id));
      setLoading(false);
    }
    load();
  }, [eventId, user.id]);

  if (loading || !eventData?.event) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const event = eventData.event;
  const attendees = eventData.attendees;
  const cat = getCategoryInfo(event.category);
  const isLive = event.status === "live";
  const isCreator = event.creator_id === user.id;

  async function handleJoin() {
    if (isJoined) {
      await leaveEvent(eventId);
      setIsJoined(false);
    } else {
      await joinEvent(eventId);
      setIsJoined(true);
    }
    onRefresh();
    const data = await getEvent(eventId);
    setEventData(data as unknown as EventResult);
  }

  async function handleReport() {
    const reason = prompt("Why are you reporting this event?");
    if (reason) {
      await reportEvent(eventId, reason);
      alert("Report submitted. Thank you.");
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-sm truncate">{event.title}</h2>
          <span className="text-xs text-muted-foreground">{cat.label}</span>
        </div>
        {isLive && (
          <Badge className="text-[10px] font-semibold bg-live/20 text-live border-live/30 gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
            LIVE
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Hero section */}
          <div
            className="rounded-2xl p-6 flex items-center justify-center text-6xl"
            style={{ background: `linear-gradient(135deg, ${cat.color}15, ${cat.color}05)` }}
          >
            {cat.emoji}
          </div>

          {/* Title & description */}
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-bricolage)" }}>
              {event.title}
            </h1>
            {event.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-card border border-border/50 p-3">
              <Clock className="w-4 h-4 text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">When</p>
              <p className="text-sm font-medium">{formatEventTime(event.starts_at)}</p>
            </div>
            <div className="rounded-xl bg-card border border-border/50 p-3">
              <MapPin className="w-4 h-4 text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Where</p>
              <p className="text-sm font-medium">{event.location_name}</p>
            </div>
          </div>

          {/* Vibe tags */}
          {event.vibe && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Vibe</p>
              <div className="flex gap-1.5 flex-wrap">
                {event.vibe.split(",").map((v) => (
                  <span key={v} className="text-xs px-3 py-1 rounded-full bg-secondary text-foreground font-medium">
                    {v.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Created by */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
            <Avatar className="w-10 h-10">
              <AvatarImage src={event.creator_avatar} />
              <AvatarFallback>{event.creator_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{event.creator_name}</p>
              <p className="text-xs text-muted-foreground">Organizer</p>
            </div>
            {event.community_name && (
              <Badge variant="outline" className="ml-auto text-[10px]">
                {event.community_name}
              </Badge>
            )}
          </div>

          {/* Attendees */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {attendees.length} going
                {event.max_attendees && (
                  <span className="text-muted-foreground">/ {event.max_attendees} max</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 bg-secondary rounded-full pl-1 pr-3 py-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={a.avatar_url} />
                    <AvatarFallback className="text-[10px]">{a.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{a.name.split(" ")[0]}</span>
                  {a.status === "checked_in" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-live" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Report button */}
          {!isCreator && (
            <button
              onClick={handleReport}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Flag className="w-3 h-3" />
              Report this event
            </button>
          )}
        </div>
      </ScrollArea>

      {/* Bottom action */}
      <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-xl">
        <Button
          onClick={handleJoin}
          className={`w-full h-12 text-base font-semibold rounded-xl ${
            isJoined
              ? "bg-secondary text-foreground hover:bg-secondary/80"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {isJoined ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Going
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              Join Event
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
