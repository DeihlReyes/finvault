import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { BudgetsClient } from "./budgets-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Budgets — FinVault" };

async function BudgetContent() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const userId = auth.supabaseId;

  const [budgets, categories] = await Promise.all([
    db.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    }),
    db.category.findMany({
      where: { userId, isArchived: false },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: { id: true, name: true, emoji: true },
    }),
  ]);

  const budgetsWithSpend = await Promise.all(
    budgets.map(async (budget) => {
      const agg = await db.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
        _sum: { amount: true },
      });
      const spent = Number(agg._sum.amount ?? 0);
      const limit = Number(budget.monthlyLimit);
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        categoryEmoji: budget.category.emoji,
        monthlyLimit: limit,
        spent,
        percentage,
      };
    })
  );

  return (
    <BudgetsClient
      budgets={budgetsWithSpend}
      categories={categories}
      currency={auth.user.currency}
    />
  );
}

export default function BudgetsPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        }
      >
        <BudgetContent />
      </Suspense>
    </div>
  );
}
