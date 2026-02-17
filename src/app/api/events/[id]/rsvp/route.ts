import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get("miggoo_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = getDb();

  // Check if already RSVP'd
  const existing = db.prepare(
    "SELECT * FROM rsvps WHERE event_id = ? AND user_id = ?"
  ).get(eventId, userId);

  if (existing) {
    // Toggle off
    db.prepare("DELETE FROM rsvps WHERE event_id = ? AND user_id = ?").run(eventId, userId);
    return NextResponse.json({ status: "removed" });
  }

  // Check max attendees
  const event = db.prepare("SELECT max_attendees FROM events WHERE id = ?").get(eventId) as { max_attendees: number | null } | undefined;
  if (event?.max_attendees) {
    const count = db.prepare("SELECT COUNT(*) as c FROM rsvps WHERE event_id = ? AND status = 'going'").get(eventId) as { c: number };
    if (count.c >= event.max_attendees) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 });
    }
  }

  db.prepare("INSERT INTO rsvps (id, event_id, user_id, status) VALUES (?, ?, ?, 'going')").run(
    uuidv4(), eventId, userId
  );

  const count = db.prepare("SELECT COUNT(*) as c FROM rsvps WHERE event_id = ? AND status = 'going'").get(eventId) as { c: number };

  return NextResponse.json({ status: "going", attendee_count: count.c });
}
