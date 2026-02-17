import { create } from "zustand";

export type ViewMode = "map" | "list";
export type AppTab = "discover" | "communities" | "chat" | "profile";

interface AppState {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;
  categoryFilter: string | null;
  setCategoryFilter: (cat: string | null) => void;
  showCreateEvent: boolean;
  setShowCreateEvent: (show: boolean) => void;
  showCreateCommunity: boolean;
  setShowCreateCommunity: (show: boolean) => void;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
  createEventLocation: [number, number] | null;
  setCreateEventLocation: (loc: [number, number] | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: "discover",
  setCurrentTab: (tab) => set({ currentTab: tab }),
  viewMode: "map",
  setViewMode: (mode) => set({ viewMode: mode }),
  selectedEventId: null,
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  // Default to a central campus location (MIT area as demo)
  mapCenter: [42.3601, -71.0942],
  setMapCenter: (center) => set({ mapCenter: center }),
  mapZoom: 15,
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  categoryFilter: null,
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),
  showCreateEvent: false,
  setShowCreateEvent: (show) => set({ showCreateEvent: show }),
  showCreateCommunity: false,
  setShowCreateCommunity: (show) => set({ showCreateCommunity: show }),
  selectedConversationId: null,
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  createEventLocation: null,
  setCreateEventLocation: (loc) => set({ createEventLocation: loc }),
}));
