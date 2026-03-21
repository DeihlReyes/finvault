import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { TransactionDetailClient } from "./transaction-detail-client";
import { Skeleton } from "@/components/ui/skeleton";

type Props = { params: Promise<{ id: string }> };

async function TransactionDetail({ id }: { id: string }) {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const [tx, wallets, categories] = await Promise.all([
    db.transaction.findFirst({
      where: { id, userId: auth.supabaseId },
      include: { category: true, wallet: true },
    }),
    db.wallet.findMany({
      where: { userId: auth.supabaseId, isArchived: false },
      select: { id: true, name: true, currency: true },
    }),
    db.category.findMany({
      where: { userId: auth.supabaseId, isArchived: false },
      select: { id: true, name: true, emoji: true },
    }),
  ]);

  if (!tx) notFound();

  return (
    <TransactionDetailClient
      transaction={{
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type,
        date: tx.date.toISOString().split("T")[0],
        note: tx.note ?? "",
        walletId: tx.walletId,
        walletName: tx.wallet.name,
        categoryId: tx.categoryId ?? "",
        categoryName: tx.category?.name ?? "",
        categoryEmoji: tx.category?.emoji ?? "💳",
        destinationWalletId: tx.destinationWalletId ?? "",
      }}
      wallets={wallets}
      categories={categories}
      currency={auth.user.currency}
    />
  );
}

export default async function TransactionDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <TransactionDetail id={id} />
      </Suspense>
    </div>
  );
}
