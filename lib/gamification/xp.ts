import { getDb } from "@/lib/db";
import { xpLogs, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { XPAction } from "@/lib/db/schema";
import { XP_AMOUNTS, levelFromXP } from "@/types/gamification";

/**
 * Awards XP to the local user. Checks for level-up and sets levelUpPending.
 */
export async function awardXP(
  userId: string,
  action: XPAction,
  amount?: number
): Promise<{ leveledUp: boolean; newLevel: number }> {
  const db = getDb();
  const xpEarned = amount ?? XP_AMOUNTS[action];

  await db.insert(xpLogs).values({
    id: crypto.randomUUID(),
    userId,
    action,
    xpEarned,
  });

  const [user] = await db
    .update(users)
    .set({
      totalXP: sql`${users.totalXP} + ${xpEarned}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ totalXP: users.totalXP, level: users.level });

  const newLevel = levelFromXP(user.totalXP);
  const leveledUp = newLevel > user.level;

  if (leveledUp) {
    await db
      .update(users)
      .set({ level: newLevel, levelUpPending: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  return { leveledUp, newLevel };
}
