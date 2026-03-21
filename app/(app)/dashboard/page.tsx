import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Dashboard — FinVault" };

async function DashboardContent() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const { user } = auth;
  const userId = auth.supabaseId;

  const [wallets, recentTransactions, upcomingRecurring] = await Promise.all([
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
  ]);

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Greeting + Level */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Hey, {user.displayName ?? "there"} 👋
          </h2>
          <p className="text-muted-foreground text-sm">Level {user.level} • {user.totalXP} XP</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-accent">🔥</span>
          <span className="font-semibold">{user.streak}</span>
          <span className="text-muted-foreground">day streak</span>
        </div>
      </div>

      {/* XP Bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Level {user.level}</span>
          <span>{user.totalXP} XP</span>
          <span>Level {user.level + 1}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${Math.min(100, ((user.totalXP - user.level ** 2 * 100) / ((user.level + 1) ** 2 * 100 - user.level ** 2 * 100)) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Net Balance */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm text-muted-foreground mb-1">Net Balance</p>
        <p className="text-3xl font-bold">
          {formatCurrency(totalBalance, user.currency)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Across {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No transactions yet. Add your first one!
          </p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">
                    {tx.category?.emoji ?? "💳"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.note ?? tx.category?.name ?? "Transaction"}</p>
                    <p className="text-xs text-muted-foreground">{tx.wallet.name}</p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    tx.type === "INCOME"
                      ? "text-[oklch(0.65_0.15_145)]"
                      : tx.type === "EXPENSE"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                  {formatCurrency(tx.amount, user.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Recurring */}
      {upcomingRecurring.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Upcoming</h3>
          <div className="space-y-3">
            {upcomingRecurring.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(rule.nextDueDate)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  {formatCurrency(rule.amount, user.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
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
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-secondary rounded w-48" />
      <div className="h-16 bg-card border border-border rounded-xl" />
      <div className="h-24 bg-card border border-border rounded-xl" />
      <div className="h-48 bg-card border border-border rounded-xl" />
    </div>
  );
}
