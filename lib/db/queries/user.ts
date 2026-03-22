import { getDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import {
  users,
  wallets,
  categories,
  transactions,
  budgets,
  achievements,
  monthlyChallenges,
  xpLogs,
  netWorthSnapshots,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ActionResult } from "@/types/api";

export async function getLocalUser() {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, LOCAL_USER_ID))
    .limit(1);
  return user ?? null;
}

export async function updateProfile(input: {
  displayName?: string;
  currency?: string;
  timezone?: string;
  avatarUrl?: string;
}): Promise<ActionResult> {
  const db = getDb();

  await db
    .update(users)
    .set({
      ...(input.displayName !== undefined
        ? { displayName: input.displayName }
        : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, LOCAL_USER_ID));

  return { success: true, data: undefined };
}

export async function completeOnboarding(input: {
  displayName: string;
  currency: string;
}): Promise<ActionResult> {
  const db = getDb();

  await db
    .update(users)
    .set({
      displayName: input.displayName,
      currency: input.currency,
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, LOCAL_USER_ID));

  return { success: true, data: undefined };
}

export async function clearLevelUpPending(): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ levelUpPending: false, updatedAt: new Date() })
    .where(eq(users.id, LOCAL_USER_ID));
}

export async function dismissTip(tipId: string): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({
      seenTips: sql`array_append(${users.seenTips}, ${tipId})`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, LOCAL_USER_ID));
}

/** Clears all user data from the database (delete account equivalent). */
export async function clearAllData(): Promise<ActionResult> {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx.delete(xpLogs).where(eq(xpLogs.userId, LOCAL_USER_ID));
    await tx
      .delete(achievements)
      .where(eq(achievements.userId, LOCAL_USER_ID));
    await tx
      .delete(monthlyChallenges)
      .where(eq(monthlyChallenges.userId, LOCAL_USER_ID));
    await tx
      .delete(netWorthSnapshots)
      .where(eq(netWorthSnapshots.userId, LOCAL_USER_ID));
    await tx.delete(budgets).where(eq(budgets.userId, LOCAL_USER_ID));
    await tx
      .delete(transactions)
      .where(eq(transactions.userId, LOCAL_USER_ID));
    await tx.delete(wallets).where(eq(wallets.userId, LOCAL_USER_ID));
    await tx.delete(categories).where(eq(categories.userId, LOCAL_USER_ID));
    await tx.delete(users).where(eq(users.id, LOCAL_USER_ID));
  });

  return { success: true, data: undefined };
}
