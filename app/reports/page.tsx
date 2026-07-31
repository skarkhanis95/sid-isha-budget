import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getOrCreateMonth } from "@/lib/services/month-service";
import { ReportsClient } from "@/components/reports/reports-client";
import { seedDatabase } from "@/lib/db/seed";

export const revalidate = 0;

export default async function ReportsPage() {
  await seedDatabase();

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonth = await getOrCreateMonth(monthKey);

  const currentMonthExpenses = await db
    .select()
    .from(schema.expenses)
    .where(eq(schema.expenses.monthId, currentMonth.id));

  const allExpenses = await db.select().from(schema.expenses);
  const allIncome = await db.select().from(schema.income);
  const categories = await db.select().from(schema.categories);
  const months = await db.select().from(schema.months);

  return (
    <ReportsClient
      currentMonthExpenses={currentMonthExpenses}
      allExpenses={allExpenses}
      allIncome={allIncome}
      categories={categories}
      months={months}
    />
  );
}
