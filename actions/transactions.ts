"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { transactionSchema } from "@/lib/validators/transaction";
import { awardXP } from "@/lib/gamification/xp";
import { evaluateStreak } from "@/lib/gamification/streak";
import { checkAndAwardAchievement } from "@/lib/gamification/achievements";
import type { ActionResult } from "@/types/api";

type BudgetAlert = { categoryId: string; percentage: number };

export async function createTransaction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ id: string; budgetAlerts: BudgetAlert[] }>> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const raw = {
    walletId: formData.get("walletId"),
    destinationWalletId: formData.get("destinationWalletId") ?? undefined,
    categoryId: formData.get("categoryId") ?? undefined,
    amount: formData.get("amount"),
    type: formData.get("type"),
    date: formData.get("date") ?? new Date().toISOString(),
    note: formData.get("note") ?? undefined,
  };

  const result = transactionSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const userId = auth.supabaseId;
  const data = result.data;

  // All DB writes in a single transaction
  const transaction = await db.$transaction(async (tx) => {
    const t = await tx.transaction.create({
      data: {
        userId,
        walletId: data.walletId,
        destinationWalletId: data.destinationWalletId,
        categoryId: data.categoryId,
        amount: data.amount,
        type: data.type,
        date: data.date,
        note: data.note,
      },
    });

    // Update wallet balance(s)
    if (data.type === "INCOME") {
      await tx.wallet.update({
        where: { id: data.walletId },
        data: { balance: { increment: data.amount } },
      });
    } else if (data.type === "EXPENSE") {
      await tx.wallet.update({
        where: { id: data.walletId },
        data: { balance: { decrement: data.amount } },
      });
    } else if (data.type === "TRANSFER" && data.destinationWalletId) {
      await tx.wallet.update({
        where: { id: data.walletId },
        data: { balance: { decrement: data.amount } },
      });
      await tx.wallet.update({
        where: { id: data.destinationWalletId },
        data: { balance: { increment: data.amount } },
      });
    }

    return t;
  });

  // Gamification (outside Prisma TX to avoid holding connection)
  await Promise.all([
    awardXP(userId, "TRANSACTION"),
    evaluateStreak(userId),
  ]);
  await checkAndAwardAchievement(userId, "FIRST_TRANSACTION");

  // Budget threshold check
  const budgetAlerts: BudgetAlert[] = [];
  if (data.type === "EXPENSE" && data.categoryId) {
    const now = data.date;
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await db.budget.findUnique({
      where: {
        userId_categoryId_month_year: { userId, categoryId: data.categoryId, month, year },
      },
    });

    if (budget) {
      const spent = await db.transaction.aggregate({
        where: {
          userId,
          categoryId: data.categoryId,
          type: "EXPENSE",
          date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
        },
        _sum: { amount: true },
      });
      const totalSpent = Number(spent._sum.amount ?? 0);
      const limit = Number(budget.monthlyLimit);
      const percentage = (totalSpent / limit) * 100;

      if (percentage >= 80) {
        budgetAlerts.push({ categoryId: data.categoryId, percentage });
      }
    }
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");

  return { success: true, data: { id: transaction.id, budgetAlerts } };
}

export async function updateTransaction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const raw = {
    walletId: formData.get("walletId"),
    destinationWalletId: formData.get("destinationWalletId") ?? undefined,
    categoryId: formData.get("categoryId") ?? undefined,
    amount: formData.get("amount"),
    type: formData.get("type"),
    date: formData.get("date"),
    note: formData.get("note") ?? undefined,
  };

  const result = transactionSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await db.transaction.updateMany({
    where: { id, userId: auth.supabaseId },
    data: {
      walletId: result.data.walletId,
      destinationWalletId: result.data.destinationWalletId,
      categoryId: result.data.categoryId,
      amount: result.data.amount,
      type: result.data.type,
      date: result.data.date,
      note: result.data.note,
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  await db.transaction.deleteMany({
    where: { id, userId: auth.supabaseId },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function bulkDeleteTransactions(ids: string[]): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  await db.transaction.deleteMany({
    where: { id: { in: ids }, userId: auth.supabaseId },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
