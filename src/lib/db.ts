// In-memory data store (replaces SQLite for serverless deployment)

export interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  university: string;
  campus: string;
  bio: string;
  role: string;
  verified: number;
  created_at: string;
  last_active: string;
}

export interface CommunityRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  campus: string;
  creator_id: string;
  member_count: number;
  created_at: string;
}

export interface CommunityMemberRow {
  community_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface EventRow {
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
  community_id: string | null;
  campus: string;
  max_attendees: number | null;
  vibe: string;
  image_url: string | null;
  created_at: string;
}

export interface EventAttendeeRow {
  event_id: string;
  user_id: string;
  status: string;
  joined_at: string;
}

export interface ConversationRow {
  id: string;
  type: string;
  ref_id: string | null;
  title: string | null;
  created_at: string;
}

export interface ConversationMemberRow {
  conversation_id: string;
  user_id: string;
  last_read: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface ConnectionRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
}

export interface EventReportRow {
  id: string;
  event_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface Store {
  users: Map<string, UserRow>;
  communities: Map<string, CommunityRow>;
  communityMembers: CommunityMemberRow[];
  events: Map<string, EventRow>;
  eventAttendees: EventAttendeeRow[];
  conversations: Map<string, ConversationRow>;
  conversationMembers: ConversationMemberRow[];
  messages: MessageRow[];
  connections: ConnectionRow[];
  eventReports: EventReportRow[];
  seeded: boolean;
}

// Global in-memory store - persists within a warm serverless instance
const store: Store = {
  users: new Map(),
  communities: new Map(),
  communityMembers: [],
  events: new Map(),
  eventAttendees: [],
  conversations: new Map(),
  conversationMembers: [],
  messages: [],
  connections: [],
  eventReports: [],
  seeded: false,
};

export function getStore(): Store {
  return store;
}

export function now(): string {
  return new Date().toISOString();
}
