import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { CategoriesClient } from "@/components/categories/categories-client";
import { seedDatabase } from "@/lib/db/seed";

export const revalidate = 0;

export default async function CategoriesPage() {
  await seedDatabase();
  const categories = await db.select().from(schema.categories);
  return <CategoriesClient initialCategories={categories} />;
}
