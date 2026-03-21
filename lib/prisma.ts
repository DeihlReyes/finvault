/**
 * Canonical import point for Prisma types, enums, and PrismaClient.
 * Re-exports from generated files so app code doesn't import from generated paths.
 * Run `npx prisma generate` to regenerate the underlying files.
 */
export { PrismaClient } from "./generated/prisma/client";
export type {
  User,
  Wallet,
  Category,
  Transaction,
  RecurringRule,
  Budget,
  Achievement,
  MonthlyChallenge,
  XPLog,
  NetWorthSnapshot,
  PushSubscription,
} from "./generated/prisma/client";

// Enum values (runtime constants) + types
export {
  WalletType,
  TransactionType,
  RecurringFrequency,
  AchievementType,
  XPAction,
} from "./generated/prisma/enums";
export type {
  WalletType as WalletTypeValue,
  TransactionType as TransactionTypeValue,
  RecurringFrequency as RecurringFrequencyValue,
  AchievementType as AchievementTypeValue,
  XPAction as XPActionValue,
} from "./generated/prisma/enums";
