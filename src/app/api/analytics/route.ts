import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  db.prepare('INSERT INTO analytics_events (id, user_id, event_type, properties) VALUES (?, ?, ?, ?)').run(
    uuidv4(),
    body.user_id || null,
    body.event_type,
    JSON.stringify(body.properties || {})
  );

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const db = getDb();
  const campusId = req.nextUrl.searchParams.get('campus_id') || 'campus-mit';

  // Dashboard metrics
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE campus_id = ?').get(campusId) as { count: number };
  const activeEvents = db.prepare(`
    SELECT COUNT(*) as count FROM events
    WHERE campus_id = ? AND datetime(starts_at) <= datetime('now') AND datetime(ends_at) >= datetime('now')
  `).get(campusId) as { count: number };
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE campus_id = ?').get(campusId) as { count: number };
  const totalAttendances = db.prepare(`
    SELECT COUNT(*) as count FROM event_attendees ea
    JOIN events e ON ea.event_id = e.id
    WHERE e.campus_id = ?
  `).get(campusId) as { count: number };

  const recentAnalytics = db.prepare(`
    SELECT event_type, COUNT(*) as count
    FROM analytics_events
    WHERE timestamp > datetime('now', '-7 days')
    GROUP BY event_type
  `).all();

  return NextResponse.json({
    total_events: totalEvents.count,
    active_events: activeEvents.count,
    total_users: totalUsers.count,
    total_attendances: totalAttendances.count,
    recent_analytics: recentAnalytics,
  });
}
