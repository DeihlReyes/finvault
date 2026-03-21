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
import { HeroHeader } from "@/components/dashboard/hero-header";
import { BudgetHealthStrip } from "@/components/dashboard/budget-health-strip";
import { UpcomingBillsCard } from "@/components/dashboard/upcoming-bills-card";
import { NetWorthSparkline } from "@/components/dashboard/net-worth-sparkline";
import { WelcomeWrapper } from "@/components/onboarding/welcome-wrapper";
import { GettingStartedCard } from "@/components/onboarding/getting-started-card";
import { FeatureTip } from "@/components/onboarding/feature-tip";
import { TIPS } from "@/lib/onboarding/tips";

export const metadata = { title: "Dashboard — FinVault" };

async function DashboardContent() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const { user } = auth;
  const userId = auth.supabaseId;

  if (!user.onboardingCompleted) redirect("/onboarding");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const daysRemaining = Math.max(
    0,
    Math.ceil((monthEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const [
    wallets,
    recentTransactions,
    upcomingRecurring,
    monthlyChallenge,
    budgetCount,
    monthIncomeAgg,
    monthExpensesAgg,
    netWorthSnapshots,
    rawBudgets,
  ] = await Promise.all([
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
    db.budget.count({ where: { userId } }),
    db.transaction.aggregate({
      where: {
        userId,
        type: "INCOME",
        date: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
    db.netWorthSnapshot.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      take: 30,
    }),
    db.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    }),
  ]);

  // Budget health — compute spend per budget then sort by percentage desc
  const budgetsWithSpend = await Promise.all(
    rawBudgets.map(async (budget) => {
      const agg = await db.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      });
      const spent = Number(agg._sum.amount ?? 0);
      const limit = Number(budget.monthlyLimit);
      return {
        id: budget.id,
        categoryName: budget.category.name,
        categoryEmoji: budget.category.emoji,
        spent,
        monthlyLimit: limit,
        percentage: limit > 0 ? (spent / limit) * 100 : 0,
      };
    }),
  );
  budgetsWithSpend.sort((a, b) => b.percentage - a.percentage);
  const top3Budgets = budgetsWithSpend.slice(0, 3);

  // Derived values
  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const monthIncome = Number(monthIncomeAgg._sum.amount ?? 0);
  const monthExpenses = Number(monthExpensesAgg._sum.amount ?? 0);
  const savings = monthIncome - monthExpenses;
  const sparklineData = netWorthSnapshots.map((s) => ({
    value: Number(s.totalValue),
  }));
  const { level, currentLevelXP, nextLevelXP, progress } =
    xpProgressToNextLevel(user.totalXP);
  const billsWithDays = upcomingRecurring.map((rule) => ({
    ...rule,
    amount: Number(rule.amount),
    daysUntil: Math.ceil(
      (rule.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    ),
  }));

  const seenTips = user.seenTips ?? [];
  const showWelcome = !seenTips.includes(TIPS.WELCOME_MODAL);
  const isNewUser = recentTransactions.length < 5;

  return (
    <div className="p-4 md:p-6 space-y-4 mx-auto">
      <WelcomeWrapper
        displayName={user.displayName ?? ""}
        showWelcome={showWelcome}
      />

      {/* Zone 1: Hero Header */}
      <HeroHeader
        displayName={user.displayName ?? ""}
        level={level}
        totalXP={user.totalXP}
        streak={user.streak}
        streakFreezeAvailable={user.streakFreezeAvailable}
        greeting={greeting}
      />

      {/* Zone 2: Financial Stat Strip */}
      <div className="grid grid-cols-3 gap-4">
        {/* Net Balance — full width on small, first col on sm+ */}
        <Card className="col-span-3 sm:col-span-1">
          <CardContent>
            <p className="text-xs text-muted-foreground mb-1">Net Balance</p>
            <p className="text-2xl font-bold leading-tight">
              {formatCurrency(totalBalance, user.currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
            </p>
            <NetWorthSparkline
              data={sparklineData}
              positive={totalBalance >= 0}
            />
          </CardContent>
        </Card>

        {/* Income */}
        <Card className="col-span-3 sm:col-span-1">
          <CardContent>
            <p className="text-xs text-muted-foreground mb-1">Income</p>
            <p className="text-xl font-bold text-[oklch(0.65_0.15_145)] leading-tight">
              {formatCurrency(monthIncome, user.currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="col-span-3 sm:col-span-1">
          <CardContent>
            <p className="text-xs text-muted-foreground mb-1">Expenses</p>
            <p className="text-xl font-bold text-destructive leading-tight">
              {formatCurrency(monthExpenses, user.currency)}
            </p>
            <p
              className={`text-xs mt-1 font-medium ${
                savings >= 0
                  ? "text-[oklch(0.65_0.15_145)]"
                  : "text-destructive"
              }`}
            >
              {savings >= 0 ? "+" : ""}
              {formatCurrency(savings, user.currency)} saved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zone 3: Gamification Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* XP Progress Card */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">XP Progress</p>
              <Badge variant="secondary" className="text-xs">
                {nextLevelXP - user.totalXP} XP to Level {level + 1}
              </Badge>
            </div>
            <DashboardClient
              level={level}
              totalXP={user.totalXP}
              xpProgress={progress}
              currentLevelXP={currentLevelXP}
              nextLevelXP={nextLevelXP}
              levelUpPending={user.levelUpPending}
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              {[
                { label: "Transaction", xp: "+10 XP" },
                { label: "Budget", xp: "+50 XP" },
                { label: "7-day streak", xp: "+50 XP" },
              ].map((hint) => (
                <Badge
                  key={hint.label}
                  variant="outline"
                  className="text-xs gap-1 font-normal"
                >
                  {hint.label}{" "}
                  <span className="text-primary font-medium">{hint.xp}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Challenge Card */}
        {monthlyChallenge && (
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold">Monthly Challenge</p>
                {monthlyChallenge.completedAt ? (
                  <Badge
                    variant="secondary"
                    className="text-xs text-[oklch(0.65_0.15_145)]"
                  >
                    ✅ Done
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {daysRemaining}d left
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Log {CHALLENGE_TARGET} transactions this month
              </p>
              {monthlyChallenge.completedAt ? (
                <div className="bg-primary/10 rounded-lg py-4 text-center">
                  <p className="text-sm font-semibold text-primary">
                    Challenge Complete! 🏆
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +200 XP earned
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between mb-2">
                    <p className="text-3xl font-bold">
                      {Number(monthlyChallenge.currentValue)}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      / {CHALLENGE_TARGET}
                    </p>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(monthlyChallenge.currentValue) /
                            CHALLENGE_TARGET) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Zone 4: Budget Health */}
      {top3Budgets.length > 0 && (
        <BudgetHealthStrip budgets={top3Budgets} currency={user.currency} />
      )}

      {/* Zone 5: Activity Row */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-3xl mb-2">💳</p>
                <p className="text-sm">No transactions yet.</p>
                <Link
                  href="/transactions"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Add your first →
                </Link>
              </div>
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

        {/* Upcoming Bills */}
        {billsWithDays.length > 0 && (
          <UpcomingBillsCard bills={billsWithDays} currency={user.currency} />
        )}
      </div>

      {/* Zone 6: Onboarding */}
      <GettingStartedCard
        hasDisplayName={!!user.displayName}
        hasWallet={wallets.length > 0}
        hasTransaction={recentTransactions.length > 0}
        hasBudget={budgetCount > 0}
      />
      {isNewUser && (
        <FeatureTip
          tipId={TIPS.DASHBOARD_XP_BAR}
          title="Earn XP with every transaction"
          description="Log income or expenses daily to level up and unlock achievements. Your streak resets if you skip a day!"
          seenTips={seenTips}
        />
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
    <div className="p-4 md:p-6 space-y-4 mx-auto animate-pulse">
      {/* Hero */}
      <div className="rounded-xl bg-secondary h-20" />
      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 col-span-3 sm:col-span-1 rounded-xl" />
        <Skeleton className="h-24 col-span-3 sm:col-span-1 rounded-xl" />
        <Skeleton className="h-24 col-span-3 sm:col-span-1 rounded-xl" />
      </div>
      {/* Gamification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      {/* Budget health */}
      <Skeleton className="h-24 rounded-xl" />
      {/* Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
