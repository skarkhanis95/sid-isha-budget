// In-memory rate limiting map for login attempts
const attemptsMap = new Map<string, { count: number; lockUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lock after 5 failures

export function checkRateLimit(ipOrUsername: string): { allowed: boolean; retryAfterMs?: number } {
  const record = attemptsMap.get(ipOrUsername);
  const now = Date.now();

  if (!record) return { allowed: true };

  if (record.lockUntil > now) {
    return {
      allowed: false,
      retryAfterMs: record.lockUntil - now,
    };
  }

  if (record.lockUntil <= now && record.count >= MAX_ATTEMPTS) {
    // Lock expired, reset
    attemptsMap.delete(ipOrUsername);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ipOrUsername: string): void {
  const now = Date.now();
  const record = attemptsMap.get(ipOrUsername) || { count: 0, lockUntil: 0 };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockUntil = now + LOCK_TIME_MS;
  }

  attemptsMap.set(ipOrUsername, record);
}

export function resetRateLimit(ipOrUsername: string): void {
  attemptsMap.delete(ipOrUsername);
}
