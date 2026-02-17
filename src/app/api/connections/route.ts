import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const db = getDb();
  const userId = req.nextUrl.searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const connections = db.prepare(`
    SELECT c.*,
      CASE
        WHEN c.user_id = ? THEN cu.name
        ELSE u.name
      END as connected_name,
      CASE
        WHEN c.user_id = ? THEN cu.avatar_url
        ELSE u.avatar_url
      END as connected_avatar,
      CASE
        WHEN c.user_id = ? THEN cu.bio
        ELSE u.bio
      END as connected_bio,
      CASE
        WHEN c.user_id = ? THEN c.connected_user_id
        ELSE c.user_id
      END as other_user_id
    FROM connections c
    JOIN users u ON c.user_id = u.id
    JOIN users cu ON c.connected_user_id = cu.id
    WHERE c.user_id = ? OR c.connected_user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId, userId, userId, userId, userId, userId);

  return NextResponse.json(connections);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = uuidv4();

  try {
    db.prepare('INSERT INTO connections (id, user_id, connected_user_id, status) VALUES (?, ?, ?, ?)').run(
      id, body.user_id, body.connected_user_id, 'pending'
    );
    return NextResponse.json({ id, status: 'pending' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Connection already exists' }, { status: 409 });
  }
}
