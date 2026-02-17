"use server";

import { getDb } from "./db";
import { getCurrentUser, signIn, signOut } from "./auth";
import { v4 as uuid } from "uuid";
import { revalidatePath } from "next/cache";

// ===================== AUTH ACTIONS =====================

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const university = formData.get("university") as string;
  const campus = formData.get("campus") as string;

  if (!email || !name || !university || !campus) {
    return { error: "All fields are required" };
  }

  if (!email.endsWith(".edu") && !email.includes("university") && !email.includes("edu")) {
    // Relaxed for MVP — in production, strict .edu validation
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

  const db = getDb();
  const id = uuid();

  db.prepare(
    `INSERT INTO events (id, title, description, category, lat, lng, location_name, starts_at, ends_at, creator_id, campus, max_attendees, vibe, community_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.title,
    data.description || "",
    data.category,
    data.lat,
    data.lng,
    data.location_name,
    data.starts_at,
    data.ends_at || null,
    user.id,
    user.campus,
    data.max_attendees || null,
    data.vibe || "",
    data.community_id || null,
    new Date(data.starts_at) <= new Date() ? "live" : "upcoming"
  );

  // Auto-join as attendee
  db.prepare(
    `INSERT INTO event_attendees (event_id, user_id, status) VALUES (?, ?, 'going')`
  ).run(id, user.id);

  // Create event conversation
  const convId = uuid();
  db.prepare(
    `INSERT INTO conversations (id, type, ref_id, title) VALUES (?, 'event', ?, ?)`
  ).run(convId, id, data.title);
  db.prepare(
    `INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`
  ).run(convId, user.id);

  revalidatePath("/");
  return { id };
}

export async function getEvents(campus?: string) {
  const db = getDb();
  const user = await getCurrentUser();
  const targetCampus = campus || user?.campus;

  const events = db
    .prepare(
      `SELECT e.*, u.name as creator_name, u.avatar_url as creator_avatar,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as attendee_count,
              c.name as community_name
       FROM events e
       JOIN users u ON e.creator_id = u.id
       LEFT JOIN communities c ON e.community_id = c.id
       WHERE e.status != 'cancelled'
       ${targetCampus ? "AND e.campus = ?" : ""}
       ORDER BY
         CASE e.status
           WHEN 'live' THEN 0
           WHEN 'upcoming' THEN 1
           ELSE 2
         END,
         e.starts_at ASC`
    )
    .all(targetCampus ? [targetCampus] : []);

  return events;
}

export async function getEvent(id: string) {
  const db = getDb();
  const event = db
    .prepare(
      `SELECT e.*, u.name as creator_name, u.avatar_url as creator_avatar,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as attendee_count,
              c.name as community_name
       FROM events e
       JOIN users u ON e.creator_id = u.id
       LEFT JOIN communities c ON e.community_id = c.id
       WHERE e.id = ?`
    )
    .get(id);

  const attendees = db
    .prepare(
      `SELECT u.id, u.name, u.avatar_url, ea.status
       FROM event_attendees ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.event_id = ?`
    )
    .all(id);

  return { event, attendees };
}

export async function joinEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO event_attendees (event_id, user_id, status) VALUES (?, ?, 'going')`
  ).run(eventId, user.id);

  // Join event conversation
  const conv = db
    .prepare(`SELECT id FROM conversations WHERE type = 'event' AND ref_id = ?`)
    .get(eventId) as { id: string } | undefined;

  if (conv) {
    db.prepare(
      `INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`
    ).run(conv.id, user.id);
  }

  revalidatePath("/");
  return { success: true };
}

