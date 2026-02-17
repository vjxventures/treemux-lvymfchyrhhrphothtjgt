# Miggoo - What's happening near you right now?

Students don't know what's going on around them. Parties, study groups, pickup games, free food — it's all happening, but discovery depends on closed group chats and disappearing stories. **Miggoo is a map-first, real-time event discovery app** that answers one question: *what's happening on campus right now?*

Open the app and you see a live map with pulsing markers for active events, attendee counts for social proof, and a one-tap "I'm going" RSVP that opens event chat instantly. The UI is designed around a single magical moment: you see something interesting happening nearby, and you decide to leave your dorm. There's no infinite feed, no algorithmic engagement — just proximity, urgency, and the human pull of FOMO.

What makes Miggoo technically interesting is the bias toward *now* over *later*: events happening in real-time pulse and float to the top, dying events flash urgency ("Ending in 12m"), and the entire data model is campus-scoped so every user sees a dense, relevant map from day one. The architecture — Next.js, Leaflet, SQLite, shadcn/ui — is deliberately scrappy because the hardest problem isn't infrastructure, it's achieving critical mass of live events per campus per hour. Everything else is a premature optimization.
