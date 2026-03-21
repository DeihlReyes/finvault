"use client";
"use no memo";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { transactionSchema } from "@/lib/validators/transaction";
import { createTransaction } from "@/actions/transactions";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Resolver } from "react-hook-form";

type TransactionInput = z.output<typeof transactionSchema>;
type Wallet = { id: string; name: string; currency: string };
type Category = { id: string; name: string; emoji: string };
type BudgetAlert = { categoryId: string; percentage: number };

type Props = {
  wallets: Wallet[];
  categories: Category[];
  onSuccess?: () => void;
};

export function TransactionForm({ wallets, categories, onSuccess }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionInput>,
    defaultValues: {
      type: "EXPENSE",
      walletId: wallets[0]?.id ?? "",
      date: new Date(),
      note: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const type = form.watch("type");
  const walletId = form.watch("walletId");
  const destinationWalletId = form.watch("destinationWalletId");
  const categoryId = form.watch("categoryId");

  async function onSubmit(data: TransactionInput) {
    setServerError(null);
    const fd = new FormData();
    fd.append("type", data.type);
    fd.append("walletId", data.walletId);
    fd.append("amount", String(data.amount));
    fd.append("date", data.date.toISOString());
    if (data.destinationWalletId)
      fd.append("destinationWalletId", data.destinationWalletId);
    if (data.categoryId) fd.append("categoryId", data.categoryId);
    if (data.note) fd.append("note", data.note);

    const result = await createTransaction(null, fd);
    if (result.success && result.data) {
      const alerts: BudgetAlert[] = result.data.budgetAlerts ?? [];
      toast.success("Transaction added! +10 XP");
      alerts.forEach((a) => {
        const pct = Math.round(a.percentage);
        if (pct >= 100) toast.error(`Budget limit reached! (${pct}% used)`);
        else toast.warning(`Budget at ${pct}% — watch your spending`);
      });
      form.reset();
      onSuccess?.();
    } else if (!result.success) {
      setServerError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  if (wallets.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-3xl">👛</p>
        <p className="text-sm font-medium">No wallets yet</p>
        <p className="text-xs text-muted-foreground">
          Create a wallet first before adding transactions.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Tabs value={field.value} onValueChange={field.onChange}>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  className="w-full text-3xl font-bold bg-transparent border-0 border-b-2 border-border rounded-none focus-visible:border-primary focus-visible:ring-0 pb-2 text-center h-auto"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* From Wallet */}
        <FormField
          control={form.control}
          name="walletId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {type === "TRANSFER" ? "From wallet" : "Wallet"}
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select wallet…">
                      {wallets.find((w) => w.id === walletId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* To Wallet (TRANSFER only) */}
        {type === "TRANSFER" && (
          <FormField
            control={form.control}
            name="destinationWalletId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To wallet</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Select destination wallet…">
                        {
                          wallets.find((w) => w.id === destinationWalletId)
                            ?.name
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Category */}
        {type !== "TRANSFER" && (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Category{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || undefined)}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="No category">
                        {(() => {
                          const c = categories.find((c) => c.id === categoryId);
                          return c ? `${c.emoji} ${c.name}` : undefined;
                        })()}
                      </SelectValue>
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  defaultValue={today}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                  className="h-9 w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Note */}
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Note{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="What was this for?"
                  className="h-9 w-full"
                />
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

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full h-10"
        >
          {form.formState.isSubmitting ? "Saving…" : "Add Transaction"}
        </Button>
      </form>
    </Form>
  );
}
