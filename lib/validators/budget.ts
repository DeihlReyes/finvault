import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Please select a category"),
  monthlyLimit: z.coerce
    .number()
    .positive("Monthly limit must be greater than 0")
    .max(999_999_999, "Limit is too large"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  rolloverEnabled: z.boolean().default(false),
});

export type BudgetInput = z.output<typeof budgetSchema>;
