import { db } from "../lib/db";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.error("❌ TELEGRAM_BOT_TOKEN is missing in .env.local!");
  process.exit(1);
}

console.log("🤖 Telegram Polling Service Started...");
console.log("Listening live for Telegram messages...\n");

let lastUpdateId = 0;

async function pollTelegram() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`
    );
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        const msg = update.message;

        if (msg && msg.text) {
          const chatId = String(msg.chat.id);
          const text = msg.text.trim();
          console.log(`📩 Received message from Chat ID ${chatId}: "${text}"`);

          if (text.startsWith("/start")) {
            const parts = text.split(" ");
            const code = parts[1]?.trim().toUpperCase();

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

                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: "✅ Successfully connected your Telegram account to SidIsha Budget! You will now receive due-date & funding alerts here.",
                  }),
                });

                console.log(`🎉 SUCCESS: Linked Telegram Chat ID ${chatId} to user ${link.userId}`);
              } else {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `⚠️ Link code "${code}" is invalid or expired. Please generate a new code in your SidIsha Budget App Settings (/settings).`,
                  }),
                });
                console.log(`⚠️ Invalid or expired code received: ${code}`);
              }
            } else {
              // Plain /start without code
              await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: "👋 Welcome to SidIsha Budget Bot!\n\nTo connect your account:\n1. Open App Settings (/settings)\n2. Click 'Connect Telegram Account' to generate your code\n3. Send `/start YOUR_CODE` here!",
                }),
              });
              console.log(`ℹ️ Sent welcome instructions to chat ${chatId}`);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Polling error:", err);
  }
}

async function startLoop() {
  while (true) {
    await pollTelegram();
  }
}

startLoop();
