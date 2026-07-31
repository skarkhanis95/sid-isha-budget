"use server";

import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { startMonth, syncTemplatesToMonth } from "@/lib/services/month-service";
import { verifySession } from "@/lib/auth/session";

async function requireSession() {
  const session = await verifySession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session;
}

export async function startMonthAction(monthKey: string) {
  await requireSession();
  await startMonth(monthKey);
  revalidatePath("/dashboard");
  revalidatePath("/month");
  return { success: true };
}

export async function syncTemplatesAction(monthId: string) {
  await requireSession();
  await syncTemplatesToMonth(monthId);
  revalidatePath("/dashboard");
  revalidatePath("/month");
  return { success: true };
}

export async function markExpenseStatusAction(expenseId: string, status: "pending" | "paid" | "skipped", paidDate?: string) {
  await requireSession();
  const now = new Date().toISOString();
  const todayDate = now.split("T")[0];

  const updatePayload: { status: string; paidDate: string | null; updatedAt: string } = {
    status,
    paidDate: status === "paid" ? (paidDate || todayDate) : null,
    updatedAt: now,
  };

  await db
    .update(schema.expenses)
    .set(updatePayload)
    .where(eq(schema.expenses.id, expenseId));

  if (status === "pending") {
    await db
      .delete(schema.notificationLog)
      .where(eq(schema.notificationLog.expenseId, expenseId));
  }

  revalidatePath("/dashboard");
  revalidatePath("/month");
  revalidatePath("/reports");
  revalidatePath("/accounts");
  return { success: true };
}

