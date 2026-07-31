import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { TemplatesClient } from "@/components/templates/templates-client";

export const revalidate = 0;

export default async function TemplatesPage() {
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
