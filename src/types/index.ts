export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  university: string;
  campus_id: string;
  bio: string | null;
  created_at: string;
}

export interface Campus {
  id: string;
  name: string;
  university: string;
  lat: number;
  lng: number;
  radius_km: number;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  creator_name?: string;
  creator_avatar?: string | null;
  community_id: string | null;
  community_name?: string | null;
  campus_id: string;
  category: EventCategory;
  lat: number;
  lng: number;
  location_name: string;
  starts_at: string;
  ends_at: string;
  max_attendees: number | null;
  attendee_count?: number;
  is_active?: boolean;
  score?: number;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  campus_id: string;
  avatar_url: string | null;
  member_count?: number;
  category: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  event_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string | null;
  content: string;
  created_at: string;
}

export interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface EventAttendee {
  event_id: string;
  user_id: string;
  status: 'going' | 'interested';
  joined_at: string;
}

export interface CommunityMember {
  community_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export type EventCategory =
  | 'social'
  | 'sports'
  | 'study'
  | 'party'
  | 'food'
  | 'music'
  | 'art'
  | 'tech'
  | 'club'
  | 'other';

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  properties: string;
  timestamp: string;
}

export const EVENT_CATEGORIES: { value: EventCategory; label: string; emoji: string; color: string }[] = [
  { value: 'social', label: 'Social', emoji: '👋', color: '#FF6B6B' },
  { value: 'sports', label: 'Sports', emoji: '⚽', color: '#4ECDC4' },
  { value: 'study', label: 'Study', emoji: '📚', color: '#45B7D1' },
  { value: 'party', label: 'Party', emoji: '🎉', color: '#F7DC6F' },
  { value: 'food', label: 'Food & Drinks', emoji: '🍕', color: '#E67E22' },
  { value: 'music', label: 'Music', emoji: '🎵', color: '#9B59B6' },
  { value: 'art', label: 'Art & Culture', emoji: '🎨', color: '#1ABC9C' },
  { value: 'tech', label: 'Tech', emoji: '💻', color: '#3498DB' },
  { value: 'club', label: 'Club Meeting', emoji: '🏛️', color: '#E74C3C' },
  { value: 'other', label: 'Other', emoji: '✨', color: '#95A5A6' },
];
