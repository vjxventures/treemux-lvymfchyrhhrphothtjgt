export interface User {
  id: string;
  name: string;
  email: string;
  campus: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string;
  creator_id: string;
  lat: number;
  lng: number;
  location_name: string | null;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  campus: string;
  is_active: number;
  vibe: string | null;
  created_at: string;
  // Computed
  attendee_count?: number;
  is_happening_now?: boolean;
  creator_name?: string;
  user_rsvp?: string | null;
}

export interface Message {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  campus: string;
  creator_id: string;
  avatar_url: string | null;
  created_at: string;
  member_count?: number;
}

export interface Rsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export type EventCategory =
  | "social"
  | "sports"
  | "study"
  | "music"
  | "food"
  | "wellness"
  | "gaming"
  | "entertainment"
  | "party"
  | "other";

export const CATEGORY_CONFIG: Record<EventCategory, { label: string; icon: string; color: string }> = {
  social: { label: "Social", icon: "🤝", color: "#f59e0b" },
  sports: { label: "Sports", icon: "🏀", color: "#10b981" },
  study: { label: "Study", icon: "📚", color: "#6366f1" },
  music: { label: "Music", icon: "🎵", color: "#ec4899" },
  food: { label: "Food", icon: "🍕", color: "#f97316" },
  wellness: { label: "Wellness", icon: "🧘", color: "#14b8a6" },
  gaming: { label: "Gaming", icon: "🎮", color: "#8b5cf6" },
  entertainment: { label: "Entertainment", icon: "🎬", color: "#ef4444" },
  party: { label: "Party", icon: "🎉", color: "#f43f5e" },
  other: { label: "Other", icon: "✨", color: "#64748b" },
};

export const VIBE_OPTIONS = ["chill", "hype", "active", "creative", "social", "study"] as const;
