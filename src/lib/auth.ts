import { cookies } from "next/headers";
import { getDb } from "./db";
import type { User } from "./types";

const DEMO_USER_ID = "user-8";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("miggoo_user_id")?.value;

  if (!userId) return null;

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | undefined;
  return user || null;
}

export async function getOrCreateDemoUser(): Promise<User> {
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(DEMO_USER_ID) as User;
  return user;
}

export function getUserById(userId: string): User | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User) || null;
}
