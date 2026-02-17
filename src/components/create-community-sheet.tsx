"use client";

import { useState } from "react";
import { createCommunity } from "@/lib/actions";
import { useAppStore } from "@/lib/store";
import type { User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

const ICONS = ["🎮", "📚", "🎵", "🍕", "⚽", "🎨", "💻", "🌲", "🎭", "🏀", "🎬", "🧠", "🎤", "🚀", "🌍", "🧘"];

interface CreateCommunitySheetProps {
  user: User;
  onCreated: () => void;
}

export function CreateCommunitySheet({ user, onCreated }: CreateCommunitySheetProps) {
  const { setShowCreateCommunity } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [icon, setIcon] = useState("🎮");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    await createCommunity({
      name: form.get("name") as string,
      description: form.get("description") as string,
      icon,
    });

    setLoading(false);
    setShowCreateCommunity(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateCommunity(false)}>
      <div
        className="w-full max-w-lg bg-card rounded-t-3xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-bricolage)" }}>
            Create Community
          </h2>
          <button onClick={() => setShowCreateCommunity(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Icon</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all border ${
                    icon === i ? "bg-primary/20 border-primary" : "bg-secondary/50 border-border/50"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
            <Input
              name="name"
              placeholder="Community name..."
              required
              className="mt-1 bg-secondary/50 border-border/50 h-12 text-base"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea
              name="description"
              placeholder="What's this community about?"
              rows={3}
              className="mt-1 bg-secondary/50 border-border/50 resize-none"
            />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? "Creating..." : "Create Community"}
          </Button>
        </form>
      </div>
    </div>
  );
}
