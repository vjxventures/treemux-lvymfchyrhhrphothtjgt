"use server";

import { getStore, now } from "./db";
import { getCurrentUser, signIn, signOut } from "./auth";
import { v4 as uuid } from "uuid";
import { revalidatePath } from "next/cache";
import { ensureSeeded } from "./seed";

// ===================== AUTH ACTIONS =====================

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const university = formData.get("university") as string;
  const campus = formData.get("campus") as string;

  if (!email || !name || !university || !campus) {
    return { error: "All fields are required" };
  }

  const user = await signIn(email, name, university, campus);
  revalidatePath("/");
  return { user };
}

export async function logoutAction() {
  await signOut();
  revalidatePath("/");
}

export async function getMe() {
  return getCurrentUser();
}

// ===================== EVENT ACTIONS =====================

export async function createEvent(data: {
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  location_name: string;
  starts_at: string;
  ends_at?: string;
  max_attendees?: number;
  vibe?: string;
  community_id?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();
  const id = uuid();

  store.events.set(id, {
    id,
    title: data.title,
    description: data.description || "",
    category: data.category,
    lat: data.lat,
    lng: data.lng,
    location_name: data.location_name,
    starts_at: data.starts_at,
    ends_at: data.ends_at || null,
    status: new Date(data.starts_at) <= new Date() ? "live" : "upcoming",
    creator_id: user.id,
    community_id: data.community_id || null,
    campus: user.campus,
    max_attendees: data.max_attendees || null,
    vibe: data.vibe || "",
    image_url: null,
    created_at: now(),
  });

  // Auto-join as attendee
  store.eventAttendees.push({ event_id: id, user_id: user.id, status: "going", joined_at: now() });

  // Create event conversation
  const convId = uuid();
  store.conversations.set(convId, { id: convId, type: "event", ref_id: id, title: data.title, created_at: now() });
  store.conversationMembers.push({ conversation_id: convId, user_id: user.id, last_read: now() });

  revalidatePath("/");
  return { id };
}

export async function getEvents(campus?: string) {
  ensureSeeded();
  const store = getStore();
  const user = await getCurrentUser();
  const targetCampus = campus || user?.campus;

  const results: Record<string, unknown>[] = [];

  for (const e of store.events.values()) {
    if (e.status === "cancelled") continue;
    if (targetCampus && e.campus !== targetCampus) continue;

    const creator = store.users.get(e.creator_id);
    const attendeeCount = store.eventAttendees.filter((a) => a.event_id === e.id).length;
    const community = e.community_id ? store.communities.get(e.community_id) : undefined;

    results.push({
      ...e,
      creator_name: creator?.name,
      creator_avatar: creator?.avatar_url,
      attendee_count: attendeeCount,
      community_name: community?.name || null,
    });
  }

  // Sort: live first, then upcoming, then others; then by starts_at ASC
  results.sort((a, b) => {
    const statusOrder = (s: string) => (s === "live" ? 0 : s === "upcoming" ? 1 : 2);
    const diff = statusOrder(a.status as string) - statusOrder(b.status as string);
    if (diff !== 0) return diff;
    return (a.starts_at as string).localeCompare(b.starts_at as string);
  });

  return results;
}

export async function getEvent(id: string) {
  ensureSeeded();
  const store = getStore();
  const e = store.events.get(id);
  if (!e) return { event: null, attendees: [] };

  const creator = store.users.get(e.creator_id);
  const attendeeCount = store.eventAttendees.filter((a) => a.event_id === e.id).length;
  const community = e.community_id ? store.communities.get(e.community_id) : undefined;

  const event = {
    ...e,
    creator_name: creator?.name,
    creator_avatar: creator?.avatar_url,
    attendee_count: attendeeCount,
    community_name: community?.name || null,
  };

  const attendees = store.eventAttendees
    .filter((a) => a.event_id === id)
    .map((a) => {
      const u = store.users.get(a.user_id);
      return { id: u?.id, name: u?.name, avatar_url: u?.avatar_url, status: a.status };
    });

  return { event, attendees };
}

export async function joinEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();

  // Remove existing and re-add (INSERT OR REPLACE)
  store.eventAttendees = store.eventAttendees.filter(
    (a) => !(a.event_id === eventId && a.user_id === user.id)
  );
  store.eventAttendees.push({ event_id: eventId, user_id: user.id, status: "going", joined_at: now() });

  // Join event conversation
  const conv = [...store.conversations.values()].find((c) => c.type === "event" && c.ref_id === eventId);
  if (conv) {
    const alreadyMember = store.conversationMembers.some(
      (cm) => cm.conversation_id === conv.id && cm.user_id === user.id
    );
    if (!alreadyMember) {
      store.conversationMembers.push({ conversation_id: conv.id, user_id: user.id, last_read: now() });
    }
  }

  revalidatePath("/");
  return { success: true };
}

