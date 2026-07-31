import fs from "fs";
import path from "path";
import { createClient, Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/drizzle/schema";

// Standalone scripts (tsx lib/db/seed.ts, tsx scripts/telegram-poll.ts) run outside
// Next.js and don't get automatic .env.local loading. Vercel injects env vars natively,
// so skip this file read there (process.env.VERCEL is set in every Vercel environment).
if (!process.env.VERCEL) {
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
  } catch {}
}

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const isTursoCloud = Boolean(process.env.TURSO_DATABASE_URL);

// Create LibSQL client
export const client: Client = createClient({
  url,
  authToken,
});

// Initialize Drizzle ORM
export const db = drizzle(client, { schema });
