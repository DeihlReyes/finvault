import { z } from "zod";

export const transactionSchema = z
  .object({
    walletId: z.string().min(1, "Wallet is required"),
    destinationWalletId: z.string().optional(),
    categoryId: z.string().optional(),
    amount: z.coerce.number().positive("Amount must be positive"),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    date: z.coerce.date(),
    note: z.string().max(500).optional(),
  })
  .refine(
    (d) => {
      if (d.type === "TRANSFER") return !!d.destinationWalletId;
      return true;
    },
    {
      message: "Destination wallet is required for transfers",
      path: ["destinationWalletId"],
    }
  )
  .refine(
    (d) => {
      if (d.type === "TRANSFER") return d.walletId !== d.destinationWalletId;
      return true;
    },
    {
      message: "Source and destination wallets must be different",
      path: ["destinationWalletId"],
    }
  );

export type TransactionInput = z.infer<typeof transactionSchema>;
