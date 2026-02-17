/**
 * Event scoring algorithm for Miggoo.
 *
 * Core principle: NOW > Later. Proximity > Virality.
 * Events happening right now or about to start score highest.
 * Events further in the future decay in score.
 */

interface ScoreInput {
  starts_at: string;
  ends_at: string;
  attendee_count: number;
  max_attendees: number | null;
  distance_km?: number;
}

export function calculateEventScore(input: ScoreInput): number {
  const now = Date.now();
  const start = new Date(input.starts_at).getTime();
  const end = new Date(input.ends_at).getTime();

  let score = 0;

  // 1. Time relevance (0–50 points)
  // Active events get maximum time score
  if (now >= start && now <= end) {
    // Currently active — highest priority
    const progress = (now - start) / (end - start);
    // Slight decay as event progresses but still high
    score += 50 - (progress * 15);
  } else if (start > now) {
    // Upcoming event
    const hoursUntil = (start - now) / 3600000;
    if (hoursUntil <= 1) {
      score += 40; // Starting very soon
    } else if (hoursUntil <= 4) {
      score += 30 - (hoursUntil * 2); // Next few hours
    } else if (hoursUntil <= 12) {
      score += 15 - (hoursUntil * 0.5); // Today
    } else {
      score += Math.max(0, 5 - (hoursUntil / 24)); // Tomorrow+
    }
  } else {
    // Past event — no score
    return 0;
  }

  // 2. Social proof (0–25 points)
  const attendees = input.attendee_count;
  score += Math.min(25, attendees * 3);

  // 3. Urgency / scarcity (0–15 points)
  if (input.max_attendees && input.max_attendees > 0) {
    const fillRate = attendees / input.max_attendees;
    if (fillRate >= 0.8) {
      score += 15; // Almost full — urgency
    } else if (fillRate >= 0.5) {
      score += 10;
    } else {
      score += 5;
    }
  }

  // 4. Proximity bonus (0–10 points)
  if (input.distance_km !== undefined) {
    if (input.distance_km <= 0.3) {
      score += 10;
    } else if (input.distance_km <= 1) {
      score += 7;
    } else if (input.distance_km <= 2) {
      score += 3;
    }
  }

  return Math.round(score * 100) / 100;
}

export function isEventActive(starts_at: string, ends_at: string): boolean {
  const now = Date.now();
  return now >= new Date(starts_at).getTime() && now <= new Date(ends_at).getTime();
}

export function getTimeLabel(starts_at: string, ends_at: string): string {
  const now = Date.now();
  const start = new Date(starts_at).getTime();
  const end = new Date(ends_at).getTime();

  if (now >= start && now <= end) {
    const minsLeft = Math.round((end - now) / 60000);
    if (minsLeft <= 60) return `Happening now · ${minsLeft}m left`;
    const hrsLeft = Math.round(minsLeft / 60);
    return `Happening now · ${hrsLeft}h left`;
  }

  if (start > now) {
    const minsUntil = Math.round((start - now) / 60000);
    if (minsUntil <= 60) return `Starts in ${minsUntil}m`;
    const hrsUntil = Math.round(minsUntil / 60);
    if (hrsUntil <= 24) return `Starts in ${hrsUntil}h`;
    return `Starts in ${Math.round(hrsUntil / 24)}d`;
  }

  return 'Ended';
}