export async function addExpenseAction(data: {
  monthId: string;
  name: string;
  categoryId: string;
  amount: number;
  paymentAccountId: string;
  fixed: boolean;
  dueDate: string;
  notes?: string;
}) {
  await requireSession();
  const now = new Date().toISOString();
  const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(schema.expenses).values({
    id,
    monthId: data.monthId,
    name: data.name,
    categoryId: data.categoryId,
    amount: data.amount,
    paymentAccountId: data.paymentAccountId,
    fixed: data.fixed,
    status: "pending",
    dueDate: data.dueDate,
    paidDate: null,
    notes: data.notes || null,
    displayOrder: 99,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/dashboard");
  revalidatePath("/month");
  return { success: true };
}

export async function updateExpenseAction(expenseId: string, data: {
  name?: string;
  categoryId?: string;
  amount?: number;
  paymentAccountId?: string;
  fixed?: boolean;
  dueDate?: string;
  status?: "pending" | "paid" | "skipped";
  paidDate?: string | null;
  notes?: string;
}) {
  await requireSession();
  const now = new Date().toISOString();

  await db
    .update(schema.expenses)
    .set({
      ...data,
      updatedAt: now,
    })
    .where(eq(schema.expenses.id, expenseId));

  revalidatePath("/dashboard");
  revalidatePath("/month");
  return { success: true };
}

export async function deleteExpenseAction(expenseId: string) {
  await requireSession();
  await db.delete(schema.expenses).where(eq(schema.expenses.id, expenseId));
  revalidatePath("/dashboard");
  revalidatePath("/month");
  return { success: true };
}

export async function addIncomeAction(data: {
  monthId: string;
  description: string;
  amount: number;
  accountId: string;
  receivedDate: string;
  notes?: string;
}) {
  await requireSession();
  const now = new Date().toISOString();
  const id = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(schema.income).values({
    id,
    monthId: data.monthId,
    description: data.description,
    amount: data.amount,
    accountId: data.accountId,
    receivedDate: data.receivedDate,
    notes: data.notes || null,
    createdAt: now,
  });

  revalidatePath("/dashboard");
  revalidatePath("/month");
  revalidatePath("/accounts");
  return { success: true };
}

export async function deleteIncomeAction(incomeId: string) {
  await requireSession();
  await db.delete(schema.income).where(eq(schema.income.id, incomeId));
  revalidatePath("/dashboard");
  revalidatePath("/month");
  revalidatePath("/accounts");
  return { success: true };
}

export async function recordTransferAction(data: {
  monthId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  transferDate: string;
  notes?: string;
}) {
  await requireSession();
  const now = new Date().toISOString();
  const id = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(schema.transfers).values({
    id,
    monthId: data.monthId,
    fromAccountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    amount: data.amount,
    status: "completed",
    transferDate: data.transferDate,
    notes: data.notes || null,
    createdAt: now,
  });

  revalidatePath("/dashboard");
  revalidatePath("/month");
  revalidatePath("/transfers");
  revalidatePath("/accounts");
  return { success: true };
}

// Account CRUD
export async function createAccountAction(data: {
  name: string;
  owner: string;
  type: string;
  openingBalance: number;
}) {
  await requireSession();
  const now = new Date().toISOString();
  const id = `acc_${Date.now()}`;

  await db.insert(schema.accounts).values({
    id,
    name: data.name,
    owner: data.owner,
    type: data.type,
    openingBalance: data.openingBalance,
    active: true,
    sortOrder: 10,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/accounts");
  return { success: true };
}

export async function updateAccountAction(accountId: string, data: Partial<typeof schema.accounts.$inferInsert>) {
  await requireSession();
  const now = new Date().toISOString();
  await db.update(schema.accounts).set({ ...data, updatedAt: now }).where(eq(schema.accounts.id, accountId));
  revalidatePath("/accounts");
  return { success: true };
}

export async function deleteAccountAction(accountId: string, reassignAccountId?: string) {
  await requireSession();
  if (reassignAccountId) {
    await db.update(schema.expenses).set({ paymentAccountId: reassignAccountId }).where(eq(schema.expenses.paymentAccountId, accountId));
    await db.update(schema.income).set({ accountId: reassignAccountId }).where(eq(schema.income.accountId, accountId));
  }
  await db.delete(schema.accounts).where(eq(schema.accounts.id, accountId));
  revalidatePath("/accounts");
  return { success: true };
}

// Category CRUD
export async function createCategoryAction(data: { name: string; icon: string; color: string }) {
  await requireSession();
  const now = new Date().toISOString();
  const id = `cat_${Date.now()}`;

  await db.insert(schema.categories).values({
    id,
    name: data.name,
    icon: data.icon,
    color: data.color,
    active: true,
    sortOrder: 10,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/categories");
  return { success: true };
}

export async function updateCategoryAction(categoryId: string, data: Partial<typeof schema.categories.$inferInsert>) {
  await requireSession();
  const now = new Date().toISOString();
  await db.update(schema.categories).set({ ...data, updatedAt: now }).where(eq(schema.categories.id, categoryId));
  revalidatePath("/categories");
  return { success: true };
}

export async function deleteCategoryAction(categoryId: string, reassignCategoryId?: string) {
  await requireSession();
  if (reassignCategoryId) {
    await db.update(schema.expenses).set({ categoryId: reassignCategoryId }).where(eq(schema.expenses.categoryId, categoryId));
  }
  await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));
  revalidatePath("/categories");
  return { success: true };
}

// Template CRUD
export async function createTemplateAction(data: {
  name: string;
  categoryId: string;
  defaultAmount: number;
  paymentAccountId: string;
  fixed: boolean;
  dueDay?: number | null;
  notes?: string;
}) {
  await requireSession();
  const now = new Date().toISOString();
  const id = `tmpl_${Date.now()}`;

  await db.insert(schema.expenseTemplates).values({
    id,
    name: data.name,
    categoryId: data.categoryId,
    defaultAmount: data.defaultAmount,
    paymentAccountId: data.paymentAccountId,
    fixed: data.fixed,
    dueDay: data.dueDay || null,
    enabled: true,
    notes: data.notes || null,
    sortOrder: 10,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/templates");
  revalidatePath("/month");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTemplateAction(templateId: string, data: Partial<typeof schema.expenseTemplates.$inferInsert>) {
  await requireSession();
  const now = new Date().toISOString();
  await db.update(schema.expenseTemplates).set({ ...data, updatedAt: now }).where(eq(schema.expenseTemplates.id, templateId));
  revalidatePath("/templates");
  revalidatePath("/month");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTemplateAction(templateId: string) {
  await requireSession();
  await db.delete(schema.expenseTemplates).where(eq(schema.expenseTemplates.id, templateId));
  revalidatePath("/templates");
  revalidatePath("/month");
  revalidatePath("/dashboard");
  return { success: true };
}
