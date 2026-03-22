import { getDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import {
  transactions,
  wallets,
  budgets,
  categories,
  type TransactionType,
} from "@/lib/db/schema";
import {
  and,
  eq,
  gte,
  lt,
  desc,
  inArray,
  sum,
  sql,
} from "drizzle-orm";
import { transactionSchema } from "@/lib/validators/transaction";
import { awardXP } from "@/lib/gamification/xp";
import { evaluateStreak } from "@/lib/gamification/streak";
import { checkAndAwardAchievement } from "@/lib/gamification/achievements";
import { incrementChallengeProgress } from "@/lib/challenges/monthly";
import type { ActionResult } from "@/types/api";

type BudgetAlert = { categoryId: string; percentage: number };

type TransactionFilters = {
  month?: number;
  year?: number;
  type?: TransactionType;
  walletId?: string;
  categoryId?: string;
};

export async function getTransactions(filters: TransactionFilters = {}) {
  const db = getDb();
  const { month, year, type, walletId, categoryId } = filters;

  const conditions = [eq(transactions.userId, LOCAL_USER_ID)];

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    conditions.push(gte(transactions.date, start));
    conditions.push(lt(transactions.date, end));
  }

  if (type) conditions.push(eq(transactions.type, type));
  if (walletId) conditions.push(eq(transactions.walletId, walletId));
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));

  return db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      walletId: transactions.walletId,
      destinationWalletId: transactions.destinationWalletId,
      categoryId: transactions.categoryId,
      amount: transactions.amount,
      type: transactions.type,
      date: transactions.date,
      note: transactions.note,
      isRecurringGenerated: transactions.isRecurringGenerated,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
      walletName: wallets.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(wallets, eq(transactions.walletId, wallets.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.date));
}

export async function createTransaction(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string; budgetAlerts: BudgetAlert[] }>> {
  const result = transactionSchema.safeParse(input);
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
  const id = crypto.randomUUID();

  // Atomic: insert transaction + update wallet balance(s)
  await db.transaction(async (tx) => {
    await tx.insert(transactions).values({
      id,
      userId: LOCAL_USER_ID,
      walletId: data.walletId,
      destinationWalletId: data.destinationWalletId,
      categoryId: data.categoryId,
      amount: String(data.amount),
      type: data.type,
      date: data.date,
      note: data.note,
    });

    if (data.type === "INCOME") {
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${data.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, data.walletId));
    } else if (data.type === "EXPENSE") {
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${data.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, data.walletId));
    } else if (data.type === "TRANSFER" && data.destinationWalletId) {
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${data.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, data.walletId));
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${data.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, data.destinationWalletId));
    }
  });

  // Gamification — fire and forget
  const txMonth = data.date.getMonth() + 1;
  const txYear = data.date.getFullYear();
  Promise.all([
    awardXP(LOCAL_USER_ID, "TRANSACTION"),
    evaluateStreak(LOCAL_USER_ID),
    incrementChallengeProgress(LOCAL_USER_ID, txMonth, txYear),
  ])
    .then(() => checkAndAwardAchievement(LOCAL_USER_ID, "FIRST_TRANSACTION"))
    .catch(console.error);

  // Budget threshold check
  const budgetAlerts: BudgetAlert[] = [];
  if (data.type === "EXPENSE" && data.categoryId) {
    const month = data.date.getMonth() + 1;
    const year = data.date.getFullYear();

    const [budget] = await db
      .select({ id: budgets.id, monthlyLimit: budgets.monthlyLimit })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, LOCAL_USER_ID),
          eq(budgets.categoryId, data.categoryId),
          eq(budgets.month, month),
          eq(budgets.year, year)
        )
      )
      .limit(1);

    if (budget) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 1);
      const [{ total }] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, LOCAL_USER_ID),
            eq(transactions.categoryId, data.categoryId),
            eq(transactions.type, "EXPENSE"),
            gte(transactions.date, monthStart),
            lt(transactions.date, monthEnd)
          )
        );

      const totalSpent = Number(total ?? 0);
      const limit = Number(budget.monthlyLimit);
      const percentage = limit > 0 ? (totalSpent / limit) * 100 : 0;
      if (percentage >= 80) {
        budgetAlerts.push({ categoryId: data.categoryId, percentage });
      }
    }
  }

  return { success: true, data: { id, budgetAlerts } };
}

