"use client";

import React, { useState } from "react";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { ExpenseSheet } from "@/components/expenses/expense-sheet";
import { MonthBanner } from "./month-banner";
import { formatMonthKey } from "@/lib/utils/formatters";
import {
  Plus,
  ArrowRightLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Trash2,
  RefreshCw,
  PlayCircle,
} from "lucide-react";
import {
  addIncomeAction,
  deleteIncomeAction,
  recordTransferAction,
  syncTemplatesAction,
  startMonthAction,
} from "@/app/actions/finance-actions";
import { useRouter } from "next/navigation";

interface MonthViewClientProps {
  monthKey: string;
  monthId?: string | null;
  incomeList: any[];
  expensesList: any[];
  categories: any[];
  accounts: any[];
  currentSystemKey: string;
  isCurrentStarted: boolean;
}

export function MonthViewClient({
  monthKey,
  monthId,
  incomeList,
  expensesList,
  categories,
  accounts,
  currentSystemKey,
  isCurrentStarted,
}: MonthViewClientProps) {
  const router = useRouter();

  // Modals state
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table" | "timeline">("cards");

  // Form states
  const [incDesc, setIncDesc] = useState("");
  const [incAmount, setIncAmount] = useState("");
  const [incAccount, setIncAccount] = useState(accounts[0]?.id || "");
  const [incDate, setIncDate] = useState(new Date().toISOString().split("T")[0]);

  const [trFrom, setTrFrom] = useState(accounts[0]?.id || "");
  const [trTo, setTrTo] = useState(accounts[1]?.id || accounts[0]?.id || "");
  const [trAmount, setTrAmount] = useState("");

  // Additional loading states
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null);

  const formattedTitle = formatMonthKey(monthKey);

  const handleNavigateMonth = (delta: number) => {
    const [yStr, mStr] = monthKey.split("-");
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + delta;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    const newMonthKey = `${y}-${String(m).padStart(2, "0")}`;
    router.push(`/month?key=${newMonthKey}`);
  };

  const handleStartThisMonth = async () => {
    setIsStarting(true);
    await startMonthAction(monthKey);
    setIsStarting(false);
  };

  const handleSyncTemplates = async () => {
    if (!monthId) return;
    setIsSyncing(true);
    await syncTemplatesAction(monthId);
    setIsSyncing(false);
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthId || !incDesc || !incAmount || !incAccount || isSavingIncome) return;

    setIsSavingIncome(true);
    try {
      await addIncomeAction({
        monthId,
        description: incDesc,
        amount: parseFloat(incAmount),
        accountId: incAccount,
        receivedDate: incDate,
      });
      setIncDesc("");
      setIncAmount("");
      setIsAddIncomeOpen(false);
    } finally {
      setIsSavingIncome(false);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (deletingIncomeId === id) return;
    if (confirm("Delete income entry?")) {
      setDeletingIncomeId(id);
      try {
        await deleteIncomeAction(id);
      } finally {
        setDeletingIncomeId(null);
      }
    }
  };

  const handleRecordTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthId || !trFrom || !trTo || !trAmount || trFrom === trTo || isTransferring) return;

    setIsTransferring(true);
    try {
      await recordTransferAction({
        monthId,
        fromAccountId: trFrom,
        toAccountId: trTo,
        amount: parseFloat(trAmount),
        transferDate: new Date().toISOString().split("T")[0],
      });
      setTrAmount("");
      setIsTransferOpen(false);
    } finally {
      setIsTransferring(false);
    }
  };

  // Grouped date-wise expenses for Timeline View
  const groupedByDateMap = new Map<string, any[]>();
  expensesList.forEach((exp) => {
    const list = groupedByDateMap.get(exp.dueDate) || [];
    list.push(exp);
    groupedByDateMap.set(exp.dueDate, list);
  });
  const sortedDates = Array.from(groupedByDateMap.keys()).sort();

  return (
    <div className="space-y-6">
      {/* Month Drift Banner */}
      <MonthBanner
        currentSystemKey={currentSystemKey}
        activeViewKey={monthKey}
        isCurrentStarted={isCurrentStarted}
      />

      {/* Month Navigation Bar */}
      <div className="glass-panel p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigateMonth(-1)}
            aria-label="Previous Month"
            className="p-2 rounded-xl bg-accent/50 hover:bg-accent text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {formattedTitle}
            </h1>
            <p className="text-xs text-muted-foreground">Monthly Financial Ledger</p>
          </div>
          <button
            onClick={() => handleNavigateMonth(1)}
            aria-label="Next Month"
            className="p-2 rounded-xl bg-accent/50 hover:bg-accent text-foreground transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-background p-1 rounded-2xl border border-border">
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === "cards" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === "timeline" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Date-wise
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === "table" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {/* If month is not started yet */}
      {!monthId ? (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8 border border-border/80">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <PlayCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{formattedTitle} Not Started</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click &quot;Start Month&quot; to project your enabled templates into expenses for {formattedTitle}.
          </p>
          <button
            onClick={handleStartThisMonth}
            disabled={isStarting}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all w-full flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {isStarting ? "Starting Month..." : `Start ${formattedTitle}`}
          </button>
        </div>
      ) : (
        <>
          {/* Quick Action Bar / Floating Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => {
                setSelectedExpense(null);
                setIsExpenseSheetOpen(true);
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>

            <button
              onClick={handleSyncTemplates}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-600 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Templates"}
            </button>

            <button
              onClick={() => setIsAddIncomeOpen(true)}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-600 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Add Income
            </button>

            <button
              onClick={() => setIsTransferOpen(true)}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfer
            </button>
          </div>

          {/* Income Section */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                Income Entries
              </h3>
              <span className="font-bold text-sm text-emerald-400">
                Total: ₹{incomeList.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
              </span>
            </div>

            {incomeList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No income entries recorded for this month yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {incomeList.map((inc) => {
                  const accName = accounts.find((a) => a.id === inc.accountId)?.name || "Account";
                  return (
                    <div key={inc.id} className="p-3 rounded-2xl bg-accent/30 border border-border/40 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground">{inc.description}</div>
                        <div className="text-muted-foreground text-[11px] mt-0.5">
                          Credited to {accName} • {inc.receivedDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-emerald-400">₹{inc.amount.toLocaleString()}</span>
                        <button
                          onClick={() => handleDeleteIncome(inc.id)}
                          disabled={deletingIncomeId === inc.id}
                          className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Expenses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">Expenses ({expensesList.length})</h3>
            </div>

            {viewMode === "cards" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {expensesList.map((exp) => (
                  <ExpenseCard
                    key={exp.id}
                    expense={exp}
                    onEdit={(e) => {
                      setSelectedExpense(e);
                      setIsExpenseSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

            {viewMode === "timeline" && (
              <div className="space-y-4">
                {sortedDates.map((dateStr) => {
                  const dateExpList = groupedByDateMap.get(dateStr) || [];
                  return (
                    <div key={dateStr} className="space-y-2">
                      <div className="text-xs font-bold text-primary tracking-wider uppercase flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {dateStr} ({dateExpList.length} expenses)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dateExpList.map((exp) => (
                          <ExpenseCard
                            key={exp.id}
                            expense={exp}
                            onEdit={(e) => {
                              setSelectedExpense(e);
                              setIsExpenseSheetOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {viewMode === "table" && (
              <ExpenseTable
                expenses={expensesList}
                onEdit={(e) => {
                  setSelectedExpense(e);
                  setIsExpenseSheetOpen(true);
                }}
              />
            )}
          </div>

          {/* Expense Edit / Add Sheet */}
          <ExpenseSheet
            expense={selectedExpense}
            isOpen={isExpenseSheetOpen}
            onClose={() => setIsExpenseSheetOpen(false)}
            categories={categories}
            accounts={accounts}
            monthId={monthId}
          />
        </>
      )}

      {/* Add Income Modal */}
      {isAddIncomeOpen && monthId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">Add Income Entry</h3>
            <form onSubmit={handleAddIncome} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siddharth Salary, Interest"
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={incAmount}
                  onChange={(e) => setIncAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-bold text-base focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Credited To Account</label>
                <select
                  value={incAccount}
                  onChange={(e) => setIncAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddIncomeOpen(false)}
                  disabled={isSavingIncome}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingIncome}
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSavingIncome ? "Saving Income..." : "Save Income"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Transfer Modal */}
      {isTransferOpen && monthId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">Record Inter-Account Transfer</h3>
            <form onSubmit={handleRecordTransfer} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">From Source Account</label>
                <select
                  value={trFrom}
                  onChange={(e) => setTrFrom(e.target.value)}
                  disabled={isTransferring}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground disabled:opacity-50"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">To Destination Account</label>
                <select
                  value={trTo}
                  onChange={(e) => setTrTo(e.target.value)}
                  disabled={isTransferring}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-foreground disabled:opacity-50"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={trAmount}
                  onChange={(e) => setTrAmount(e.target.value)}
                  disabled={isTransferring}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl font-bold text-base focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  disabled={isTransferring}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent rounded-xl disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  {isTransferring ? "Executing..." : "Execute Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
