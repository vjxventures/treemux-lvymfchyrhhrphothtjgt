'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EVENT_CATEGORIES } from '@/types';
import type { EventCategory } from '@/types';
import { X, MapPin } from 'lucide-react';

export default function CreateEvent() {
  const { createEvent, setShowEventCreate, mapCenter } = useAppStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('social');
  const [locationName, setLocationName] = useState('');
  const [startsIn, setStartsIn] = useState('30'); // minutes from now
  const [duration, setDuration] = useState('120'); // minutes
  const [maxAttendees, setMaxAttendees] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    const now = new Date();
    const starts = new Date(now.getTime() + parseInt(startsIn) * 60000);
    const ends = new Date(starts.getTime() + parseInt(duration) * 60000);

    // Offset the event location slightly from map center for variety
    const offsetLat = (Math.random() - 0.5) * 0.003;
    const offsetLng = (Math.random() - 0.5) * 0.003;

    createEvent({
      title: title.trim(),
      description: description.trim(),
      category,
      location_name: locationName.trim() || 'On campus',
      lat: mapCenter.lat + offsetLat,
      lng: mapCenter.lng + offsetLng,
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowEventCreate(false)}
      />

      <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface-card border border-white/[0.08] rounded-t-2xl sm:rounded-2xl animate-fade-up">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Create Event</h2>
            <button
              onClick={() => setShowEventCreate(false)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                What&apos;s happening?
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Pickup basketball game"
                className="bg-white/[0.04] border-white/[0.08] text-foreground placeholder:text-muted-foreground/40"
                maxLength={80}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people what to expect..."
                className="bg-white/[0.04] border-white/[0.08] text-foreground placeholder:text-muted-foreground/40 min-h-[80px] resize-none"
                maxLength={500}
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {EVENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all
                      ${category === cat.value
                        ? 'text-white'
                        : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] border border-white/[0.06]'
                      }
                    `}
                    style={category === cat.value ? {
                      backgroundColor: `${cat.color}30`,
                      color: cat.color,
                      border: `1px solid ${cat.color}60`,
                      boxShadow: `0 0 12px ${cat.color}20`,
                    } : {}}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5 block">
                <MapPin className="w-3 h-3" /> Where
              </label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Z-Center Courts, Room 123..."
                className="bg-white/[0.04] border-white/[0.08] text-foreground placeholder:text-muted-foreground/40"
              />
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                Pin will be placed near your current map view
              </p>
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Starts in (min)
                </label>
                <select
                  value={startsIn}
                  onChange={(e) => setStartsIn(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-white/[0.04] border border-white/[0.08] text-foreground text-sm"
                >
                  <option value="0">Right now</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="240">4 hours</option>
                  <option value="480">8 hours</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-white/[0.04] border border-white/[0.08] text-foreground text-sm"
                >
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="300">5 hours</option>
                  <option value="480">8 hours</option>
                </select>
              </div>
            </div>

            {/* Max attendees */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Max attendees (optional)
              </label>
              <Input
                type="number"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(e.target.value)}
                placeholder="Leave empty for unlimited"
                className="bg-white/[0.04] border-white/[0.08] text-foreground placeholder:text-muted-foreground/40"
                min={1}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleCreate}
              disabled={!title.trim()}
              className="w-full bg-neon-pink hover:bg-neon-pink/90 text-white font-semibold h-11 glow-pink disabled:opacity-50 disabled:glow-none"
            >
              Drop the Pin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
