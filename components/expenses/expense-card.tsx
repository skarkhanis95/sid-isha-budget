"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Ban, Calendar, Wallet, Tag } from "lucide-react";
import { markExpenseStatusAction } from "@/app/actions/finance-actions";

interface ExpenseCardProps {
  expense: {
    id: string;
    name: string;
    amount: number;
    fixed: boolean;
    status: string;
    dueDate: string;
    paidDate?: string | null;
    categoryName?: string;
    accountName?: string;
    notes?: string | null;
  };
  onEdit: (expense: any) => void;
}

export function ExpenseCard({ expense, onEdit }: ExpenseCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleTogglePaid = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    const newStatus = expense.status === "paid" ? "pending" : "paid";
    await markExpenseStatusAction(expense.id, newStatus);
    setIsUpdating(false);
  };

  const getStatusBadge = () => {
    switch (expense.status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case "skipped":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <Ban className="w-3 h-3" />
            Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onEdit(expense)}
      className="glass-card p-4 rounded-2xl cursor-pointer hover:border-primary/40 transition-all duration-200 active:scale-[0.99] space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-base text-foreground leading-tight">{expense.name}</h4>
            {expense.fixed && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                Fixed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {expense.categoryName || "Unassigned"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              {expense.accountName || "Account"}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-bold text-lg text-foreground">₹{expense.amount.toLocaleString()}</div>
          <div className="mt-1">{getStatusBadge()}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 text-primary/80" />
          <span>Due {expense.dueDate}</span>
        </div>

        {/* Quick One-Tap Mark Paid Button */}
        <button
          onClick={handleTogglePaid}
          disabled={isUpdating}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all duration-150 ${
            expense.status === "paid"
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isUpdating ? "Saving..." : expense.status === "paid" ? "Mark Pending" : "Mark Paid"}
        </button>
      </div>
    </div>
  );
}
