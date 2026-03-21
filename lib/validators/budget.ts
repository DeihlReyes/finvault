import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  monthlyLimit: z.coerce.number().positive("Monthly limit must be positive"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  rolloverEnabled: z.boolean().default(false),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
