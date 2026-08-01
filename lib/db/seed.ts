import crypto from "crypto";
import { db } from "./index";
import * as schema from "@/drizzle/schema";
import bcrypt from "bcryptjs";

function generateStartCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

export async function seedDatabase() {
  const now = new Date().toISOString();

  // 1. Create database tables if they don't exist yet
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      type TEXT NOT NULL,
      opening_balance REAL NOT NULL DEFAULT 0,
      balance_override REAL,
      balance_override_date TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Tag',
      color TEXT NOT NULL DEFAULT '#3b82f6',
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS expense_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      default_amount REAL NOT NULL DEFAULT 0,
      payment_account_id TEXT NOT NULL,
      fixed INTEGER NOT NULL DEFAULT 0,
      due_day INTEGER,
      frequency TEXT NOT NULL DEFAULT 'monthly',
      anchor_date TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS months (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      month_key TEXT NOT NULL UNIQUE,
      notes TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS income (
      id TEXT PRIMARY KEY,
      month_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      account_id TEXT NOT NULL,
      received_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      month_id TEXT NOT NULL,
      template_id TEXT,
      name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_account_id TEXT NOT NULL,
      fixed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT NOT NULL,
      paid_date TEXT,
      notes TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      month_id TEXT NOT NULL,
      from_account_id TEXT NOT NULL,
      to_account_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      transfer_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS notification_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      lead_time_days INTEGER NOT NULL DEFAULT 1,
      in_app_enabled INTEGER NOT NULL DEFAULT 1,
      telegram_enabled INTEGER NOT NULL DEFAULT 0,
      daily_send_hour INTEGER NOT NULL DEFAULT 8,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS telegram_links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      telegram_chat_id TEXT,
      linked_at TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      start_code TEXT UNIQUE
    );`,
    `CREATE TABLE IF NOT EXISTS login_attempts (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL UNIQUE,
      count INTEGER NOT NULL DEFAULT 0,
      lock_until INTEGER
    );`,
    `CREATE TABLE IF NOT EXISTS notification_log (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      month_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      message_preview TEXT NOT NULL
    );`
  ];

  for (const query of tables) {
    await db.run(query);
  }

  // 1b. Idempotent migrations for columns added after initial release
  // (CREATE TABLE IF NOT EXISTS above only helps fresh databases)
  const columnMigrations = [
    `ALTER TABLE expense_templates ADD COLUMN frequency TEXT NOT NULL DEFAULT 'monthly';`,
    `ALTER TABLE expense_templates ADD COLUMN anchor_date TEXT;`,
    `ALTER TABLE accounts ADD COLUMN balance_override REAL;`,
    `ALTER TABLE accounts ADD COLUMN balance_override_date TEXT;`,
  ];
  for (const query of columnMigrations) {
    try {
      await db.run(query);
    } catch (err) {
      // Ignore "duplicate column name" — means this migration already ran
      if (!(err instanceof Error) || !/duplicate column/i.test(err.message)) {
        throw err;
      }
    }
  }

  // 2. If database is already initialized, skip
  const existingUsers = await db.select().from(schema.users);
  if (existingUsers.length > 0) {
    return;
  }

  console.log("Database uninitialized. Seeding clean structure...");

  // Seed Predefined Users (Siddharth & Isha)
  // Passwords are generated randomly unless overridden via SEED_SID_PASSWORD / SEED_ISHA_PASSWORD.
  // Change them from Settings (or re-seed) after first login.
  const sidPassword = process.env.SEED_SID_PASSWORD || crypto.randomBytes(9).toString("base64url");
  const ishaPassword = process.env.SEED_ISHA_PASSWORD || crypto.randomBytes(9).toString("base64url");

  const userList = [
    { id: "usr_sid", username: "siddharth", passwordHash: await bcrypt.hash(sidPassword, 10), displayName: "Siddharth", createdAt: now },
    { id: "usr_isha", username: "isha", passwordHash: await bcrypt.hash(ishaPassword, 10), displayName: "Isha", createdAt: now },
  ];
  await db.insert(schema.users).values(userList);

  console.log("=".repeat(60));
  console.log("Generated initial login credentials (save these now):");
  console.log(`  siddharth / ${sidPassword}`);
  console.log(`  isha      / ${ishaPassword}`);
  console.log("=".repeat(60));

  for (const u of userList) {
    await db.insert(schema.notificationSettings).values({
      id: `ns_${u.id}`,
      userId: u.id,
      leadTimeDays: 1,
      inAppEnabled: true,
      telegramEnabled: false,
      dailySendHour: 8,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schema.telegramLinks).values({
      id: `tg_${u.id}`,
      userId: u.id,
      status: "pending",
      startCode: generateStartCode(),
    });
  }

  // Seed Base Accounts with 0 opening balance
  const accountList = [
    { id: "acc_hdfc", name: "HDFC Savings", owner: "Siddharth", type: "bank", openingBalance: 0, active: true, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "acc_icici", name: "ICICI Savings", owner: "Isha", type: "bank", openingBalance: 0, active: true, sortOrder: 2, createdAt: now, updatedAt: now },
    { id: "acc_cash", name: "Cash Wallet", owner: "Joint", type: "cash", openingBalance: 0, active: true, sortOrder: 3, createdAt: now, updatedAt: now },
  ];
  await db.insert(schema.accounts).values(accountList);

  // Seed Base Categories
  const categoryList = [
    { id: "cat_rent", name: "Housing / Rent", icon: "Home", color: "#ef4444", active: true, sortOrder: 1, createdAt: now, updatedAt: now },
    { id: "cat_emi", name: "Loans / EMI", icon: "CreditCard", color: "#f97316", active: true, sortOrder: 2, createdAt: now, updatedAt: now },
    { id: "cat_util", name: "Utilities", icon: "Zap", color: "#eab308", active: true, sortOrder: 3, createdAt: now, updatedAt: now },
    { id: "cat_groc", name: "Groceries & Household", icon: "ShoppingCart", color: "#22c55e", active: true, sortOrder: 4, createdAt: now, updatedAt: now },
    { id: "cat_sub", name: "Subscriptions", icon: "Tv", color: "#06b6d4", active: true, sortOrder: 5, createdAt: now, updatedAt: now },
    { id: "cat_dine", name: "Dining & Outings", icon: "Utensils", color: "#3b82f6", active: true, sortOrder: 6, createdAt: now, updatedAt: now },
    { id: "cat_health", name: "Healthcare & Medical", icon: "HeartPulse", color: "#ec4899", active: true, sortOrder: 7, createdAt: now, updatedAt: now },
    { id: "cat_misc", name: "Miscellaneous", icon: "Tag", color: "#a855f7", active: true, sortOrder: 8, createdAt: now, updatedAt: now },
  ];
  await db.insert(schema.categories).values(categoryList);

  console.log("Clean database initialization completed.");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
