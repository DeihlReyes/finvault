"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { transactions, categories, netWorthSnapshots } from "@/lib/db/schema";
import { and, eq, gte, lt, desc } from "drizzle-orm";
import { sum } from "drizzle-orm";
import { useUser } from "@/lib/hooks/use-db-queries";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";
import { ReportsControls } from "@/components/reports/reports-controls";
import { ExportButtons } from "@/components/reports/export-buttons";

const ExpenseDonutChart = dynamic(
  () =>
    import("@/components/reports/expense-donut-chart").then(
      (m) => m.ExpenseDonutChart
    ),
  { loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
);
const IncomeExpenseBarChart = dynamic(
  () =>
    import("@/components/reports/income-expense-bar-chart").then(
      (m) => m.IncomeExpenseBarChart
    ),
  { loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
);
const NetWorthLineChart = dynamic(
  () =>
    import("@/components/reports/net-worth-line-chart").then(
      (m) => m.NetWorthLineChart
    ),
  { loading: () => <Skeleton className="h-64 w-full rounded-xl" /> }
);

const MONTH_LABELS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const now = new Date();
  const tab = searchParams.get("tab") ?? "overview";
  const month = searchParams.get("month")
    ? parseInt(searchParams.get("month")!)
    : now.getMonth() + 1;
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!)
    : now.getFullYear();

  const { db, isReady } = useDb();
  const { data: user } = useUser();
  const currency = user?.currency ?? "USD";
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);

  const overviewQ = useQuery({
    queryKey: ["reports-overview", month, year],
    queryFn: async () => {
      const [incomeRow, expenseRow, byCatRows] = await Promise.all([
        db
          .select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, LOCAL_USER_ID),
              eq(transactions.type, "INCOME"),
              gte(transactions.date, from),
              lt(transactions.date, to)
            )
          ),
        db
          .select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, LOCAL_USER_ID),
              eq(transactions.type, "EXPENSE"),
              gte(transactions.date, from),
              lt(transactions.date, to)
            )
          ),
        db
          .select({
            categoryId: transactions.categoryId,
            total: sum(transactions.amount),
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, LOCAL_USER_ID),
              eq(transactions.type, "EXPENSE"),
              gte(transactions.date, from),
              lt(transactions.date, to)
            )
          )
          .groupBy(transactions.categoryId)
          .orderBy(desc(sum(transactions.amount)))
          .limit(5),
      ]);

      const catIds = byCatRows
        .map((r) => r.categoryId)
        .filter(Boolean) as string[];
      const cats =
        catIds.length > 0
          ? await db
              .select()
              .from(categories)
              .where(eq(categories.userId, LOCAL_USER_ID))
          : [];
      const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

      return {
        income: Number(incomeRow[0]?.total ?? 0),
        expenses: Number(expenseRow[0]?.total ?? 0),
        byCategory: byCatRows.map((r) => ({
          categoryId: r.categoryId,
          amount: Number(r.total ?? 0),
          cat: catMap[r.categoryId ?? ""],
        })),
      };
    },
    enabled: isReady && tab === "overview",
  });

  const categoryQ = useQuery({
    queryKey: ["reports-categories", month, year],
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
            gte(transactions.date, from),
            lt(transactions.date, to)
          )
        )
        .groupBy(transactions.categoryId)
        .orderBy(desc(sum(transactions.amount)));

      const cats = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, LOCAL_USER_ID));
      const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

      return rows.map((r) => ({
        name: catMap[r.categoryId ?? ""]?.name ?? "Unknown",
        value: Number(r.total ?? 0),
        emoji: catMap[r.categoryId ?? ""]?.emoji ?? "💳",
        color: catMap[r.categoryId ?? ""]?.color ?? "#6C47FF",
      }));
    },
    enabled: isReady && tab === "categories",
  });

  const trendsQ = useQuery({
    queryKey: ["reports-trends", month, year],
    queryFn: async () => {
      const months: Array<{ year: number; month: number; label: string }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        months.push({
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        });
      }
      const rangeFrom = new Date(months[0].year, months[0].month - 1, 1);
      const rangeTo = new Date(year, month, 1);
      const [incomeRows, expenseRows] = await Promise.all([
        db
          .select({ amount: transactions.amount, date: transactions.date })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, LOCAL_USER_ID),
              eq(transactions.type, "INCOME"),
              gte(transactions.date, rangeFrom),
              lt(transactions.date, rangeTo)
            )
          ),
        db
          .select({ amount: transactions.amount, date: transactions.date })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, LOCAL_USER_ID),
              eq(transactions.type, "EXPENSE"),
              gte(transactions.date, rangeFrom),
              lt(transactions.date, rangeTo)
            )
          ),
      ]);
      return months.map(({ year: y, month: m, label }) => {
        const mStart = new Date(y, m - 1, 1).getTime();
        const mEnd = new Date(y, m, 1).getTime();
        const inc = incomeRows
          .filter(
            (r) =>
              new Date(r.date).getTime() >= mStart &&
              new Date(r.date).getTime() < mEnd
          )
          .reduce((s, r) => s + Number(r.amount), 0);
        const exp = expenseRows
          .filter(
            (r) =>
              new Date(r.date).getTime() >= mStart &&
              new Date(r.date).getTime() < mEnd
          )
          .reduce((s, r) => s + Number(r.amount), 0);
        return { label, income: inc, expenses: exp };
      });
    },
    enabled: isReady && tab === "trends",
  });

  const networthQ = useQuery({
    queryKey: ["reports-networth"],
    queryFn: async () => {
      const snaps = await db
        .select()
        .from(netWorthSnapshots)
        .where(eq(netWorthSnapshots.userId, LOCAL_USER_ID))
        .orderBy(netWorthSnapshots.date)
        .limit(90);
      return snaps.map((s) => ({
        label: `${MONTH_LABELS[new Date(s.date).getMonth()]} ${new Date(s.date).getDate()}`,
        value: Number(s.totalValue),
      }));
    },
    enabled: isReady && tab === "networth",
  });

  return (
    <div className="p-4 md:p-6 mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reports</h2>
        <ExportButtons month={month} year={year} />
      </div>

      <ReportsControls tab={tab} month={month} year={year} />

      {tab === "overview" && (
        <>
          {overviewQ.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">Income</p>
                    <p className="text-base font-bold text-[oklch(0.65_0.15_145)]">
                      {formatCurrency(overviewQ.data?.income ?? 0, currency)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Expenses
                    </p>
                    <p className="text-base font-bold text-destructive">
                      {formatCurrency(overviewQ.data?.expenses ?? 0, currency)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">Saved</p>
                    <p
                      className={`text-base font-bold ${(overviewQ.data?.income ?? 0) - (overviewQ.data?.expenses ?? 0) >= 0 ? "text-[oklch(0.65_0.15_145)]" : "text-destructive"}`}
                    >
                      {formatCurrency(
                        (overviewQ.data?.income ?? 0) -
                          (overviewQ.data?.expenses ?? 0),
                        currency
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top Spending</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {(overviewQ.data?.byCategory ?? []).length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No expense data for this period
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {overviewQ.data?.byCategory.map((entry, i) => {
                        const pct =
                          (overviewQ.data?.expenses ?? 0) > 0
                            ? (entry.amount / (overviewQ.data?.expenses ?? 1)) *
                              100
                            : 0;
                        return (
                          <div key={entry.categoryId ?? i}>
                            {i > 0 && <Separator className="mb-3" />}
                            <div className="flex justify-between text-sm mb-1.5">
                              <span>
                                {entry.cat?.emoji} {entry.cat?.name ?? "Unknown"}
                              </span>
                              <span className="text-muted-foreground">
                                {formatCurrency(entry.amount, currency)}{" "}
                                <span className="text-xs">
                                  ({Math.round(pct)}%)
                                </span>
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
          )}
        </>
      )}

      {tab === "categories" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {categoryQ.isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <ExpenseDonutChart
                data={categoryQ.data ?? []}
                currency={currency}
              />
            )}
          </CardContent>
        </Card>
      )}

      {tab === "trends" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Income vs Expenses (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {trendsQ.isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <IncomeExpenseBarChart
                data={trendsQ.data ?? []}
                currency={currency}
              />
            )}
          </CardContent>
        </Card>
      )}

      {tab === "networth" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Net Worth History</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {networthQ.isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <NetWorthLineChart
                data={networthQ.data ?? []}
                currency={currency}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
