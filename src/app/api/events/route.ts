import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import type { Event } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campus = searchParams.get("campus") || "stanford";
  const category = searchParams.get("category");
  const cookieStore = await cookies();
  const userId = cookieStore.get("miggoo_user_id")?.value;

  const db = getDb();
  const now = new Date().toISOString();

  let query = `
    SELECT
      e.*,
      u.name as creator_name,
      (SELECT COUNT(*) FROM rsvps WHERE event_id = e.id AND status = 'going') as attendee_count,
      CASE
        WHEN e.starts_at <= ? AND (e.ends_at IS NULL OR e.ends_at >= ?) THEN 1
        ELSE 0
      END as is_happening_now
    FROM events e
    JOIN users u ON e.creator_id = u.id
    WHERE e.campus = ?
      AND e.is_active = 1
      AND (e.ends_at IS NULL OR e.ends_at >= ?)
  `;

  const params: (string | number)[] = [now, now, campus, now];

  if (category) {
    query += " AND e.category = ?";
    params.push(category);
  }

  // Order: happening now first, then by start time
  query += " ORDER BY is_happening_now DESC, e.starts_at ASC";

  const events = db.prepare(query).all(...params) as Event[];

  // Add user RSVP status if logged in
  if (userId) {
    for (const event of events) {
      const rsvp = db.prepare(
        "SELECT status FROM rsvps WHERE event_id = ? AND user_id = ?"
      ).get(event.id, userId) as { status: string } | undefined;
      event.user_rsvp = rsvp?.status || null;
    }
  }

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("miggoo_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, category, lat, lng, location_name, starts_at, ends_at, max_attendees, vibe } = body;

  if (!title || !lat || !lng || !starts_at) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare("SELECT campus FROM users WHERE id = ?").get(userId) as { campus: string };

  const id = uuidv4();
  db.prepare(
    `INSERT INTO events (id, title, description, category, creator_id, lat, lng, location_name, starts_at, ends_at, max_attendees, campus, vibe)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, title, description || null, category || "social", userId, lat, lng, location_name || null, starts_at, ends_at || null, max_attendees || null, user.campus, vibe || null);

  // Auto-RSVP creator
  db.prepare("INSERT INTO rsvps (id, event_id, user_id, status) VALUES (?, ?, ?, 'going')").run(
    uuidv4(), id, userId
  );

  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
  return NextResponse.json({ event }, { status: 201 });
}
