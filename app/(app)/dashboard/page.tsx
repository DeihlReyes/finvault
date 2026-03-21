import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { xpProgressToNextLevel } from "@/types/gamification";
import {
  seedMonthlyChallenge,
  CHALLENGE_TYPE,
  CHALLENGE_TARGET,
} from "@/lib/challenges/monthly";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata = { title: "Dashboard — FinVault" };

async function DashboardContent() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const { user } = auth;
  const userId = auth.supabaseId;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [wallets, recentTransactions, upcomingRecurring, monthlyChallenge] =
    await Promise.all([
      db.wallet.findMany({
        where: { userId, isArchived: false },
        orderBy: { createdAt: "asc" },
      }),
      db.transaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 5,
        include: { category: true, wallet: true },
      }),
      db.recurringRule.findMany({
        where: { userId, isPaused: false },
        orderBy: { nextDueDate: "asc" },
        take: 3,
      }),
      seedMonthlyChallenge(userId, month, year).then(() =>
        db.monthlyChallenge.findUnique({
          where: {
            userId_challengeType_month_year: {
              userId,
              challengeType: CHALLENGE_TYPE,
              month,
              year,
            },
          },
        }),
      ),
    ]);

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const { level, progress } = xpProgressToNextLevel(user.totalXP);

  return (
    <div className="p-4 md:p-6 space-y-5  mx-auto">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Hey, {user.displayName ?? "there"} 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Level {level} • {user.totalXP} XP
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 text-sm px-3 py-1">
          🔥 <span className="font-bold">{user.streak}</span>
          <span className="text-muted-foreground font-normal">streak</span>
        </Badge>
      </div>

      {/* XP Bar (animated client component + level-up celebration) */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <DashboardClient
            level={level}
            totalXP={user.totalXP}
            xpProgress={progress}
            levelUpPending={user.levelUpPending}
          />
        </CardContent>
      </Card>

      {/* Net Balance */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground mb-1">Net Balance</p>
          <p className="text-3xl font-bold">
            {formatCurrency(totalBalance, user.currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Across {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Monthly Challenge */}
      {monthlyChallenge && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Challenge</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm">
                Log {CHALLENGE_TARGET} transactions this month
              </p>
              {monthlyChallenge.completedAt && (
                <Badge variant="secondary" className="text-xs">
                  ✅ Done
                </Badge>
              )}
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (Number(monthlyChallenge.currentValue) / CHALLENGE_TARGET) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {Number(monthlyChallenge.currentValue)} / {CHALLENGE_TARGET}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Link
              href="/transactions"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No transactions yet. Add your first one!
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx, i) => (
                <div key={tx.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0">
                        {tx.category?.emoji ?? "💳"}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          {tx.note ?? tx.category?.name ?? "Transaction"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.wallet.name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold shrink-0 ml-3 ${
                        tx.type === "INCOME"
                          ? "text-[oklch(0.65_0.15_145)]"
                          : tx.type === "EXPENSE"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {tx.type === "INCOME"
                        ? "+"
                        : tx.type === "EXPENSE"
                          ? "-"
                          : ""}
                      {formatCurrency(tx.amount, user.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Recurring */}
      {upcomingRecurring.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {upcomingRecurring.map((rule, i) => (
                <div key={rule.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                        }).format(rule.nextDueDate)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {formatCurrency(rule.amount, user.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-5  mx-auto">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  );
}
