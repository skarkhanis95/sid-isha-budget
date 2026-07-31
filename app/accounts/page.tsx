import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { calculateAccountBalances } from "@/lib/services/balance-service";
import { seedDatabase } from "@/lib/db/seed";
import { AccountsClient } from "@/components/accounts/accounts-client";

export const revalidate = 0;

export default async function AccountsPage() {
  await seedDatabase();

  const rawAccounts = await db.select().from(schema.accounts);
  const accountBalances = await calculateAccountBalances();

  const accountsWithBalances = rawAccounts.map((acc) => {
    const bal = accountBalances.find((b) => b.accountId === acc.id);
    return {
      ...acc,
      currentBalance: bal ? bal.currentBalance : acc.openingBalance,
      pendingExpensesAmount: bal ? bal.pendingExpensesAmount : 0,
      projectedBalance: bal ? bal.projectedBalance : acc.openingBalance,
      hasShortfall: bal ? bal.hasShortfall : false,
    };
  });

  return <AccountsClient initialAccounts={accountsWithBalances} />;
}
