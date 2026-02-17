import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateEventScore, isEventActive } from '@/lib/scoring';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const db = getDb();
  const campusId = req.nextUrl.searchParams.get('campus_id') || 'campus-mit';
  const category = req.nextUrl.searchParams.get('category');

  let query = `
    SELECT e.*,
      u.name as creator_name, u.avatar_url as creator_avatar,
      c.name as community_name,
      (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as attendee_count
    FROM events e
    LEFT JOIN users u ON e.creator_id = u.id
    LEFT JOIN communities c ON e.community_id = c.id
    WHERE e.campus_id = ?
      AND datetime(e.ends_at) > datetime('now', '-1 hour')
  `;
  const params: (string | number)[] = [campusId];

  if (category && category !== 'all') {
    query += ' AND e.category = ?';
    params.push(category);
  }

  query += ' ORDER BY e.starts_at ASC';

  const events = db.prepare(query).all(...params) as Array<Record<string, unknown>>;

  // Calculate scores and add metadata
  const scoredEvents = events.map((event) => ({
    ...event,
    is_active: isEventActive(event.starts_at as string, event.ends_at as string),
    score: calculateEventScore({
      starts_at: event.starts_at as string,
      ends_at: event.ends_at as string,
      attendee_count: event.attendee_count as number,
      max_attendees: event.max_attendees as number | null,
    }),
  })).filter(e => e.score > 0).sort((a, b) => b.score - a.score);

  return NextResponse.json(scoredEvents);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO events (id, title, description, creator_id, community_id, campus_id, category, lat, lng, location_name, starts_at, ends_at, max_attendees)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    body.title,
    body.description || '',
    body.creator_id,
    body.community_id || null,
    body.campus_id,
    body.category || 'other',
    body.lat,
    body.lng,
    body.location_name || '',
    body.starts_at,
    body.ends_at,
    body.max_attendees || null
  );

  // Creator auto-attends
  db.prepare('INSERT INTO event_attendees (event_id, user_id, status) VALUES (?, ?, ?)').run(id, body.creator_id, 'going');

  // Track analytics
  db.prepare('INSERT INTO analytics_events (id, user_id, event_type, properties) VALUES (?, ?, ?, ?)').run(
    uuidv4(), body.creator_id, 'event_created', JSON.stringify({ event_id: id, category: body.category })
  );

  return NextResponse.json({ id, ...body }, { status: 201 });
}
