import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "miggoo.db");

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
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      campus TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'social',
      creator_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      location_name TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT,
      max_attendees INTEGER,
      campus TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      vibe TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'going',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      campus TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS community_members (
      community_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (community_id, user_id),
      FOREIGN KEY (community_id) REFERENCES communities(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      user_a TEXT NOT NULL,
      user_b TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_a) REFERENCES users(id),
      FOREIGN KEY (user_b) REFERENCES users(id),
      UNIQUE(user_a, user_b)
    );

    CREATE INDEX IF NOT EXISTS idx_events_campus ON events(campus);
    CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
    CREATE INDEX IF NOT EXISTS idx_events_starts ON events(starts_at);
    CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps(event_id);
    CREATE INDEX IF NOT EXISTS idx_messages_event ON messages(event_id);
  `);

  // Seed demo data if empty
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (count.c === 0) {
    seedDemoData(db);
  }
}

function seedDemoData(db: Database.Database) {
  const now = new Date();

  const users = [
    { id: "user-1", name: "Alex Rivera", email: "alex@stanford.edu", campus: "stanford", avatar_url: null },
    { id: "user-2", name: "Jordan Kim", email: "jordan@stanford.edu", campus: "stanford", avatar_url: null },
    { id: "user-3", name: "Sam Chen", email: "sam@stanford.edu", campus: "stanford", avatar_url: null },
    { id: "user-4", name: "Maya Patel", email: "maya@stanford.edu", campus: "stanford", avatar_url: null },
    { id: "user-5", name: "Chris Lee", email: "chris@stanford.edu", campus: "stanford", avatar_url: null },
    { id: "user-6", name: "Taylor Swift", email: "taylor@stanford.edu", campus: "stanford", avatar_url: null },
    { id: "user-7", name: "Riley Park", email: "riley@stanford.edu", campus: "stanford", avatar_url: null },
    { id: "user-8", name: "Demo User", email: "demo@stanford.edu", campus: "stanford", avatar_url: null },
  ];

  const insertUser = db.prepare(
    "INSERT INTO users (id, name, email, campus, avatar_url) VALUES (?, ?, ?, ?, ?)"
  );
  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, u.campus, u.avatar_url);
  }

  // Create events happening NOW and soon — the magical moment
  const events = [
    {
      id: "evt-1",
      title: "🏀 Pickup Basketball @ the Quad",
      description: "Need 2 more players! Chill game, all levels welcome. We have an extra ball.",
      category: "sports",
      creator_id: "user-1",
      lat: 37.4275,
      lng: -122.1697,
      location_name: "Main Quad",
      starts_at: new Date(now.getTime() - 30 * 60000).toISOString(),
      ends_at: new Date(now.getTime() + 90 * 60000).toISOString(),
      campus: "stanford",
      vibe: "active",
    },
    {
      id: "evt-2",
      title: "☕ Study & Coffee Hangout",
      description: "Working on CS229 problem set, grab a coffee and join. Good vibes only.",
      category: "study",
      creator_id: "user-2",
      lat: 37.4263,
      lng: -122.1702,
      location_name: "Green Library Café",
      starts_at: new Date(now.getTime() - 60 * 60000).toISOString(),
      ends_at: new Date(now.getTime() + 120 * 60000).toISOString(),
      campus: "stanford",
      vibe: "chill",
    },
    {
      id: "evt-3",
      title: "🎵 Open Mic Night",
      description: "Bring your guitar, your voice, or just your ears. Sign-up sheet at the door.",
      category: "music",
      creator_id: "user-3",
      lat: 37.4249,
      lng: -122.1712,
      location_name: "CoHo (Coffee House)",
      starts_at: new Date(now.getTime() + 30 * 60000).toISOString(),
      ends_at: new Date(now.getTime() + 180 * 60000).toISOString(),
      campus: "stanford",
      vibe: "creative",
    },
    {
      id: "evt-4",
      title: "🌮 Free Tacos at EBF",
      description: "Engineering club is giving out free tacos while supplies last. Come through!",
      category: "food",
      creator_id: "user-4",
      lat: 37.4285,
      lng: -122.1745,
      location_name: "Huang Engineering Center",
      starts_at: new Date(now.getTime() - 15 * 60000).toISOString(),
      ends_at: new Date(now.getTime() + 45 * 60000).toISOString(),
      campus: "stanford",
      vibe: "social",
    },
    {
      id: "evt-5",
      title: "🧘 Sunset Yoga on the Lawn",
      description: "Bring a mat or towel. Beginner friendly. Let's decompress together.",
      category: "wellness",
      creator_id: "user-5",
      lat: 37.4292,
      lng: -122.1680,
      location_name: "Wilbur Field",
      starts_at: new Date(now.getTime() + 60 * 60000).toISOString(),
      ends_at: new Date(now.getTime() + 120 * 60000).toISOString(),
      campus: "stanford",
      vibe: "chill",
    },
    {
      id: "evt-6",
      title: "🎮 Smash Bros Tournament",
      description: "Double elimination. Bring your controller. Snacks provided. Winner gets bragging rights.",
      category: "gaming",
      creator_id: "user-6",
      lat: 37.4258,
      lng: -122.1738,
      location_name: "FloMo Lounge",
      starts_at: new Date(now.getTime() + 120 * 60000).toISOString(),
      ends_at: new Date(now.getTime() + 300 * 60000).toISOString(),
      campus: "stanford",
      vibe: "hype",
    },
    {
      id: "evt-7",
      title: "🎬 Outdoor Movie Night",
      description: "Showing Interstellar on the big screen. Bring blankets!",
      category: "entertainment",
      creator_id: "user-7",
      lat: 37.4300,
      lng: -122.1720,
      location_name: "Roble Field",
      starts_at: new Date(now.getTime() + 180 * 60000).toISOString(),
      ends_at: new Date(now.getTime() + 360 * 60000).toISOString(),
      campus: "stanford",
      vibe: "chill",
    },
    {
      id: "evt-8",
      title: "🔥 Bonfire & S'mores",
      description: "End of week celebration! Bring your stories and your appetite.",
      category: "social",
      creator_id: "user-1",
      lat: 37.4310,
      lng: -122.1695,
      location_name: "Lake Lag",
      starts_at: new Date(now.getTime() - 10 * 60000).toISOString(),
      ends_at: new Date(now.getTime() + 150 * 60000).toISOString(),
      campus: "stanford",
      vibe: "social",
    },
  ];

  const insertEvent = db.prepare(
    `INSERT INTO events (id, title, description, category, creator_id, lat, lng, location_name, starts_at, ends_at, campus, vibe)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const e of events) {
    insertEvent.run(e.id, e.title, e.description, e.category, e.creator_id, e.lat, e.lng, e.location_name, e.starts_at, e.ends_at, e.campus, e.vibe);
  }

  // Add RSVPs for social proof
  const insertRsvp = db.prepare(
    "INSERT INTO rsvps (id, event_id, user_id, status) VALUES (?, ?, ?, 'going')"
  );
  const rsvps = [
    { event_id: "evt-1", users: ["user-2", "user-3", "user-5"] },
    { event_id: "evt-2", users: ["user-4", "user-6"] },
    { event_id: "evt-3", users: ["user-1", "user-4", "user-5", "user-7"] },
    { event_id: "evt-4", users: ["user-1", "user-2", "user-3", "user-5", "user-6", "user-7"] },
    { event_id: "evt-5", users: ["user-3", "user-7"] },
    { event_id: "evt-6", users: ["user-1", "user-2", "user-7"] },
    { event_id: "evt-8", users: ["user-2", "user-3", "user-4", "user-5", "user-6"] },
  ];
  let rsvpIdx = 0;
  for (const r of rsvps) {
    for (const uid of r.users) {
      insertRsvp.run(`rsvp-${rsvpIdx++}`, r.event_id, uid);
    }
  }

  // Seed some chat messages
  const insertMsg = db.prepare(
    "INSERT INTO messages (id, event_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  const msgs = [
    { event_id: "evt-1", user_id: "user-2", content: "On my way! 🏃", mins_ago: 5 },
    { event_id: "evt-1", user_id: "user-3", content: "I'll bring water bottles", mins_ago: 3 },
    { event_id: "evt-4", user_id: "user-6", content: "How many tacos left??", mins_ago: 8 },
    { event_id: "evt-4", user_id: "user-4", content: "Still plenty! Come thru", mins_ago: 6 },
    { event_id: "evt-8", user_id: "user-3", content: "This is gonna be so good 🔥", mins_ago: 2 },
  ];
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    const ts = new Date(now.getTime() - m.mins_ago * 60000).toISOString();
    insertMsg.run(`msg-${i}`, m.event_id, m.user_id, m.content, ts);
  }

  // Seed a community
  db.prepare(
    "INSERT INTO communities (id, name, description, campus, creator_id) VALUES (?, ?, ?, ?, ?)"
  ).run("comm-1", "Stanford Night Owls", "Late night adventures and spontaneous plans", "stanford", "user-1");

  db.prepare(
    "INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)"
  ).run("comm-1", "user-1", "admin");
  db.prepare(
    "INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)"
  ).run("comm-1", "user-2", "member");
}
