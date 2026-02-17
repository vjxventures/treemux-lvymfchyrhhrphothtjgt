import { cookies } from "next/headers";
import { getDb } from "./db";
import { v4 as uuid } from "uuid";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  university: string;
  campus: string;
  bio: string;
  role: "student" | "ambassador" | "admin";
  verified: number;
  created_at: string;
  last_active: string;
}

const SESSION_COOKIE = "miggoo_session";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(sessionId) as User | undefined;

  if (user) {
    db.prepare("UPDATE users SET last_active = datetime('now') WHERE id = ?").run(
      user.id
    );
  }
  return user || null;
}

export async function signIn(email: string, name: string, university: string, campus: string): Promise<User> {
  const db = getDb();
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;

  if (!user) {
    const id = uuid();
    const avatarIdx = Math.floor(Math.random() * 8) + 1;
    db.prepare(
      `INSERT INTO users (id, email, name, university, campus, avatar_url) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, email, name, university, campus, `/avatars/${avatarIdx}.svg`);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return user;
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
