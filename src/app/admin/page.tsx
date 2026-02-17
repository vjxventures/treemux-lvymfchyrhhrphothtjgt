'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Zap, Users, CalendarDays, TrendingUp, MapPin, BarChart3,
  Plus, Sparkles, ArrowLeft,
} from 'lucide-react';
import { EVENT_CATEGORIES } from '@/types';
import type { Event, EventCategory } from '@/types';
import Link from 'next/link';

interface Metrics {
  total_events: number;
  active_events: number;
  total_users: number;
  total_attendances: number;
  recent_analytics: { event_type: string; count: number }[];
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showSeedForm, setShowSeedForm] = useState(false);
  const [seedTitle, setSeedTitle] = useState('');
  const [seedDesc, setSeedDesc] = useState('');
  const [seedCategory, setSeedCategory] = useState<EventCategory>('social');
  const [seedLocation, setSeedLocation] = useState('');
  const [seeding, setSeeding] = useState(false);

  const fetchData = useCallback(async () => {
    const [metricsRes, eventsRes] = await Promise.all([
      fetch('/api/analytics?campus_id=campus-mit'),
      fetch('/api/events?campus_id=campus-mit'),
    ]);
    setMetrics(await metricsRes.json());
    setEvents(await eventsRes.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const seedEvent = async () => {
    if (!seedTitle.trim()) return;
    setSeeding(true);
    const now = new Date();
    const starts = new Date(now.getTime() + Math.floor(Math.random() * 120) * 60000);
    const ends = new Date(starts.getTime() + (120 + Math.floor(Math.random() * 180)) * 60000);
    const offsetLat = (Math.random() - 0.5) * 0.006;
    const offsetLng = (Math.random() - 0.5) * 0.006;

    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: seedTitle.trim(),
        description: seedDesc.trim(),
        creator_id: `user-${Math.ceil(Math.random() * 5)}`,
        campus_id: 'campus-mit',
        category: seedCategory,
        lat: 42.3601 + offsetLat,
        lng: -71.0942 + offsetLng,
        location_name: seedLocation.trim() || 'On campus',
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        max_attendees: Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 5 : null,
      }),
    });

    setSeedTitle('');
    setSeedDesc('');
    setSeedLocation('');
    setSeeding(false);
    fetchData();
  };

  const quickSeedBatch = async () => {
    setSeeding(true);
    const quickEvents = [
      { title: 'Coffee & Code', desc: 'Casual coding session with free coffee', category: 'tech' as EventCategory, location: 'Barker Library Cafe' },
      { title: 'Frisbee on the Green', desc: 'Ultimate frisbee, all welcome!', category: 'sports' as EventCategory, location: 'Killian Court' },
      { title: 'Movie Night: Interstellar', desc: 'Outdoor screening with blankets', category: 'social' as EventCategory, location: 'Student Center Lawn' },
      { title: 'Dumpling Making Workshop', desc: 'Learn to make dumplings from scratch', category: 'food' as EventCategory, location: 'McCormick Kitchen' },
      { title: 'Open Mic Night', desc: 'Poetry, music, comedy - anything goes', category: 'music' as EventCategory, location: 'Coffeehouse Lounge' },
    ];

    for (const e of quickEvents) {
      const now = new Date();
      const starts = new Date(now.getTime() + Math.floor(Math.random() * 240) * 60000);
      const ends = new Date(starts.getTime() + (90 + Math.floor(Math.random() * 120)) * 60000);
      const offsetLat = (Math.random() - 0.5) * 0.005;
      const offsetLng = (Math.random() - 0.5) * 0.005;

      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: e.title,
          description: e.desc,
          creator_id: `user-${Math.ceil(Math.random() * 5)}`,
          campus_id: 'campus-mit',
          category: e.category,
          lat: 42.3601 + offsetLat,
          lng: -71.0942 + offsetLng,
          location_name: e.location,
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          max_attendees: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 5 : null,
        }),
      });
    }

    setSeeding(false);
    fetchData();
  };

  const activeEvents = events.filter(e => e.is_active);

  return (
    <div className="min-h-screen bg-surface-dark text-foreground" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <div className="noise-overlay" />

      {/* Header */}
      <header className="border-b border-white/[0.06] glass sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Sparkles className="w-5 h-5 text-neon-pink" />
            <span className="font-bold text-base">
              <span className="text-white">mig</span>
              <span className="text-neon-pink">goo</span>
              <span className="text-muted-foreground ml-2 text-xs font-normal">Ambassador Dashboard</span>
            </span>
          </div>
          <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30 text-xs">
            MIT Campus
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Events', value: metrics?.total_events ?? '—', icon: CalendarDays, color: 'neon-pink', trend: '+12%' },
            { label: 'Active Now', value: metrics?.active_events ?? '—', icon: Zap, color: 'neon-green', trend: 'live' },
            { label: 'Total Users', value: metrics?.total_users ?? '—', icon: Users, color: 'neon-cyan', trend: '+8%' },
            { label: 'Attendances', value: metrics?.total_attendances ?? '—', icon: TrendingUp, color: 'neon-yellow', trend: '+23%' },
          ].map(({ label, value, icon: Icon, color, trend }) => (
            <Card key={label} className="bg-surface-card border-white/[0.06] hover:border-white/[0.1] transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-5 h-5 text-${color}`} />
                  <Badge variant="secondary" className={`text-[10px] bg-${color}/10 text-${color} border-${color}/20`}>
                    {trend}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* North Star Metric */}
        <Card className="bg-surface-card border-neon-pink/20 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-neon-pink" />
              North Star: Active Visible Events / User / Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-neon-pink">
                {metrics ? (metrics.total_events / Math.max(metrics.total_users, 1)).toFixed(1) : '—'}
              </span>
              <span className="text-sm text-muted-foreground">events per user</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-xs text-muted-foreground">7-Day Retention Target</div>
                <div className="text-lg font-bold text-neon-green mt-1">&ge; 30%</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-xs text-muted-foreground">Events/Campus/Week</div>
                <div className="text-lg font-bold text-neon-cyan mt-1">{metrics?.total_events ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-xs text-muted-foreground">Density Delta</div>
                <div className="text-lg font-bold text-neon-yellow mt-1">+{activeEvents.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Active Events */}
          <Card className="bg-surface-card border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-green" />
                Live Events ({activeEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No active events. Time to seed some!</p>
                ) : (
                  activeEvents.map((event) => {
                    const catInfo = EVENT_CATEGORIES.find(c => c.value === event.category);
                    return (
                      <div key={event.id} className="p-3 rounded-lg border border-neon-green/10 bg-neon-green/[0.02] flex items-center gap-3">
                        <span className="text-lg">{catInfo?.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{event.title}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> {event.location_name}
                            <span className="text-neon-cyan">{event.attendee_count} going</span>
                          </div>
                        </div>
                        <Badge className="bg-neon-green/15 text-neon-green text-[10px] border-neon-green/20 shrink-0">
                          Score: {event.score}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seeding Tools */}
          <Card className="bg-surface-card border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-neon-pink" />
                Seed Events (Ambassador Tool)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={quickSeedBatch}
                  disabled={seeding}
                  className="w-full bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30 font-medium"
                  variant="secondary"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {seeding ? 'Seeding...' : 'Quick Seed: 5 Events'}
                </Button>

                <Separator className="bg-white/[0.06]" />

                <button
                  onClick={() => setShowSeedForm(!showSeedForm)}
                  className="text-xs text-neon-cyan hover:underline"
                >
                  {showSeedForm ? 'Hide custom form' : 'Seed custom event...'}
                </button>

                {showSeedForm && (
                  <div className="space-y-3 animate-fade-up">
                    <Input
                      value={seedTitle}
                      onChange={(e) => setSeedTitle(e.target.value)}
                      placeholder="Event title"
                      className="bg-white/[0.04] border-white/[0.08] text-sm"
                    />
                    <Textarea
                      value={seedDesc}
                      onChange={(e) => setSeedDesc(e.target.value)}
                      placeholder="Description"
                      className="bg-white/[0.04] border-white/[0.08] text-sm min-h-[60px] resize-none"
                    />
                    <Input
                      value={seedLocation}
                      onChange={(e) => setSeedLocation(e.target.value)}
                      placeholder="Location name"
                      className="bg-white/[0.04] border-white/[0.08] text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {EVENT_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setSeedCategory(cat.value)}
                          className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                            seedCategory === cat.value
                              ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/40'
                              : 'bg-white/[0.04] text-muted-foreground border border-white/[0.06]'
                          }`}
                        >
                          {cat.emoji} {cat.label}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={seedEvent}
                      disabled={!seedTitle.trim() || seeding}
                      className="w-full bg-neon-pink hover:bg-neon-pink/90 text-white font-medium"
                    >
                      Seed Event
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics breakdown */}
        {metrics?.recent_analytics && metrics.recent_analytics.length > 0 && (
          <Card className="bg-surface-card border-white/[0.06] mt-8">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-neon-cyan" />
                Analytics (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {metrics.recent_analytics.map((a) => (
                  <div key={a.event_type} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-xs text-muted-foreground capitalize">
                      {a.event_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-lg font-bold text-foreground mt-1">{a.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
