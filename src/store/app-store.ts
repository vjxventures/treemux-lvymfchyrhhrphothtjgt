'use client';

import { create } from 'zustand';
import type { Event, Community, ChatMessage, Connection, EventCategory } from '@/types';

interface AppState {
  // User
  currentUserId: string;
  currentCampusId: string;

  // Events
  events: Event[];
  selectedEvent: (Event & { attendees?: Array<{ user_id: string; name: string; avatar_url: string | null; status: string }> }) | null;
  eventFilter: EventCategory | 'all';
  loadingEvents: boolean;

  // Communities
  communities: Community[];
  loadingCommunities: boolean;

  // Chat
  chatMessages: ChatMessage[];
  loadingChat: boolean;

  // Connections
  connections: Connection[];

  // UI State
  activePanel: 'map' | 'events' | 'communities' | 'connections' | 'profile';
  showEventCreate: boolean;
  showCommunityCreate: boolean;
  showEventDetail: boolean;
  mapCenter: { lat: number; lng: number };

  // Actions
  setCurrentUser: (id: string) => void;
  setEventFilter: (filter: EventCategory | 'all') => void;
  setActivePanel: (panel: AppState['activePanel']) => void;
  setShowEventCreate: (show: boolean) => void;
  setShowCommunityCreate: (show: boolean) => void;
  setShowEventDetail: (show: boolean) => void;
  setSelectedEvent: (event: Event | null) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;

  // Async
  fetchEvents: () => Promise<void>;
  fetchCommunities: () => Promise<void>;
  fetchEventDetail: (id: string) => Promise<void>;
  fetchChat: (eventId: string) => Promise<void>;
  sendMessage: (eventId: string, content: string) => Promise<void>;
  createEvent: (data: Partial<Event>) => Promise<void>;
  createCommunity: (data: Partial<Community>) => Promise<void>;
  attendEvent: (eventId: string, status: string) => Promise<void>;
  leaveEvent: (eventId: string) => Promise<void>;
  joinCommunity: (communityId: string) => Promise<void>;
  fetchConnections: () => Promise<void>;
  sendConnection: (targetUserId: string) => Promise<void>;
  acceptConnection: (connectionId: string) => Promise<void>;
  trackEvent: (eventType: string, properties?: Record<string, unknown>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUserId: 'user-demo',
  currentCampusId: 'campus-mit',
  events: [],
  selectedEvent: null,
  eventFilter: 'all',
  loadingEvents: false,
  communities: [],
  loadingCommunities: false,
  chatMessages: [],
  loadingChat: false,
  connections: [],
  activePanel: 'map',
  showEventCreate: false,
  showCommunityCreate: false,
  showEventDetail: false,
  mapCenter: { lat: 42.3601, lng: -71.0942 },

  setCurrentUser: (id) => set({ currentUserId: id }),
  setEventFilter: (filter) => { set({ eventFilter: filter }); get().fetchEvents(); },
  setActivePanel: (panel) => set({ activePanel: panel }),
  setShowEventCreate: (show) => set({ showEventCreate: show }),
  setShowCommunityCreate: (show) => set({ showCommunityCreate: show }),
  setShowEventDetail: (show) => set({ showEventDetail: show }),
  setSelectedEvent: (event) => set({ selectedEvent: event as AppState['selectedEvent'] }),
  setMapCenter: (center) => set({ mapCenter: center }),

  fetchEvents: async () => {
    set({ loadingEvents: true });
    try {
      const { currentCampusId, eventFilter } = get();
      const params = new URLSearchParams({ campus_id: currentCampusId });
      if (eventFilter !== 'all') params.set('category', eventFilter);
      const res = await fetch(`/api/events?${params}`);
      const events = await res.json();
      set({ events, loadingEvents: false });
    } catch {
      set({ loadingEvents: false });
    }
  },

  fetchCommunities: async () => {
    set({ loadingCommunities: true });
    try {
      const { currentCampusId } = get();
      const res = await fetch(`/api/communities?campus_id=${currentCampusId}`);
      const communities = await res.json();
      set({ communities, loadingCommunities: false });
    } catch {
      set({ loadingCommunities: false });
    }
  },

  fetchEventDetail: async (id) => {
    try {
      const res = await fetch(`/api/events/${id}`);
      const event = await res.json();
      set({ selectedEvent: event, showEventDetail: true });
    } catch { /* ignore */ }
  },

  fetchChat: async (eventId) => {
    set({ loadingChat: true });
    try {
      const res = await fetch(`/api/events/${eventId}/chat`);
      const messages = await res.json();
      set({ chatMessages: messages, loadingChat: false });
    } catch {
      set({ loadingChat: false });
    }
  },

  sendMessage: async (eventId, content) => {
    const { currentUserId } = get();
    try {
      const res = await fetch(`/api/events/${eventId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, content }),
      });
      const message = await res.json();
      set((state) => ({ chatMessages: [...state.chatMessages, message] }));
    } catch { /* ignore */ }
  },

  createEvent: async (data) => {
    const { currentUserId, currentCampusId } = get();
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, creator_id: currentUserId, campus_id: currentCampusId }),
      });
      set({ showEventCreate: false });
      get().fetchEvents();
      get().trackEvent('event_created', { category: data.category });
    } catch { /* ignore */ }
  },

  createCommunity: async (data) => {
    const { currentUserId, currentCampusId } = get();
    try {
      await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, creator_id: currentUserId, campus_id: currentCampusId }),
      });
      set({ showCommunityCreate: false });
      get().fetchCommunities();
    } catch { /* ignore */ }
  },

  attendEvent: async (eventId, status) => {
    const { currentUserId } = get();
    await fetch(`/api/events/${eventId}/attend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUserId, status }),
    });
    get().fetchEventDetail(eventId);
    get().fetchEvents();
    get().trackEvent('event_attended', { event_id: eventId, status });
  },

  leaveEvent: async (eventId) => {
    const { currentUserId } = get();
    await fetch(`/api/events/${eventId}/attend?user_id=${currentUserId}`, { method: 'DELETE' });
    get().fetchEventDetail(eventId);
    get().fetchEvents();
  },

  joinCommunity: async (communityId) => {
    const { currentUserId } = get();
    await fetch(`/api/communities/${communityId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUserId }),
    });
    get().fetchCommunities();
  },

  fetchConnections: async () => {
    const { currentUserId } = get();
    const res = await fetch(`/api/connections?user_id=${currentUserId}`);
    const connections = await res.json();
    set({ connections });
  },

  sendConnection: async (targetUserId) => {
    const { currentUserId } = get();
    await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUserId, connected_user_id: targetUserId }),
    });
    get().fetchConnections();
  },

  acceptConnection: async (connectionId) => {
    await fetch(`/api/connections/${connectionId}/accept`, { method: 'POST' });
    get().fetchConnections();
  },

  trackEvent: (eventType, properties = {}) => {
    const { currentUserId } = get();
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUserId, event_type: eventType, properties }),
    }).catch(() => {});
  },
}));
