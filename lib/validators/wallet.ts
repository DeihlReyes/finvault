import { z } from "zod";

export const walletSchema = z.object({
  name: z.string().min(1, "Wallet name is required").max(50, "Name must be 50 characters or less"),
  type: z.enum(["CASH", "BANK", "EWALLET", "CREDIT_CARD", "SAVINGS", "INVESTMENT"]),
  balance: z.coerce
    .number()
    .min(-999_999_999, "Balance is too low")
    .max(999_999_999, "Balance is too large")
    .default(0),
  currency: z.string().length(3, "Must be a 3-letter currency code (e.g. USD)").default("USD"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").default("#6C47FF"),
  icon: z.string().default("wallet"),
});

export type WalletInput = z.output<typeof walletSchema>;
