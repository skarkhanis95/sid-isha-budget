import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function resolveDueDate(year: number, month: number, dueDay: number | null | undefined): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (!dueDay || dueDay < 1) {
    return `${year}-${pad(month)}-01`;
  }
  const maxDay = getDaysInMonth(year, month);
  const resolvedDay = Math.min(dueDay, maxDay);
  return `${year}-${pad(month)}-${pad(resolvedDay)}`;
}

const FREQUENCY_INTERVAL_MONTHS: Record<string, number> = {
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};

// Determines whether a template with the given frequency/anchorDate should
// produce an expense in the target (year, month), and what day-of-month to use.
export function resolveTemplateOccurrence(
  frequency: string,
  anchorDate: string | null | undefined,
  targetYear: number,
  targetMonth: number
): { shouldOccur: boolean; day: number | null } {
  if (frequency === "monthly" || !frequency) {
    return { shouldOccur: true, day: null }; // caller falls back to dueDay
  }

  if (!anchorDate) {
    // Misconfigured non-monthly template with no anchor date — skip rather than guess.
    return { shouldOccur: false, day: null };
  }

  const [anchorYearStr, anchorMonthStr, anchorDayStr] = anchorDate.split("-");
  const anchorYear = parseInt(anchorYearStr, 10);
  const anchorMonth = parseInt(anchorMonthStr, 10);
  const anchorDay = parseInt(anchorDayStr, 10);

  const monthsBetween = (targetYear - anchorYear) * 12 + (targetMonth - anchorMonth);

  if (frequency === "one_time") {
    return { shouldOccur: monthsBetween === 0, day: anchorDay };
  }

  const interval = FREQUENCY_INTERVAL_MONTHS[frequency];
  if (!interval) {
    return { shouldOccur: false, day: null };
  }

  return { shouldOccur: monthsBetween >= 0 && monthsBetween % interval === 0, day: anchorDay };
}

export async function getMonth(monthKey: string) {
  const [existing] = await db
    .select()
    .from(schema.months)
    .where(eq(schema.months.monthKey, monthKey));
  return existing || null;
}

export async function syncTemplatesToMonth(monthId: string) {
  const [monthObj] = await db
    .select()
    .from(schema.months)
    .where(eq(schema.months.id, monthId));

  if (!monthObj) return;

  const enabledTemplates = await db
    .select()
    .from(schema.expenseTemplates)
    .where(eq(schema.expenseTemplates.enabled, true));

  const existingExpenses = await db
    .select()
    .from(schema.expenses)
    .where(eq(schema.expenses.monthId, monthId));

  const existingTemplateIds = new Set(
    existingExpenses.map((e) => e.templateId).filter(Boolean)
  );

  const now = new Date().toISOString();

  for (let i = 0; i < enabledTemplates.length; i++) {
    const tmpl = enabledTemplates[i];
    if (existingTemplateIds.has(tmpl.id)) continue;

    const { shouldOccur, day } = resolveTemplateOccurrence(
      tmpl.frequency,
      tmpl.anchorDate,
      monthObj.year,
      monthObj.month
    );
    if (!shouldOccur) continue;

    const dueDate =
      day !== null
        ? resolveDueDate(monthObj.year, monthObj.month, day)
        : tmpl.fixed
        ? resolveDueDate(monthObj.year, monthObj.month, tmpl.dueDay)
        : `${monthObj.year}-${String(monthObj.month).padStart(2, "0")}-01`;

    await db.insert(schema.expenses).values({
      id: `exp_${monthId}_${tmpl.id}`,
      monthId,
      templateId: tmpl.id,
      name: tmpl.name,
      categoryId: tmpl.categoryId,
      amount: tmpl.defaultAmount,
      paymentAccountId: tmpl.paymentAccountId,
      fixed: tmpl.fixed,
      status: "pending",
      dueDate,
      paidDate: null,
      notes: tmpl.notes,
      displayOrder: tmpl.sortOrder || i + 1,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function startMonth(monthKey: string) {
  const existing = await getMonth(monthKey);
  if (existing) {
    // Month is already started; return existing without auto-syncing deleted expenses
    return existing;
  }

  const [yearStr, monthStr] = monthKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const monthId = `m_${yearStr}_${monthStr}`;
  const now = new Date().toISOString();

  await db.insert(schema.months).values({
    id: monthId,
    year,
    month,
    monthKey,
    createdAt: now,
  });

  await syncTemplatesToMonth(monthId);

  const [newMonth] = await db
    .select()
    .from(schema.months)
    .where(eq(schema.months.id, monthId));

  return newMonth;
}

export const getOrCreateMonth = startMonth;
