import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { getMonth } from "@/lib/services/month-service";
import { formatMonthKey } from "@/lib/utils/formatters";
import { calculateAccountBalances } from "@/lib/services/balance-service";
import { generateTransferRecommendations } from "@/lib/services/transfer-planner";
import { seedDatabase } from "@/lib/db/seed";
import { eq } from "drizzle-orm";
import {
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  Wallet,
  PiggyBank,
  ArrowRightLeft,
  Calendar,
  AlertTriangle,
  PlayCircle,
} from "lucide-react";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { MonthlyExpenseBarChart } from "@/components/charts/monthly-expense-bar-chart";
import { SavingsLineChart } from "@/components/charts/savings-line-chart";
import { IncomeVsExpenseChart } from "@/components/charts/income-vs-expense-chart";
import { AccountBalanceBarChart } from "@/components/charts/account-balance-bar-chart";
import Link from "next/link";
import { recordTransferAction, startMonthAction } from "@/app/actions/finance-actions";

export const revalidate = 0; // Dynamic server page

export default async function DashboardPage() {
  await seedDatabase();

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthRecord = await getMonth(currentMonthKey);
  const formattedCurrentTitle = formatMonthKey(currentMonthKey);

  const categories = await db.select().from(schema.categories);
  const allMonths = await db.select().from(schema.months);
  const allExpenses = await db.select().from(schema.expenses);
  const allIncome = await db.select().from(schema.income);

  // If current month is not started yet
  if (!currentMonthRecord) {
    const accountBalances = await calculateAccountBalances();
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Financial Dashboard</h1>
            <p className="text-xs text-muted-foreground">Overview for {formattedCurrentTitle}</p>
          </div>
          <Link
            href={`/month?key=${currentMonthKey}`}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            Go to Month View
          </Link>
        </div>

        <div className="glass-panel p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8 border border-border/80">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <PlayCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{formattedCurrentTitle} Not Started</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click &quot;Start Month&quot; to manually project your active expense templates into {formattedCurrentTitle}.
          </p>
          <form
            action={async () => {
              "use server";
              await startMonthAction(currentMonthKey);
            }}
          >
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all w-full flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Start {formattedCurrentTitle} Now
            </button>
          </form>
        </div>

        {/* Display current balances even before starting month */}
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <h3 className="font-bold text-sm text-foreground">Current Account Balances</h3>
          <AccountBalanceBarChart data={accountBalances} />
        </div>
      </div>
    );
  }

  // Current Month Data
  const monthIncomeList = await db
    .select()
    .from(schema.income)
    .where(eq(schema.income.monthId, currentMonthRecord.id));

  const monthExpensesList = await db
    .select()
    .from(schema.expenses)
    .where(eq(schema.expenses.monthId, currentMonthRecord.id));

  const accountBalances = await calculateAccountBalances(currentMonthRecord.id);
  const recommendations = await generateTransferRecommendations(currentMonthRecord.id);

  // Metrics Calculations
  const totalIncome = monthIncomeList.reduce((sum, inc) => sum + inc.amount, 0);
  const budgetedExpenses = monthExpensesList.reduce((sum, exp) => sum + exp.amount, 0);
  const paidExpenses = monthExpensesList
    .filter((exp) => exp.status === "paid")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = monthExpensesList
    .filter((exp) => exp.status === "pending")
    .reduce((sum, exp) => sum + exp.amount, 0);

  const remainingBudget = totalIncome - budgetedExpenses;
  const currentCashAvailable = accountBalances.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const projectedMonthEndBalance = accountBalances.reduce((sum, acc) => sum + acc.projectedBalance, 0);
  const savingsAmount = Math.max(0, totalIncome - paidExpenses);
  const savingsPercentage = totalIncome > 0 ? Math.round((savingsAmount / totalIncome) * 100) : 0;

  // Upcoming Fixed Expenses (next 3-5)
  const todayStr = now.toISOString().split("T")[0];
  const upcomingFixedExpenses = monthExpensesList
    .filter((exp) => exp.fixed && exp.status === "pending" && exp.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  // Category Breakdown Data
  const categoryDataMap = new Map<string, number>();
  monthExpensesList.forEach((exp) => {
    const catName = categories.find((c) => c.id === exp.categoryId)?.name || "Other";
    categoryDataMap.set(catName, (categoryDataMap.get(catName) || 0) + exp.amount);
  });

  const categoryPieData = Array.from(categoryDataMap.entries()).map(([name, amount], idx) => {
    const catObj = categories.find((c) => c.name === name);
    return {
      name,
      amount,
      color: catObj?.color || ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899"][idx % 6],
    };
  });

  // Historical 12 months data with formatted YYYY-MMM keys
  const monthlyHistory = allMonths.slice(-12).map((m) => {
    const mExpenses = allExpenses
      .filter((e) => e.monthId === m.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const mIncome = allIncome
      .filter((i) => i.monthId === m.id)
      .reduce((sum, i) => sum + i.amount, 0);
    return {
      monthKey: formatMonthKey(m.monthKey),
      income: mIncome,
      expenses: mExpenses,
      savings: Math.max(0, mIncome - mExpenses),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Financial Dashboard</h1>
          <p className="text-xs text-muted-foreground">Overview for {formattedCurrentTitle} • Live balances & forecasts</p>
        </div>
        <Link
          href={`/month?key=${currentMonthKey}`}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          Open Month View
        </Link>
      </div>

      {/* 8 Primary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Total Income */}
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">₹{totalIncome.toLocaleString()}</div>
          <p className="text-[11px] text-muted-foreground">{monthIncomeList.length} income entries</p>
        </div>

        {/* 2. Budgeted Expenses */}
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Budgeted Expenses</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-foreground">₹{budgetedExpenses.toLocaleString()}</div>
          <p className="text-[11px] text-muted-foreground">{monthExpensesList.length} total expenses</p>
        </div>

        {/* 3. Paid Expenses */}
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Paid Expenses</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-500">₹{paidExpenses.toLocaleString()}</div>
          <p className="text-[11px] text-muted-foreground">
            {monthExpensesList.filter((e) => e.status === "paid").length} expenses paid
          </p>
        </div>

        {/* 4. Pending Expenses */}
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pending Expenses</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">₹{pendingExpenses.toLocaleString()}</div>
          <p className="text-[11px] text-muted-foreground">
            {monthExpensesList.filter((e) => e.status === "pending").length} remaining
          </p>
        </div>

        {/* 5. Remaining Budget */}
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Remaining Budget</span>
            <Wallet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-xl font-bold ${remainingBudget >= 0 ? "text-foreground" : "text-destructive"}`}>
            ₹{remainingBudget.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Income minus budgeted</p>
        </div>

        {/* 6. Current Cash Available */}
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Current Cash Available</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-foreground">₹{currentCashAvailable.toLocaleString()}</div>
          <p className="text-[11px] text-muted-foreground">Across all active accounts</p>
        </div>

        {/* 7. Projected Month-End Balance */}
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Projected Month-End</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-xl font-bold ${projectedMonthEndBalance >= 0 ? "text-purple-400" : "text-destructive"}`}>
            ₹{projectedMonthEndBalance.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">After pending expenses</p>
        </div>

        {/* 8. Savings */}
        <div className="glass-card p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Savings</span>
            <PiggyBank className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl font-bold text-pink-400">
            ₹{savingsAmount.toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">({savingsPercentage}%)</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Current monthly savings</p>
        </div>
      </div>

      {/* Row 2: Upcoming Due Dates & Transfer Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Due Dates Card */}
        <div className="glass-panel p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              Upcoming Fixed Due Dates
            </h3>
            <span className="text-xs text-muted-foreground">Next 5</span>
          </div>

          <div className="space-y-2.5">
            {upcomingFixedExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No upcoming fixed due dates this month.</p>
            ) : (
              upcomingFixedExpenses.map((exp) => {
                const targetAcc = accountBalances.find((b) => b.accountId === exp.paymentAccountId);
                const hasShortfall = targetAcc ? targetAcc.hasShortfall : false;
                const dueDateObj = new Date(exp.dueDate);
                const diffTime = dueDateObj.getTime() - now.getTime();
                const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                return (
                  <div key={exp.id} className="p-3 rounded-2xl bg-accent/30 border border-border/40 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{exp.name}</div>
                      <div className="text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>Due {exp.dueDate} ({daysRemaining}d left)</span>
                        <span>•</span>
                        <span>{targetAcc?.accountName || "Account"}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-bold text-foreground">₹{exp.amount.toLocaleString()}</div>
                      {hasShortfall ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Shortfall Alert
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-semibold">Funded</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Transfer Recommendations Card */}
        <div className="glass-panel p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
              <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              Transfer Recommendations
            </h3>
            <span className="text-xs text-muted-foreground">{recommendations.length} recommended</span>
          </div>

          <div className="space-y-2.5">
            {recommendations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                All account projected balances are healthy! No transfers needed.
              </p>
            ) : (
              recommendations.map((rec, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-accent/30 border border-indigo-500/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-indigo-400">₹{rec.recommendedAmount.toLocaleString()}</span>
                    <form
                      action={async () => {
                        "use server";
                        if (currentMonthRecord) {
                          await recordTransferAction({
                            monthId: currentMonthRecord.id,
                            fromAccountId: rec.fromAccountId,
                            toAccountId: rec.toAccountId,
                            amount: rec.recommendedAmount,
                            transferDate: new Date().toISOString().split("T")[0],
                            notes: rec.reason,
                          });
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-[11px] transition-colors"
                      >
                        Record Transfer
                      </button>
                    </form>
                  </div>
                  <div className="text-foreground">
                    Transfer from <strong className="text-primary">{rec.fromAccountName}</strong> to <strong className="text-emerald-400">{rec.toAccountName}</strong>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{rec.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Expenses Pie */}
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <h3 className="font-bold text-sm text-foreground">Expense by Category</h3>
          <CategoryPieChart data={categoryPieData} />
        </div>

        {/* Account Balances Horizontal Bar */}
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <h3 className="font-bold text-sm text-foreground">Account Balances Overview</h3>
          <AccountBalanceBarChart data={accountBalances} />
        </div>

        {/* 12-Month Expense Trend */}
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <h3 className="font-bold text-sm text-foreground">Monthly Expense History</h3>
          <MonthlyExpenseBarChart data={monthlyHistory} />
        </div>

        {/* Income vs Expense Comparison */}
        <div className="glass-panel p-5 rounded-3xl space-y-3">
          <h3 className="font-bold text-sm text-foreground">Income vs Expense Trend</h3>
          <IncomeVsExpenseChart data={monthlyHistory} />
        </div>
      </div>
    </div>
  );
}
