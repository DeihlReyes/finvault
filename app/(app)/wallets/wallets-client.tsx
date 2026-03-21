"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { WalletForm } from "@/components/wallets/wallet-form";
import { archiveWallet } from "@/actions/wallets";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";

type Wallet = {
  id: string;
  name: string;
  balance: number;
  currency: string;
  color: string;
  type: string;
  typeLabel: string;
};

type Props = {
  wallets: Wallet[];
  totalBalance: number;
  currency: string;
};

export function WalletsClient({ wallets, totalBalance, currency }: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editWallet, setEditWallet] = useState<Wallet | null>(null);

  async function handleArchive(id: string, name: string) {
    if (!confirm(`Archive "${name}"?`)) return;
    const result = await archiveWallet(id);
    if (result.success) {
      toast.success("Wallet archived");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function openAdd() {
    setEditWallet(null);
    setSheetOpen(true);
  }

  function openEdit(w: Wallet) {
    setEditWallet(w);
    setSheetOpen(true);
  }

  function onFormSuccess() {
    setSheetOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Wallets</h2>
          <Button size="sm" onClick={openAdd}>+ Add</Button>
        </div>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalBalance, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className="relative group overflow-hidden"
              style={{ borderLeftColor: wallet.color, borderLeftWidth: 4 }}
            >
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold leading-tight">{wallet.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs font-normal">
                      {wallet.typeLabel}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-xs"
                      onClick={() => openEdit(wallet)}
                    >
                      ✎
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-xs hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleArchive(wallet.id, wallet.name)}
                    >
                      🗑
                    </Button>
                  </div>
                </div>
                <p className="text-xl font-bold">
                  {formatCurrency(wallet.balance, wallet.currency)}
                </p>
              </CardContent>
            </Card>
          ))}

          <button
            onClick={openAdd}
            className="rounded-xl border border-dashed border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[7rem]"
          >
            <span className="text-xl">+</span> Add wallet
          </button>
        </div>
      </div>

      <Credenza open={sheetOpen} onOpenChange={setSheetOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>{editWallet ? "Edit Wallet" : "New Wallet"}</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody className="pb-4">
            <WalletForm
              defaultCurrency={currency}
              editId={editWallet?.id}
              initialValues={
                editWallet
                  ? {
                      name: editWallet.name,
                      type: editWallet.type,
                      balance: editWallet.balance,
                      currency: editWallet.currency,
                      color: editWallet.color,
                    }
                  : undefined
              }
              onSuccess={onFormSuccess}
            />
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
