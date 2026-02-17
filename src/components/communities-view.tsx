"use client";

import { useState } from "react";
import { joinCommunity } from "@/lib/actions";
import { useAppStore } from "@/lib/store";
import type { User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Users, Check } from "lucide-react";

interface CommunityData {
  id: string;
  name: string;
  description: string;
  icon: string;
  campus: string;
  creator_name: string;
  member_count: number;
}

interface CommunitiesViewProps {
  communities: never[];
  user: User;
  onRefresh: () => void;
}

export function CommunitiesView({ communities, user, onRefresh }: CommunitiesViewProps) {
  const { setShowCreateCommunity } = useAppStore();
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const typedCommunities = communities as unknown as CommunityData[];

  async function handleJoin(communityId: string) {
    await joinCommunity(communityId);
    setJoinedIds((prev) => new Set([...prev, communityId]));
    onRefresh();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-bricolage)" }}>
            Communities
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {typedCommunities.length} groups on {user.campus}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateCommunity(true)}
          size="sm"
          className="rounded-xl gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 pt-2 space-y-3">
          {typedCommunities.map((community, i) => (
            <div
              key={community.id}
              className="rounded-2xl border border-border/50 bg-card p-4 animate-float-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                  {community.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{community.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {community.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {community.member_count} members
                    </span>
                    <span className="text-xs text-muted-foreground">
                      by {community.creator_name}
                    </span>
                  </div>
                </div>
                <Button
                  variant={joinedIds.has(community.id) ? "secondary" : "default"}
                  size="sm"
                  className="shrink-0 rounded-xl"
                  onClick={() => handleJoin(community.id)}
                >
                  {joinedIds.has(community.id) ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Joined
                    </>
                  ) : (
                    "Join"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
