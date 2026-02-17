import { getCurrentUser } from "@/lib/auth";
import { getEvents, getCommunities, getConversations, getConnections } from "@/lib/actions";
import { seedDatabase } from "@/lib/seed";
import { AppShell } from "@/components/app-shell";
import { LoginScreen } from "@/components/login-screen";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Auto-seed on first load
  seedDatabase();

  const user = await getCurrentUser();

  if (!user) {
    return <LoginScreen />;
  }

  const [events, communities, conversations, connections] = await Promise.all([
    getEvents(),
    getCommunities(),
    getConversations(),
    getConnections(),
  ]);

  return (
    <AppShell
      user={user}
      initialEvents={events as never[]}
      initialCommunities={communities as never[]}
      initialConversations={conversations as never[]}
      initialConnections={connections as never[]}
    />
  );
}
