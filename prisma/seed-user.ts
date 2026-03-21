import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const USER_ID = "7c31e09f-8f18-417e-8c52-537f7af216ba";

const CATEGORIES = [
  { name: "Food & Dining", emoji: "🍔", color: "#F97316" },
  { name: "Transport", emoji: "🚌", color: "#6C47FF" },
  { name: "Housing", emoji: "🏠", color: "#10B981" },
  { name: "Entertainment", emoji: "🎮", color: "#EC4899" },
  { name: "Health", emoji: "❤️", color: "#EF4444" },
  { name: "Shopping", emoji: "🛍️", color: "#F59E0B" },
  { name: "Savings", emoji: "💰", color: "#22C55E" },
  { name: "Salary", emoji: "💼", color: "#6366F1" },
  { name: "Freelance", emoji: "💻", color: "#8B5CF6" },
  { name: "Other", emoji: "📦", color: "#6B7280" },
];

async function main() {
  console.log(`Seeding for user: ${USER_ID}`);

  // 1. Ensure user row exists in Prisma (may already be there from webhook)
  const existing = await db.user.findUnique({ where: { id: USER_ID } });
  if (!existing) {
    console.error("User not found in DB. Make sure the auth webhook has fired or create the user manually.");
    process.exit(1);
  }
  console.log(`Found user: ${existing.email}`);

  // 2. Default categories (skip if already seeded)
  const existingCats = await db.category.count({ where: { userId: USER_ID } });
  if (existingCats === 0) {
    await db.category.createMany({
      data: CATEGORIES.map((c) => ({ userId: USER_ID, ...c, isDefault: true })),
    });
    console.log(`Created ${CATEGORIES.length} categories`);
  } else {
    console.log(`Skipping categories — ${existingCats} already exist`);
  }

  // 3. Fetch category IDs we'll need
  const cats = await db.category.findMany({
    where: { userId: USER_ID },
    select: { id: true, name: true },
  });
  const cat = (name: string) =>
    cats.find((c) => c.name.toLowerCase().includes(name.toLowerCase()))?.id;

  // 4. Wallets
  const existingWallets = await db.wallet.count({ where: { userId: USER_ID } });
  let walletId: string;
  let savingsWalletId: string;

  if (existingWallets === 0) {
    const main = await db.wallet.create({
      data: {
        userId: USER_ID,
        name: "Main Account",
        type: "BANK",
        balance: 4250.00,
        currency: existing.currency,
        color: "#6C47FF",
        icon: "bank",
      },
    });
    const savings = await db.wallet.create({
      data: {
        userId: USER_ID,
        name: "Savings",
        type: "SAVINGS",
        balance: 12000.00,
        currency: existing.currency,
        color: "#22C55E",
        icon: "piggy-bank",
      },
    });
    const cash = await db.wallet.create({
      data: {
        userId: USER_ID,
        name: "Cash",
        type: "CASH",
        balance: 150.00,
        currency: existing.currency,
        color: "#F97316",
        icon: "wallet",
      },
    });
    walletId = main.id;
    savingsWalletId = savings.id;
    console.log(`Created 3 wallets (IDs: ${main.id}, ${savings.id}, ${cash.id})`);
  } else {
    const wallets = await db.wallet.findMany({ where: { userId: USER_ID } });
    walletId = wallets[0].id;
    savingsWalletId = wallets[1]?.id ?? wallets[0].id;
    console.log(`Skipping wallets — ${existingWallets} already exist`);
  }

  // 5. Transactions — last 2 months of realistic data
  const existingTx = await db.transaction.count({ where: { userId: USER_ID } });
  if (existingTx === 0) {
    const now = new Date();
    const d = (daysAgo: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      return date;
    };

    const transactions = [
      // This month — income
      { type: "INCOME", amount: 5000, categoryId: cat("salary"), walletId, date: d(2), note: "Monthly salary" },
      { type: "INCOME", amount: 800, categoryId: cat("freelance"), walletId, date: d(8), note: "Design project" },
      // This month — expenses
      { type: "EXPENSE", amount: 1200, categoryId: cat("housing"), walletId, date: d(1), note: "Rent" },
      { type: "EXPENSE", amount: 85.50, categoryId: cat("food"), walletId, date: d(1), note: "Groceries" },
      { type: "EXPENSE", amount: 42.00, categoryId: cat("food"), walletId, date: d(3), note: "Dinner out" },
      { type: "EXPENSE", amount: 29.99, categoryId: cat("entertainment"), walletId, date: d(4), note: "Netflix & Spotify" },
      { type: "EXPENSE", amount: 55.00, categoryId: cat("transport"), walletId, date: d(5), note: "Gas" },
      { type: "EXPENSE", amount: 120.00, categoryId: cat("shopping"), walletId, date: d(6), note: "Clothes" },
      { type: "EXPENSE", amount: 18.50, categoryId: cat("food"), walletId, date: d(7), note: "Lunch" },
      { type: "EXPENSE", amount: 65.00, categoryId: cat("health"), walletId, date: d(9), note: "Gym membership" },
      { type: "EXPENSE", amount: 34.00, categoryId: cat("transport"), walletId, date: d(11), note: "Uber rides" },
      { type: "EXPENSE", amount: 210.00, categoryId: cat("shopping"), walletId, date: d(13), note: "Electronics" },
      { type: "EXPENSE", amount: 22.00, categoryId: cat("food"), walletId, date: d(14), note: "Coffee & snacks" },
      // Last month — income
      { type: "INCOME", amount: 5000, categoryId: cat("salary"), walletId, date: d(32), note: "Monthly salary" },
      { type: "INCOME", amount: 350, categoryId: cat("freelance"), walletId, date: d(38), note: "Logo design" },
      // Last month — expenses
      { type: "EXPENSE", amount: 1200, categoryId: cat("housing"), walletId, date: d(31), note: "Rent" },
      { type: "EXPENSE", amount: 92.00, categoryId: cat("food"), walletId, date: d(33), note: "Groceries" },
      { type: "EXPENSE", amount: 48.00, categoryId: cat("food"), walletId, date: d(35), note: "Restaurant" },
      { type: "EXPENSE", amount: 29.99, categoryId: cat("entertainment"), walletId, date: d(36), note: "Streaming services" },
      { type: "EXPENSE", amount: 60.00, categoryId: cat("transport"), walletId, date: d(37), note: "Gas" },
      { type: "EXPENSE", amount: 89.00, categoryId: cat("health"), walletId, date: d(39), note: "Doctor visit" },
      { type: "EXPENSE", amount: 145.00, categoryId: cat("shopping"), walletId, date: d(42), note: "Home items" },
      { type: "EXPENSE", amount: 15.00, categoryId: cat("food"), walletId, date: d(44), note: "Coffee" },
      { type: "EXPENSE", amount: 200.00, categoryId: cat("savings"), walletId: savingsWalletId, date: d(45), note: "Monthly savings transfer" },
    ];

    await db.transaction.createMany({
      data: transactions.map((t) => ({
        userId: USER_ID,
        walletId: t.walletId,
        categoryId: t.categoryId ?? null,
        amount: t.amount,
        type: t.type as "INCOME" | "EXPENSE",
        date: t.date,
        note: t.note,
      })),
    });
    console.log(`Created ${transactions.length} transactions`);
  } else {
    console.log(`Skipping transactions — ${existingTx} already exist`);
  }

  // 6. Budgets for current month
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const existingBudgets = await db.budget.count({ where: { userId: USER_ID, month, year } });
  if (existingBudgets === 0) {
    const budgetCats = [
      { name: "food", limit: 400 },
      { name: "transport", limit: 150 },
      { name: "entertainment", limit: 100 },
      { name: "shopping", limit: 300 },
      { name: "health", limit: 120 },
    ];

    for (const { name, limit } of budgetCats) {
      const categoryId = cat(name);
      if (!categoryId) continue;
      await db.budget.upsert({
        where: { userId_categoryId_month_year: { userId: USER_ID, categoryId, month, year } },
        create: { userId: USER_ID, categoryId, monthlyLimit: limit, month, year },
        update: {},
      });
    }
    console.log(`Created ${budgetCats.length} budgets for ${month}/${year}`);
  } else {
    console.log(`Skipping budgets — ${existingBudgets} already exist for this month`);
  }

  // 7. Mark onboarding complete
  await db.user.update({
    where: { id: USER_ID },
    data: { onboardingCompleted: true, displayName: existing.displayName ?? "Deihl" },
  });
  console.log("Marked onboarding complete");

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
