import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { calculateAccountBalances } from "./balance-service";
import { generateTransferRecommendations } from "./transfer-planner";

export async function processDailyNotifications() {
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const nowIso = new Date().toISOString();

  const allUsers = await db.select().from(schema.users);
  const results = [];

  for (const user of allUsers) {
    const [settings] = await db
      .select()
      .from(schema.notificationSettings)
      .where(eq(schema.notificationSettings.userId, user.id));

    if (!settings || (!settings.inAppEnabled && !settings.telegramEnabled)) {
      continue; // User has notifications disabled
    }

    const leadDays = settings.leadTimeDays ?? 1;

    // Calculate cutoff target date: today + leadDays
    const targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() + leadDays);
    const targetDateStr = targetDateObj.toISOString().split("T")[0];

    // Find pending fixed expenses where dueDate <= targetDateStr and status == 'pending'
    const pendingFixedExpenses = await db
      .select()
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.fixed, true),
          eq(schema.expenses.status, "pending"),
          lte(schema.expenses.dueDate, targetDateStr),
          gte(schema.expenses.dueDate, todayStr)
        )
      );

    const accountBalances = await calculateAccountBalances();
    const recommendations = await generateTransferRecommendations();

    for (const exp of pendingFixedExpenses) {
      const [acc] = await db
        .select()
        .from(schema.accounts)
        .where(eq(schema.accounts.id, exp.paymentAccountId));

      const accName = acc ? acc.name : "your designated account";
      const targetAccBalance = accountBalances.find((b) => b.accountId === exp.paymentAccountId);
      const isShortfall = targetAccBalance ? targetAccBalance.hasShortfall : false;

      let msg = `${exp.name} is due on ${exp.dueDate}. Please keep ${accName} funded with ₹${exp.amount.toLocaleString("en-IN")}.`;

      if (isShortfall) {
        const rec = recommendations.find((r) => r.toAccountId === exp.paymentAccountId);
        if (rec) {
          msg += ` (Recommendation: Transfer ₹${rec.recommendedAmount.toLocaleString("en-IN")} from ${rec.fromAccountName}).`;
        }
      }

      // 1. In-App Dispatch
      if (settings.inAppEnabled) {
        const [existingLog] = await db
          .select()
          .from(schema.notificationLog)
          .where(
            and(
              eq(schema.notificationLog.expenseId, exp.id),
              eq(schema.notificationLog.monthId, exp.monthId),
              eq(schema.notificationLog.userId, user.id),
              eq(schema.notificationLog.channel, "in_app")
            )
          );

        if (!existingLog) {
          await db.insert(schema.notificationLog).values({
            id: `nlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            expenseId: exp.id,
            monthId: exp.monthId,
            userId: user.id,
            channel: "in_app",
            sentAt: nowIso,
            messagePreview: msg,
          });
          results.push({ userId: user.id, channel: "in_app", expense: exp.name });
        }
      }

      // 2. Telegram Dispatch
      if (settings.telegramEnabled) {
        const [tgLink] = await db
          .select()
          .from(schema.telegramLinks)
          .where(
            and(
              eq(schema.telegramLinks.userId, user.id),
              eq(schema.telegramLinks.status, "active")
            )
          );

        if (tgLink && tgLink.telegramChatId) {
          const [existingTgLog] = await db
            .select()
            .from(schema.notificationLog)
            .where(
              and(
                eq(schema.notificationLog.expenseId, exp.id),
                eq(schema.notificationLog.monthId, exp.monthId),
                eq(schema.notificationLog.userId, user.id),
                eq(schema.notificationLog.channel, "telegram")
              )
            );

          if (!existingTgLog) {
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            if (botToken) {
              try {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: tgLink.telegramChatId,
                    text: `🔔 SidIsha Budget Alert\n\n${msg}`,
                  }),
                });

                await db.insert(schema.notificationLog).values({
                  id: `nlog_tg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  expenseId: exp.id,
                  monthId: exp.monthId,
                  userId: user.id,
                  channel: "telegram",
                  sentAt: nowIso,
                  messagePreview: msg,
                });
                results.push({ userId: user.id, channel: "telegram", expense: exp.name });
              } catch (err) {
                console.error("Failed to send Telegram alert:", err);
              }
            }
          }
        }
      }
    }
  }

  return results;
}
