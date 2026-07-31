import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.message && body.message.text) {
      const chatId = String(body.message.chat.id);
      const text: string = body.message.text.trim();

      if (text.startsWith("/start")) {
        const parts = text.split(" ");
        const code = parts[1]?.trim().toUpperCase();
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (code) {
          const [link] = await db
            .select()
            .from(schema.telegramLinks)
            .where(eq(schema.telegramLinks.startCode, code));

          if (link) {
            const now = new Date().toISOString();
            await db
              .update(schema.telegramLinks)
              .set({
                telegramChatId: chatId,
                status: "active",
                linkedAt: now,
                startCode: null,
              })
              .where(eq(schema.telegramLinks.id, link.id));

            await db
              .update(schema.notificationSettings)
              .set({ telegramEnabled: true })
              .where(eq(schema.notificationSettings.userId, link.userId));

            if (botToken) {
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: "✅ Successfully connected your Telegram account to Household Finance Manager! You will now receive due-date & funding alerts here.",
                }),
              });
            }
          } else if (botToken) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: `⚠️ Link code "${code}" is invalid or expired. Please generate a new code in your Household Finance App Settings (/settings).`,
              }),
            });
          }
        } else if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "👋 Welcome to Household Finance Bot!\n\nTo connect your account:\n1. Open App Settings (/settings)\n2. Click 'Connect Telegram Account' to generate your code\n3. Send `/start YOUR_CODE` here!",
            }),
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
