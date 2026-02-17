"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import type { User } from "@/lib/auth";
import { BottomNav } from "./bottom-nav";
import { DiscoverView } from "./discover-view";
import { CommunitiesView } from "./communities-view";
import { ChatView } from "./chat-view";
import { ProfileView } from "./profile-view";
import { EventDetail } from "./event-detail";
import { CreateEventSheet } from "./create-event-sheet";
import { CreateCommunitySheet } from "./create-community-sheet";

interface AppShellProps {
  user: User;
  initialEvents: never[];
  initialCommunities: never[];
  initialConversations: never[];
  initialConnections: never[];
}

export function AppShell({
  user,
  initialEvents,
  initialCommunities,
  initialConversations,
  initialConnections,
}: AppShellProps) {
  const { currentTab, selectedEventId, setSelectedEventId, showCreateEvent, showCreateCommunity } = useAppStore();
  const [events, setEvents] = useState(initialEvents);
  const [communities, setCommunities] = useState(initialCommunities);
  const [conversations] = useState(initialConversations);
  const [connections] = useState(initialConnections);

  const refreshEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    setEvents(data);
  }, []);

  const refreshCommunities = useCallback(async () => {
    const res = await fetch("/api/communities");
    const data = await res.json();
    setCommunities(data);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {selectedEventId ? (
          <EventDetail
            eventId={selectedEventId}
            user={user}
            onBack={() => setSelectedEventId(null)}
            onRefresh={refreshEvents}
          />
        ) : (
          <>
            {currentTab === "discover" && (
              <DiscoverView events={events} user={user} />
            )}
            {currentTab === "communities" && (
              <CommunitiesView communities={communities} user={user} onRefresh={refreshCommunities} />
            )}
            {currentTab === "chat" && (
              <ChatView conversations={conversations} user={user} />
            )}
            {currentTab === "profile" && (
              <ProfileView user={user} connections={connections} events={events} />
            )}
          </>
        )}
      </div>

      {/* Bottom navigation */}
      {!selectedEventId && <BottomNav user={user} conversations={conversations} />}

      {/* Sheets */}
      {showCreateEvent && (
        <CreateEventSheet user={user} onCreated={refreshEvents} />
      )}
      {showCreateCommunity && (
        <CreateCommunitySheet user={user} onCreated={refreshCommunities} />
      )}
    </div>
  );
}
