"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getTransactionFormData } from "@/actions/transactions";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  wallets: { id: string; name: string; currency: string }[];
  categories: { id: string; name: string; emoji: string }[];
  current: {
    type?: string;
    month: number;
    year: number;
    wallet?: string;
    category?: string;
  };
};

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export function TransactionsHeader({ wallets, categories, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [formData, setFormData] = useState<{ wallets: typeof wallets; categories: typeof categories } | null>(null);
  const [loading, startLoading] = useTransition();

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleOpenSheet() {
    setSheetOpen(true);
    if (!formData) {
      startLoading(async () => {
        const data = await getTransactionFormData();
        if (data) setFormData(data);
      });
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Transactions</h2>
          <Button size="sm" className="hidden md:flex" onClick={handleOpenSheet}>+ Add</Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Select value={String(current.month)} onValueChange={(v) => v && setParam("month", v)}>
            <SelectTrigger className="h-8 text-xs w-auto shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(current.year)} onValueChange={(v) => v && setParam("year", v)}>
            <SelectTrigger className="h-8 text-xs w-auto shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={current.type ?? ""} onValueChange={(v) => setParam("type", v || undefined)}>
            <SelectTrigger className="h-8 text-xs w-auto shrink-0">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>

          {wallets.length > 1 && (
            <Select value={current.wallet ?? ""} onValueChange={(v) => setParam("wallet", v || undefined)}>
              <SelectTrigger className="h-8 text-xs w-auto shrink-0">
                <SelectValue placeholder="All wallets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All wallets</SelectItem>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {categories.length > 0 && (
            <Select value={current.category ?? ""} onValueChange={(v) => setParam("category", v || undefined)}>
              <SelectTrigger className="h-8 text-xs w-auto shrink-0">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Credenza open={sheetOpen} onOpenChange={setSheetOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Add Transaction</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody className="pb-4">
            {loading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            )}
            {!loading && formData && (
              <TransactionForm
                wallets={formData.wallets}
                categories={formData.categories}
                onSuccess={() => { setSheetOpen(false); router.refresh(); }}
              />
            )}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
