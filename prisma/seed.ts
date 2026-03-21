import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const DEFAULT_CATEGORIES = [
  { name: "Food", emoji: "🍔", color: "#F97316" },
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

export async function seedDefaultCategories(userId: string) {
  await db.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({
      userId,
      ...c,
      isDefault: true,
    })),
    skipDuplicates: true,
  });
}

async function main() {
  console.log("Seed: nothing to seed globally — categories are per-user.");
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
