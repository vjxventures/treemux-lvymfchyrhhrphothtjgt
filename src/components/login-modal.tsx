"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginModalProps {
  onLogin: (user: { id: string; name: string }) => void;
  onClose: () => void;
}

export function LoginModal({ onLogin, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<"choice" | "form">("choice");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      onLogin(data.user);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }
    if (!email.includes("@") || !email.includes(".edu")) {
      setError("Please use a .edu email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-3xl shadow-2xl p-6 w-full max-w-sm slide-up-enter">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">M</span>
          </div>
          <h2 className="text-xl font-bold">Welcome to Miggoo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            See what&apos;s happening around you right now
          </p>
        </div>

        {mode === "choice" ? (
          <div className="space-y-3">
            <Button
              onClick={handleDemoLogin}
              className="w-full h-12 text-base font-semibold rounded-xl"
              disabled={loading}
            >
              Try as Demo User
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode("form")}
              className="w-full h-12 text-base rounded-xl"
            >
              Sign in with .edu email
            </Button>
            <button
              onClick={onClose}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition py-2"
            >
              Browse without signing in
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-11 rounded-xl"
            />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              type="email"
              className="h-11 rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base font-semibold rounded-xl"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Let's go!"}
            </Button>
            <button
              onClick={() => setMode("choice")}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition py-2"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
