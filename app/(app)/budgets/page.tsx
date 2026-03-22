"use client";

import { useMemo } from "react";
import {
  useBudgets,
  useCategories,
  useUser,
} from "@/lib/hooks/use-db-queries";
import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { transactions } from "@/lib/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";
import { sum } from "drizzle-orm";
import { BudgetsClient } from "./budgets-client";
import { FeatureTip } from "@/components/onboarding/feature-tip";
import { TIPS } from "@/lib/onboarding/tips";
import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetsPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const { db, isReady } = useDb();
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(
    month,
    year
  );
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: user } = useUser();

  const categoryIds = budgets.map((b) => b.categoryId);

  const { data: spendMap = {} } = useQuery({
    queryKey: ["budgetSpend", month, year],
    queryFn: async () => {
      if (categoryIds.length === 0) return {};
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
    enabled: isReady && categoryIds.length > 0,
  });

  const budgetsWithSpend = useMemo(
    () =>
      budgets.map((budget) => {
        const spent = spendMap[budget.categoryId] ?? 0;
        const limit = Number(budget.monthlyLimit);
        return {
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          categoryEmoji: budget.categoryEmoji,
          monthlyLimit: limit,
          spent,
          percentage: limit > 0 ? (spent / limit) * 100 : 0,
        };
      }),
    [budgets, spendMap]
  );

  if (budgetsLoading || catsLoading) {
    return (
      <div className="p-4 md:p-6 mx-auto">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const seenTips = user?.seenTips ?? [];

  return (
    <div className="p-4 md:p-6 mx-auto">
      {budgets.length === 0 && (
        <FeatureTip
          tipId={TIPS.BUDGETS_FIRST}
          title="Set your first budget"
          description="Pick a category and set a monthly limit. Earn +50 XP when you create your first budget!"
          seenTips={seenTips}
        />
      )}
      <BudgetsClient
        budgets={budgetsWithSpend}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji,
        }))}
        currency={user?.currency ?? "USD"}
      />
    </div>
  );
}
