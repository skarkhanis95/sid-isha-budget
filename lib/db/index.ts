import { createClient, Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/drizzle/schema";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

// Create LibSQL client (supports both Turso remote URL and local SQLite fallback)
export const client: Client = createClient({
  url,
  authToken,
});

// Initialize Drizzle ORM
export const db = drizzle(client, { schema });
