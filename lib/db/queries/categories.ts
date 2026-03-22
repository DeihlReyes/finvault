import { getDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { categories, transactions } from "@/lib/db/schema";
import { and, eq, count } from "drizzle-orm";
import { categorySchema } from "@/lib/validators/category";
import type { ActionResult } from "@/types/api";

export async function getCategories() {
  const db = getDb();
  return db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.userId, LOCAL_USER_ID),
        eq(categories.isArchived, false)
      )
    )
    .orderBy(categories.isDefault, categories.name);
}

export async function createCategory(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  const result = categorySchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const data = result.data;

  await db.insert(categories).values({
    id,
    userId: LOCAL_USER_ID,
    name: data.name,
    emoji: data.emoji ?? "💰",
    color: data.color ?? "#6C47FF",
  });

  return { success: true, data: { id } };
}

export async function updateCategory(
  id: string,
  input: Record<string, unknown>
): Promise<ActionResult> {
  const result = categorySchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const db = getDb();
  const data = result.data;

  await db
    .update(categories)
    .set({
      name: data.name,
      emoji: data.emoji ?? "💰",
      color: data.color ?? "#6C47FF",
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, id), eq(categories.userId, LOCAL_USER_ID)));

  return { success: true, data: undefined };
}

export async function archiveCategory(id: string): Promise<ActionResult> {
  const db = getDb();

  const [{ txCount }] = await db
    .select({ txCount: count() })
    .from(transactions)
    .where(eq(transactions.categoryId, id));

  if (txCount > 0) {
    return {
      success: false,
      error:
        "Cannot archive a category that has transactions. Remove transactions first.",
    };
  }

  await db
    .update(categories)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, LOCAL_USER_ID)));

  return { success: true, data: undefined };
}
