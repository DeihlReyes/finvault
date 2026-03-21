import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import type { User } from "@/lib/generated/prisma/client";

export type AuthUser = {
  supabaseId: string;
  email: string;
  user: User;
};

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
 * Gets the Supabase session and the corresponding Prisma user.
 * If the DB user doesn't exist yet (e.g. auth webhook missed in local dev),
 * it is created here as a fallback so the app never gets stuck.
 * Returns null only when there is no Supabase session at all.
 */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) return null;

  const isNew = !(await db.user.findUnique({
    where: { id: supabaseUser.id },
    select: { id: true },
  }));

  // Upsert: atomic — safe under concurrent requests on first login
  const user = await db.user.upsert({
    where: { id: supabaseUser.id },
    update: {},
    create: {
      id: supabaseUser.id,
      email: supabaseUser.email ?? "",
      displayName:
        (supabaseUser.user_metadata?.full_name as string | undefined) ??
        (supabaseUser.user_metadata?.name as string | undefined) ??
        null,
    },
  });

  if (isNew) {
    await db.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        userId: user.id,
        ...c,
        isDefault: true,
      })),
      skipDuplicates: true,
    });
  }

  return {
    supabaseId: supabaseUser.id,
    email: supabaseUser.email ?? user.email,
    user,
  };

}