export async function leaveEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();
  store.eventAttendees = store.eventAttendees.filter(
    (a) => !(a.event_id === eventId && a.user_id === user.id)
  );
  revalidatePath("/");
  return { success: true };
}

// ===================== COMMUNITY ACTIONS =====================

export async function createCommunity(data: {
  name: string;
  description: string;
  icon: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();
  const id = uuid();

  store.communities.set(id, {
    id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    campus: user.campus,
    creator_id: user.id,
    member_count: 1,
    created_at: now(),
  });

  store.communityMembers.push({ community_id: id, user_id: user.id, role: "creator", joined_at: now() });

  // Create community conversation
  const convId = uuid();
  store.conversations.set(convId, { id: convId, type: "community", ref_id: id, title: data.name, created_at: now() });
  store.conversationMembers.push({ conversation_id: convId, user_id: user.id, last_read: now() });

  revalidatePath("/");
  return { id };
}

export async function getCommunities(campus?: string) {
  ensureSeeded();
  const store = getStore();
  const user = await getCurrentUser();
  const targetCampus = campus || user?.campus;

  const results: Record<string, unknown>[] = [];

  for (const c of store.communities.values()) {
    if (targetCampus && c.campus !== targetCampus) continue;

    const creator = store.users.get(c.creator_id);
    const memberCount = store.communityMembers.filter((m) => m.community_id === c.id).length;

    results.push({
      ...c,
      creator_name: creator?.name,
      member_count: memberCount,
    });
  }

  results.sort((a, b) => (b.member_count as number) - (a.member_count as number));
  return results;
}

export async function joinCommunity(communityId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();

  const alreadyMember = store.communityMembers.some(
    (m) => m.community_id === communityId && m.user_id === user.id
  );
  if (!alreadyMember) {
    store.communityMembers.push({ community_id: communityId, user_id: user.id, role: "member", joined_at: now() });
  }

  // Update member count
  const community = store.communities.get(communityId);
  if (community) {
    community.member_count = store.communityMembers.filter((m) => m.community_id === communityId).length;
  }

  // Join community conversation
  const conv = [...store.conversations.values()].find((c) => c.type === "community" && c.ref_id === communityId);
  if (conv) {
    const alreadyConvMember = store.conversationMembers.some(
      (cm) => cm.conversation_id === conv.id && cm.user_id === user.id
    );
    if (!alreadyConvMember) {
      store.conversationMembers.push({ conversation_id: conv.id, user_id: user.id, last_read: now() });
    }
  }

  revalidatePath("/");
  return { success: true };
}

// ===================== CHAT ACTIONS =====================

export async function getConversations() {
  const user = await getCurrentUser();
  if (!user) return [];

  const store = getStore();

  const myConvIds = store.conversationMembers
    .filter((cm) => cm.user_id === user.id)
    .map((cm) => ({ id: cm.conversation_id, last_read: cm.last_read }));

  const results: Record<string, unknown>[] = [];

  for (const { id: convId, last_read } of myConvIds) {
    const conv = store.conversations.get(convId);
    if (!conv) continue;

    const convMessages = store.messages
      .filter((m) => m.conversation_id === convId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

    const lastMsg = convMessages[convMessages.length - 1];
    const lastSender = lastMsg ? store.users.get(lastMsg.sender_id) : undefined;
    const unreadCount = convMessages.filter((m) => m.created_at > last_read).length;

    results.push({
      ...conv,
      last_message: lastMsg?.content || null,
      last_sender_id: lastMsg?.sender_id || null,
      last_sender_name: lastSender?.name || null,
      last_message_at: lastMsg?.created_at || null,
      unread_count: unreadCount,
    });
  }

  results.sort((a, b) => {
    const aTime = a.last_message_at as string | null;
    const bTime = b.last_message_at as string | null;
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return bTime.localeCompare(aTime);
  });

  return results;
}

export async function getMessages(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const store = getStore();

  // Mark as read
  const cm = store.conversationMembers.find(
    (cm) => cm.conversation_id === conversationId && cm.user_id === user.id
  );
  if (cm) cm.last_read = now();

  return store.messages
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((m) => {
      const sender = store.users.get(m.sender_id);
      return { ...m, sender_name: sender?.name, sender_avatar: sender?.avatar_url };
    });
}

export async function sendMessage(conversationId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();
  const id = uuid();

  store.messages.push({ id, conversation_id: conversationId, sender_id: user.id, content, created_at: now() });

  const cm = store.conversationMembers.find(
    (cm) => cm.conversation_id === conversationId && cm.user_id === user.id
  );
  if (cm) cm.last_read = now();

  revalidatePath("/");
  return { id };
}

export async function startDirectMessage(otherUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();

  // Check for existing DM
  const myConvIds = new Set(
    store.conversationMembers.filter((cm) => cm.user_id === user.id).map((cm) => cm.conversation_id)
  );
  const otherConvIds = new Set(
    store.conversationMembers.filter((cm) => cm.user_id === otherUserId).map((cm) => cm.conversation_id)
  );

  for (const convId of myConvIds) {
    if (otherConvIds.has(convId)) {
      const conv = store.conversations.get(convId);
      if (conv?.type === "direct") {
        return { conversationId: conv.id };
      }
    }
  }

  const otherUser = store.users.get(otherUserId);
  const convId = uuid();

  store.conversations.set(convId, {
    id: convId,
    type: "direct",
    ref_id: null,
    title: `${user.name} & ${otherUser?.name}`,
    created_at: now(),
  });

  store.conversationMembers.push({ conversation_id: convId, user_id: user.id, last_read: now() });
  store.conversationMembers.push({ conversation_id: convId, user_id: otherUserId, last_read: now() });

  revalidatePath("/");
  return { conversationId: convId };
}

// ===================== CONNECTION ACTIONS =====================

export async function sendConnection(toUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();

  const exists = store.connections.some(
    (c) => c.from_user_id === user.id && c.to_user_id === toUserId
  );
  if (!exists) {
    store.connections.push({
      id: uuid(),
      from_user_id: user.id,
      to_user_id: toUserId,
      status: "pending",
      created_at: now(),
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function respondConnection(connectionId: string, accept: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();
  const conn = store.connections.find((c) => c.id === connectionId && c.to_user_id === user.id);
  if (conn) {
    conn.status = accept ? "accepted" : "declined";
  }

  revalidatePath("/");
  return { success: true };
}

export async function getConnections() {
  const user = await getCurrentUser();
  if (!user) return [];

  const store = getStore();
  return store.connections
    .filter(
      (c) => (c.from_user_id === user.id || c.to_user_id === user.id) && c.status === "accepted"
    )
    .map((c) => {
      const fromUser = store.users.get(c.from_user_id);
      const toUser = store.users.get(c.to_user_id);
      return {
        ...c,
        from_name: fromUser?.name,
        from_avatar: fromUser?.avatar_url,
        to_name: toUser?.name,
        to_avatar: toUser?.avatar_url,
      };
    });
}

// ===================== PROFILE ACTIONS =====================

export async function updateProfile(data: { name?: string; bio?: string }) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();
  const u = store.users.get(user.id);
  if (u) {
    if (data.name) u.name = data.name;
    if (data.bio !== undefined) u.bio = data.bio;
  }

  revalidatePath("/");
  return { success: true };
}

export async function getUser(id: string) {
  ensureSeeded();
  const store = getStore();
  return store.users.get(id) || null;
}

// ===================== REPORT ACTIONS =====================

export async function reportEvent(eventId: string, reason: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const store = getStore();
  store.eventReports.push({
    id: uuid(),
    event_id: eventId,
    reporter_id: user.id,
    reason,
    status: "pending",
    created_at: now(),
  });

  revalidatePath("/");
  return { success: true };
}

// ===================== AMBASSADOR/ADMIN ACTIONS =====================

export async function getAmbassadorStats() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ambassador" && user.role !== "admin")) {
    return { error: "Not authorized" };
  }

  const store = getStore();
  const campus = user.campus;

  const campusEvents = [...store.events.values()].filter((e) => e.campus === campus);
  const totalEvents = campusEvents.length;
  const liveEvents = campusEvents.filter((e) => e.status === "live").length;
  const totalUsers = [...store.users.values()].filter((u) => u.campus === campus).length;
  const totalCommunities = [...store.communities.values()].filter((c) => c.campus === campus).length;

  const campusEventIds = new Set(campusEvents.map((e) => e.id));
  const pendingReports = store.eventReports.filter(
    (r) => campusEventIds.has(r.event_id) && r.status === "pending"
  ).length;

  const recentEvents = campusEvents
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)
    .map((e) => {
      const creator = store.users.get(e.creator_id);
      return { ...e, creator_name: creator?.name };
    });

  const reports = store.eventReports
    .filter((r) => campusEventIds.has(r.event_id) && r.status === "pending")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => {
      const event = store.events.get(r.event_id);
      const reporter = store.users.get(r.reporter_id);
      return { ...r, event_title: event?.title, reporter_name: reporter?.name };
    });

  return { totalEvents, liveEvents, totalUsers, totalCommunities, pendingReports, recentEvents, reports };
}

export async function resolveReport(reportId: string, action: "dismiss" | "remove_event") {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ambassador" && user.role !== "admin")) {
    return { error: "Not authorized" };
  }

  const store = getStore();

  if (action === "remove_event") {
    const report = store.eventReports.find((r) => r.id === reportId);
    if (report) {
      const event = store.events.get(report.event_id);
      if (event) event.status = "cancelled";
    }
  }

  const report = store.eventReports.find((r) => r.id === reportId);
  if (report) report.status = "resolved";

  revalidatePath("/");
  return { success: true };
}
