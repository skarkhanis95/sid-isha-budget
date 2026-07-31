"use client";

import React from "react";
import { NotificationBell } from "./notification-bell";
import { User, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth-actions";

export function Header({
  displayName,
  notifications = [],
}: {
  displayName?: string;
  notifications?: Array<{ id: string; sentAt: string; messagePreview: string; channel: string }>;
}) {
  return (
    <header className="sticky top-0 z-20 w-full bg-card/80 backdrop-blur-md border-b border-border/80 px-4 py-3 flex items-center justify-between">
      {/* Mobile Title */}
      <div className="flex items-center gap-2.5 md:hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
          SB
        </div>
        <span className="font-bold text-base tracking-tight text-foreground">SidIsha Budget</span>
      </div>

      {/* Desktop Breadcrumb/Title Placeholder */}
      <div className="hidden md:block">
        <h2 className="text-sm font-semibold text-muted-foreground">SidIsha Budget</h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <NotificationBell notifications={notifications} />

        {/* User Info / Quick Logout on Mobile */}
        {displayName && (
          <div className="flex items-center gap-2 pl-2 border-l border-border/60">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/50 text-xs font-medium text-foreground">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>{displayName}</span>
            </div>

            <form action={logoutAction} className="md:hidden">
              <button
                type="submit"
                aria-label="Logout"
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
