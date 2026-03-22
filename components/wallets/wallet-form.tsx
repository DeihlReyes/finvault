"use client";
"use no memo";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { walletSchema } from "@/lib/validators/wallet";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
type WalletInput = z.output<typeof walletSchema>;
import { createWallet, updateWallet } from "@/actions/wallets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  { value: "BANK", label: "🏦 Bank account" },
  { value: "CASH", label: "💵 Cash" },
  { value: "EWALLET", label: "📱 E-Wallet" },
  { value: "CREDIT_CARD", label: "💳 Credit card" },
  { value: "SAVINGS", label: "🐷 Savings" },
  { value: "INVESTMENT", label: "📈 Investment" },
];

const PALETTE = [
  "#6C47FF", "#F97316", "#10B981", "#EC4899",
  "#EF4444", "#F59E0B", "#22C55E", "#6366F1",
];

export function WalletForm({ defaultCurrency = "USD", onSuccess, editId, initialValues }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<WalletInput>({
    resolver: zodResolver(walletSchema) as Resolver<WalletInput>,
    defaultValues: {
      name: initialValues?.name ?? "",
      type: (initialValues?.type as WalletInput["type"]) ?? "BANK",
      balance: initialValues?.balance ?? 0,
      currency: initialValues?.currency ?? defaultCurrency,
      color: initialValues?.color ?? "#6C47FF",
      icon: "wallet",
    },
  });

  const selectedType = form.watch("type");
  const selectedColor = form.watch("color");

  async function onSubmit(data: WalletInput) {
    setServerError(null);
    const payload = { ...data, currency: data.currency.toUpperCase() };
    const result = editId
      ? await updateWallet(editId, payload as Record<string, unknown>)
      : await createWallet(payload as Record<string, unknown>);

    if (result.success) {
      toast.success(editId ? "Wallet updated!" : "Wallet created! +25 XP");
      onSuccess?.();
    } else {
      setServerError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wallet name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="e.g. Main Checking"
                  className="h-9 w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select type…">
                      {WALLET_TYPES.find((t) => t.value === selectedType)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {WALLET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Balance */}
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{editId ? "Current balance" : "Starting balance"}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  className="h-9 w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Currency */}
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency code</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  maxLength={3}
                  placeholder="USD"
                  className="h-9 w-full uppercase"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{
                        backgroundColor: color,
                        outline: selectedColor === color ? "2px solid white" : "2px solid transparent",
                        outlineOffset: "2px",
                      }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <div className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
            {serverError}
          </div>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full h-10">
          {form.formState.isSubmitting ? "Saving…" : editId ? "Update Wallet" : "Create Wallet"}
        </Button>
      </form>
    </Form>
  );
}
