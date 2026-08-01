"use client";

import React, { useState } from "react";
import { Download, PieChart as PieIcon, BarChart2, TrendingUp, Award } from "lucide-react";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { MonthlyExpenseBarChart } from "@/components/charts/monthly-expense-bar-chart";
import { SavingsLineChart } from "@/components/charts/savings-line-chart";
import { formatMonthKey } from "@/lib/utils/formatters";
import * as XLSX from "xlsx";

interface ReportsClientProps {
  currentMonthExpenses: any[];
  allExpenses: any[];
  allIncome: any[];
  categories: any[];
  months: any[];
}

export function ReportsClient({
  currentMonthExpenses,
  allExpenses,
  allIncome,
  categories,
  months,
}: ReportsClientProps) {
  const [period, setPeriod] = useState<"current_month" | "current_year" | "all_time">("current_month");

  // Filter expenses based on selected period
  const selectedExpenses = React.useMemo(() => {
    if (period === "current_month") return currentMonthExpenses;
    const now = new Date();
    if (period === "current_year") {
      const yearStr = String(now.getFullYear());
      return allExpenses.filter((e) => e.dueDate.startsWith(yearStr));
    }
    return allExpenses;
  }, [period, currentMonthExpenses, allExpenses]);

  // Statistics
  const highestExpense = selectedExpenses.length > 0
    ? [...selectedExpenses].sort((a, b) => b.amount - a.amount)[0]
    : null;

  const totalExpenseAmount = selectedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category distribution
  const categoryMap = new Map<string, number>();
  selectedExpenses.forEach((exp) => {
    const catName = categories.find((c) => c.id === exp.categoryId)?.name || "Unassigned";
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + exp.amount);
  });

  const categoryPieData = Array.from(categoryMap.entries()).map(([name, amount], idx) => ({
    name,
    amount,
    color: categories.find((c) => c.name === name)?.color || ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7"][idx % 5],
  }));

  const largestCategory = categoryPieData.length > 0
    ? [...categoryPieData].sort((a, b) => b.amount - a.amount)[0]
    : null;

  // Monthly trends with YYYY-MMM labels
  const monthlyHistory = months.map((m) => {
    const mExp = allExpenses.filter((e) => e.monthId === m.id).reduce((sum, e) => sum + e.amount, 0);
    const mInc = allIncome.filter((i) => i.monthId === m.id).reduce((sum, i) => sum + i.amount, 0);
    return {
      monthKey: formatMonthKey(m.monthKey),
      expenses: mExp,
      savings: Math.max(0, mInc - mExp),
    };
  });

  const exportToCSV = () => {
    const data = selectedExpenses.map((e) => ({
      "Expense Name": e.name,
      Category: categories.find((c) => c.id === e.categoryId)?.name || "Unassigned",
      "Amount (INR)": e.amount,
      Fixed: e.fixed ? "Yes" : "No",
      Status: e.status,
      "Due Date": e.dueDate,
      "Paid Date": e.paidDate || "-",
      Notes: e.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses Report");
    XLSX.writeFile(wb, `household_finance_${period}_report.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Financial Reports & Analytics</h1>
          <p className="text-xs text-muted-foreground">Historical spending analysis, category trends, and data export</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <select
            value={period}
            onChange={(e: any) => setPeriod(e.target.value)}
            className="px-3.5 py-2 bg-card border border-border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
          >
            <option value="current_month">Current Month</option>
            <option value="current_year">Current Year</option>
            <option value="all_time">All Time History</option>
          </select>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Expenses ({period.replace("_", " ")})</span>
            <BarChart2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground">₹{totalExpenseAmount.toLocaleString("en-IN")}</div>
          <p className="text-[11px] text-muted-foreground">{selectedExpenses.length} entries</p>
        </div>

        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Highest Expense</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">
            ₹{highestExpense ? highestExpense.amount.toLocaleString("en-IN") : 0}
          </div>
          <p className="text-[11px] text-muted-foreground">{highestExpense ? highestExpense.name : "-"}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Top Category</span>
            <PieIcon className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl font-bold text-pink-400">{largestCategory ? largestCategory.name : "-"}</div>
          <p className="text-[11px] text-muted-foreground">
            ₹{largestCategory ? largestCategory.amount.toLocaleString("en-IN") : 0}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <h3 className="font-bold text-sm text-foreground">Category Spending Breakdown</h3>
          <CategoryPieChart data={categoryPieData} />
        </div>

        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <h3 className="font-bold text-sm text-foreground">Monthly Expense History</h3>
          <MonthlyExpenseBarChart data={monthlyHistory} />
        </div>

        <div className="glass-panel p-5 rounded-3xl space-y-3 lg:col-span-2">
          <h3 className="font-bold text-sm text-foreground">Monthly Savings Trend</h3>
          <SavingsLineChart data={monthlyHistory} />
        </div>
      </div>
    </div>
  );
}
