"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Send,
  ExternalLink,
  CheckCircle2,
  Database,
  Server,
  HardDrive,
} from "lucide-react";
import {
  updateNotificationSettingsAction,
  generateTelegramLinkCodeAction,
  disconnectTelegramAction,
} from "@/app/actions/notification-actions";

interface SettingsClientProps {
  userId: string;
  settings: any;
  telegramLink: any;
  isTursoCloud?: boolean;
  tursoUrl?: string | null;
}

export function SettingsClient({
  userId,
  settings,
  telegramLink,
  isTursoCloud = false,
  tursoUrl = null,
}: SettingsClientProps) {
  const { theme, setTheme } = useTheme();

  const [leadTimeDays, setLeadTimeDays] = useState(settings?.leadTimeDays ?? 1);
  const [inAppEnabled, setInAppEnabled] = useState(settings?.inAppEnabled ?? true);
  const [telegramEnabled, setTelegramEnabled] = useState(settings?.telegramEnabled ?? false);
  const [linkCode, setLinkCode] = useState<string | null>(telegramLink?.startCode || null);
  const [isGenerating, setIsGenerating] = useState(false);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "HouseholdFinanceBot";

  const handleUpdateSettings = async (newLead?: number, newInApp?: boolean, newTg?: boolean) => {
    const payload = {
      leadTimeDays: newLead !== undefined ? newLead : leadTimeDays,
      inAppEnabled: newInApp !== undefined ? newInApp : inAppEnabled,
      telegramEnabled: newTg !== undefined ? newTg : telegramEnabled,
    };
    await updateNotificationSettingsAction(userId, payload);
  };

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    const res = await generateTelegramLinkCodeAction(userId);
    setLinkCode(res.code);
    setIsGenerating(false);
  };

  const handleDisconnect = async () => {
    if (confirm("Disconnect Telegram notifications?")) {
      await disconnectTelegramAction(userId);
      setTelegramEnabled(false);
      setLinkCode(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Settings & Preferences</h1>
        <p className="text-xs text-muted-foreground">Manage database, appearance theme, notification alerts, and Telegram bot</p>
      </div>

      {/* Database Connection Status Card */}
      <div className="glass-panel p-6 rounded-3xl space-y-3">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Active Database Connection
        </h3>

        <div className="p-4 rounded-2xl bg-accent/30 border border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isTursoCloud ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {isTursoCloud ? <Server className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">
                {isTursoCloud ? "Turso Cloud Database" : "Local SQLite Database"}
              </div>
              <p className="text-xs text-muted-foreground break-all">
                {isTursoCloud ? `Connected to Turso (${tursoUrl})` : "Running locally on file:local.db"}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
              isTursoCloud
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {isTursoCloud ? "⚡ Live Cloud DB" : "📁 Local DB"}
          </span>
        </div>
      </div>

      {/* Theme Options */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          Appearance Theme
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "dark", label: "Dark Mode", icon: Moon },
            { id: "light", label: "Light Mode", icon: Sun },
            { id: "system", label: "System", icon: Monitor },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-md shadow-primary/10"
                    : "bg-card/40 border-border/60 text-muted-foreground hover:border-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification & Telegram Settings */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Due-Date Alerts & Telegram Link
        </h3>

        <div className="space-y-4">
          {/* Lead Time Selector */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Alert Lead Window</label>
            <select
              value={leadTimeDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setLeadTimeDays(val);
                handleUpdateSettings(val);
              }}
              className="w-full sm:w-64 px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
            >
              <option value={0}>On Due Date (Same day)</option>
              <option value={1}>1 Day Before Due Date (Default)</option>
              <option value={3}>3 Days Before Due Date</option>
              <option value={7}>7 Days Before Due Date</option>
            </select>
          </div>

          {/* In-App Alerts Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/30 border border-border/40">
            <div>
              <span className="font-semibold text-xs text-foreground">In-App Notification Center</span>
              <p className="text-[11px] text-muted-foreground">Surfaces toasts and persistent bell alerts</p>
            </div>
            <input
              type="checkbox"
              checked={inAppEnabled}
              onChange={(e) => {
                setInAppEnabled(e.target.checked);
                handleUpdateSettings(undefined, e.target.checked);
              }}
              className="w-5 h-5 accent-primary rounded cursor-pointer"
            />
          </div>

          {/* Telegram Alerts Integration */}
          <div className="p-5 rounded-2xl bg-accent/30 border border-blue-500/30 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Telegram Push Alerts</h4>
                  <p className="text-[11px] text-muted-foreground">Receive instant due-date notifications on Telegram</p>
                </div>
              </div>

              {telegramLink?.status === "active" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              )}
            </div>

            {telegramLink?.status === "active" ? (
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Enable Telegram Push Notifications</span>
                  <input
                    type="checkbox"
                    checked={telegramEnabled}
                    onChange={(e) => {
                      setTelegramEnabled(e.target.checked);
                      handleUpdateSettings(undefined, undefined, e.target.checked);
                    }}
                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20"
                >
                  Disconnect Telegram
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  To connect your account, generate a start code and open the Telegram Bot:
                </p>

                {linkCode ? (
                  <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                    <div className="text-xs font-semibold text-foreground">Your Link Code:</div>
                    <div className="font-mono font-bold text-xl text-primary tracking-widest">{linkCode}</div>
                    <a
                      href={`https://t.me/${botUsername}?start=${linkCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors mt-1"
                    >
                      Open Bot on Telegram
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-md hover:bg-primary/90 transition-all"
                  >
                    {isGenerating ? "Generating..." : "Connect Telegram Account"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