export async function updateTransaction(
  id: string,
  input: Record<string, unknown>
): Promise<ActionResult> {
  const result = transactionSchema.safeParse(input);
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
  const next = result.data;

  const [old] = await db
    .select({
      type: transactions.type,
      amount: transactions.amount,
      walletId: transactions.walletId,
      destinationWalletId: transactions.destinationWalletId,
    })
    .from(transactions)
    .where(
      and(eq(transactions.id, id), eq(transactions.userId, LOCAL_USER_ID))
    )
    .limit(1);

  if (!old) return { success: false, error: "Transaction not found" };

  await db.transaction(async (tx) => {
    // Reverse old balance effect
    if (old.type === "INCOME") {
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} - ${old.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, old.walletId));
    } else if (old.type === "EXPENSE") {
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${old.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, old.walletId));
    } else if (old.type === "TRANSFER" && old.destinationWalletId) {
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${old.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, old.walletId));
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} - ${old.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, old.destinationWalletId));
    }

    // Apply new balance effect
    if (next.type === "INCOME") {
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${next.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, next.walletId));
    } else if (next.type === "EXPENSE") {
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} - ${next.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, next.walletId));
    } else if (next.type === "TRANSFER" && next.destinationWalletId) {
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} - ${next.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, next.walletId));
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${next.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, next.destinationWalletId));
    }

    await tx
      .update(transactions)
      .set({
        walletId: next.walletId,
        destinationWalletId: next.destinationWalletId,
        categoryId: next.categoryId,
        amount: String(next.amount),
        type: next.type,
        date: next.date,
        note: next.note,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id));
  });

  return { success: true, data: undefined };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const db = getDb();

  const [tx] = await db
    .select({
      type: transactions.type,
      amount: transactions.amount,
      walletId: transactions.walletId,
      destinationWalletId: transactions.destinationWalletId,
    })
    .from(transactions)
    .where(
      and(eq(transactions.id, id), eq(transactions.userId, LOCAL_USER_ID))
    )
    .limit(1);

  if (!tx) return { success: false, error: "Transaction not found" };

  await db.transaction(async (dtx) => {
    await dtx.delete(transactions).where(eq(transactions.id, id));

    if (tx.type === "INCOME") {
      await dtx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} - ${tx.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, tx.walletId));
    } else if (tx.type === "EXPENSE") {
      await dtx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${tx.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, tx.walletId));
    } else if (tx.type === "TRANSFER" && tx.destinationWalletId) {
      await dtx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${tx.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, tx.walletId));
      await dtx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} - ${tx.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, tx.destinationWalletId));
    }
  });

  return { success: true, data: undefined };
}

export async function bulkDeleteTransactions(
  ids: string[]
): Promise<ActionResult> {
  if (ids.length === 0) return { success: true, data: undefined };

  const db = getDb();

  const txs = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      walletId: transactions.walletId,
      destinationWalletId: transactions.destinationWalletId,
    })
    .from(transactions)
    .where(
      and(
        inArray(transactions.id, ids),
        eq(transactions.userId, LOCAL_USER_ID)
      )
    );

  await db.transaction(async (dtx) => {
    await dtx.delete(transactions).where(inArray(transactions.id, ids));

    for (const tx of txs) {
      if (tx.type === "INCOME") {
        await dtx
          .update(wallets)
          .set({ balance: sql`${wallets.balance} - ${tx.amount}`, updatedAt: new Date() })
          .where(eq(wallets.id, tx.walletId));
      } else if (tx.type === "EXPENSE") {
        await dtx
          .update(wallets)
          .set({ balance: sql`${wallets.balance} + ${tx.amount}`, updatedAt: new Date() })
          .where(eq(wallets.id, tx.walletId));
      } else if (tx.type === "TRANSFER" && tx.destinationWalletId) {
        await dtx
          .update(wallets)
          .set({ balance: sql`${wallets.balance} + ${tx.amount}`, updatedAt: new Date() })
          .where(eq(wallets.id, tx.walletId));
        await dtx
          .update(wallets)
          .set({ balance: sql`${wallets.balance} - ${tx.amount}`, updatedAt: new Date() })
          .where(eq(wallets.id, tx.destinationWalletId));
      }
    }
  });

  return { success: true, data: undefined };
}

export async function getTransactionFormData() {
  const db = getDb();
  const [ws, cats] = await Promise.all([
    db
      .select({ id: wallets.id, name: wallets.name, currency: wallets.currency })
      .from(wallets)
      .where(
        and(eq(wallets.userId, LOCAL_USER_ID), eq(wallets.isArchived, false))
      )
      .orderBy(wallets.createdAt),
    db
      .select({
        id: categories.id,
        name: categories.name,
        emoji: categories.emoji,
      })
      .from(categories)
      .where(
        and(
          eq(categories.userId, LOCAL_USER_ID),
          eq(categories.isArchived, false)
        )
      )
      .orderBy(categories.name),
  ]);
  return { wallets: ws, categories: cats };
}
