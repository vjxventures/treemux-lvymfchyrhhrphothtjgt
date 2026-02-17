"use client";

import { useState } from "react";
import { updateProfile, logoutAction } from "@/lib/actions";
import type { User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LogOut, Edit2, Check, Calendar, Users, Shield, MapPin } from "lucide-react";

interface ConnectionData {
  id: string;
  from_name: string;
  to_name: string;
  from_avatar: string;
  to_avatar: string;
  from_user_id: string;
  to_user_id: string;
}

interface EventData {
  id: string;
  title: string;
  creator_id: string;
  status: string;
}

interface ProfileViewProps {
  user: User;
  connections: never[];
  events: never[];
}

export function ProfileView({ user, connections, events }: ProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || "");
  const [name, setName] = useState(user.name);

  const typedConnections = connections as unknown as ConnectionData[];
  const typedEvents = events as unknown as EventData[];

  const myEvents = typedEvents.filter((e) => e.creator_id === user.id);

  async function handleSave() {
    await updateProfile({ name, bio });
    setEditing(false);
  }

  async function handleLogout() {
    await logoutAction();
    window.location.reload();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-bricolage)" }}>
          Profile
        </h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground gap-1.5">
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Profile card */}
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-secondary/50 border-border/50 h-8 text-sm font-medium"
                    />
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people about yourself..."
                      rows={2}
                      className="bg-secondary/50 border-border/50 resize-none text-xs"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} className="h-7 text-xs rounded-lg gap-1">
                        <Check className="w-3 h-3" />
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs rounded-lg">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{user.name}</h2>
                      <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                    {user.bio && <p className="text-sm mt-2 text-foreground/80">{user.bio}</p>}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <Badge variant="outline" className="text-xs gap-1">
                <MapPin className="w-3 h-3" />
                {user.campus}
              </Badge>
              <Badge variant="outline" className="text-xs gap-1 capitalize">
                <Shield className="w-3 h-3" />
                {user.role}
              </Badge>
              {user.verified === 1 && (
                <Badge className="text-xs bg-live/20 text-live border-live/30 gap-1">
                  <Check className="w-3 h-3" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
              <p className="text-2xl font-bold text-primary">{myEvents.length}</p>
              <p className="text-xs text-muted-foreground">Events created</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
              <p className="text-2xl font-bold text-live">{typedConnections.length}</p>
              <p className="text-xs text-muted-foreground">Connections</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {myEvents.filter((e) => e.status === "live").length}
              </p>
              <p className="text-xs text-muted-foreground">Live now</p>
            </div>
          </div>

          {/* Connections */}
          {typedConnections.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Connections
              </h3>
              <div className="flex flex-wrap gap-2">
                {typedConnections.map((conn) => {
                  const otherName = conn.from_user_id === user.id ? conn.to_name : conn.from_name;
                  const otherAvatar = conn.from_user_id === user.id ? conn.to_avatar : conn.from_avatar;
                  return (
                    <div key={conn.id} className="flex items-center gap-1.5 bg-secondary rounded-full pl-1 pr-3 py-1">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={otherAvatar} />
                        <AvatarFallback className="text-[10px]">{otherName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{otherName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* My events */}
          {myEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                My Events
              </h3>
              <div className="space-y-2">
                {myEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <span className="text-sm font-medium">{event.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {event.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ambassador link */}
          {(user.role === "ambassador" || user.role === "admin") && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Shield className="w-4 h-4" />
                Ambassador Dashboard
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                You have moderation access for {user.campus}.
              </p>
              <a href="/ambassador">
                <Button variant="outline" size="sm" className="mt-3 rounded-xl border-primary/30 text-primary hover:bg-primary/10">
                  Open Dashboard
                </Button>
              </a>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
