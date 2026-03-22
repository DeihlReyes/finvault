"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDb } from "@/lib/db";
import { getLocalUser } from "@/lib/db/queries/user";
import { getWallets } from "@/lib/db/queries/wallets";
import { getCategories } from "@/lib/db/queries/categories";
import { getTransactions } from "@/lib/db/queries/transactions";
import { getBudgets } from "@/lib/db/queries/budgets";
import {
  getAchievements,
  getNetWorthSnapshots,
} from "@/lib/db/queries/gamification";
import { monthlyChallenges, transactions, wallets } from "@/lib/db/schema";
import { and, eq, gte, lt, sum } from "drizzle-orm";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import type { TransactionType } from "@/lib/db/schema";

// ─── Shared invalidation helper ──────────────────────────────────────────────

export function useInvalidate() {
  const queryClient = useQueryClient();
  return {
    wallets: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
    categories: () =>
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
    transactions: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    budgets: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
    user: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
    all: () => queryClient.invalidateQueries(),
  };
}

// ─── Individual hooks ─────────────────────────────────────────────────────────

export function useUser() {
  const { isReady } = useDb();
  return useQuery({
    queryKey: ["user"],
    queryFn: getLocalUser,
    enabled: isReady,
  });
}

export function useWallets() {
  const { isReady } = useDb();
  return useQuery({
    queryKey: ["wallets"],
    queryFn: getWallets,
    enabled: isReady,
  });
}

export function useCategories() {
  const { isReady } = useDb();
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    enabled: isReady,
  });
}

export function useTransactions(
  filters: {
    month?: number;
    year?: number;
    type?: TransactionType;
    walletId?: string;
    categoryId?: string;
  } = {}
) {
  const { isReady } = useDb();
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
    enabled: isReady,
  });
}

export function useBudgets(month: number, year: number) {
  const { isReady } = useDb();
  return useQuery({
    queryKey: ["budgets", month, year],
    queryFn: () => getBudgets(month, year),
    enabled: isReady,
  });
}

export function useAchievements() {
  const { isReady } = useDb();
  return useQuery({
    queryKey: ["achievements"],
    queryFn: getAchievements,
    enabled: isReady,
  });
}

export function useNetWorthSnapshots(limit = 30) {
  const { isReady } = useDb();
  return useQuery({
    queryKey: ["netWorthSnapshots", limit],
    queryFn: () => getNetWorthSnapshots(limit),
    enabled: isReady,
  });
}

// ─── Dashboard composite hook ─────────────────────────────────────────────────

export function useDashboardData() {
  const { db, isReady } = useDb();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const user = useUser();
  const walletsQ = useWallets();
  const recentTx = useQuery({
    queryKey: ["transactions", "recent"],
    queryFn: () => getTransactions({ month, year }),
    enabled: isReady,
  });
  const budgetsQ = useBudgets(month, year);
  const snapshots = useNetWorthSnapshots(30);

  const monthlyChallenge = useQuery({
    queryKey: ["monthlyChallenge", month, year],
    queryFn: async () => {
      const [challenge] = await db
        .select()
        .from(monthlyChallenges)
        .where(
          and(
            eq(monthlyChallenges.userId, LOCAL_USER_ID),
            eq(monthlyChallenges.month, month),
            eq(monthlyChallenges.year, year)
          )
        )
        .limit(1);
      return challenge ?? null;
    },
    enabled: isReady,
  });

  const monthlyAggs = useQuery({
    queryKey: ["monthlyAggs", month, year],
    queryFn: async () => {
      const [incomeRow] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, LOCAL_USER_ID),
            eq(transactions.type, "INCOME"),
            gte(transactions.date, monthStart),
            lt(transactions.date, monthEnd)
          )
        );
      const [expenseRow] = await db
        .select({ total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, LOCAL_USER_ID),
            eq(transactions.type, "EXPENSE"),
            gte(transactions.date, monthStart),
            lt(transactions.date, monthEnd)
          )
        );
      return {
        income: Number(incomeRow?.total ?? 0),
        expenses: Number(expenseRow?.total ?? 0),
      };
    },
    enabled: isReady,
  });

  const spendByCategory = useQuery({
    queryKey: ["spendByCategory", month, year],
    queryFn: async () => {
      const rows = await db
        .select({
          categoryId: transactions.categoryId,
          total: sum(transactions.amount),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, LOCAL_USER_ID),
            eq(transactions.type, "EXPENSE"),
            gte(transactions.date, monthStart),
            lt(transactions.date, monthEnd)
          )
        )
        .groupBy(transactions.categoryId);
      return Object.fromEntries(
        rows.map((r) => [r.categoryId ?? "", Number(r.total ?? 0)])
      );
    },
    enabled: isReady,
  });

  const isLoading =
    user.isLoading ||
    walletsQ.isLoading ||
    recentTx.isLoading ||
    budgetsQ.isLoading ||
    monthlyAggs.isLoading;

  return {
    user: user.data,
    wallets: walletsQ.data ?? [],
    recentTransactions: recentTx.data ?? [],
    budgets: budgetsQ.data ?? [],
    monthlyChallenge: monthlyChallenge.data ?? null,
    snapshots: snapshots.data ?? [],
    monthlyAggs: monthlyAggs.data ?? { income: 0, expenses: 0 },
    spendByCategory: spendByCategory.data ?? {},
    isLoading,
    month,
    year,
  };
}