export async function leaveEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const db = getDb();
  db.prepare(`DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?`).run(
    eventId,
    user.id
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

  const db = getDb();
  const id = uuid();

  db.prepare(
    `INSERT INTO communities (id, name, description, icon, campus, creator_id) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, data.name, data.description, data.icon, user.campus, user.id);

  db.prepare(
    `INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, 'creator')`
  ).run(id, user.id);

  // Create community conversation
  const convId = uuid();
  db.prepare(
    `INSERT INTO conversations (id, type, ref_id, title) VALUES (?, 'community', ?, ?)`
  ).run(convId, id, data.name);
  db.prepare(
    `INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`
  ).run(convId, user.id);

  revalidatePath("/");
  return { id };
}

export async function getCommunities(campus?: string) {
  const db = getDb();
  const user = await getCurrentUser();
  const targetCampus = campus || user?.campus;

  return db
    .prepare(
      `SELECT c.*, u.name as creator_name,
              (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
       FROM communities c
       JOIN users u ON c.creator_id = u.id
       ${targetCampus ? "WHERE c.campus = ?" : ""}
       ORDER BY c.member_count DESC`
    )
    .all(targetCampus ? [targetCampus] : []);
}

export async function joinCommunity(communityId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO community_members (community_id, user_id) VALUES (?, ?)`
  ).run(communityId, user.id);

  db.prepare(
    `UPDATE communities SET member_count = (SELECT COUNT(*) FROM community_members WHERE community_id = ?) WHERE id = ?`
  ).run(communityId, communityId);

  // Join community conversation
  const conv = db
    .prepare(`SELECT id FROM conversations WHERE type = 'community' AND ref_id = ?`)
    .get(communityId) as { id: string } | undefined;

  if (conv) {
    db.prepare(
      `INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`
    ).run(conv.id, user.id);
  }

  revalidatePath("/");
  return { success: true };
}

// ===================== CHAT ACTIONS =====================

export async function getConversations() {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getDb();
  return db
    .prepare(
      `SELECT c.*,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sender_id,
              (SELECT u.name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_sender_name,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND created_at > cm.last_read) as unread_count
       FROM conversations c
       JOIN conversation_members cm ON c.id = cm.conversation_id AND cm.user_id = ?
       ORDER BY last_message_at DESC NULLS LAST`
    )
    .all(user.id);
}

export async function getMessages(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getDb();

  // Mark as read
  db.prepare(
    `UPDATE conversation_members SET last_read = datetime('now') WHERE conversation_id = ? AND user_id = ?`
  ).run(conversationId, user.id);

  return db
    .prepare(
      `SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`
    )
    .all(conversationId);
}

export async function sendMessage(conversationId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const db = getDb();
  const id = uuid();

  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)`
  ).run(id, conversationId, user.id, content);

  db.prepare(
    `UPDATE conversation_members SET last_read = datetime('now') WHERE conversation_id = ? AND user_id = ?`
  ).run(conversationId, user.id);

  revalidatePath("/");
  return { id };
}

export async function startDirectMessage(otherUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const db = getDb();

  // Check for existing DM
  const existing = db
    .prepare(
      `SELECT c.id FROM conversations c
       JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
       JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
       WHERE c.type = 'direct'`
    )
    .get(user.id, otherUserId) as { id: string } | undefined;

  if (existing) return { conversationId: existing.id };

  const otherUser = db.prepare("SELECT name FROM users WHERE id = ?").get(otherUserId) as { name: string };
  const convId = uuid();

  db.prepare(
    `INSERT INTO conversations (id, type, title) VALUES (?, 'direct', ?)`
  ).run(convId, `${user.name} & ${otherUser.name}`);

  db.prepare(
    `INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`
  ).run(convId, user.id);
  db.prepare(
    `INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`
  ).run(convId, otherUserId);

  revalidatePath("/");
  return { conversationId: convId };
}

// ===================== CONNECTION ACTIONS =====================

export async function sendConnection(toUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const db = getDb();
  const id = uuid();

  db.prepare(
    `INSERT OR IGNORE INTO connections (id, from_user_id, to_user_id) VALUES (?, ?, ?)`
  ).run(id, user.id, toUserId);

  revalidatePath("/");
  return { success: true };
}

export async function respondConnection(connectionId: string, accept: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const db = getDb();
  db.prepare(`UPDATE connections SET status = ? WHERE id = ? AND to_user_id = ?`).run(
    accept ? "accepted" : "declined",
    connectionId,
    user.id
  );

  revalidatePath("/");
  return { success: true };
}

export async function getConnections() {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getDb();
  return db
    .prepare(
      `SELECT c.*,
              u_from.name as from_name, u_from.avatar_url as from_avatar,
              u_to.name as to_name, u_to.avatar_url as to_avatar
       FROM connections c
       JOIN users u_from ON c.from_user_id = u_from.id
       JOIN users u_to ON c.to_user_id = u_to.id
       WHERE (c.from_user_id = ? OR c.to_user_id = ?) AND c.status = 'accepted'`
    )
    .all(user.id, user.id);
}

// ===================== PROFILE ACTIONS =====================

export async function updateProfile(data: { name?: string; bio?: string }) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const db = getDb();
  if (data.name) {
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(data.name, user.id);
  }
  if (data.bio !== undefined) {
    db.prepare("UPDATE users SET bio = ? WHERE id = ?").run(data.bio, user.id);
  }

  revalidatePath("/");
  return { success: true };
}

export async function getUser(id: string) {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

// ===================== REPORT ACTIONS =====================

export async function reportEvent(eventId: string, reason: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO event_reports (id, event_id, reporter_id, reason) VALUES (?, ?, ?, ?)`
  ).run(id, eventId, user.id, reason);

  revalidatePath("/");
  return { success: true };
}

