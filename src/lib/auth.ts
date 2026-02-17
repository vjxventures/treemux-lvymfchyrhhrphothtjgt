import { cookies } from "next/headers";
import { getStore, now } from "./db";
import type { UserRow } from "./db";
import { v4 as uuid } from "uuid";
import { ensureSeeded } from "./seed";

export type User = UserRow;

const SESSION_COOKIE = "miggoo_session";

export async function getCurrentUser(): Promise<User | null> {
  ensureSeeded();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const store = getStore();
  const user = store.users.get(sessionId);
  if (user) {
    user.last_active = now();
  }
  return user || null;
}

export async function signIn(email: string, name: string, university: string, campus: string): Promise<User> {
  ensureSeeded();
  const store = getStore();
  let user: User | undefined;

  for (const u of store.users.values()) {
    if (u.email === email) {
      user = u;
      break;
    }
  }

  if (!user) {
    const id = uuid();
    const avatarIdx = Math.floor(Math.random() * 8) + 1;
    user = {
      id,
      email,
      name,
      avatar_url: `/avatars/${avatarIdx}.svg`,
      university,
      campus,
      bio: "",
      role: "student",
      verified: 0,
      created_at: now(),
      last_active: now(),
    };
    store.users.set(id, user);
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
