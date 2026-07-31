import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { TemplatesClient } from "@/components/templates/templates-client";
import { seedDatabase } from "@/lib/db/seed";

export const revalidate = 0;

export default async function TemplatesPage() {
  await seedDatabase();

  const templates = await db.select().from(schema.expenseTemplates);
  const categories = await db.select().from(schema.categories);
  const accounts = await db.select().from(schema.accounts);

  return (
    <TemplatesClient
      initialTemplates={templates}
      categories={categories}
      accounts={accounts}
    />
  );
}