// ===================== AMBASSADOR/ADMIN ACTIONS =====================

export async function getAmbassadorStats() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ambassador" && user.role !== "admin")) {
    return { error: "Not authorized" };
  }

  const db = getDb();
  const campus = user.campus;

  const totalEvents = (db.prepare("SELECT COUNT(*) as count FROM events WHERE campus = ?").get(campus) as { count: number }).count;
  const liveEvents = (db.prepare("SELECT COUNT(*) as count FROM events WHERE campus = ? AND status = 'live'").get(campus) as { count: number }).count;
  const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE campus = ?").get(campus) as { count: number }).count;
  const totalCommunities = (db.prepare("SELECT COUNT(*) as count FROM communities WHERE campus = ?").get(campus) as { count: number }).count;
  const pendingReports = (db
    .prepare(
      `SELECT COUNT(*) as count FROM event_reports er
       JOIN events e ON er.event_id = e.id
       WHERE e.campus = ? AND er.status = 'pending'`
    )
    .get(campus) as { count: number }).count;

  const recentEvents = db
    .prepare(
      `SELECT e.*, u.name as creator_name
       FROM events e JOIN users u ON e.creator_id = u.id
       WHERE e.campus = ? ORDER BY e.created_at DESC LIMIT 10`
    )
    .all(campus);

  const reports = db
    .prepare(
      `SELECT er.*, e.title as event_title, u.name as reporter_name
       FROM event_reports er
       JOIN events e ON er.event_id = e.id
       JOIN users u ON er.reporter_id = u.id
       WHERE e.campus = ? AND er.status = 'pending'
       ORDER BY er.created_at DESC`
    )
    .all(campus);

  return { totalEvents, liveEvents, totalUsers, totalCommunities, pendingReports, recentEvents, reports };
}

export async function resolveReport(reportId: string, action: "dismiss" | "remove_event") {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ambassador" && user.role !== "admin")) {
    return { error: "Not authorized" };
  }

  const db = getDb();

  if (action === "remove_event") {
    const report = db.prepare("SELECT event_id FROM event_reports WHERE id = ?").get(reportId) as { event_id: string };
    if (report) {
      db.prepare("UPDATE events SET status = 'cancelled' WHERE id = ?").run(report.event_id);
    }
  }

  db.prepare("UPDATE event_reports SET status = 'resolved' WHERE id = ?").run(reportId);
  revalidatePath("/");
  return { success: true };
}
