import { getDb } from "@/lib/db";
import { achievements } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { AchievementType } from "@/lib/db/schema";
import { awardXP } from "./xp";

/**
 * Idempotent achievement unlock.
 * If the achievement was just created (not already existing), awards +50 XP.
 */
export async function checkAndAwardAchievement(
  userId: string,
  type: AchievementType
): Promise<boolean> {
  const db = getDb();

  const existing = await db
    .select({ id: achievements.id })
    .from(achievements)
    .where(and(eq(achievements.userId, userId), eq(achievements.type, type)))
    .limit(1);

  if (existing.length > 0) return false;

  await db.insert(achievements).values({
    id: crypto.randomUUID(),
    userId,
    type,
    unlockedAt: new Date(),
  });

  await awardXP(userId, "ACHIEVEMENT");
  return true;
}
