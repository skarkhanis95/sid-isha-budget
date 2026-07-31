"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ArrowRightLeft,
  PieChart,
  Settings,
  CreditCard,
  Tag,
  Layers,
  Bell,
  LogOut,
  Wallet,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth-actions";

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Month", href: "/month", icon: CalendarDays },
  { name: "Transfers", href: "/transfers", icon: ArrowRightLeft },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

const desktopManagementItems = [
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Templates", href: "/templates", icon: Layers },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

export function Navigation({ userDisplayName }: { userDisplayName?: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/90 min-h-screen p-4 sticky top-0 h-screen justify-between z-30">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              SB
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight tracking-tight text-white">SidIsha Budget</h1>
              <p className="text-xs text-muted-foreground">Household Manager</p>
            </div>
          </div>

          {/* Core Navigation */}
          <nav className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Main Menu</p>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Management Navigation */}
          <nav className="space-y-1 pt-4 border-t border-border/50">
            <p className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">Management</p>
            {desktopManagementItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer & Logout */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          {userDisplayName && (
            <div className="px-3 py-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Logged in as</span>
              <span className="text-xs font-semibold text-foreground">{userDisplayName}</span>
            </div>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border px-2 py-1.5 shadow-2xl">
        <nav className="flex justify-around items-center">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl min-w-[56px] min-h-[48px] transition-all duration-150 ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "scale-110" : ""}`} />
                <span className="text-[10px] tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
