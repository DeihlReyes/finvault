import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { TransactionsHeader } from "./transactions-header";
import { TransactionItem } from "@/components/transactions/transaction-item";
import type { TransactionType } from "@/lib/generated/prisma/enums";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Transactions — FinVault" };

type SearchParams = Promise<{
  type?: string;
  month?: string;
  year?: string;
  wallet?: string;
  category?: string;
}>;

async function TransactionList({
  searchParams,
}: {
  searchParams: Awaited<SearchParams>;
}) {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const { type, month, year, wallet, category } = searchParams;
  const { user, supabaseId: userId } = auth;

  const now = new Date();
  const filterMonth = month ? parseInt(month) : now.getMonth() + 1;
  const filterYear = year ? parseInt(year) : now.getFullYear();

  const [transactions, wallets, categories] = await Promise.all([
    db.transaction.findMany({
      where: {
        userId,
        ...(type && { type: type as TransactionType }),
        ...(wallet && { walletId: wallet }),
        ...(category && { categoryId: category }),
        date: {
          gte: new Date(filterYear, filterMonth - 1, 1),
          lt: new Date(filterYear, filterMonth, 1),
        },
      },
      orderBy: { date: "desc" },
      include: { category: true, wallet: true },
    }),
    db.wallet.findMany({
      where: { userId, isArchived: false },
      select: { id: true, name: true, currency: true },
    }),
    db.category.findMany({
      where: { userId, isArchived: false },
      select: { id: true, name: true, emoji: true },
    }),
  ]);

  return (
    <>
      <TransactionsHeader
        wallets={wallets}
        categories={categories}
        current={{
          type,
          month: filterMonth,
          year: filterYear,
          wallet,
          category,
        }}
      />
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No transactions for this period</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              id={tx.id}
              type={tx.type as "INCOME" | "EXPENSE" | "TRANSFER"}
              amount={Number(tx.amount)}
              note={tx.note}
              date={tx.date}
              category={
                tx.category
                  ? { name: tx.category.name, emoji: tx.category.emoji }
                  : null
              }
              walletName={tx.wallet.name}
              currency={user.currency}
            />
          ))
        )}
      </div>
    </>
  );
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <div className="p-4 md:p-6  mx-auto space-y-4">
      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <TransactionList searchParams={params} />
      </Suspense>
    </div>
  );
}
