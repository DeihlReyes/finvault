"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { budgetSchema } from "@/lib/validators/budget";
import { awardXP } from "@/lib/gamification/xp";
import { checkAndAwardAchievement } from "@/lib/gamification/achievements";
import type { ActionResult } from "@/types/api";

export async function createBudget(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const now = new Date();
  const result = budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    monthlyLimit: formData.get("monthlyLimit"),
    month: formData.get("month") ?? now.getMonth() + 1,
    year: formData.get("year") ?? now.getFullYear(),
    rolloverEnabled: formData.get("rolloverEnabled") === "true",
  });

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const budget = await db.budget.create({
    data: { userId: auth.supabaseId, ...result.data },
  });

  await awardXP(auth.supabaseId, "BUDGET_SETUP");
  await checkAndAwardAchievement(auth.supabaseId, "BUDGET_BUILDER");

  revalidatePath("/budgets");
  return { success: true, data: { id: budget.id } };
}

export async function updateBudget(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const result = budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    monthlyLimit: formData.get("monthlyLimit"),
    month: formData.get("month"),
    year: formData.get("year"),
    rolloverEnabled: formData.get("rolloverEnabled") === "true",
  });

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await db.budget.updateMany({
    where: { id, userId: auth.supabaseId },
    data: { monthlyLimit: result.data.monthlyLimit, rolloverEnabled: result.data.rolloverEnabled },
  });

  revalidatePath("/budgets");
  return { success: true, data: undefined };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  await db.budget.deleteMany({
    where: { id, userId: auth.supabaseId },
  });

  revalidatePath("/budgets");
  return { success: true, data: undefined };
}
