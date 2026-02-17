'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { EVENT_CATEGORIES } from '@/types';
import type { EventCategory } from '@/types';
import { Users, Plus, X } from 'lucide-react';

export default function CommunityPanel() {
  const {
    communities, fetchCommunities, joinCommunity, loadingCommunities,
    showCommunityCreate, setShowCommunityCreate, createCommunity,
  } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('social');

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  const handleCreate = () => {
    if (!name.trim()) return;
    createCommunity({ name: name.trim(), description: description.trim(), category });
    setName('');
    setDescription('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Communities</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowCommunityCreate(true)}
          className="h-7 px-2 text-neon-cyan hover:text-neon-cyan/80 hover:bg-neon-cyan/10"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          New
        </Button>
      </div>

      {/* Create form */}
      {showCommunityCreate && (
        <div className="p-4 border-b border-white/[0.06] bg-white/[0.02] animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Community</span>
            <button onClick={() => setShowCommunityCreate(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Community name"
              className="bg-white/[0.04] border-white/[0.08] text-sm"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this community about?"
              className="bg-white/[0.04] border-white/[0.08] text-sm min-h-[60px] resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {EVENT_CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                    category === cat.value
                      ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/40'
                      : 'bg-white/[0.04] text-muted-foreground border border-white/[0.06]'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full bg-neon-pink hover:bg-neon-pink/90 text-white font-medium"
            >
              Create Community
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loadingCommunities ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : communities.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No communities yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Start one for your group!</p>
            </div>
          ) : (
            communities.map((comm, i) => {
              const catInfo = EVENT_CATEGORIES.find(c => c.value === comm.category);
              return (
                <div
                  key={comm.id}
                  className="p-4 rounded-xl border border-white/[0.06] bg-surface-card hover:bg-surface-elevated transition-colors animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${catInfo?.color}20` }}
                    >
                      {catInfo?.emoji || '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground">{comm.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{comm.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/[0.04] text-muted-foreground">
                          <Users className="w-2.5 h-2.5 mr-1" />
                          {comm.member_count} members
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => joinCommunity(comm.id)}
                      className="h-7 px-3 text-xs text-neon-cyan hover:bg-neon-cyan/10 shrink-0"
                    >
                      Join
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
