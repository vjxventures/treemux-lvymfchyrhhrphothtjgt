import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import type { Event } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get("miggoo_user_id")?.value;
  const db = getDb();
  const now = new Date().toISOString();

  const event = db.prepare(`
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
    WHERE e.id = ?
  `).get(now, now, id) as Event | undefined;

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (userId) {
    const rsvp = db.prepare(
      "SELECT status FROM rsvps WHERE event_id = ? AND user_id = ?"
    ).get(id, userId) as { status: string } | undefined;
    event.user_rsvp = rsvp?.status || null;
  }

  // Get attendees
  const attendees = db.prepare(`
    SELECT u.id, u.name, u.avatar_url
    FROM rsvps r JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ? AND r.status = 'going'
    ORDER BY r.created_at ASC
  `).all(id);

  return NextResponse.json({ event, attendees });
}
