import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();

  try {
    db.prepare('INSERT OR REPLACE INTO event_attendees (event_id, user_id, status) VALUES (?, ?, ?)').run(
      id, body.user_id, body.status || 'going'
    );

    db.prepare('INSERT INTO analytics_events (id, user_id, event_type, properties) VALUES (?, ?, ?, ?)').run(
      uuidv4(), body.user_id, 'event_attended', JSON.stringify({ event_id: id, status: body.status })
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to attend' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const userId = req.nextUrl.searchParams.get('user_id');

  db.prepare('DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?').run(id, userId);

  return NextResponse.json({ success: true });
}
