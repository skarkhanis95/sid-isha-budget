import { createClient, Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/drizzle/schema";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const isTursoCloud = Boolean(process.env.TURSO_DATABASE_URL);

if (isTursoCloud) {
  console.log(`⚡ [DB] Connected to Turso Cloud Database (${process.env.TURSO_DATABASE_URL})`);
} else {
  console.log("📁 [DB] Connected to Local SQLite Database (file:local.db)");
}

// Create LibSQL client
export const client: Client = createClient({
  url,
  authToken,
});

// Initialize Drizzle ORM
export const db = drizzle(client, { schema });
