"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { wallets, transactions, categories } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default function WalletDetailPage({ params }: Props) {
  const { id } = use(params);
  const { db, isReady } = useDb();

  const walletQ = useQuery({
    queryKey: ["wallet", id],
    queryFn: async () => {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.id, id), eq(wallets.userId, LOCAL_USER_ID)))
        .limit(1);
      return wallet ?? null;
    },
    enabled: isReady,
  });

  const txQ = useQuery({
    queryKey: ["wallet-transactions", id],
    queryFn: async () => {
      return db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          type: transactions.type,
          date: transactions.date,
          note: transactions.note,
          categoryName: categories.name,
          categoryEmoji: categories.emoji,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            eq(transactions.walletId, id),
            eq(transactions.userId, LOCAL_USER_ID)
          )
        )
        .orderBy(desc(transactions.date))
        .limit(30);
    },
    enabled: isReady,
  });

  if (walletQ.isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!walletQ.data) {
    notFound();
  }

  const wallet = walletQ.data;
  const txList = txQ.data ?? [];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <Card style={{ borderLeftColor: wallet.color ?? undefined, borderLeftWidth: 4 }}>
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground mb-1">
            {wallet.type.replace("_", " ")}
          </p>
          <p className="text-2xl font-bold">{wallet.name}</p>
          <p className="text-3xl font-bold mt-2">
            {formatCurrency(Number(wallet.balance), wallet.currency)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {txList.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {txList.map((tx, i) => (
                <div key={tx.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm shrink-0">
                        {tx.categoryEmoji ?? "💳"}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          {tx.note ?? tx.categoryName ?? "Transaction"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(tx.date))}
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
                      {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                      {formatCurrency(Number(tx.amount), wallet.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
