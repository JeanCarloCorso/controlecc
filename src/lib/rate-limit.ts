const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_TRACKED_KEYS = 10_000;

function pruneExpired(now: number) {
  for (const [key, value] of attempts) {
    if (value.resetAt <= now) attempts.delete(key);
  }
  if (attempts.size >= MAX_TRACKED_KEYS) {
    const oldestKey = attempts.keys().next().value;
    if (oldestKey) attempts.delete(oldestKey);
  }
}

export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  if (attempts.size >= MAX_TRACKED_KEYS) pruneExpired(now);
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
