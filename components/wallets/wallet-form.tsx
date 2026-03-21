"use client";

import { useActionState, useEffect, useRef } from "react";
import { createWallet, updateWallet } from "@/actions/wallets";
import { toast } from "sonner";
import type { ActionResult } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WalletResult = ActionResult<{ id: string }>;

type Props = {
  defaultCurrency?: string;
  onSuccess?: () => void;
  editId?: string;
  initialValues?: {
    name: string;
    type: string;
    balance: number;
    currency: string;
    color: string;
  };
};

const WALLET_TYPES = [
  { value: "BANK", label: "Bank" },
  { value: "CASH", label: "Cash" },
  { value: "EWALLET", label: "E-Wallet" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "SAVINGS", label: "Savings" },
  { value: "INVESTMENT", label: "Investment" },
];

const PALETTE = [
  "#6C47FF", "#F97316", "#10B981", "#EC4899",
  "#EF4444", "#F59E0B", "#22C55E", "#6366F1",
];

export function WalletForm({ defaultCurrency = "USD", onSuccess, editId, initialValues }: Props) {
  const prevState = useRef<WalletResult | null>(null);

  const action = editId
    ? updateWallet.bind(null, editId)
    : createWallet;

  const [state, formAction, pending] = useActionState<WalletResult | null, FormData>(
    action,
    null
  );

  useEffect(() => {
    if (state && state !== prevState.current) {
      prevState.current = state;
      if (state.success) {
        toast.success(editId ? "Wallet updated!" : "Wallet created! +25 XP");
        onSuccess?.();
      } else if (state.error) {
        toast.error(state.error);
      }
    }
  }, [state, editId, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Wallet name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          maxLength={50}
          defaultValue={initialValues?.name}
          placeholder="e.g. Main Checking"
          className="h-9 w-full"
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select name="type" required defaultValue={initialValues?.type ?? "BANK"}>
          <SelectTrigger className="w-full h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WALLET_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Balance */}
      <div className="space-y-1.5">
        <Label htmlFor="balance">{editId ? "Balance" : "Starting balance"}</Label>
        <Input
          id="balance"
          name="balance"
          type="number"
          step="0.01"
          defaultValue={initialValues?.balance ?? 0}
          className="h-9 w-full"
        />
      </div>

      {/* Currency */}
      <div className="space-y-1.5">
        <Label htmlFor="currency">Currency</Label>
        <Input
          id="currency"
          name="currency"
          type="text"
          maxLength={3}
          defaultValue={initialValues?.currency ?? defaultCurrency}
          placeholder="USD"
          className="h-9 w-full uppercase"
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {PALETTE.map((color) => (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={color === (initialValues?.color ?? "#6C47FF")}
                className="sr-only"
              />
              <span
                className="block w-7 h-7 rounded-full ring-2 ring-offset-2 ring-offset-background ring-transparent has-[:checked]:ring-white transition-all"
                style={{ backgroundColor: color }}
              />
            </label>
          ))}
        </div>
      </div>

      {state && !state.success && state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full h-10">
        {pending ? "Saving…" : editId ? "Update Wallet" : "Create Wallet"}
      </Button>
    </form>
  );
}
