"use server";

import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateNotificationSettingsAction(userId: string, data: {
  leadTimeDays?: number;
  inAppEnabled?: boolean;
  telegramEnabled?: boolean;
}) {
  const now = new Date().toISOString();

  await db
    .update(schema.notificationSettings)
    .set({
      ...data,
      updatedAt: now,
    })
    .where(eq(schema.notificationSettings.userId, userId));

  revalidatePath("/settings");
  return { success: true };
}

export async function generateTelegramLinkCodeAction(userId: string) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const [existing] = await db
    .select()
    .from(schema.telegramLinks)
    .where(eq(schema.telegramLinks.userId, userId));

  if (existing) {
    await db
      .update(schema.telegramLinks)
      .set({
        startCode: code,
        status: "pending",
      })
      .where(eq(schema.telegramLinks.userId, userId));
  } else {
    await db.insert(schema.telegramLinks).values({
      id: `tg_${userId}`,
      userId,
      startCode: code,
      status: "pending",
    });
  }

  revalidatePath("/settings");
  return { code };
}

export async function disconnectTelegramAction(userId: string) {
  await db
    .update(schema.telegramLinks)
    .set({
      status: "revoked",
      telegramChatId: null,
      startCode: null,
    })
    .where(eq(schema.telegramLinks.userId, userId));

  await db
    .update(schema.notificationSettings)
    .set({ telegramEnabled: false })
    .where(eq(schema.notificationSettings.userId, userId));

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteNotificationLogAction(logId: string) {
  await db.delete(schema.notificationLog).where(eq(schema.notificationLog.id, logId));
  revalidatePath("/notifications");
  return { success: true };
}
