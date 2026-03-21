import { z } from "zod";

export const recurringRuleSchema = z.object({
  walletId: z.string().min(1, "Wallet is required"),
  categoryId: z.string().optional(),
  name: z.string().min(1, "Name is required").max(100),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  frequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export type RecurringRuleInput = z.infer<typeof recurringRuleSchema>;
