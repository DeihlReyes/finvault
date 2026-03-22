"use client";

import { useSearchParams } from "next/navigation";
import {
  useTransactions,
  useWallets,
  useCategories,
  useUser,
} from "@/lib/hooks/use-db-queries";
import { TransactionsHeader } from "./transactions-header";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { Skeleton } from "@/components/ui/skeleton";
import { groupByDate, formatCurrency } from "@/lib/utils";
import type { TransactionType } from "@/lib/db/schema";

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const now = new Date();

  const type = searchParams.get("type") as TransactionType | undefined;
  const month = searchParams.get("month")
    ? parseInt(searchParams.get("month")!)
    : now.getMonth() + 1;
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!)
    : now.getFullYear();
  const walletId = searchParams.get("wallet") ?? undefined;
  const categoryId = searchParams.get("category") ?? undefined;

  const { data: txList = [], isLoading: txLoading } = useTransactions({
    month,
    year,
    type: type ?? undefined,
    walletId,
    categoryId,
  });
  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();
  const { data: user } = useUser();

  if (txLoading) {
    return (
      <div className="p-4 md:p-6 mx-auto space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 mx-auto space-y-4">
      <TransactionsHeader
        wallets={wallets.map((w) => ({
          id: w.id,
          name: w.name,
          currency: w.currency,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji,
        }))}
        current={{
          type: type ?? undefined,
          month,
          year,
          wallet: walletId,
          category: categoryId,
        }}
      />
      <div className="space-y-4">
        {txList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No transactions for this period</p>
          </div>
        ) : (
          groupByDate(txList).map(({ label, items: group }) => {
            const currency = user?.currency ?? "USD";
            const income = group
              .filter((t) => t.type === "INCOME")
              .reduce((s, t) => s + Number(t.amount), 0);
            const expense = group
              .filter((t) => t.type === "EXPENSE")
              .reduce((s, t) => s + Number(t.amount), 0);
            const net = income - expense;

            return (
              <div key={label} className="space-y-2">
                {/* Date group header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {label}
                  </span>
                  {(income > 0 || expense > 0) && (
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        net > 0
                          ? "text-emerald-400"
                          : net < 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {net > 0 ? "+" : ""}
                      {formatCurrency(net, currency)}
                    </span>
                  )}
                </div>

                {/* Transactions for this group */}
                {group.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    id={tx.id}
                    type={tx.type as "INCOME" | "EXPENSE" | "TRANSFER"}
                    amount={Number(tx.amount)}
                    note={tx.note}
                    date={tx.date}
                    category={
                      tx.categoryName
                        ? {
                            name: tx.categoryName,
                            emoji: tx.categoryEmoji ?? "💳",
                          }
                        : null
                    }
                    walletName={tx.walletName ?? ""}
                    currency={currency}
                    showDate={false}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
