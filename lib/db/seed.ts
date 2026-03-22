import type { DrizzleDb } from "./index";
import { categories, users } from "./schema";
import { LOCAL_USER_ID } from "./constants";
import { eq } from "drizzle-orm";

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

/**
 * Seeds the local user and default categories if they don't exist.
 * Safe to call on every app startup — checks before inserting.
 */
export async function seedLocalUser(db: DrizzleDb): Promise<void> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, LOCAL_USER_ID));

  if (existing.length > 0) return;

  // Create the local user
  await db.insert(users).values({
    id: LOCAL_USER_ID,
    email: "local@finvault.app",
    onboardingCompleted: false,
  });

  // Seed default categories
  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((c) => ({
      id: crypto.randomUUID(),
      userId: LOCAL_USER_ID,
      ...c,
      isDefault: true,
    }))
  );
}
