"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { transactionSchema } from "@/lib/validators/transaction";
import { awardXP } from "@/lib/gamification/xp";
import { evaluateStreak } from "@/lib/gamification/streak";
import { checkAndAwardAchievement } from "@/lib/gamification/achievements";
import { incrementChallengeProgress } from "@/lib/challenges/monthly";
import { notifyUser } from "@/lib/push/notify";
import type { ActionResult } from "@/types/api";

type BudgetAlert = { categoryId: string; percentage: number };

export async function createTransaction(
  _prev: ActionResult<{ id: string; budgetAlerts: BudgetAlert[] }> | null,
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
  const txDate = data.date;
  const txMonth = txDate.getMonth() + 1;
  const txYear = txDate.getFullYear();

  // Fire-and-forget — don't block the response on gamification writes
  Promise.all([
    awardXP(userId, "TRANSACTION"),
    evaluateStreak(userId),
    incrementChallengeProgress(userId, txMonth, txYear),
  ]).then(() => checkAndAwardAchievement(userId, "FIRST_TRANSACTION"))
    .catch(console.error);

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
        // Fire-and-forget push notification
        notifyUser(userId, {
          title: percentage >= 100 ? "Budget exceeded!" : "Budget warning",
          body:
            percentage >= 100
              ? `You've exceeded your budget for this category.`
              : `You've used ${Math.round(percentage)}% of your budget.`,
          tag: `budget-${data.categoryId}`,
          url: "/budgets",
        }).catch(() => {});
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
  _prev: ActionResult<void> | null,
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

  // Fetch the old transaction to reverse its balance effect
  const old = await db.transaction.findFirst({
    where: { id, userId: auth.supabaseId },
    select: { type: true, amount: true, walletId: true, destinationWalletId: true },
  });
  if (!old) return { success: false, error: "Transaction not found" };

  const next = result.data;

  await db.$transaction(async (prisma) => {
    // 1. Reverse old balance effect
    if (old.type === "INCOME") {
      await prisma.wallet.update({ where: { id: old.walletId }, data: { balance: { decrement: old.amount } } });
    } else if (old.type === "EXPENSE") {
      await prisma.wallet.update({ where: { id: old.walletId }, data: { balance: { increment: old.amount } } });
    } else if (old.type === "TRANSFER" && old.destinationWalletId) {
      await prisma.wallet.update({ where: { id: old.walletId }, data: { balance: { increment: old.amount } } });
      await prisma.wallet.update({ where: { id: old.destinationWalletId }, data: { balance: { decrement: old.amount } } });
    }

    // 2. Apply new balance effect
    if (next.type === "INCOME") {
      await prisma.wallet.update({ where: { id: next.walletId }, data: { balance: { increment: next.amount } } });
    } else if (next.type === "EXPENSE") {
      await prisma.wallet.update({ where: { id: next.walletId }, data: { balance: { decrement: next.amount } } });
    } else if (next.type === "TRANSFER" && next.destinationWalletId) {
      await prisma.wallet.update({ where: { id: next.walletId }, data: { balance: { decrement: next.amount } } });
      await prisma.wallet.update({ where: { id: next.destinationWalletId }, data: { balance: { increment: next.amount } } });
    }

    // 3. Update the transaction record
    await prisma.transaction.update({
      where: { id },
      data: {
        walletId: next.walletId,
        destinationWalletId: next.destinationWalletId,
        categoryId: next.categoryId,
        amount: next.amount,
        type: next.type,
        date: next.date,
        note: next.note,
      },
    });
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { success: true, data: undefined };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const tx = await db.transaction.findFirst({
    where: { id, userId: auth.supabaseId },
    select: { type: true, amount: true, walletId: true, destinationWalletId: true },
  });
  if (!tx) return { success: false, error: "Transaction not found" };

  await db.$transaction(async (prisma) => {
    await prisma.transaction.delete({ where: { id } });

    if (tx.type === "INCOME") {
      await prisma.wallet.update({
        where: { id: tx.walletId },
        data: { balance: { decrement: tx.amount } },
      });
    } else if (tx.type === "EXPENSE") {
      await prisma.wallet.update({
        where: { id: tx.walletId },
        data: { balance: { increment: tx.amount } },
      });
    } else if (tx.type === "TRANSFER" && tx.destinationWalletId) {
      await prisma.wallet.update({
        where: { id: tx.walletId },
        data: { balance: { increment: tx.amount } },
      });
      await prisma.wallet.update({
        where: { id: tx.destinationWalletId },
        data: { balance: { decrement: tx.amount } },
      });
    }
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { success: true, data: undefined };
}

export async function bulkDeleteTransactions(ids: string[]): Promise<ActionResult> {
  const auth = await getUser();
  if (!auth) return { success: false, error: "Not authenticated" };

  const txs = await db.transaction.findMany({
    where: { id: { in: ids }, userId: auth.supabaseId },
    select: { id: true, type: true, amount: true, walletId: true, destinationWalletId: true },
  });

  await db.$transaction(async (prisma) => {
    await prisma.transaction.deleteMany({ where: { id: { in: ids } } });

    for (const tx of txs) {
      if (tx.type === "INCOME") {
        await prisma.wallet.update({
          where: { id: tx.walletId },
          data: { balance: { decrement: tx.amount } },
        });
      } else if (tx.type === "EXPENSE") {
        await prisma.wallet.update({
          where: { id: tx.walletId },
          data: { balance: { increment: tx.amount } },
        });
      } else if (tx.type === "TRANSFER" && tx.destinationWalletId) {
        await prisma.wallet.update({
          where: { id: tx.walletId },
          data: { balance: { increment: tx.amount } },
        });
        await prisma.wallet.update({
          where: { id: tx.destinationWalletId },
          data: { balance: { decrement: tx.amount } },
        });
      }
    }
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  return { success: true, data: undefined };
}

export async function getTransactionFormData() {
  const auth = await getUser();
  if (!auth) return null;

  const [wallets, categories] = await Promise.all([
    db.wallet.findMany({
      where: { userId: auth.supabaseId, isArchived: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, currency: true },
    }),
    db.category.findMany({
      where: { userId: auth.supabaseId, isArchived: false },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: { id: true, name: true, emoji: true },
    }),
  ]);

  return { wallets, categories };
}
