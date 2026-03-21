import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Reports — FinVault" };

type SearchParams = Promise<{ tab?: string; from?: string; to?: string }>;

async function ReportsContent({ searchParams }: { searchParams: Awaited<SearchParams> }) {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const { supabaseId: userId, user } = auth;
  const now = new Date();
  const from = searchParams.from
    ? new Date(searchParams.from)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = searchParams.to
    ? new Date(searchParams.to)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [totalIncome, totalExpenses, byCategory] = await Promise.all([
    db.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: from, lte: to } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
  ]);

  const categories = await db.category.findMany({
    where: { id: { in: byCategory.map((b) => b.categoryId!).filter(Boolean) } },
  });
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const income = Number(totalIncome._sum.amount ?? 0);
  const expenses = Number(totalExpenses._sum.amount ?? 0);

  return (
    <div className="space-y-4">
      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Income</p>
          <p className="text-lg font-bold text-[oklch(0.65_0.15_145)]">
            {formatCurrency(income, user.currency)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Expenses</p>
          <p className="text-lg font-bold text-destructive">
            {formatCurrency(expenses, user.currency)}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-1">Net Savings</p>
        <p className={`text-xl font-bold ${income - expenses >= 0 ? "text-[oklch(0.65_0.15_145)]" : "text-destructive"}`}>
          {formatCurrency(income - expenses, user.currency)}
        </p>
      </div>

      {/* Top categories */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Top Spending Categories</h3>
        {byCategory.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No expense data for this period
          </p>
        ) : (
          <div className="space-y-3">
            {byCategory.map((entry) => {
              const cat = categoryMap[entry.categoryId!];
              const amount = Number(entry._sum.amount ?? 0);
              const pct = expenses > 0 ? (amount / expenses) * 100 : 0;
              return (
                <div key={entry.categoryId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat?.emoji} {cat?.name ?? "Unknown"}</span>
                    <span className="text-muted-foreground">{formatCurrency(amount, user.currency)}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Reports</h2>
      <Suspense fallback={<div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />)}</div>}>
        <ReportsContent searchParams={params} />
      </Suspense>
    </div>
  );
}
