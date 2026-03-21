"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSwipeToDelete } from "@/hooks/use-swipe-to-delete";
import { deleteTransaction } from "@/actions/transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
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

type Props = {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  note: string | null;
  date: Date;
  category: { name: string; emoji: string } | null;
  walletName: string;
  currency: string;
};

export function TransactionItem({
  id,
  type,
  amount,
  note,
  date,
  category,
  walletName,
  currency,
}: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    elementRef: ref,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetPosition,
  } = useSwipeToDelete(() => setConfirmOpen(true));

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteTransaction(id);
    setDeleting(false);
    setConfirmOpen(false);
    if (result.success) {
      toast.success("Transaction deleted");
      router.refresh();
    } else {
      resetPosition();
      toast.error("Failed to delete");
    }
  }

  const isIncome = type === "INCOME";
  const isTransfer = type === "TRANSFER";

  const amountColor = isIncome
    ? "text-emerald-400"
    : isTransfer
      ? "text-muted-foreground"
      : "text-red-400";

  const amountPrefix = isIncome ? "+" : isTransfer ? "" : "-";

  const iconBg = isIncome
    ? "bg-emerald-500/10 text-emerald-400"
    : isTransfer
      ? "bg-blue-500/10 text-blue-400"
      : "bg-secondary";

  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
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

      <div className="relative overflow-hidden rounded-2xl">
        {/* Swipe-to-delete background */}
        <div className="absolute inset-0 bg-red-500/90 flex items-center justify-end pr-5 rounded-2xl">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg">🗑️</span>
            <span className="text-white text-[10px] font-semibold uppercase tracking-wider">
              Delete
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          ref={ref}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ willChange: "transform" }}
        >
          <Link href={`/transactions/${id}`} className="block">
            <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-card/80 transition-all">
              {/* Emoji icon */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${iconBg}`}
              >
                {category?.emoji ?? (isTransfer ? "↔️" : "💳")}
              </div>

              {/* Label + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">
                  {note ?? category?.name ?? "Transaction"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {walletName} · {formatDate(date)}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0 ml-2">
                <span
                  className={`text-sm font-bold tabular-nums ${amountColor}`}
                >
                  {amountPrefix}
                  {formatCurrency(amount, currency)}
                </span>
                {!isTransfer && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                    {type}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
