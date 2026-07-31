import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  owner: text("owner").notNull(),
  type: text("type").notNull(), // 'bank', 'cash', 'wallet', 'credit_card'
  openingBalance: real("opening_balance").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("Tag"),
  color: text("color").notNull().default("#3b82f6"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const expenseTemplates = sqliteTable("expense_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: text("category_id").notNull(),
  defaultAmount: real("default_amount").notNull().default(0),
  paymentAccountId: text("payment_account_id").notNull(),
  fixed: integer("fixed", { mode: "boolean" }).notNull().default(false),
  dueDay: integer("due_day"), // 1-31, relative day of month
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const months = sqliteTable("months", {
  id: text("id").primaryKey(),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  monthKey: text("month_key").notNull().unique(), // YYYY-MM
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const income = sqliteTable("income", {
  id: text("id").primaryKey(),
  monthId: text("month_id").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  accountId: text("account_id").notNull(),
  receivedDate: text("received_date").notNull(), // YYYY-MM-DD
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  monthId: text("month_id").notNull(),
  templateId: text("template_id"),
  name: text("name").notNull(),
  categoryId: text("category_id").notNull(),
  amount: real("amount").notNull(),
  paymentAccountId: text("payment_account_id").notNull(),
  fixed: integer("fixed", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("pending"), // 'pending', 'paid', 'skipped'
  dueDate: text("due_date").notNull(), // YYYY-MM-DD resolved absolute date
  paidDate: text("paid_date"), // YYYY-MM-DD when marked paid
  notes: text("notes"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const transfers = sqliteTable("transfers", {
  id: text("id").primaryKey(),
  monthId: text("month_id").notNull(),
  fromAccountId: text("from_account_id").notNull(),
  toAccountId: text("to_account_id").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("completed"), // 'pending', 'completed'
  transferDate: text("transfer_date").notNull(), // YYYY-MM-DD
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const notificationSettings = sqliteTable("notification_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  leadTimeDays: integer("lead_time_days").notNull().default(1),
  inAppEnabled: integer("in_app_enabled", { mode: "boolean" }).notNull().default(true),
  telegramEnabled: integer("telegram_enabled", { mode: "boolean" }).notNull().default(false),
  dailySendHour: integer("daily_send_hour").notNull().default(8),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const telegramLinks = sqliteTable("telegram_links", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  telegramChatId: text("telegram_chat_id"),
  linkedAt: text("linked_at"),
  status: text("status").notNull().default("pending"), // 'pending', 'active', 'revoked'
  startCode: text("start_code").unique(),
});

export const notificationLog = sqliteTable("notification_log", {
  id: text("id").primaryKey(),
  expenseId: text("expense_id").notNull(),
  monthId: text("month_id").notNull(),
  userId: text("user_id").notNull(),
  channel: text("channel").notNull(), // 'in_app', 'telegram'
  sentAt: text("sent_at").notNull(),
  messagePreview: text("message_preview").notNull(),
});
