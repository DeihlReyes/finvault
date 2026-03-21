import { z } from "zod";

export const walletSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  type: z.enum(["CASH", "BANK", "EWALLET", "CREDIT_CARD", "SAVINGS", "INVESTMENT"]),
  balance: z.coerce.number().default(0),
  currency: z.string().length(3).default("USD"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6C47FF"),
  icon: z.string().default("wallet"),
});

export type WalletInput = z.infer<typeof walletSchema>;
