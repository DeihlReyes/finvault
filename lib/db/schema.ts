import {
  pgTable,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  date,
  index,
  unique,
} from "drizzle-orm/pg-core";

// ─── TypeScript Enum Types ────────────────────────────────────────────────────
// Stored as TEXT in the DB; TypeScript types provide compile-time safety.

export type WalletType =
  | "CASH"
  | "BANK"
  | "EWALLET"
  | "CREDIT_CARD"
  | "SAVINGS"
  | "INVESTMENT";

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export type AchievementType =
  | "FIRST_TRANSACTION"
  | "BUDGET_BUILDER"
  | "WALLET_WIZARD"
  | "STREAK_WARRIOR"
  | "UNDER_BUDGET"
  | "EXPORT_PRO"
  | "SAVER_OF_THE_MONTH"
  | "CENTURY_STREAK";

export type XPAction =
  | "TRANSACTION"
  | "BUDGET_SETUP"
  | "RECURRING_RULE"
  | "BUDGET_COMPLETED"
  | "STREAK_7"
  | "STREAK_30"
  | "STREAK_100"
  | "FIRST_WALLET"
  | "EXPORT"
  | "CHALLENGE_COMPLETE"
  | "ACHIEVEMENT";

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  currency: text("currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("UTC"),
  totalXP: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  levelUpPending: boolean("level_up_pending").notNull().default(false),
  streak: integer("streak").notNull().default(0),
  lastTransactionDate: timestamp("last_transaction_date"),
  streakFreezeAvailable: integer("streak_freeze_available")
    .notNull()
    .default(0),
  lastFreezeGrantedAt: timestamp("last_freeze_granted_at"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  seenTips: text("seen_tips").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wallets = pgTable(
  "wallets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().$type<WalletType>(),
    balance: numeric("balance", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    currency: text("currency").notNull().default("USD"),
    color: text("color").notNull().default("#6C47FF"),
    icon: text("icon").notNull().default("wallet"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("idx_wallets_user_id").on(t.userId)]
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("💰"),
    color: text("color").notNull().default("#6C47FF"),
    isDefault: boolean("is_default").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("idx_categories_user_id").on(t.userId)]
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallets.id),
    destinationWalletId: text("destination_wallet_id").references(
      () => wallets.id
    ),
    categoryId: text("category_id").references(() => categories.id),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    type: text("type").notNull().$type<TransactionType>(),
    date: timestamp("date").notNull(),
    note: text("note"),
    isRecurringGenerated: boolean("is_recurring_generated")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_transactions_user_id").on(t.userId),
    index("idx_transactions_user_date").on(t.userId, t.date),
    index("idx_transactions_user_wallet").on(t.userId, t.walletId),
    index("idx_transactions_user_category").on(t.userId, t.categoryId),
  ]
);

export const budgets = pgTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    monthlyLimit: numeric("monthly_limit", {
      precision: 18,
      scale: 2,
    }).notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    rolloverEnabled: boolean("rollover_enabled").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("uq_budgets_user_category_month_year").on(
      t.userId,
      t.categoryId,
      t.month,
      t.year
    ),
    index("idx_budgets_user_id").on(t.userId),
    index("idx_budgets_user_month_year").on(t.userId, t.month, t.year),
  ]
);

export const achievements = pgTable(
  "achievements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull().$type<AchievementType>(),
    unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  },
  (t) => [
    unique("uq_achievements_user_type").on(t.userId, t.type),
    index("idx_achievements_user_id").on(t.userId),
  ]
);

export const monthlyChallenges = pgTable(
  "monthly_challenges",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeType: text("challenge_type").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    targetValue: numeric("target_value", { precision: 18, scale: 2 }).notNull(),
    currentValue: numeric("current_value", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("uq_challenges_user_type_month_year").on(
      t.userId,
      t.challengeType,
      t.month,
      t.year
    ),
    index("idx_monthly_challenges_user_id").on(t.userId),
  ]
);

export const xpLogs = pgTable(
  "xp_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull().$type<XPAction>(),
    xpEarned: integer("xp_earned").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("idx_xp_logs_user_id").on(t.userId)]
);

export const netWorthSnapshots = pgTable(
  "net_worth_snapshots",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    totalValue: numeric("total_value", { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("uq_net_worth_user_date").on(t.userId, t.date),
    index("idx_net_worth_user_id").on(t.userId),
  ]
);

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type MonthlyChallenge = typeof monthlyChallenges.$inferSelect;
export type XPLog = typeof xpLogs.$inferSelect;
export type NetWorthSnapshot = typeof netWorthSnapshots.$inferSelect;
