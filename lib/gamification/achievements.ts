import { db } from "@/lib/db";
import type { AchievementType } from "@/lib/generated/prisma/enums";
import { awardXP } from "./xp";

/**
 * Idempotent achievement unlock.
 * If the achievement was just created (not already existing), awards +50 XP.
 */
export async function checkAndAwardAchievement(
  userId: string,
  type: AchievementType
): Promise<boolean> {
  const now = new Date();

  const existing = await db.achievement.findUnique({
    where: { userId_type: { userId, type } },
  });

  if (existing) return false;

  await db.achievement.create({
    data: { userId, type, unlockedAt: now },
  });

  // Award XP for unlocking an achievement
  await awardXP(userId, "ACHIEVEMENT");

  return true;
}
