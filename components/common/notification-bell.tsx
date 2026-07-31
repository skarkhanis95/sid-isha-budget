"use client";

import React, { useState } from "react";
import { Bell, X, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  sentAt: string;
  messagePreview: string;
  channel: string;
}

export function NotificationBell({ notifications = [] }: { notifications?: NotificationItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.length;

  return (
    <div className="relative">
      {/* ARIA live region for accessibility announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {unreadCount > 0 ? `You have ${unreadCount} new notification(s)` : "No new notifications"}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative p-2.5 rounded-full hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl bg-card border border-border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <Bell className="w-4 h-4 text-primary" />
              In-App Alerts
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No recent notifications. You&apos;re all caught up!
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3.5 hover:bg-accent/30 transition-colors space-y-1">
                  <div className="flex justify-between items-start text-xs text-muted-foreground">
                    <span className="font-medium text-primary capitalize">{n.channel.replace("_", " ")}</span>
                    <span>{new Date(n.sentAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                  <p className="text-xs text-foreground leading-snug">{n.messagePreview}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-border bg-muted/20 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1 py-1"
            >
              View Notification History
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
