'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, UserPlus } from 'lucide-react';

export default function ConnectionsPanel() {
  const { connections, fetchConnections, acceptConnection, currentUserId } = useAppStore();

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const pending = connections.filter(
    (c) => {
      const conn = c as unknown as { status: string; connected_user_id: string };
      return conn.status === 'pending' && conn.connected_user_id === currentUserId;
    }
  );
  const accepted = connections.filter(
    (c) => (c as unknown as { status: string }).status === 'accepted'
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-foreground">Connections</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-neon-yellow uppercase tracking-wider">
                  Pending Requests
                </span>
                <Badge className="bg-neon-yellow/20 text-neon-yellow text-[10px] h-4 px-1.5">
                  {pending.length}
                </Badge>
              </div>
              {pending.map((conn) => {
                const c = conn as unknown as { id: string; connected_name: string; connected_bio: string; other_user_id: string };
                return (
                  <div key={c.id} className="p-3 rounded-xl border border-neon-yellow/20 bg-neon-yellow/[0.03] flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-yellow to-neon-pink flex items-center justify-center text-xs font-bold text-white">
                      {c.connected_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.connected_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.connected_bio}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => acceptConnection(c.id)}
                      className="h-7 px-3 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Accept
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Connected */}
          {accepted.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-neon-cyan uppercase tracking-wider mb-2 block">
                Your People ({accepted.length})
              </span>
              {accepted.map((conn, i) => {
                const c = conn as unknown as { id: string; connected_name: string; connected_bio: string };
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-white/[0.06] bg-surface-card flex items-center gap-3 mb-2 animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-xs font-bold text-white">
                      {c.connected_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.connected_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.connected_bio}</p>
                    </div>
                    <Badge className="bg-neon-green/10 text-neon-green text-[10px] border-neon-green/20">
                      Connected
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {connections.length === 0 && (
            <div className="py-8 text-center">
              <UserPlus className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No connections yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Connect with people at events!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
