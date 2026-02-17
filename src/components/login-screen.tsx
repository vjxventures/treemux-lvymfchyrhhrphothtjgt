"use client";

import { useState } from "react";
import { loginAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export function LoginScreen() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await loginAction(form);
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-live/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-xl border-border/50">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-bricolage)" }}>
                miggoo
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              See what&apos;s happening right now on campus
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
              <Input
                name="name"
                placeholder="Your name"
                required
                className="mt-1 bg-secondary/50 border-border/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">University Email</label>
              <Input
                name="email"
                type="email"
                placeholder="you@university.edu"
                required
                className="mt-1 bg-secondary/50 border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">University</label>
                <Input
                  name="university"
                  placeholder="MIT"
                  defaultValue="MIT"
                  required
                  className="mt-1 bg-secondary/50 border-border/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Campus</label>
                <Input
                  name="campus"
                  placeholder="MIT Campus"
                  defaultValue="MIT Campus"
                  required
                  className="mt-1 bg-secondary/50 border-border/50"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? "Joining..." : "Join Miggoo"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Invite-only. Currently available at select campuses.
            </p>
          </div>

          {/* Quick login buttons for demo */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center mb-3">Quick demo login</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Alex Chen", email: "alex@mit.edu" },
                { name: "Maya Patel", email: "maya@mit.edu" },
              ].map((u) => (
                <form key={u.email} onSubmit={handleSubmit}>
                  <input type="hidden" name="name" value={u.name} />
                  <input type="hidden" name="email" value={u.email} />
                  <input type="hidden" name="university" value="MIT" />
                  <input type="hidden" name="campus" value="MIT Campus" />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full text-xs h-9 border-border/50"
                    disabled={loading}
                  >
                    {u.name}
                  </Button>
                </form>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
