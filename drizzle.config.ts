import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: process.env.TURSO_DATABASE_URL ? "turso" : "sqlite",
  dbCredentials: {
    url,
    authToken,
  },
});
