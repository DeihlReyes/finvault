import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Budgets — FinVault" };

async function BudgetList() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const userId = auth.supabaseId;

  const budgets = await db.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

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
      return { ...budget, spent, percentage };
    })
  );

  return (
    <div className="space-y-3">
      {budgetsWithSpend.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm">No budgets for this month</p>
          <button className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            Create budget
          </button>
        </div>
      ) : (
        budgetsWithSpend.map((budget) => {
          const barColor =
            budget.percentage >= 85
              ? "bg-destructive"
              : budget.percentage >= 60
              ? "bg-accent"
              : "bg-[oklch(0.65_0.15_145)]";

          return (
            <div key={budget.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span>{budget.category.emoji}</span>
                  <span className="font-medium text-sm">{budget.category.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(budget.spent, auth.user.currency)} /{" "}
                  {formatCurrency(budget.monthlyLimit, auth.user.currency)}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${Math.min(100, budget.percentage)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {Math.round(budget.percentage)}% used
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Budgets</h2>
      <Suspense fallback={<div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}</div>}>
        <BudgetList />
      </Suspense>
    </div>
  );
}
