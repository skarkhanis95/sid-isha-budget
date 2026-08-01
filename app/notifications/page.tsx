import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { verifySession } from "@/lib/auth/session";
import { eq, desc } from "drizzle-orm";
import { Bell, Trash2, Calendar } from "lucide-react";
import { deleteNotificationLogAction } from "@/app/actions/notification-actions";
import { SubmitButton } from "@/components/common/submit-button";

export const revalidate = 0;

export default async function NotificationsPage() {
  const session = await verifySession();

  if (!session) return null;

  const logs = await db
    .select()
    .from(schema.notificationLog)
    .where(eq(schema.notificationLog.userId, session.userId))
    .orderBy(desc(schema.notificationLog.sentAt));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Notification History</h1>
        <p className="text-xs text-muted-foreground">Historical alert logs dispatched via in-app and Telegram</p>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-4">
        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No notification logs recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-accent/30 border border-border/50 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-primary/10">
                      {log.channel.replace("_", " ")}
                    </span>
                    <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.sentAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed pt-1">{log.messagePreview}</p>
                </div>

                <form
                  action={async () => {
                    "use server";
                    await deleteNotificationLogAction(log.id);
                  }}
                >
                  <SubmitButton
                    aria-label="Delete log"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
