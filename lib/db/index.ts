import fs from "fs";
import path from "path";
import { createClient, Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/drizzle/schema";

// Load .env.local synchronously before initializing database client
try {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    for (const line of envConfig.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const eqIdx = trimmed.indexOf("=");
        const k = trimmed.substring(0, eqIdx).trim();
        const v = trimmed.substring(eqIdx + 1).trim();
        if (k && !process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
} catch (e) {}

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
