import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Wallets — FinVault" };

const WALLET_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash", BANK: "Bank", EWALLET: "E-Wallet",
  CREDIT_CARD: "Credit Card", SAVINGS: "Savings", INVESTMENT: "Investment",
};

async function WalletGrid() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const wallets = await db.wallet.findMany({
    where: { userId: auth.supabaseId, isArchived: false },
    orderBy: { createdAt: "asc" },
  });

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground">Total Balance</p>
        <p className="text-2xl font-bold">{formatCurrency(totalBalance, auth.user.currency)}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="bg-card border border-border rounded-xl p-5"
            style={{ borderLeftColor: wallet.color, borderLeftWidth: 4 }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold">{wallet.name}</p>
                <p className="text-xs text-muted-foreground">{WALLET_TYPE_LABELS[wallet.type]}</p>
              </div>
            </div>
            <p className="text-xl font-bold">{formatCurrency(wallet.balance, wallet.currency)}</p>
          </div>
        ))}

        <button className="bg-card border border-dashed border-border rounded-xl p-5 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <span className="text-xl">+</span> Add wallet
        </button>
      </div>
    </div>
  );
}

export default function WalletsPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Wallets</h2>
      <Suspense fallback={<div className="h-48 bg-card border border-border rounded-xl animate-pulse" />}>
        <WalletGrid />
      </Suspense>
    </div>
  );
}
