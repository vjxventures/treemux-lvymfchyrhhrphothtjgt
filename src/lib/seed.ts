import { getDb } from "./db";
import { v4 as uuid } from "uuid";

const CAMPUS = "MIT Campus";
const UNIVERSITY = "MIT";

// MIT area coordinates
const BASE_LAT = 42.3601;
const BASE_LNG = -71.0942;

function rLat() {
  return BASE_LAT + (Math.random() - 0.5) * 0.012;
}
function rLng() {
  return BASE_LNG + (Math.random() - 0.5) * 0.015;
}

export function seedDatabase() {
  const db = getDb();

  // Check if already seeded
  const count = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
  if (count > 0) return;

  // Create users
  const users = [
    { id: uuid(), email: "alex@mit.edu", name: "Alex Chen", avatar_url: "/avatars/1.svg", role: "ambassador" },
    { id: uuid(), email: "maya@mit.edu", name: "Maya Patel", avatar_url: "/avatars/2.svg", role: "student" },
    { id: uuid(), email: "jordan@mit.edu", name: "Jordan Rivera", avatar_url: "/avatars/3.svg", role: "student" },
    { id: uuid(), email: "sam@mit.edu", name: "Sam Williams", avatar_url: "/avatars/4.svg", role: "student" },
    { id: uuid(), email: "kai@mit.edu", name: "Kai Nakamura", avatar_url: "/avatars/5.svg", role: "student" },
    { id: uuid(), email: "zoe@mit.edu", name: "Zoe Mitchell", avatar_url: "/avatars/6.svg", role: "student" },
    { id: uuid(), email: "liam@mit.edu", name: "Liam O'Brien", avatar_url: "/avatars/7.svg", role: "student" },
    { id: uuid(), email: "nina@mit.edu", name: "Nina Gonzalez", avatar_url: "/avatars/8.svg", role: "ambassador" },
  ];

  const insertUser = db.prepare(
    `INSERT INTO users (id, email, name, avatar_url, university, campus, role, bio, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
  );

  for (const u of users) {
    insertUser.run(u.id, u.email, u.name, u.avatar_url, UNIVERSITY, CAMPUS, u.role, `${u.name.split(" ")[0]} loves campus life!`);
  }

  // Create communities
  const communities = [
    { id: uuid(), name: "MIT Hackers", description: "Hackathons, coding sessions, and tech talks", icon: "💻", creator: 0 },
    { id: uuid(), name: "Outdoor Adventures", description: "Hiking, kayaking, and exploring Boston", icon: "🌲", creator: 1 },
    { id: uuid(), name: "Music & Vibes", description: "Open mics, jam sessions, and concerts", icon: "🎵", creator: 2 },
    { id: uuid(), name: "Foodies United", description: "Food trucks, cooking nights, and restaurant hopping", icon: "🍕", creator: 3 },
    { id: uuid(), name: "Sports Club", description: "Pickup games, intramurals, and watch parties", icon: "⚽", creator: 4 },
    { id: uuid(), name: "Art Collective", description: "Gallery visits, studio sessions, and creative workshops", icon: "🎨", creator: 5 },
  ];

  const insertComm = db.prepare(
    `INSERT INTO communities (id, name, description, icon, campus, creator_id) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertCommMember = db.prepare(
    `INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)`
  );

  for (const c of communities) {
    insertComm.run(c.id, c.name, c.description, c.icon, CAMPUS, users[c.creator].id);
    insertCommMember.run(c.id, users[c.creator].id, "creator");

    // Add random members
    const memberCount = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    for (let i = 0; i < memberCount; i++) {
      if (shuffled[i].id !== users[c.creator].id) {
        try {
          insertCommMember.run(c.id, shuffled[i].id, "member");
        } catch { /* ignore duplicate */ }
      }
    }
  }

  // Update community member counts
  db.prepare(
    `UPDATE communities SET member_count = (SELECT COUNT(*) FROM community_members WHERE community_id = communities.id)`
  ).run();

  // Create events — a mix of live, upcoming, and past
  const now = new Date();
  const events = [
    {
      id: uuid(), title: "Late Night Hack Session", description: "Bring your laptop and your wildest ideas. Pizza provided. Building cool things until sunrise.",
      category: "study", lat: rLat(), lng: rLng(), location_name: "Stata Center, Room 32-144",
      starts_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), ends_at: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      status: "live", creator: 0, community: 0, vibe: "focused, energetic"
    },
    {
      id: uuid(), title: "Rooftop Sunset Hangout", description: "Chill vibes on the rooftop. Bring drinks, good music, and good energy.",
      category: "social", lat: rLat(), lng: rLng(), location_name: "East Campus Rooftop",
      starts_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), ends_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      status: "live", creator: 1, community: null, vibe: "chill, sunset, social"
    },
    {
      id: uuid(), title: "Pickup Basketball", description: "5v5 at the outdoor courts. All skill levels welcome!",
      category: "sports", lat: rLat(), lng: rLng(), location_name: "Briggs Field Courts",
      starts_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), ends_at: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
      status: "live", creator: 4, community: 4, vibe: "competitive, fun"
    },
    {
      id: uuid(), title: "Open Mic Night", description: "Sign up to perform or just come watch. Poetry, music, comedy — anything goes.",
      category: "music", lat: rLat(), lng: rLng(), location_name: "Student Center, La Sala",
      starts_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), ends_at: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      status: "upcoming", creator: 2, community: 2, vibe: "creative, intimate"
    },
    {
      id: uuid(), title: "Ramen Pop-Up", description: "Homemade tonkotsu ramen by @kai. Limited to 30 bowls. First come, first served.",
      category: "food", lat: rLat(), lng: rLng(), location_name: "Next House Kitchen",
      starts_at: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      status: "upcoming", creator: 4, community: 3, vibe: "delicious, cozy"
    },
    {
      id: uuid(), title: "Figure Drawing Session", description: "Drop in for an hour or stay all evening. All materials provided.",
      category: "art", lat: rLat(), lng: rLng(), location_name: "Media Lab, E14",
      starts_at: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(), ends_at: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      status: "upcoming", creator: 5, community: 5, vibe: "relaxing, creative"
    },
    {
      id: uuid(), title: "Late Night Taco Run", description: "Carpool to the best taco truck in Somerville. Leaving at 11pm sharp.",
      category: "food", lat: rLat(), lng: rLng(), location_name: "Student Center Lobby",
      starts_at: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      status: "upcoming", creator: 3, community: null, vibe: "spontaneous, fun"
    },
    {
      id: uuid(), title: "Morning Yoga on the Lawn", description: "Start your day right. Bring a mat or a towel. Beginner-friendly.",
      category: "sports", lat: rLat(), lng: rLng(), location_name: "Killian Court",
      starts_at: new Date(now.getTime() + 14 * 60 * 60 * 1000).toISOString(), ends_at: new Date(now.getTime() + 15 * 60 * 60 * 1000).toISOString(),
      status: "upcoming", creator: 1, community: null, vibe: "peaceful, energizing"
    },
    {
      id: uuid(), title: "Board Game Night", description: "Settlers, Codenames, Betrayal... bring your favorites or try something new.",
      category: "social", lat: rLat(), lng: rLng(), location_name: "McCormick Hall Lounge",
      starts_at: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(), ends_at: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      status: "upcoming", creator: 6, community: null, vibe: "nerdy, social"
    },
    {
      id: uuid(), title: "DJ Set & Dance Party", description: "House music meets campus energy. Basement party with local DJs.",
      category: "party", lat: rLat(), lng: rLng(), location_name: "Senior House Basement",
      starts_at: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(), ends_at: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      status: "upcoming", creator: 7, community: 2, vibe: "loud, electric, dance"
    },
    {
      id: uuid(), title: "Study Grind: Finals Prep", description: "Quiet co-working session. Snacks and coffee provided. No talking zone.",
      category: "study", lat: rLat(), lng: rLng(), location_name: "Hayden Library, 2nd Floor",
      starts_at: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(), ends_at: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      status: "upcoming", creator: 0, community: 0, vibe: "focused, quiet"
    },
    {
      id: uuid(), title: "Stargazing Night", description: "Meet at the observatory. Clear skies tonight! Telescope will be set up.",
      category: "social", lat: rLat(), lng: rLng(), location_name: "MIT Observatory, Roof",
      starts_at: new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString(),
      status: "upcoming", creator: 5, community: null, vibe: "magical, romantic, peaceful"
    },
  ];

  const insertEvent = db.prepare(
    `INSERT INTO events (id, title, description, category, lat, lng, location_name, starts_at, ends_at, status, creator_id, campus, vibe, community_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertAttendee = db.prepare(
    `INSERT INTO event_attendees (event_id, user_id, status) VALUES (?, ?, ?)`
  );

  for (const e of events) {
    insertEvent.run(
      e.id, e.title, e.description, e.category, e.lat, e.lng, e.location_name,
      e.starts_at, e.ends_at || null, e.status, users[e.creator].id, CAMPUS, e.vibe,
      e.community !== null ? communities[e.community].id : null
    );

    // Add creator as attendee
    insertAttendee.run(e.id, users[e.creator].id, e.status === "live" ? "checked_in" : "going");

    // Add random attendees
    const attCount = 2 + Math.floor(Math.random() * 5);
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    for (let i = 0; i < attCount; i++) {
      if (shuffled[i].id !== users[e.creator].id) {
        try {
          insertAttendee.run(e.id, shuffled[i].id, Math.random() > 0.5 ? "going" : "interested");
        } catch { /* ignore duplicate */ }
      }
    }
  }

  // Create some conversations and messages
  const insertConv = db.prepare(
    `INSERT INTO conversations (id, type, ref_id, title) VALUES (?, ?, ?, ?)`
  );
  const insertConvMember = db.prepare(
    `INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`
  );
  const insertMsg = db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, ?)`
  );

  // Event conversations
  for (const e of events) {
    const convId = uuid();
    insertConv.run(convId, "event", e.id, e.title);
    insertConvMember.run(convId, users[e.creator].id);

    const msgs = [
      "Who's coming tonight?",
      "Can't wait for this!",
      "Is there parking nearby?",
      "Bringing snacks!",
      "What should I bring?",
    ];
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      const sender = users[Math.floor(Math.random() * users.length)];
      try { insertConvMember.run(convId, sender.id); } catch { /* ignore */ }
      insertMsg.run(
        uuid(), convId, sender.id, msgs[i % msgs.length],
        new Date(now.getTime() - (60 - i * 10) * 60 * 1000).toISOString()
      );
    }
  }

  // Community conversations
  for (const c of communities) {
    const convId = uuid();
    insertConv.run(convId, "community", c.id, c.name);
    for (const u of users.slice(0, 4)) {
      try { insertConvMember.run(convId, u.id); } catch { /* ignore */ }
    }
    insertMsg.run(uuid(), convId, users[0].id, `Welcome to ${c.name}!`, new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
    insertMsg.run(uuid(), convId, users[1].id, "Excited to be here!", new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString());
  }

  // Connections
  const insertConn = db.prepare(
    `INSERT OR IGNORE INTO connections (id, from_user_id, to_user_id, status) VALUES (?, ?, ?, 'accepted')`
  );
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      if (Math.random() > 0.5) {
        insertConn.run(uuid(), users[i].id, users[j].id);
      }
    }
  }

  console.log("Database seeded successfully!");
}
