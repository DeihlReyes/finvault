"use client";

import { useWallets, useUser } from "@/lib/hooks/use-db-queries";
import { WalletsClient } from "./wallets-client";
import { FeatureTip } from "@/components/onboarding/feature-tip";
import { TIPS } from "@/lib/onboarding/tips";
import { Skeleton } from "@/components/ui/skeleton";

const WALLET_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK: "Bank",
  EWALLET: "E-Wallet",
  CREDIT_CARD: "Credit Card",
  SAVINGS: "Savings",
  INVESTMENT: "Investment",
};

export default function WalletsPage() {
  const { data: wallets = [], isLoading } = useWallets();
  const { data: user } = useUser();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 mx-auto">
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
      </div>
    );
  }

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const seenTips = user?.seenTips ?? [];

  return (
    <div className="p-4 md:p-6 mx-auto">
      {wallets.length === 1 && (
        <FeatureTip
          tipId={TIPS.WALLETS_ADD_SECOND}
          title="Add more wallets"
          description="Track cash, savings, and credit cards separately for a complete picture of your finances."
          seenTips={seenTips}
        />
      )}
      <WalletsClient
        wallets={wallets.map((w) => ({
          ...w,
          balance: Number(w.balance),
          typeLabel: WALLET_TYPE_LABELS[w.type] ?? w.type,
        }))}
        totalBalance={totalBalance}
        currency={user?.currency ?? "USD"}
      />
    </div>
  );
}
