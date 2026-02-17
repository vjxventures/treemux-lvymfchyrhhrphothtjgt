import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const db = getDb();
  const campusId = req.nextUrl.searchParams.get('campus_id') || 'campus-mit';

  const communities = db.prepare(`
    SELECT c.*,
      u.name as creator_name,
      (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
    FROM communities c
    JOIN users u ON c.creator_id = u.id
    WHERE c.campus_id = ?
    ORDER BY member_count DESC
  `).all(campusId);

  return NextResponse.json(communities);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO communities (id, name, description, creator_id, campus_id, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, body.name, body.description || '', body.creator_id, body.campus_id, body.category || 'other');

  db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)').run(id, body.creator_id, 'admin');

  return NextResponse.json({ id, ...body }, { status: 201 });
}
