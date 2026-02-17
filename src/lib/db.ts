import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "miggoo.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      university TEXT NOT NULL,
      campus TEXT NOT NULL,
      bio TEXT DEFAULT '',
      role TEXT DEFAULT 'student' CHECK(role IN ('student', 'ambassador', 'admin')),
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      last_active TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      campus TEXT NOT NULL,
      creator_id TEXT NOT NULL REFERENCES users(id),
      member_count INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS community_members (
      community_id TEXT NOT NULL REFERENCES communities(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT DEFAULT 'member' CHECK(role IN ('member', 'moderator', 'creator')),
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (community_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL CHECK(category IN ('party', 'study', 'sports', 'food', 'music', 'art', 'social', 'other')),
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      location_name TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'live', 'ended', 'cancelled')),
      creator_id TEXT NOT NULL REFERENCES users(id),
      community_id TEXT REFERENCES communities(id),
      campus TEXT NOT NULL,
      max_attendees INTEGER,
      vibe TEXT DEFAULT '',
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_attendees (
      event_id TEXT NOT NULL REFERENCES events(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'going' CHECK(status IN ('going', 'interested', 'checked_in')),
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      from_user_id TEXT NOT NULL REFERENCES users(id),
      to_user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(from_user_id, to_user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('direct', 'event', 'community')),
      ref_id TEXT,
      title TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversation_members (
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      last_read TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (conversation_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS event_reports (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id),
      reporter_id TEXT NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_campus ON events(campus);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
    CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
    CREATE INDEX IF NOT EXISTS idx_events_location ON events(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);
  `);
}
