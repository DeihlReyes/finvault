"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { recurringRuleSchema } from "@/lib/validators/recurring-rule";
import { awardXP } from "@/lib/gamification/xp";
import { computeNextDueDate } from "@/lib/recurring/processor";
import type { ActionResult } from "@/types/api";
import type { RecurringFrequency } from "@/lib/generated/prisma/enums";

export async function createRecurringRule(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const raw = {
    walletId: formData.get("walletId"),
    categoryId: formData.get("categoryId") ?? undefined,
    name: formData.get("name"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    frequency: formData.get("frequency"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") ?? undefined,
  };

  const result = recurringRuleSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const nextDueDate = computeNextDueDate(result.data.startDate, result.data.frequency as RecurringFrequency);

  const rule = await db.recurringRule.create({
    data: {
      userId: auth.supabaseId,
      ...result.data,
      nextDueDate,
    },
  });

  await awardXP(auth.supabaseId, "RECURRING_RULE");

  revalidatePath("/", "layout");
  return { success: true, data: { id: rule.id } };
}

export async function updateRecurringRule(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const raw = {
    walletId: formData.get("walletId"),
    categoryId: formData.get("categoryId") ?? undefined,
    name: formData.get("name"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    frequency: formData.get("frequency"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") ?? undefined,
  };

  const result = recurringRuleSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const nextDueDate = computeNextDueDate(result.data.startDate, result.data.frequency as RecurringFrequency);

  await db.recurringRule.updateMany({
    where: { id, userId: auth.supabaseId },
    data: { ...result.data, nextDueDate },
  });

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function togglePausedRule(id: string): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const rule = await db.recurringRule.findFirst({
    where: { id, userId: auth.supabaseId },
    select: { isPaused: true },
  });
  if (!rule) return { success: false, error: "Rule not found" };

  await db.recurringRule.updateMany({
    where: { id, userId: auth.supabaseId },
    data: { isPaused: !rule.isPaused },
  });

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function deleteRecurringRule(id: string): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  await db.recurringRule.deleteMany({
    where: { id, userId: auth.supabaseId },
  });

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}
