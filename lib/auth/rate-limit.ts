import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lock after 5 failures

export async function checkRateLimit(ipOrUsername: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const [record] = await db
    .select()
    .from(schema.loginAttempts)
    .where(eq(schema.loginAttempts.identifier, ipOrUsername));

  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockUntil && record.lockUntil > now) {
    return { allowed: false, retryAfterMs: record.lockUntil - now };
  }

  return { allowed: true };
}

export async function recordFailedAttempt(ipOrUsername: string): Promise<void> {
  const [record] = await db
    .select()
    .from(schema.loginAttempts)
    .where(eq(schema.loginAttempts.identifier, ipOrUsername));

  const now = Date.now();
  const nextCount = (record?.count ?? 0) + 1;
  const lockUntil = nextCount >= MAX_ATTEMPTS ? now + LOCK_TIME_MS : record?.lockUntil ?? null;

  if (record) {
    await db
      .update(schema.loginAttempts)
      .set({ count: nextCount, lockUntil })
      .where(eq(schema.loginAttempts.identifier, ipOrUsername));
  } else {
    await db.insert(schema.loginAttempts).values({
      id: `la_${crypto.randomUUID()}`,
      identifier: ipOrUsername,
      count: nextCount,
      lockUntil,
    });
  }
}

export async function resetRateLimit(ipOrUsername: string): Promise<void> {
  await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.identifier, ipOrUsername));
}
