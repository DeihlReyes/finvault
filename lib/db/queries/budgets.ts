import { getDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { budgets, categories } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { budgetSchema } from "@/lib/validators/budget";
import { awardXP } from "@/lib/gamification/xp";
import { checkAndAwardAchievement } from "@/lib/gamification/achievements";
import type { ActionResult } from "@/types/api";

export async function getBudgets(month: number, year: number) {
  const db = getDb();
  return db
    .select({
      id: budgets.id,
      userId: budgets.userId,
      categoryId: budgets.categoryId,
      monthlyLimit: budgets.monthlyLimit,
      month: budgets.month,
      year: budgets.year,
      rolloverEnabled: budgets.rolloverEnabled,
      createdAt: budgets.createdAt,
      updatedAt: budgets.updatedAt,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
      categoryColor: categories.color,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(
      and(
        eq(budgets.userId, LOCAL_USER_ID),
        eq(budgets.month, month),
        eq(budgets.year, year)
      )
    );
}

export async function createBudget(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  const result = budgetSchema.safeParse(input);
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

  await db.insert(budgets).values({
    id,
    userId: LOCAL_USER_ID,
    categoryId: data.categoryId,
    monthlyLimit: String(data.monthlyLimit),
    month: data.month,
    year: data.year,
    rolloverEnabled: data.rolloverEnabled ?? false,
  });

  Promise.all([
    awardXP(LOCAL_USER_ID, "BUDGET_SETUP"),
    checkAndAwardAchievement(LOCAL_USER_ID, "BUDGET_BUILDER"),
  ]).catch(console.error);

  return { success: true, data: { id } };
}

export async function updateBudget(
  id: string,
  input: Record<string, unknown>
): Promise<ActionResult> {
  const result = budgetSchema.safeParse(input);
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
    .update(budgets)
    .set({
      monthlyLimit: String(data.monthlyLimit),
      rolloverEnabled: data.rolloverEnabled ?? false,
      updatedAt: new Date(),
    })
    .where(and(eq(budgets.id, id), eq(budgets.userId, LOCAL_USER_ID)));

  return { success: true, data: undefined };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const db = getDb();

  await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, LOCAL_USER_ID)));

  return { success: true, data: undefined };
}
