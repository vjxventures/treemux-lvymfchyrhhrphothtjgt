'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import EventMap from '@/components/map/EventMap';
import EventList from '@/components/events/EventList';
import EventDetail from '@/components/events/EventDetail';
import CreateEvent from '@/components/events/CreateEvent';
import CommunityPanel from '@/components/events/CommunityPanel';
import ConnectionsPanel from '@/components/events/ConnectionsPanel';
import { Map, CalendarDays, Users, UserCircle, Plus, Sparkles } from 'lucide-react';

export default function AppShell() {
  const {
    activePanel, setActivePanel, fetchEvents,
    showEventCreate, setShowEventCreate, showEventDetail,
    events, trackEvent,
  } = useAppStore();

  useEffect(() => {
    fetchEvents();
    trackEvent('app_opened', {});
    // Refresh every 30s to keep events fresh
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = events.filter(e => e.is_active).length;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-surface-dark overflow-hidden relative">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Top bar */}
      <header className="relative z-20 h-14 flex items-center justify-between px-4 border-b border-white/[0.06] glass">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-neon-pink" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">mig</span>
            <span className="text-neon-pink">goo</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-green/10 border border-neon-green/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
              </span>
              <span className="text-[11px] font-semibold text-neon-green">{activeCount} live</span>
            </div>
          )}

          <span className="text-xs text-muted-foreground">MIT Campus</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Map (always visible as base layer) */}
        <div className="absolute inset-0 z-0">
          <EventMap />
        </div>

        {/* Side panel */}
        {activePanel !== 'map' && (
          <div className="relative z-10 w-full sm:w-[380px] h-full glass border-r border-white/[0.06] animate-slide-in-right">
            {activePanel === 'events' && <EventList />}
            {activePanel === 'communities' && <CommunityPanel />}
            {activePanel === 'connections' && <ConnectionsPanel />}
            {activePanel === 'profile' && (
              <div className="p-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
                    D
                  </div>
                  <h3 className="font-bold text-lg text-white">Demo User</h3>
                  <p className="text-sm text-muted-foreground">demo@mit.edu</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">MIT · Just exploring Miggoo!</p>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="text-xs text-muted-foreground mb-1">Events Attended</div>
                    <div className="text-xl font-bold text-neon-cyan">3</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="text-xs text-muted-foreground mb-1">Connections</div>
                    <div className="text-xl font-bold text-neon-pink">2</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="text-xs text-muted-foreground mb-1">Communities</div>
                    <div className="text-xl font-bold text-neon-purple">1</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAB - Create Event */}
        <button
          onClick={() => setShowEventCreate(true)}
          className="absolute z-20 bottom-24 right-4 w-14 h-14 rounded-full bg-neon-pink hover:bg-neon-pink/90 text-white flex items-center justify-center shadow-lg glow-pink transition-all hover:scale-105 active:scale-95"
          title="Create Event"
        >
          <Plus className="w-6 h-6" />
        </button>
      </main>

      {/* Bottom navigation */}
      <nav className="relative z-20 h-16 flex items-center justify-around px-2 border-t border-white/[0.06] glass">
        {([
          { key: 'map', icon: Map, label: 'Discover' },
          { key: 'events', icon: CalendarDays, label: 'Events' },
          { key: 'communities', icon: Users, label: 'Groups' },
          { key: 'connections', icon: UserCircle, label: 'People' },
          { key: 'profile', icon: UserCircle, label: 'Profile' },
        ] as const).map(({ key, icon: Icon, label }) => {
          const isActive = activePanel === key;
          return (
            <button
              key={key}
              onClick={() => setActivePanel(key)}
              className={`
                flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all
                ${isActive
                  ? 'text-neon-pink'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-neon-pink mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      {showEventCreate && <CreateEvent />}
      {showEventDetail && <EventDetail />}
    </div>
  );
}
