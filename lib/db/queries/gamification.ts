import { getDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { achievements, xpLogs, netWorthSnapshots, wallets } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { sum } from "drizzle-orm";

export async function getAchievements() {
  const db = getDb();
  return db
    .select()
    .from(achievements)
    .where(eq(achievements.userId, LOCAL_USER_ID))
    .orderBy(desc(achievements.unlockedAt));
}

export async function getXPLogs(limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(xpLogs)
    .where(eq(xpLogs.userId, LOCAL_USER_ID))
    .orderBy(desc(xpLogs.createdAt))
    .limit(limit);
}

/** Records today's net worth snapshot based on current wallet balances. */
export async function recordNetWorthSnapshot(): Promise<void> {
  const db = getDb();

  const ws = await db
    .select({ balance: wallets.balance })
    .from(wallets)
    .where(
      and(eq(wallets.userId, LOCAL_USER_ID), eq(wallets.isArchived, false))
    );

  const totalValue = ws
    .reduce((acc, w) => acc + Number(w.balance), 0)
    .toFixed(2);

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const existing = await db
    .select({ id: netWorthSnapshots.id })
    .from(netWorthSnapshots)
    .where(
      and(
        eq(netWorthSnapshots.userId, LOCAL_USER_ID),
        eq(netWorthSnapshots.date, today)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(netWorthSnapshots)
      .set({ totalValue })
      .where(eq(netWorthSnapshots.id, existing[0].id));
  } else {
    await db.insert(netWorthSnapshots).values({
      id: crypto.randomUUID(),
      userId: LOCAL_USER_ID,
      date: today,
      totalValue,
    });
  }
}

export async function getNetWorthSnapshots(limit = 30) {
  const db = getDb();
  return db
    .select()
    .from(netWorthSnapshots)
    .where(eq(netWorthSnapshots.userId, LOCAL_USER_ID))
    .orderBy(netWorthSnapshots.date)
    .limit(limit);
}
