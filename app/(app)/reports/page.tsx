import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ReportsControls } from "@/components/reports/reports-controls";
import { ExportButtons } from "@/components/reports/export-buttons";
import { ExpenseDonutChart } from "@/components/reports/expense-donut-chart";
import { IncomeExpenseBarChart } from "@/components/reports/income-expense-bar-chart";
import { NetWorthLineChart } from "@/components/reports/net-worth-line-chart";

export const metadata = { title: "Reports — FinVault" };

type SearchParams = Promise<{
  tab?: string;
  month?: string;
  year?: string;
}>;

// ── Overview Tab ────────────────────────────────────────────────────────────

async function OverviewContent({
  userId,
  currency,
  from,
  to,
}: {
  userId: string;
  currency: string;
  from: Date;
  to: Date;
}) {
  const [totalIncome, totalExpenses, byCategory] = await Promise.all([
    db.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: from, lt: to } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
  ]);

  const categories = await db.category.findMany({
    where: { id: { in: byCategory.map((b) => b.categoryId!).filter(Boolean) } },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const income = Number(totalIncome._sum.amount ?? 0);
  const expenses = Number(totalExpenses._sum.amount ?? 0);
  const net = income - expenses;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Income</p>
            <p className="text-base font-bold text-[oklch(0.65_0.15_145)]">
              {formatCurrency(income, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Expenses</p>
            <p className="text-base font-bold text-destructive">
              {formatCurrency(expenses, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Saved</p>
            <p
              className={`text-base font-bold ${net >= 0 ? "text-[oklch(0.65_0.15_145)]" : "text-destructive"}`}
            >
              {formatCurrency(net, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Spending</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {byCategory.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No expense data for this period
            </p>
          ) : (
            <div className="space-y-3">
              {byCategory.map((entry, i) => {
                const cat = catMap[entry.categoryId!];
                const amount = Number(entry._sum.amount ?? 0);
                const pct = expenses > 0 ? (amount / expenses) * 100 : 0;
                return (
                  <div key={entry.categoryId}>
                    {i > 0 && <Separator className="mb-3" />}
                    <div className="flex justify-between text-sm mb-1.5">
                      <span>
                        {cat?.emoji} {cat?.name ?? "Unknown"}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(amount, currency)}{" "}
                        <span className="text-xs">({Math.round(pct)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Categories Tab ───────────────────────────────────────────────────────────

async function CategoriesContent({
  userId,
  currency,
  from,
  to,
}: {
  userId: string;
  currency: string;
  from: Date;
  to: Date;
}) {
  const byCategory = await db.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", date: { gte: from, lt: to } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const categories = await db.category.findMany({
    where: { id: { in: byCategory.map((b) => b.categoryId!).filter(Boolean) } },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const chartData = byCategory.map((entry) => {
    const cat = catMap[entry.categoryId!];
    return {
      name: cat?.name ?? "Unknown",
      value: Number(entry._sum.amount ?? 0),
      emoji: cat?.emoji ?? "💳",
      color: cat?.color ?? "#6C47FF",
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ExpenseDonutChart data={chartData} currency={currency} />
      </CardContent>
    </Card>
  );
}

// ── Trends Tab ───────────────────────────────────────────────────────────────

async function TrendsContent({
  userId,
  currency,
  currentMonth,
  currentYear,
}: {
  userId: string;
  currency: string;
  currentMonth: number;
  currentYear: number;
}) {
  // Build last 6 months
  const months: Array<{ year: number; month: number; label: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const MONTH_LABELS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    });
  }

  const data = await Promise.all(
    months.map(async ({ year, month, label }) => {
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 1);
      const [inc, exp] = await Promise.all([
        db.transaction.aggregate({
          where: { userId, type: "INCOME", date: { gte: from, lt: to } },
          _sum: { amount: true },
        }),
        db.transaction.aggregate({
          where: { userId, type: "EXPENSE", date: { gte: from, lt: to } },
          _sum: { amount: true },
        }),
      ]);
      return {
        label,
        income: Number(inc._sum.amount ?? 0),
        expenses: Number(exp._sum.amount ?? 0),
      };
    }),
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Income vs Expenses (6 months)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <IncomeExpenseBarChart data={data} currency={currency} />
      </CardContent>
    </Card>
  );
}

// ── Net Worth Tab ─────────────────────────────────────────────────────────────

async function NetWorthContent({
  userId,
  currency,
}: {
  userId: string;
  currency: string;
}) {
  const snapshots = await db.netWorthSnapshot.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    take: 90,
  });

  const MONTH_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const chartData = snapshots.map((s) => ({
    label: `${MONTH_LABELS[s.date.getMonth()]} ${s.date.getDate()}`,
    value: Number(s.totalValue),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Net Worth History</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <NetWorthLineChart data={chartData} currency={currency} />
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

async function ReportsContent({
  tab,
  month,
  year,
}: {
  tab: string;
  month: number;
  year: number;
}) {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const { supabaseId: userId, user } = auth;
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  return (
    <>
      {tab === "overview" && (
        <OverviewContent
          userId={userId}
          currency={user.currency}
          from={from}
          to={to}
        />
      )}
      {tab === "categories" && (
        <CategoriesContent
          userId={userId}
          currency={user.currency}
          from={from}
          to={to}
        />
      )}
      {tab === "trends" && (
        <TrendsContent
          userId={userId}
          currency={user.currency}
          currentMonth={month}
          currentYear={year}
        />
      )}
      {tab === "networth" && (
        <NetWorthContent userId={userId} currency={user.currency} />
      )}
    </>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const now = new Date();
  const tab = params.tab ?? "overview";
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  return (
    <div className="p-4 md:p-6  mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reports</h2>
        <ExportButtons month={month} year={year} />
      </div>

      <ReportsControls tab={tab} month={month} year={year} />

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        }
      >
        <ReportsContent tab={tab} month={month} year={year} />
      </Suspense>
    </div>
  );
}
