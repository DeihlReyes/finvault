/* eslint-disable react-hooks/incompatible-library */
"use client";
"use no memo";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { budgetSchema } from "@/lib/validators/budget";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
type BudgetInput = z.output<typeof budgetSchema>;
import { createBudget } from "@/actions/budgets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type Category = { id: string; name: string; emoji: string };
type Props = { categories: Category[]; onSuccess?: () => void };

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function BudgetForm({ categories, onSuccess }: Props) {
  const now = new Date();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetInput>,
    defaultValues: {
      categoryId: "",
      monthlyLimit: undefined,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      rolloverEnabled: false,
    },
  });

  const selectedCategoryId = form.watch("categoryId");
  const selectedMonth = form.watch("month");
  const selectedYear = form.watch("year");

  async function onSubmit(data: BudgetInput) {
    setServerError(null);
    const fd = new FormData();
    fd.append("categoryId", data.categoryId);
    fd.append("monthlyLimit", String(data.monthlyLimit));
    fd.append("month", String(data.month));
    fd.append("year", String(data.year));
    if (data.rolloverEnabled) fd.append("rolloverEnabled", "true");

    const result = await createBudget(null, fd);
    if (result.success) {
      toast.success("Budget created! +50 XP");
      onSuccess?.();
    } else {
      setServerError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Category */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select a category…">
                      {(() => {
                        const c = categories.find(
                          (c) => c.id === selectedCategoryId,
                        );
                        return c ? `${c.emoji} ${c.name}` : undefined;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
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

        {/* Monthly limit */}
        <FormField
          control={form.control}
          name="monthlyLimit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly limit</FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={
                    field.value == null ||
                    (typeof field.value === "number" && isNaN(field.value))
                      ? ""
                      : field.value
                  }
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500.00"
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  className="h-9 w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Period */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Month</FormLabel>
                <FormControl>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue>
                        {MONTHS[(selectedMonth as number) - 1]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue>{selectedYear}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        now.getFullYear() - 1,
                        now.getFullYear(),
                        now.getFullYear() + 1,
                      ].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Rollover */}
        <FormField
          control={form.control}
          name="rolloverEnabled"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                  <Checkbox
                    id="rolloverEnabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div>
                    <FormLabel
                      htmlFor="rolloverEnabled"
                      className="cursor-pointer font-medium text-sm"
                    >
                      Roll over unused budget
                    </FormLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Carry unspent amount forward to the next month
                    </p>
                  </div>
                </div>
              </FormControl>
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
          {form.formState.isSubmitting ? "Saving…" : "Create Budget"}
        </Button>
      </form>
    </Form>
  );
}
