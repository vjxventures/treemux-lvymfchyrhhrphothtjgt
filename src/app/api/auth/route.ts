import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import type { User } from "@/lib/types";

// Quick login / signup — for MVP, just campus email
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 });
  }

  // Extract campus from email domain
  const domain = email.split("@")[1];
  if (!domain || !domain.includes(".edu")) {
    return NextResponse.json({ error: "Please use your .edu email" }, { status: 400 });
  }
  const campus = domain.split(".edu")[0].replace(/\./g, "-");

  const db = getDb();

  // Check if user exists
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;

  if (!user) {
    const id = uuidv4();
    db.prepare("INSERT INTO users (id, name, email, campus) VALUES (?, ?, ?, ?)").run(
      id, name, email, campus
    );
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User;
  }

  const response = NextResponse.json({ user });
  response.cookies.set("miggoo_user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}

// Demo login
export async function GET() {
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get("user-8") as User;

  const response = NextResponse.json({ user });
  response.cookies.set("miggoo_user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
