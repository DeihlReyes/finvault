"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBudget } from "@/actions/budgets";
import { toast } from "sonner";
import type { ActionResult } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BudgetResult = ActionResult<{ id: string }>;

type Category = { id: string; name: string; emoji: string };

type Props = {
  categories: Category[];
  onSuccess?: () => void;
};

export function BudgetForm({ categories, onSuccess }: Props) {
  const prevState = useRef<BudgetResult | null>(null);
  const now = new Date();

  const [state, formAction, pending] = useActionState<BudgetResult | null, FormData>(
    createBudget,
    null
  );

  useEffect(() => {
    if (state && state !== prevState.current) {
      prevState.current = state;
      if (state.success) {
        toast.success("Budget created! +50 XP");
        onSuccess?.();
      } else if (state.error) {
        toast.error(state.error);
      }
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="month" value={now.getMonth() + 1} />
      <input type="hidden" name="year" value={now.getFullYear()} />

      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select name="categoryId" required>
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Select a category…" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="monthlyLimit">Monthly limit</Label>
        <Input
          id="monthlyLimit"
          name="monthlyLimit"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
          className="h-9 w-full"
        />
      </div>

      <div className="flex items-center gap-3">
        <Checkbox id="rolloverEnabled" name="rolloverEnabled" value="true" />
        <Label htmlFor="rolloverEnabled" className="cursor-pointer font-normal">
          Roll over unused budget to next month
        </Label>
      </div>

      {state && !state.success && state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full h-10">
        {pending ? "Saving…" : "Create Budget"}
      </Button>
    </form>
  );
}
