import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { WalletsClient } from "./wallets-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Wallets — FinVault" };

const WALLET_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK: "Bank",
  EWALLET: "E-Wallet",
  CREDIT_CARD: "Credit Card",
  SAVINGS: "Savings",
  INVESTMENT: "Investment",
};

async function WalletContent() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const wallets = await db.wallet.findMany({
    where: { userId: auth.supabaseId, isArchived: false },
    orderBy: { createdAt: "asc" },
  });

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  return (
    <WalletsClient
      wallets={wallets.map((w) => ({
        ...w,
        balance: Number(w.balance),
        typeLabel: WALLET_TYPE_LABELS[w.type] ?? w.type,
      }))}
      totalBalance={totalBalance}
      currency={auth.user.currency}
    />
  );
}

export default function WalletsPage() {
  return (
    <div className="p-4 md:p-6  mx-auto">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
        }
      >
        <WalletContent />
      </Suspense>
    </div>
  );
}
