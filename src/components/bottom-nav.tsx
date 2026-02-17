"use client";

import { useAppStore, type AppTab } from "@/lib/store";
import { Map, Users, MessageCircle, User as UserIcon } from "lucide-react";
import type { User } from "@/lib/auth";

interface BottomNavProps {
  user: User;
  conversations: never[];
}

const tabs: { id: AppTab; label: string; icon: typeof Map }[] = [
  { id: "discover", label: "Discover", icon: Map },
  { id: "communities", label: "Groups", icon: Users },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "profile", label: "Profile", icon: UserIcon },
];

export function BottomNav({ conversations }: BottomNavProps) {
  const { currentTab, setCurrentTab } = useAppStore();

  const unreadCount = (conversations as Array<{ unread_count?: number }>).reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0
  );

  return (
    <nav className="flex-shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-xl px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          const showBadge = tab.id === "chat" && unreadCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute -bottom-0 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
