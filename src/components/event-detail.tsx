"use client";

import { useState, useEffect, useRef } from "react";
import { format, isPast, isFuture, differenceInMinutes } from "date-fns";
import { CATEGORY_CONFIG, type Event, type EventCategory, type Message } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EventDetailProps {
  event: Event;
  onClose: () => void;
  onRsvp: () => void;
  isLoggedIn: boolean;
}

interface Attendee {
  id: string;
  name: string;
  avatar_url: string | null;
}

export function EventDetail({ event, onClose, onRsvp, isLoggedIn }: EventDetailProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cat = CATEGORY_CONFIG[event.category as EventCategory] || CATEGORY_CONFIG.other;
  const isNow = !!event.is_happening_now;
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;

  useEffect(() => {
    fetch(`/api/events/${event.id}`)
      .then((r) => r.json())
      .then((data) => {
        setAttendees(data.attendees || []);
      });
    fetch(`/api/events/${event.id}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []));
  }, [event.id]);

  // Poll for new messages when chat is open
  useEffect(() => {
    if (!showChat) return;
    const interval = setInterval(() => {
      fetch(`/api/events/${event.id}/messages`)
        .then((r) => r.json())
        .then((data) => setMessages(data.messages || []));
    }, 3000);
    return () => clearInterval(interval);
  }, [event.id, showChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/events/${event.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } finally {
      setSending(false);
    }
  };

  function getTimeDisplay() {
    if (isNow) {
      if (end) {
        const minsLeft = differenceInMinutes(end, new Date());
        if (minsLeft <= 30) return `Ending in ${minsLeft} min`;
        return `Live now - ends ${format(end, "h:mm a")}`;
      }
      return "Happening now";
    }
    if (isFuture(start)) {
      const minsUntil = differenceInMinutes(start, new Date());
      if (minsUntil <= 60) return `Starting in ${minsUntil} min`;
      return format(start, "EEEE, h:mm a");
    }
    return format(start, "EEEE, h:mm a");
  }

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {isNow && (
          <Badge className="bg-green-500/15 text-green-600 border-green-500/30 font-semibold animate-pulse">
            LIVE NOW
          </Badge>
        )}
        {!isNow && isFuture(start) && (
          <Badge variant="secondary" className="font-medium">
            Upcoming
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {/* Category + Title */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: cat.color + "15", border: `2px solid ${cat.color}40` }}
          >
            {cat.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">{event.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              by {event.creator_name || "Unknown"}
            </p>
          </div>
        </div>

        {/* Key info pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className={`text-xs font-semibold ${isNow ? "text-green-600" : ""}`}>
              {getTimeDisplay()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-xs font-medium">
              {event.location_name || "On campus"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-xs font-medium">
              {event.attendee_count || 0} going
              {event.max_attendees ? ` / ${event.max_attendees}` : ""}
            </span>
          </div>

          {event.vibe && (
            <Badge variant="outline" className="text-xs capitalize">
              {event.vibe} vibe
            </Badge>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            {event.description}
          </p>
        )}

        {/* RSVP Button */}
        <Button
          onClick={onRsvp}
          className="w-full h-12 text-base font-bold rounded-xl mb-4"
          style={
            event.user_rsvp
              ? { background: cat.color + "20", color: cat.color, border: `2px solid ${cat.color}40` }
              : { background: cat.color, color: "white" }
          }
          variant={event.user_rsvp ? "outline" : "default"}
          disabled={!isLoggedIn}
        >
          {!isLoggedIn
            ? "Sign in to RSVP"
            : event.user_rsvp
              ? "You're going! (tap to cancel)"
              : isNow
                ? "I'm on my way!"
                : "I'm going!"
          }
        </Button>

        {/* Attendees */}
        {attendees.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Who&apos;s going
            </h4>
            <div className="flex flex-wrap gap-2">
              {attendees.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-2.5 py-1"
                >
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ background: `hsl(${a.name.length * 40}, 60%, 70%)` }}
                  />
                  <span className="text-xs font-medium">{a.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-4" />

        {/* Chat Section */}
        <div>
          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center justify-between w-full mb-3"
          >
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              Event Chat
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4">
                  {messages.length}
                </Badge>
              )}
            </h4>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-muted-foreground transition-transform ${showChat ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showChat && (
            <div className="bg-secondary/30 rounded-xl border border-border/40 overflow-hidden">
              <ScrollArea className="h-[200px] p-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex gap-2">
                        <div
                          className="w-6 h-6 rounded-full shrink-0 mt-0.5"
                          style={{ background: `hsl(${(msg.user_name || "").length * 40}, 60%, 70%)` }}
                        />
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-semibold">
                              {msg.user_name?.split(" ")[0] || "Anon"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(msg.created_at), "h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {isLoggedIn && (
                <div className="flex gap-2 p-2 border-t border-border/40">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Say something..."
                    className="h-8 text-sm bg-background"
                  />
                  <Button
                    size="sm"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="h-8 px-3"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
