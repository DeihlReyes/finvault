import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type Props = { params: Promise<{ id: string }> };

async function WalletDetail({ id }: { id: string }) {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const wallet = await db.wallet.findFirst({
    where: { id, userId: auth.supabaseId },
  });

  if (!wallet) notFound();

  const transactions = await db.transaction.findMany({
    where: { userId: auth.supabaseId, walletId: id },
    orderBy: { date: "desc" },
    take: 30,
    include: { category: true },
  });

  return (
    <div className="space-y-5">
      {/* Wallet card */}
      <Card style={{ borderLeftColor: wallet.color, borderLeftWidth: 4 }}>
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground mb-1">{wallet.type.replace("_", " ")}</p>
          <p className="text-2xl font-bold">{wallet.name}</p>
          <p className="text-3xl font-bold mt-2">
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, i) => (
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
                        <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
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
                      {formatCurrency(tx.amount, wallet.currency)}
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

export default async function WalletDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <WalletDetail id={id} />
      </Suspense>
    </div>
  );
}
