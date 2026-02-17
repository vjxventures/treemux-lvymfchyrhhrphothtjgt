import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'data', 'miggoo.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS campuses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      university TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      radius_km REAL NOT NULL DEFAULT 2.0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      university TEXT NOT NULL,
      campus_id TEXT NOT NULL REFERENCES campuses(id),
      bio TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS communities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      creator_id TEXT NOT NULL REFERENCES users(id),
      campus_id TEXT NOT NULL REFERENCES campuses(id),
      avatar_url TEXT,
      category TEXT NOT NULL DEFAULT 'other',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS community_members (
      community_id TEXT NOT NULL REFERENCES communities(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (community_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      creator_id TEXT NOT NULL REFERENCES users(id),
      community_id TEXT REFERENCES communities(id),
      campus_id TEXT NOT NULL REFERENCES campuses(id),
      category TEXT NOT NULL DEFAULT 'other',
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      location_name TEXT NOT NULL DEFAULT '',
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      max_attendees INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_attendees (
      event_id TEXT NOT NULL REFERENCES events(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'going',
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      connected_user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, connected_user_id)
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      properties TEXT NOT NULL DEFAULT '{}',
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_campus ON events(campus_id);
    CREATE INDEX IF NOT EXISTS idx_events_starts ON events(starts_at);
    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
    CREATE INDEX IF NOT EXISTS idx_chat_event ON chat_messages(event_id);
    CREATE INDEX IF NOT EXISTS idx_connections_user ON connections(user_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_community_members ON community_members(community_id);
  `);

  // Seed data if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM campuses').get() as { count: number };
  if (count.count === 0) {
    seedDatabase(db);
  }
}

function seedDatabase(db: Database.Database) {
  // Create campuses
  const campuses = [
    { id: 'campus-mit', name: 'MIT Campus', university: 'MIT', lat: 42.3601, lng: -71.0942, radius_km: 1.5 },
    { id: 'campus-harvard', name: 'Harvard Yard', university: 'Harvard', lat: 42.3770, lng: -71.1167, radius_km: 1.5 },
    { id: 'campus-stanford', name: 'Stanford Campus', university: 'Stanford', lat: 37.4275, lng: -122.1697, radius_km: 2.0 },
  ];

  const insertCampus = db.prepare('INSERT INTO campuses (id, name, university, lat, lng, radius_km) VALUES (?, ?, ?, ?, ?, ?)');
  for (const c of campuses) {
    insertCampus.run(c.id, c.name, c.university, c.lat, c.lng, c.radius_km);
  }

  // Create users
  const users = [
    { id: 'user-1', name: 'Alex Chen', email: 'alex@mit.edu', university: 'MIT', campus_id: 'campus-mit', avatar_url: null, bio: 'CS major, loves hackathons' },
    { id: 'user-2', name: 'Maya Patel', email: 'maya@mit.edu', university: 'MIT', campus_id: 'campus-mit', avatar_url: null, bio: 'Physics + art enthusiast' },
    { id: 'user-3', name: 'Jordan Kim', email: 'jordan@mit.edu', university: 'MIT', campus_id: 'campus-mit', avatar_url: null, bio: 'Basketball & ML researcher' },
    { id: 'user-4', name: 'Sam Rivera', email: 'sam@mit.edu', university: 'MIT', campus_id: 'campus-mit', avatar_url: null, bio: 'Music producer & EE major' },
    { id: 'user-5', name: 'Priya Sharma', email: 'priya@mit.edu', university: 'MIT', campus_id: 'campus-mit', avatar_url: null, bio: 'Startup founder, coffee addict' },
    { id: 'user-demo', name: 'Demo User', email: 'demo@mit.edu', university: 'MIT', campus_id: 'campus-mit', avatar_url: null, bio: 'Just exploring Miggoo!' },
  ];

  const insertUser = db.prepare('INSERT INTO users (id, name, email, university, campus_id, avatar_url, bio) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, u.university, u.campus_id, u.avatar_url, u.bio);
  }

  // Create communities
  const communities = [
    { id: 'comm-1', name: 'MIT Hackers', description: 'Build cool stuff every weekend', creator_id: 'user-1', campus_id: 'campus-mit', category: 'tech' },
    { id: 'comm-2', name: 'Pickup Basketball', description: 'Drop-in games at the Z-Center', creator_id: 'user-3', campus_id: 'campus-mit', category: 'sports' },
    { id: 'comm-3', name: 'Late Night Foodies', description: 'Exploring Cambridge food at midnight', creator_id: 'user-5', campus_id: 'campus-mit', category: 'food' },
    { id: 'comm-4', name: 'Studio Sessions', description: 'Open mic, jam sessions, and production collabs', creator_id: 'user-4', campus_id: 'campus-mit', category: 'music' },
  ];

  const insertCommunity = db.prepare('INSERT INTO communities (id, name, description, creator_id, campus_id, category) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMember = db.prepare('INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)');

  for (const c of communities) {
    insertCommunity.run(c.id, c.name, c.description, c.creator_id, c.campus_id, c.category);
    insertMember.run(c.id, c.creator_id, 'admin');
  }

  // Add some members
  insertMember.run('comm-1', 'user-2', 'member');
  insertMember.run('comm-1', 'user-5', 'member');
  insertMember.run('comm-2', 'user-1', 'member');
  insertMember.run('comm-2', 'user-4', 'member');
  insertMember.run('comm-3', 'user-2', 'member');
  insertMember.run('comm-4', 'user-2', 'member');
  insertMember.run('comm-1', 'user-demo', 'member');

  // Create events - mix of active NOW, upcoming in next 4 hours, and later today
  const now = new Date();
  const events = [
    {
      id: uuidv4(), title: 'Hackathon Kickoff', description: 'Build something cool in 12 hours! Snacks provided.', creator_id: 'user-1', community_id: 'comm-1', campus_id: 'campus-mit', category: 'tech',
      lat: 42.3612, lng: -71.0918, location_name: 'Stata Center, Room 123',
      starts_at: new Date(now.getTime() - 60 * 60000).toISOString(), ends_at: new Date(now.getTime() + 11 * 3600000).toISOString(), max_attendees: 50,
    },
    {
      id: uuidv4(), title: '3v3 Pickup Game', description: 'Need 2 more for half-court. All skill levels welcome!', creator_id: 'user-3', community_id: 'comm-2', campus_id: 'campus-mit', category: 'sports',
      lat: 42.3592, lng: -71.0956, location_name: 'Z-Center Courts',
      starts_at: new Date(now.getTime() - 30 * 60000).toISOString(), ends_at: new Date(now.getTime() + 90 * 60000).toISOString(), max_attendees: 6,
    },
    {
      id: uuidv4(), title: 'Ramen Run', description: 'Late night ramen crawl through Central Square', creator_id: 'user-5', community_id: 'comm-3', campus_id: 'campus-mit', category: 'food',
      lat: 42.3654, lng: -71.1037, location_name: 'Meeting at Central Sq T Stop',
      starts_at: new Date(now.getTime() + 2 * 3600000).toISOString(), ends_at: new Date(now.getTime() + 4 * 3600000).toISOString(), max_attendees: 8,
    },
    {
      id: uuidv4(), title: 'Open Jam Session', description: 'Bring your instrument or just vibe. All genres welcome.', creator_id: 'user-4', community_id: 'comm-4', campus_id: 'campus-mit', category: 'music',
      lat: 42.3588, lng: -71.0972, location_name: 'Student Center, Basement',
      starts_at: new Date(now.getTime() + 1 * 3600000).toISOString(), ends_at: new Date(now.getTime() + 3 * 3600000).toISOString(), max_attendees: null,
    },
    {
      id: uuidv4(), title: 'Study Group: Linear Algebra', description: 'Prepping for the midterm. Bring your problem sets.', creator_id: 'user-2', community_id: null, campus_id: 'campus-mit', category: 'study',
      lat: 42.3621, lng: -71.0905, location_name: 'Hayden Library, 2nd Floor',
      starts_at: new Date(now.getTime() + 30 * 60000).toISOString(), ends_at: new Date(now.getTime() + 150 * 60000).toISOString(), max_attendees: 10,
    },
    {
      id: uuidv4(), title: 'Sunset Yoga on the Roof', description: 'Decompress before finals. Mats provided.', creator_id: 'user-2', community_id: null, campus_id: 'campus-mit', category: 'social',
      lat: 42.3565, lng: -71.0932, location_name: 'Next House Rooftop',
      starts_at: new Date(now.getTime() + 3 * 3600000).toISOString(), ends_at: new Date(now.getTime() + 4 * 3600000).toISOString(), max_attendees: 15,
    },
    {
      id: uuidv4(), title: 'Board Game Night', description: 'Catan, Codenames, and more. Pizza incoming.', creator_id: 'user-1', community_id: null, campus_id: 'campus-mit', category: 'social',
      lat: 42.3631, lng: -71.0887, location_name: 'East Campus Lounge',
      starts_at: new Date(now.getTime() - 20 * 60000).toISOString(), ends_at: new Date(now.getTime() + 160 * 60000).toISOString(), max_attendees: 20,
    },
    {
      id: uuidv4(), title: 'Startup Pitch Practice', description: 'Present your idea, get brutal honest feedback.', creator_id: 'user-5', community_id: 'comm-1', campus_id: 'campus-mit', category: 'tech',
      lat: 42.3604, lng: -71.0875, location_name: 'Martin Trust Center',
      starts_at: new Date(now.getTime() + 5 * 3600000).toISOString(), ends_at: new Date(now.getTime() + 7 * 3600000).toISOString(), max_attendees: 25,
    },
    {
      id: uuidv4(), title: 'Art Gallery Pop-Up', description: 'Student art showcase. Free entry, wine served.', creator_id: 'user-2', community_id: null, campus_id: 'campus-mit', category: 'art',
      lat: 42.3597, lng: -71.0946, location_name: 'Wiesner Building Gallery',
      starts_at: new Date(now.getTime() - 90 * 60000).toISOString(), ends_at: new Date(now.getTime() + 120 * 60000).toISOString(), max_attendees: null,
    },
    {
      id: uuidv4(), title: 'DJ Set & Dance Party', description: 'House and techno all night. BYOB.', creator_id: 'user-4', community_id: 'comm-4', campus_id: 'campus-mit', category: 'party',
      lat: 42.3573, lng: -71.0989, location_name: 'Random Hall Common Room',
      starts_at: new Date(now.getTime() + 6 * 3600000).toISOString(), ends_at: new Date(now.getTime() + 10 * 3600000).toISOString(), max_attendees: 40,
    },
  ];

  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, description, creator_id, community_id, campus_id, category, lat, lng, location_name, starts_at, ends_at, max_attendees)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAttendee = db.prepare('INSERT INTO event_attendees (event_id, user_id, status) VALUES (?, ?, ?)');

  for (const e of events) {
    insertEvent.run(e.id, e.title, e.description, e.creator_id, e.community_id, e.campus_id, e.category, e.lat, e.lng, e.location_name, e.starts_at, e.ends_at, e.max_attendees);
    // Add creator as attendee
    insertAttendee.run(e.id, e.creator_id, 'going');
    // Add some random attendees
    const others = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'].filter(u => u !== e.creator_id);
    const numAttendees = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numAttendees; i++) {
      try {
        insertAttendee.run(e.id, others[i], Math.random() > 0.3 ? 'going' : 'interested');
      } catch { /* skip duplicates */ }
    }
  }

  // Add some chat messages
  const insertChat = db.prepare('INSERT INTO chat_messages (id, event_id, user_id, content) VALUES (?, ?, ?, ?)');
  const firstEventId = events[0].id;
  insertChat.run(uuidv4(), firstEventId, 'user-1', 'Who\'s bringing the energy drinks? 😄');
  insertChat.run(uuidv4(), firstEventId, 'user-2', 'I got Red Bulls for everyone!');
  insertChat.run(uuidv4(), firstEventId, 'user-5', 'Just arrived, where should I sit?');

  const secondEventId = events[1].id;
  insertChat.run(uuidv4(), secondEventId, 'user-3', 'Courts are open, heading there now');
  insertChat.run(uuidv4(), secondEventId, 'user-1', 'Be there in 5!');

  // Add connections
  const insertConn = db.prepare('INSERT INTO connections (id, user_id, connected_user_id, status) VALUES (?, ?, ?, ?)');
  insertConn.run(uuidv4(), 'user-demo', 'user-1', 'accepted');
  insertConn.run(uuidv4(), 'user-demo', 'user-2', 'accepted');
  insertConn.run(uuidv4(), 'user-3', 'user-demo', 'pending');
}
