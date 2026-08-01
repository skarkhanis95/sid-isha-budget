import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, and, or } from "drizzle-orm";

export interface AccountBalanceSummary {
  accountId: string;
  accountName: string;
  owner: string;
  type: string;
  openingBalance: number;
  currentBalance: number;
  pendingExpensesAmount: number;
  projectedBalance: number;
  hasShortfall: boolean;
  balanceOverride: number | null;
  balanceOverrideDate: string | null;
}

export async function calculateAccountBalances(monthId?: string): Promise<AccountBalanceSummary[]> {
  const allAccounts = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.active, true));

  const allIncome = await db.select().from(schema.income);
  const allExpenses = await db.select().from(schema.expenses);
  const allTransfers = await db.select().from(schema.transfers);

  const summaries: AccountBalanceSummary[] = allAccounts.map((acc) => {
    // A manual balance override resets the ledger baseline as of a given date —
    // only transactions on/after that date accrue on top of it. Lets you skip
    // tracking every small expense and just correct the balance periodically.
    const hasOverride = acc.balanceOverride !== null && acc.balanceOverride !== undefined;
    const baseBalance = hasOverride ? acc.balanceOverride! : acc.openingBalance;
    const cutoffDate = hasOverride ? acc.balanceOverrideDate : null;

    // Income credited to this account
    const totalIncome = allIncome
      .filter((inc) => inc.accountId === acc.id && (!cutoffDate || inc.receivedDate >= cutoffDate))
      .reduce((sum, inc) => sum + inc.amount, 0);

    // Paid expenses from this account
    const totalPaidExpenses = allExpenses
      .filter(
        (exp) =>
          exp.paymentAccountId === acc.id &&
          exp.status === "paid" &&
          (!cutoffDate || (exp.paidDate || exp.dueDate) >= cutoffDate)
      )
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Completed transfers in & out
    const transfersIn = allTransfers
      .filter((tr) => tr.toAccountId === acc.id && tr.status === "completed" && (!cutoffDate || tr.transferDate >= cutoffDate))
      .reduce((sum, tr) => sum + tr.amount, 0);

    const transfersOut = allTransfers
      .filter((tr) => tr.fromAccountId === acc.id && tr.status === "completed" && (!cutoffDate || tr.transferDate >= cutoffDate))
      .reduce((sum, tr) => sum + tr.amount, 0);

    const currentBalance = baseBalance + totalIncome + transfersIn - transfersOut - totalPaidExpenses;

    // Pending expenses for targeted month (or all pending if no month specified)
    const pendingExpenses = allExpenses.filter((exp) => {
      const matchMonth = monthId ? exp.monthId === monthId : true;
      return matchMonth && exp.paymentAccountId === acc.id && exp.status === "pending";
    });

    const pendingExpensesAmount = pendingExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Pending transfers
    const pendingTransfersIn = allTransfers
      .filter((tr) => tr.toAccountId === acc.id && tr.status === "pending")
      .reduce((sum, tr) => sum + tr.amount, 0);

    const pendingTransfersOut = allTransfers
      .filter((tr) => tr.fromAccountId === acc.id && tr.status === "pending")
      .reduce((sum, tr) => sum + tr.amount, 0);

    const projectedBalance = currentBalance - pendingExpensesAmount + pendingTransfersIn - pendingTransfersOut;

    return {
      accountId: acc.id,
      accountName: acc.name,
      owner: acc.owner,
      type: acc.type,
      openingBalance: acc.openingBalance,
      currentBalance,
      pendingExpensesAmount,
      projectedBalance,
      hasShortfall: projectedBalance < 0,
      balanceOverride: hasOverride ? acc.balanceOverride! : null,
      balanceOverrideDate: hasOverride ? acc.balanceOverrideDate ?? null : null,
    };
  });

  return summaries;
}
