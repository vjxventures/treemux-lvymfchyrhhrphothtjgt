import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const event = db.prepare(`
    SELECT e.*,
      u.name as creator_name, u.avatar_url as creator_avatar,
      c.name as community_name,
      (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as attendee_count
    FROM events e
    LEFT JOIN users u ON e.creator_id = u.id
    LEFT JOIN communities c ON e.community_id = c.id
    WHERE e.id = ?
  `).get(id);

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const attendees = db.prepare(`
    SELECT ea.*, u.name, u.avatar_url
    FROM event_attendees ea
    JOIN users u ON ea.user_id = u.id
    WHERE ea.event_id = ?
  `).all(id);

  return NextResponse.json({ ...event, attendees });
}
