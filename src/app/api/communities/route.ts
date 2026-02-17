import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campus = searchParams.get("campus") || "stanford";

  const db = getDb();
  const communities = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
    FROM communities c
    WHERE c.campus = ?
    ORDER BY member_count DESC
  `).all(campus);

  return NextResponse.json({ communities });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("miggoo_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare("SELECT campus FROM users WHERE id = ?").get(userId) as { campus: string };
  const id = uuidv4();

  db.prepare(
    "INSERT INTO communities (id, name, description, campus, creator_id) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name, description || null, user.campus, userId);

  db.prepare(
    "INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, 'admin')"
  ).run(id, userId);

  const community = db.prepare("SELECT * FROM communities WHERE id = ?").get(id);
  return NextResponse.json({ community }, { status: 201 });
}
