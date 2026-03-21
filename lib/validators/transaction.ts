import { z } from "zod";

export const transactionSchema = z
  .object({
    walletId: z.string().min(1, "Please select a wallet"),
    destinationWalletId: z.string().optional(),
    categoryId: z.string().optional(),
    amount: z.coerce
      .number()
      .positive("Amount must be greater than 0")
      .max(999_999_999, "Amount is too large"),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    date: z.coerce.date(),
    note: z.string().max(500, "Note must be 500 characters or less").optional(),
  })
  .refine(
    (d) => (d.type === "TRANSFER" ? !!d.destinationWalletId : true),
    { message: "Please select a destination wallet for transfers", path: ["destinationWalletId"] }
  )
  .refine(
    (d) => (d.type === "TRANSFER" ? d.walletId !== d.destinationWalletId : true),
    { message: "Source and destination wallets must be different", path: ["destinationWalletId"] }
  );

export type TransactionInput = z.output<typeof transactionSchema>;
