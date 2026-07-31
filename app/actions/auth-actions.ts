"use server";

import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, destroySession } from "@/lib/auth/session";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/auth/rate-limit";
import { redirect } from "next/navigation";

export async function loginAction(prevState: { error?: string } | null, formData: FormData) {
  try {
    const username = (formData.get("username") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!username || !password) {
      return { error: "Please enter both username and password." };
    }

    const rateCheck = await checkRateLimit(username);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterMs || 0) / 60000);
      return { error: `Too many failed attempts. Please try again in ${minutes} minute(s).` };
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));

    if (!user) {
      await recordFailedAttempt(username);
      return { error: "Invalid username or password." };
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      await recordFailedAttempt(username);
      return { error: "Invalid username or password." };
    }

    await resetRateLimit(username);

    await createSession({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    return { success: true };
  } catch (err) {
    console.error("Login action error:", err);
    return { error: "An unexpected error occurred during login. Please try again." };
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
