import React from "react";
import { db, isTursoCloud } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { verifySession } from "@/lib/auth/session";
import { SettingsClient } from "@/components/settings/settings-client";
import { eq } from "drizzle-orm";

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await verifySession();

  if (!session) return null;

  const [settings] = await db
    .select()
    .from(schema.notificationSettings)
    .where(eq(schema.notificationSettings.userId, session.userId));

  const [telegramLink] = await db
    .select()
    .from(schema.telegramLinks)
    .where(eq(schema.telegramLinks.userId, session.userId));

  return (
    <SettingsClient
      settings={settings}
      telegramLink={telegramLink}
      isTursoCloud={isTursoCloud}
      tursoUrl={process.env.TURSO_DATABASE_URL || null}
    />
  );
}
