import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { getMonth } from "@/lib/services/month-service";
import { MonthViewClient } from "@/components/month/month-view-client";
import { eq } from "drizzle-orm";

export const revalidate = 0;

export default async function MonthPage({
  searchParams,
}: {
  searchParams?: { key?: string };
}) {
  const now = new Date();
  const currentSystemKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const targetKey = searchParams?.key || currentSystemKey;

  const currentMonthRecord = await getMonth(currentSystemKey);
  const isCurrentStarted = Boolean(currentMonthRecord);

  const targetMonthRecord = await getMonth(targetKey);

  let incomeList: any[] = [];
  let expensesList: any[] = [];
  const categories = await db.select().from(schema.categories);
  const accounts = await db.select().from(schema.accounts);

  if (targetMonthRecord) {
    incomeList = await db
      .select()
      .from(schema.income)
      .where(eq(schema.income.monthId, targetMonthRecord.id));

    const rawExpenses = await db
      .select()
      .from(schema.expenses)
      .where(eq(schema.expenses.monthId, targetMonthRecord.id));

    expensesList = rawExpenses.map((exp) => ({
      ...exp,
      categoryName: categories.find((c) => c.id === exp.categoryId)?.name,
      accountName: accounts.find((a) => a.id === exp.paymentAccountId)?.name,
    }));
  }

  return (
    <MonthViewClient
      monthKey={targetKey}
      monthId={targetMonthRecord ? targetMonthRecord.id : null}
      incomeList={incomeList}
      expensesList={expensesList}
      categories={categories}
      accounts={accounts}
      currentSystemKey={currentSystemKey}
      isCurrentStarted={isCurrentStarted}
    />
  );
}
