"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTransaction, deleteTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ActionResult } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type UpdateResult = ActionResult<void>;

type Transaction = {
  id: string;
  amount: number;
  type: string;
  date: string;
  note: string;
  walletId: string;
  walletName: string;
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  destinationWalletId: string;
};

type Props = {
  transaction: Transaction;
  wallets: { id: string; name: string; currency: string }[];
  categories: { id: string; name: string; emoji: string }[];
  currency: string;
};

export function TransactionDetailClient({ transaction: tx, wallets, categories, currency }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(tx.type);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const prevState = useRef<UpdateResult | null>(null);

  const boundUpdate = updateTransaction.bind(null, tx.id);
  const [state, formAction, pending] = useActionState<UpdateResult | null, FormData>(
    boundUpdate,
    null
  );

  useEffect(() => {
    if (!state || state === prevState.current) return;
    prevState.current = state;
    if (state.success) {
      toast.success("Transaction updated!");
      startTransition(() => setEditing(false));
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteTransaction(tx.id);
    setDeleting(false);
    setConfirmDelete(false);
    if (result.success) {
      toast.success("Transaction deleted");
      router.push("/transactions");
    } else {
      toast.error(result.error);
    }
  }

  if (!editing) {
    return (
      <>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            ← Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-center">
              <span className="text-4xl">{tx.categoryEmoji}</span>
              <p
                className={`text-3xl font-bold mt-2 ${
                  tx.type === "INCOME"
                    ? "text-[oklch(0.65_0.15_145)]"
                    : tx.type === "EXPENSE"
                    ? "text-destructive"
                    : ""
                }`}
              >
                {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                {formatCurrency(tx.amount, currency)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{tx.type}</p>
            </div>

            <Separator />

            <div className="space-y-3">
              {[
                { label: "Wallet", value: tx.walletName },
                { label: "Category", value: tx.categoryName || "—" },
                { label: "Date", value: formatDate(new Date(tx.date)) },
                { label: "Note", value: tx.note || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Edit Transaction</h2>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="type" value={type} />

            {/* Type */}
            <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
              <TabsList className="w-full">
                <TabsTrigger value="EXPENSE" className="flex-1">Expense</TabsTrigger>
                <TabsTrigger value="INCOME" className="flex-1">Income</TabsTrigger>
                <TabsTrigger value="TRANSFER" className="flex-1">Transfer</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={tx.amount}
                className="h-9 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Wallet</Label>
              <Select name="walletId" defaultValue={tx.walletId}>
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type !== "TRANSFER" && (
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select name="categoryId" defaultValue={tx.categoryId || ""}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                name="date"
                type="date"
                defaultValue={tx.date}
                required
                className="h-9 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Note</Label>
              <Input
                name="note"
                type="text"
                defaultValue={tx.note}
                maxLength={500}
                className="h-9 w-full"
              />
            </div>

            {state && !state.success && state.error && (
              <p className="text-destructive text-sm">{state.error}</p>
            )}

            <Button type="submit" disabled={pending} className="w-full h-10">
              {pending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
