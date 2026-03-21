import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionType } from "@/lib/generated/prisma/enums";

export const metadata = { title: "Transactions — FinVault" };

type SearchParams = Promise<{ type?: string; month?: string; year?: string; wallet?: string; category?: string }>;

async function TransactionList({ searchParams }: { searchParams: Awaited<SearchParams> }) {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const { type, month, year, wallet, category } = searchParams;
  const { user, supabaseId: userId } = auth;

  const now = new Date();
  const filterMonth = month ? parseInt(month) : now.getMonth() + 1;
  const filterYear = year ? parseInt(year) : now.getFullYear();

  const where = {
    userId,
    ...(type && { type: type as TransactionType }),
    ...(wallet && { walletId: wallet }),
    ...(category && { categoryId: category }),
    date: {
      gte: new Date(filterYear, filterMonth - 1, 1),
      lt: new Date(filterYear, filterMonth, 1),
    },
  };

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { category: true, wallet: true },
  });

  return (
    <div className="space-y-3">
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No transactions for this period</p>
        </div>
      ) : (
        transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                {tx.category?.emoji ?? "💳"}
              </div>
              <div>
                <p className="text-sm font-medium">{tx.note ?? tx.category?.name ?? "Transaction"}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.wallet.name} · {formatDate(tx.date)}
                </p>
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
        ))
      )}
    </div>
  );
}

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Transactions</h2>
      <Suspense fallback={<div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}</div>}>
        <TransactionList searchParams={params} />
      </Suspense>
    </div>
  );
}
