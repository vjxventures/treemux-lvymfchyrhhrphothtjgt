export const CATEGORIES = {
  party: { label: "Party", emoji: "🎉", color: "oklch(0.65 0.25 330)" },
  study: { label: "Study", emoji: "📚", color: "oklch(0.7 0.15 200)" },
  sports: { label: "Sports", emoji: "⚽", color: "oklch(0.72 0.2 145)" },
  food: { label: "Food", emoji: "🍕", color: "oklch(0.75 0.18 55)" },
  music: { label: "Music", emoji: "🎵", color: "oklch(0.65 0.2 300)" },
  art: { label: "Art", emoji: "🎨", color: "oklch(0.7 0.2 350)" },
  social: { label: "Social", emoji: "👋", color: "oklch(0.7 0.15 240)" },
  other: { label: "Other", emoji: "✨", color: "oklch(0.6 0.05 260)" },
} as const;

export type Category = keyof typeof CATEGORIES;

export function getCategoryInfo(cat: string) {
  return CATEGORIES[cat as Category] || CATEGORIES.other;
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);

  if (mins < 0) {
    const absMins = Math.abs(mins);
    if (absMins < 60) return `in ${absMins}m`;
    const absHours = Math.floor(absMins / 60);
    if (absHours < 24) return `in ${absHours}h`;
    return `in ${Math.floor(absHours / 24)}d`;
  }
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatEventTime(startsAt: string, endsAt?: string): string {
  const start = new Date(startsAt);
  const now = new Date();
  const diff = start.getTime() - now.getTime();

  const timeStr = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (diff < 0 && diff > -12 * 60 * 60 * 1000) {
    return `Started ${formatTimeAgo(startsAt)} · ${timeStr}`;
  }

  if (diff > 0 && diff < 60 * 60 * 1000) {
    return `Starts ${formatTimeAgo(startsAt)} · ${timeStr}`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(start);
  eventDay.setHours(0, 0, 0, 0);

  if (eventDay.getTime() === today.getTime()) {
    return `Today · ${timeStr}`;
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (eventDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow · ${timeStr}`;
  }

  return start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + ` · ${timeStr}`;
}
