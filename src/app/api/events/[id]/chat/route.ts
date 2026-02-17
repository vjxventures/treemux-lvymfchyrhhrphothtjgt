import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const messages = db.prepare(`
    SELECT cm.*, u.name as user_name, u.avatar_url as user_avatar
    FROM chat_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.event_id = ?
    ORDER BY cm.created_at ASC
  `).all(id);

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const msgId = uuidv4();

  db.prepare('INSERT INTO chat_messages (id, event_id, user_id, content) VALUES (?, ?, ?, ?)').run(
    msgId, id, body.user_id, body.content
  );

  const message = db.prepare(`
    SELECT cm.*, u.name as user_name, u.avatar_url as user_avatar
    FROM chat_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.id = ?
  `).get(msgId);

  return NextResponse.json(message, { status: 201 });
}
