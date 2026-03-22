"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { transactions, wallets, categories } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { useWallets, useCategories, useUser } from "@/lib/hooks/use-db-queries";
import { TransactionDetailClient } from "./transaction-detail-client";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default function TransactionDetailPage({ params }: Props) {
  const { id } = use(params);
  const { db, isReady } = useDb();

  const txQ = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const [tx] = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          type: transactions.type,
          date: transactions.date,
          note: transactions.note,
          walletId: transactions.walletId,
          categoryId: transactions.categoryId,
          destinationWalletId: transactions.destinationWalletId,
          walletName: wallets.name,
          categoryName: categories.name,
          categoryEmoji: categories.emoji,
        })
        .from(transactions)
        .leftJoin(wallets, eq(transactions.walletId, wallets.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            eq(transactions.id, id),
            eq(transactions.userId, LOCAL_USER_ID)
          )
        )
        .limit(1);
      return tx ?? null;
    },
    enabled: isReady,
  });

  const { data: walletList = [] } = useWallets();
  const { data: categoryList = [] } = useCategories();
  const { data: user } = useUser();

  if (txQ.isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!txQ.data) {
    notFound();
  }

  const tx = txQ.data;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <TransactionDetailClient
        transaction={{
          id: tx.id,
          amount: Number(tx.amount),
          type: tx.type as "INCOME" | "EXPENSE" | "TRANSFER",
          date: new Date(tx.date).toISOString().split("T")[0],
          note: tx.note ?? "",
          walletId: tx.walletId,
          walletName: tx.walletName ?? "",
          categoryId: tx.categoryId ?? "",
          categoryName: tx.categoryName ?? "",
          categoryEmoji: tx.categoryEmoji ?? "💳",
          destinationWalletId: tx.destinationWalletId ?? "",
        }}
        wallets={walletList.map((w) => ({
          id: w.id,
          name: w.name,
          currency: w.currency,
        }))}
        categories={categoryList.map((c) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji,
        }))}
        currency={user?.currency ?? "USD"}
      />
    </div>
  );
}
