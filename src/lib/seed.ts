import { getStore, now } from "./db";
import type { UserRow, CommunityRow } from "./db";
import { v4 as uuid } from "uuid";

const CAMPUS = "MIT Campus";
const UNIVERSITY = "MIT";

const BASE_LAT = 42.3601;
const BASE_LNG = -71.0942;

function rLat() {
  return BASE_LAT + (Math.random() - 0.5) * 0.012;
}
function rLng() {
  return BASE_LNG + (Math.random() - 0.5) * 0.015;
}

export function ensureSeeded() {
  const store = getStore();
  if (store.seeded) return;
  store.seeded = true;
  seedDatabase();
}

export function seedDatabase() {
  const store = getStore();

  if (store.users.size > 0) return;

  const ts = now();

  // Create users
  const users: UserRow[] = [
    { id: uuid(), email: "alex@mit.edu", name: "Alex Chen", avatar_url: "/avatars/1.svg", role: "ambassador", university: UNIVERSITY, campus: CAMPUS, bio: "Alex loves campus life!", verified: 1, created_at: ts, last_active: ts },
    { id: uuid(), email: "maya@mit.edu", name: "Maya Patel", avatar_url: "/avatars/2.svg", role: "student", university: UNIVERSITY, campus: CAMPUS, bio: "Maya loves campus life!", verified: 1, created_at: ts, last_active: ts },
    { id: uuid(), email: "jordan@mit.edu", name: "Jordan Rivera", avatar_url: "/avatars/3.svg", role: "student", university: UNIVERSITY, campus: CAMPUS, bio: "Jordan loves campus life!", verified: 1, created_at: ts, last_active: ts },
    { id: uuid(), email: "sam@mit.edu", name: "Sam Williams", avatar_url: "/avatars/4.svg", role: "student", university: UNIVERSITY, campus: CAMPUS, bio: "Sam loves campus life!", verified: 1, created_at: ts, last_active: ts },
    { id: uuid(), email: "kai@mit.edu", name: "Kai Nakamura", avatar_url: "/avatars/5.svg", role: "student", university: UNIVERSITY, campus: CAMPUS, bio: "Kai loves campus life!", verified: 1, created_at: ts, last_active: ts },
    { id: uuid(), email: "zoe@mit.edu", name: "Zoe Mitchell", avatar_url: "/avatars/6.svg", role: "student", university: UNIVERSITY, campus: CAMPUS, bio: "Zoe loves campus life!", verified: 1, created_at: ts, last_active: ts },
    { id: uuid(), email: "liam@mit.edu", name: "Liam O'Brien", avatar_url: "/avatars/7.svg", role: "student", university: UNIVERSITY, campus: CAMPUS, bio: "Liam loves campus life!", verified: 1, created_at: ts, last_active: ts },
    { id: uuid(), email: "nina@mit.edu", name: "Nina Gonzalez", avatar_url: "/avatars/8.svg", role: "ambassador", university: UNIVERSITY, campus: CAMPUS, bio: "Nina loves campus life!", verified: 1, created_at: ts, last_active: ts },
  ];

  for (const u of users) {
    store.users.set(u.id, u);
  }

  // Create communities
  const communities: CommunityRow[] = [
    { id: uuid(), name: "MIT Hackers", description: "Hackathons, coding sessions, and tech talks", icon: "\u{1F4BB}", campus: CAMPUS, creator_id: users[0].id, member_count: 1, created_at: ts },
    { id: uuid(), name: "Outdoor Adventures", description: "Hiking, kayaking, and exploring Boston", icon: "\u{1F332}", campus: CAMPUS, creator_id: users[1].id, member_count: 1, created_at: ts },
    { id: uuid(), name: "Music & Vibes", description: "Open mics, jam sessions, and concerts", icon: "\u{1F3B5}", campus: CAMPUS, creator_id: users[2].id, member_count: 1, created_at: ts },
    { id: uuid(), name: "Foodies United", description: "Food trucks, cooking nights, and restaurant hopping", icon: "\u{1F355}", campus: CAMPUS, creator_id: users[3].id, member_count: 1, created_at: ts },
    { id: uuid(), name: "Sports Club", description: "Pickup games, intramurals, and watch parties", icon: "\u26BD", campus: CAMPUS, creator_id: users[4].id, member_count: 1, created_at: ts },
    { id: uuid(), name: "Art Collective", description: "Gallery visits, studio sessions, and creative workshops", icon: "\u{1F3A8}", campus: CAMPUS, creator_id: users[5].id, member_count: 1, created_at: ts },
  ];

  for (const c of communities) {
    store.communities.set(c.id, c);
    store.communityMembers.push({ community_id: c.id, user_id: c.creator_id, role: "creator", joined_at: ts });

    // Add random members
    const memberCount = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    for (let i = 0; i < memberCount; i++) {
      if (shuffled[i].id !== c.creator_id) {
        const alreadyMember = store.communityMembers.some(
          (m) => m.community_id === c.id && m.user_id === shuffled[i].id
        );
        if (!alreadyMember) {
          store.communityMembers.push({ community_id: c.id, user_id: shuffled[i].id, role: "member", joined_at: ts });
        }
      }
    }
  }

  // Update community member counts
  for (const c of communities) {
    c.member_count = store.communityMembers.filter((m) => m.community_id === c.id).length;
  }

  // Create events
  const n = new Date();
  const events = [
    { id: uuid(), title: "Late Night Hack Session", description: "Bring your laptop and your wildest ideas. Pizza provided. Building cool things until sunrise.", category: "study", lat: rLat(), lng: rLng(), location_name: "Stata Center, Room 32-144", starts_at: new Date(n.getTime() - 60 * 60 * 1000).toISOString(), ends_at: new Date(n.getTime() + 3 * 60 * 60 * 1000).toISOString(), status: "live", creator: 0, community: 0, vibe: "focused, energetic" },
    { id: uuid(), title: "Rooftop Sunset Hangout", description: "Chill vibes on the rooftop. Bring drinks, good music, and good energy.", category: "social", lat: rLat(), lng: rLng(), location_name: "East Campus Rooftop", starts_at: new Date(n.getTime() - 30 * 60 * 1000).toISOString(), ends_at: new Date(n.getTime() + 2 * 60 * 60 * 1000).toISOString(), status: "live", creator: 1, community: null, vibe: "chill, sunset, social" },
    { id: uuid(), title: "Pickup Basketball", description: "5v5 at the outdoor courts. All skill levels welcome!", category: "sports", lat: rLat(), lng: rLng(), location_name: "Briggs Field Courts", starts_at: new Date(n.getTime() - 20 * 60 * 1000).toISOString(), ends_at: new Date(n.getTime() + 90 * 60 * 1000).toISOString(), status: "live", creator: 4, community: 4, vibe: "competitive, fun" },
    { id: uuid(), title: "Open Mic Night", description: "Sign up to perform or just come watch. Poetry, music, comedy \u2014 anything goes.", category: "music", lat: rLat(), lng: rLng(), location_name: "Student Center, La Sala", starts_at: new Date(n.getTime() + 2 * 60 * 60 * 1000).toISOString(), ends_at: new Date(n.getTime() + 5 * 60 * 60 * 1000).toISOString(), status: "upcoming", creator: 2, community: 2, vibe: "creative, intimate" },
    { id: uuid(), title: "Ramen Pop-Up", description: "Homemade tonkotsu ramen by @kai. Limited to 30 bowls. First come, first served.", category: "food", lat: rLat(), lng: rLng(), location_name: "Next House Kitchen", starts_at: new Date(n.getTime() + 4 * 60 * 60 * 1000).toISOString(), ends_at: null, status: "upcoming", creator: 4, community: 3, vibe: "delicious, cozy" },
    { id: uuid(), title: "Figure Drawing Session", description: "Drop in for an hour or stay all evening. All materials provided.", category: "art", lat: rLat(), lng: rLng(), location_name: "Media Lab, E14", starts_at: new Date(n.getTime() + 5 * 60 * 60 * 1000).toISOString(), ends_at: new Date(n.getTime() + 8 * 60 * 60 * 1000).toISOString(), status: "upcoming", creator: 5, community: 5, vibe: "relaxing, creative" },
    { id: uuid(), title: "Late Night Taco Run", description: "Carpool to the best taco truck in Somerville. Leaving at 11pm sharp.", category: "food", lat: rLat(), lng: rLng(), location_name: "Student Center Lobby", starts_at: new Date(n.getTime() + 7 * 60 * 60 * 1000).toISOString(), ends_at: null, status: "upcoming", creator: 3, community: null, vibe: "spontaneous, fun" },
    { id: uuid(), title: "Morning Yoga on the Lawn", description: "Start your day right. Bring a mat or a towel. Beginner-friendly.", category: "sports", lat: rLat(), lng: rLng(), location_name: "Killian Court", starts_at: new Date(n.getTime() + 14 * 60 * 60 * 1000).toISOString(), ends_at: new Date(n.getTime() + 15 * 60 * 60 * 1000).toISOString(), status: "upcoming", creator: 1, community: null, vibe: "peaceful, energizing" },
    { id: uuid(), title: "Board Game Night", description: "Settlers, Codenames, Betrayal... bring your favorites or try something new.", category: "social", lat: rLat(), lng: rLng(), location_name: "McCormick Hall Lounge", starts_at: new Date(n.getTime() + 3 * 60 * 60 * 1000).toISOString(), ends_at: new Date(n.getTime() + 7 * 60 * 60 * 1000).toISOString(), status: "upcoming", creator: 6, community: null, vibe: "nerdy, social" },
    { id: uuid(), title: "DJ Set & Dance Party", description: "House music meets campus energy. Basement party with local DJs.", category: "party", lat: rLat(), lng: rLng(), location_name: "Senior House Basement", starts_at: new Date(n.getTime() + 8 * 60 * 60 * 1000).toISOString(), ends_at: new Date(n.getTime() + 12 * 60 * 60 * 1000).toISOString(), status: "upcoming", creator: 7, community: 2, vibe: "loud, electric, dance" },
    { id: uuid(), title: "Study Grind: Finals Prep", description: "Quiet co-working session. Snacks and coffee provided. No talking zone.", category: "study", lat: rLat(), lng: rLng(), location_name: "Hayden Library, 2nd Floor", starts_at: new Date(n.getTime() + 1 * 60 * 60 * 1000).toISOString(), ends_at: new Date(n.getTime() + 6 * 60 * 60 * 1000).toISOString(), status: "upcoming", creator: 0, community: 0, vibe: "focused, quiet" },
    { id: uuid(), title: "Stargazing Night", description: "Meet at the observatory. Clear skies tonight! Telescope will be set up.", category: "social", lat: rLat(), lng: rLng(), location_name: "MIT Observatory, Roof", starts_at: new Date(n.getTime() + 10 * 60 * 60 * 1000).toISOString(), ends_at: null, status: "upcoming", creator: 5, community: null, vibe: "magical, romantic, peaceful" },
  ];

  for (const e of events) {
    store.events.set(e.id, {
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      lat: e.lat,
      lng: e.lng,
      location_name: e.location_name,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      status: e.status,
      creator_id: users[e.creator].id,
      community_id: e.community !== null ? communities[e.community].id : null,
      campus: CAMPUS,
      max_attendees: null,
      vibe: e.vibe,
      image_url: null,
      created_at: ts,
    });

    // Creator as attendee
    store.eventAttendees.push({
      event_id: e.id,
      user_id: users[e.creator].id,
      status: e.status === "live" ? "checked_in" : "going",
      joined_at: ts,
    });

    // Random attendees
    const attCount = 2 + Math.floor(Math.random() * 5);
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    for (let i = 0; i < attCount; i++) {
      if (shuffled[i].id !== users[e.creator].id) {
        const alreadyAttending = store.eventAttendees.some(
          (a) => a.event_id === e.id && a.user_id === shuffled[i].id
        );
        if (!alreadyAttending) {
          store.eventAttendees.push({
            event_id: e.id,
            user_id: shuffled[i].id,
            status: Math.random() > 0.5 ? "going" : "interested",
            joined_at: ts,
          });
        }
      }
    }
  }

  // Event conversations
  const msgs = ["Who's coming tonight?", "Can't wait for this!", "Is there parking nearby?", "Bringing snacks!", "What should I bring?"];
  for (const e of events) {
    const convId = uuid();
    store.conversations.set(convId, { id: convId, type: "event", ref_id: e.id, title: e.title, created_at: ts });
    store.conversationMembers.push({ conversation_id: convId, user_id: users[e.creator].id, last_read: ts });

    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      const sender = users[Math.floor(Math.random() * users.length)];
      const alreadyMember = store.conversationMembers.some(
        (cm) => cm.conversation_id === convId && cm.user_id === sender.id
      );
      if (!alreadyMember) {
        store.conversationMembers.push({ conversation_id: convId, user_id: sender.id, last_read: ts });
      }
      store.messages.push({
        id: uuid(),
        conversation_id: convId,
        sender_id: sender.id,
        content: msgs[i % msgs.length],
        created_at: new Date(n.getTime() - (60 - i * 10) * 60 * 1000).toISOString(),
      });
    }
  }

  // Community conversations
  for (const c of communities) {
    const convId = uuid();
    store.conversations.set(convId, { id: convId, type: "community", ref_id: c.id, title: c.name, created_at: ts });
    for (const u of users.slice(0, 4)) {
      const alreadyMember = store.conversationMembers.some(
        (cm) => cm.conversation_id === convId && cm.user_id === u.id
      );
      if (!alreadyMember) {
        store.conversationMembers.push({ conversation_id: convId, user_id: u.id, last_read: ts });
      }
    }
    store.messages.push({ id: uuid(), conversation_id: convId, sender_id: users[0].id, content: `Welcome to ${c.name}!`, created_at: new Date(n.getTime() - 24 * 60 * 60 * 1000).toISOString() });
    store.messages.push({ id: uuid(), conversation_id: convId, sender_id: users[1].id, content: "Excited to be here!", created_at: new Date(n.getTime() - 12 * 60 * 60 * 1000).toISOString() });
  }

  // Connections
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      if (Math.random() > 0.5) {
        store.connections.push({ id: uuid(), from_user_id: users[i].id, to_user_id: users[j].id, status: "accepted", created_at: ts });
      }
    }
  }

  console.log("In-memory database seeded successfully!");
}
