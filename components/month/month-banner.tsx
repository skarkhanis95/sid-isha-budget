"use client";

import React, { useState } from "react";
import { AlertCircle, PlayCircle, Calendar } from "lucide-react";
import { startMonthAction } from "@/app/actions/finance-actions";
import { formatMonthKey } from "@/lib/utils/formatters";
import { useRouter } from "next/navigation";

export function MonthBanner({
  currentSystemKey,
  activeViewKey,
  isCurrentStarted,
}: {
  currentSystemKey: string;
  activeViewKey: string;
  isCurrentStarted: boolean;
}) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  // If currently viewing an older month when current month is not started yet or viewing old month
  const isDrifting = activeViewKey !== currentSystemKey;

  if (!isDrifting && isCurrentStarted) return null;

  const handleStartCurrentMonth = async () => {
    setIsStarting(true);
    await startMonthAction(currentSystemKey);
    setIsStarting(false);
    router.push(`/month?key=${currentSystemKey}`);
  };

  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold text-sm">
            {isDrifting
              ? `You are currently viewing ${formatMonthKey(activeViewKey)}.`
              : `${formatMonthKey(currentSystemKey)} is not started yet.`}
          </span>
          <p className="text-[11px] text-amber-300/80 mt-0.5">
            {isCurrentStarted
              ? `Switch to active month ${formatMonthKey(currentSystemKey)}.`
              : `Click "Start ${formatMonthKey(currentSystemKey)}" to project active templates into expenses.`}
          </p>
        </div>
      </div>

      <button
        onClick={handleStartCurrentMonth}
        disabled={isStarting}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
      >
        <PlayCircle className="w-4 h-4" />
        {isStarting ? "Starting..." : `Start ${formatMonthKey(currentSystemKey)}`}
      </button>
    </div>
  );
}
