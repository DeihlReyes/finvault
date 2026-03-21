"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import type { ActionResult } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Wallet = { id: string; name: string; currency: string };
type Category = { id: string; name: string; emoji: string };
type BudgetAlert = { categoryId: string; percentage: number };
type TxResult = ActionResult<{ id: string; budgetAlerts: BudgetAlert[] }>;

type Props = {
  wallets: Wallet[];
  categories: Category[];
  onSuccess?: () => void;
};

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";

export function TransactionForm({ wallets, categories, onSuccess }: Props) {
  const [type, setType] = useState<TxType>("EXPENSE");
  const today = new Date().toISOString().split("T")[0];
  const prevState = useRef<TxResult | null>(null);

  const [state, formAction, pending] = useActionState<
    TxResult | null,
    FormData
  >(createTransaction, null);

  useEffect(() => {
    if (state && state !== prevState.current) {
      prevState.current = state;
      if (state.success && state.data) {
        const alerts = state.data.budgetAlerts ?? [];
        toast.success("Transaction added! +10 XP");
        alerts.forEach((a) => {
          const pct = Math.round(a.percentage);
          if (pct >= 100) {
            toast.error(`Budget limit reached! (${pct}% used)`);
          } else {
            toast.warning(`Budget at ${pct}% — watch your spending`);
          }
        });
        onSuccess?.();
      } else if (!state.success && state.error) {
        toast.error(state.error);
      }
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="type" value={type} />

      {/* Type tabs */}
      <Tabs value={type} onValueChange={(v) => setType(v as TxType)}>
        <TabsList className="w-full">
          <TabsTrigger value="EXPENSE" className="flex-1">
            Expense
          </TabsTrigger>
          <TabsTrigger value="INCOME" className="flex-1">
            Income
          </TabsTrigger>
          <TabsTrigger value="TRANSFER" className="flex-1">
            Transfer
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Amount */}
      <Input
        name="amount"
        type="number"
        step="0.01"
        min="0.01"
        required
        placeholder="0.00"
        className="w-full text-3xl font-bold bg-transparent border-0 border-b-2 border-border rounded-none focus-visible:border-primary focus-visible:ring-0 pb-2 text-center h-auto"
      />

      {/* Wallet */}
      <div className="space-y-1.5">
        <Label>{type === "TRANSFER" ? "From wallet" : "Wallet"}</Label>
        <Select name="walletId" required defaultValue={wallets[0]?.id}>
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Select wallet…" />
          </SelectTrigger>
          <SelectContent>
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* To wallet (TRANSFER only) */}
      {type === "TRANSFER" && (
        <div className="space-y-1.5">
          <Label>To wallet</Label>
          <Select name="destinationWalletId" required>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Select wallet…" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category (not for TRANSFER) */}
      {type !== "TRANSFER" && (
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select name="categoryId" defaultValue="">
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={today}
          required
          className="h-9 w-full"
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          name="note"
          type="text"
          maxLength={500}
          placeholder="What was this for?"
          className="h-9 w-full"
        />
      </div>

      {state && !state.success && state.error && (
        <p className="text-destructive text-sm text-center">{state.error}</p>
      )}

      <Button
        type="submit"
        disabled={pending || wallets.length === 0}
        className="w-full h-10"
      >
        {pending ? "Saving…" : "Add Transaction"}
      </Button>

      {wallets.length === 0 && (
        <p className="text-muted-foreground text-xs text-center">
          Create a wallet first before adding transactions.
        </p>
      )}
    </form>
  );
}
