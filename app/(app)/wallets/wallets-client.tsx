"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add, Edit, Trash } from "@hugeicons/core-free-icons";

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
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editWallet, setEditWallet] = useState<Wallet | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Wallet | null>(null);

  async function handleArchive() {
    if (!archiveTarget) return;
    const targetId = archiveTarget.id;

    // Optimistic: close dialog + remove from cache immediately
    setArchiveTarget(null);
    queryClient.setQueryData<Array<{ id: string }>>(["wallets"], (old) =>
      (old ?? []).filter((w) => w.id !== targetId)
    );

    const result = await archiveWallet(targetId);
    if (result.success) {
      toast.success("Wallet archived");
    } else {
      toast.error(result.error);
    }
    queryClient.invalidateQueries({ queryKey: ["wallets"] });
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
    // Cache invalidation is handled by WalletForm itself
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Wallets</h2>
          <Button onClick={openAdd}>
            <HugeiconsIcon icon={Add} /> Add Wallet
          </Button>
        </div>

        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold mt-0.5">
              {formatCurrency(totalBalance, currency)}
            </p>
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
                    <Badge
                      variant="secondary"
                      className="mt-1 text-xs font-normal"
                    >
                      {wallet.typeLabel}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => openEdit(wallet)}
                    >
                      <HugeiconsIcon icon={Edit} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setArchiveTarget(wallet)}
                    >
                      <HugeiconsIcon icon={Trash} />
                    </Button>
                  </div>
                </div>
                <p className="text-xl font-bold">
                  {formatCurrency(wallet.balance, wallet.currency)}
                </p>
              </CardContent>
            </Card>
          ))}

          <Button
            variant={"outline"}
            onClick={openAdd}
            className="rounded-xl border border-dashed border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-28"
          >
            <HugeiconsIcon icon={Add} /> Add Wallet
          </Button>
        </div>
      </div>

      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Archive &ldquo;{archiveTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The wallet will be hidden from your dashboard. Transactions are
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleArchive}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Credenza open={sheetOpen} onOpenChange={setSheetOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>
              {editWallet ? "Edit Wallet" : "New Wallet"}
            </CredenzaTitle>
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
