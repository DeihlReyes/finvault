"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSwipeToDelete } from "@/hooks/use-swipe-to-delete";
import { deleteTransaction } from "@/actions/transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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

  async function handleDelete() {
    const result = await deleteTransaction(id);
    if (result.success) {
      toast.success("Transaction deleted");
      router.refresh();
    } else {
      // Reset the swipe position
      if (ref.current) ref.current.style.transform = "translateX(0)";
      toast.error("Failed to delete");
    }
  }

  const { elementRef: ref, handleTouchStart, handleTouchMove, handleTouchEnd } =
    useSwipeToDelete(handleDelete);

  const amountColor =
    type === "INCOME"
      ? "text-[oklch(0.65_0.15_145)]"
      : type === "EXPENSE"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete hint behind the card */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive rounded-xl w-full">
        <span className="text-destructive-foreground text-sm font-medium">Delete</span>
      </div>

      <div
        ref={ref}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative"
        style={{ willChange: "transform" }}
      >
        <Link href={`/transactions/${id}`} className="block">
          <Card className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0">
                {category?.emoji ?? "💳"}
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">
                  {note ?? category?.name ?? "Transaction"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {walletName} · {formatDate(date)}
                </p>
              </div>
            </div>
            <span className={`text-sm font-semibold shrink-0 ml-3 ${amountColor}`}>
              {type === "INCOME" ? "+" : type === "EXPENSE" ? "-" : ""}
              {formatCurrency(amount, currency)}
            </span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
