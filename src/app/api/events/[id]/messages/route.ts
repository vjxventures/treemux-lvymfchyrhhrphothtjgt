import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import type { Message } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const db = getDb();

  const messages = db.prepare(`
    SELECT m.*, u.name as user_name
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.event_id = ?
    ORDER BY m.created_at ASC
  `).all(eventId) as Message[];

  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get("miggoo_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { content } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const db = getDb();
  const id = uuidv4();

  db.prepare(
    "INSERT INTO messages (id, event_id, user_id, content) VALUES (?, ?, ?, ?)"
  ).run(id, eventId, userId, content.trim());

  const message = db.prepare(`
    SELECT m.*, u.name as user_name
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ?
  `).get(id) as Message;

  return NextResponse.json({ message }, { status: 201 });
}
