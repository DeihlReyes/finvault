"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { BudgetForm } from "@/components/budgets/budget-form";
import { deleteBudget } from "@/actions/budgets";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Add } from "@hugeicons/core-free-icons";

type Budget = {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  monthlyLimit: number;
  spent: number;
  percentage: number;
};

type Category = { id: string; name: string; emoji: string };

type Props = {
  budgets: Budget[];
  categories: Category[];
  currency: string;
};

export function BudgetsClient({ budgets, categories, currency }: Props) {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;

    // Optimistic: close dialog + remove from cache immediately
    setDeleteTarget(null);
    queryClient.setQueryData<Array<{ id: string }>>(["budgets"], (old) =>
      (old ?? []).filter((b) => b.id !== targetId)
    );

    const result = await deleteBudget(targetId);
    if (result.success) {
      toast.success("Budget deleted");
    } else {
      toast.error(result.error);
    }
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  }

  function onFormSuccess() {
    setSheetOpen(false);
    // Cache invalidation is handled by BudgetForm itself
  }

  const usedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter(
    (c) => !usedCategoryIds.has(c.id),
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Budgets</h2>
          <Button onClick={() => setSheetOpen(true)}>
            <HugeiconsIcon icon={Add} /> Create Budget
          </Button>
        </div>

        {budgets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm mb-1 font-medium">No budgets this month</p>
            <p className="text-xs mb-4">Set spending limits to stay on track</p>
            <Button onClick={() => setSheetOpen(true)}>
              <HugeiconsIcon icon={Add} /> Create Budget
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const barColor =
                budget.percentage >= 85
                  ? "bg-destructive"
                  : budget.percentage >= 60
                    ? "bg-accent"
                    : "bg-[oklch(0.65_0.15_145)]";

              return (
                <Card key={budget.id} className="group">
                  <CardContent className="pt-5">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span>{budget.categoryEmoji}</span>
                        <span className="font-medium text-sm">
                          {budget.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(budget.spent, currency)} /{" "}
                          {formatCurrency(budget.monthlyLimit, currency)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(budget)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{
                          width: `${Math.min(100, budget.percentage)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {Math.round(budget.percentage)}% used
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription>
              The {deleteTarget?.categoryEmoji} {deleteTarget?.categoryName}{" "}
              budget will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Credenza open={sheetOpen} onOpenChange={setSheetOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>New Budget</CredenzaTitle>
          </CredenzaHeader>
          <CredenzaBody>
            {availableCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                All categories already have budgets this month.
              </p>
            ) : (
              <BudgetForm
                categories={availableCategories}
                onSuccess={onFormSuccess}
              />
            )}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
