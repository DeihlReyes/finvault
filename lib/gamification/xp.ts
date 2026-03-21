import { db } from "@/lib/db";
import type { XPAction } from "@/lib/generated/prisma/enums";
import { XP_AMOUNTS, levelFromXP } from "@/types/gamification";

/**
 * Awards XP to a user. Checks for level-up and sets levelUpPending.
 * All writes happen inside a single Prisma transaction.
 */
export async function awardXP(
  userId: string,
  action: XPAction,
  amount?: number
): Promise<{ leveledUp: boolean; newLevel: number }> {
  const xpEarned = amount ?? XP_AMOUNTS[action];

  return db.$transaction(async (tx) => {
    await tx.xPLog.create({
      data: { userId, action, xpEarned },
    });

    const user = await tx.user.update({
      where: { id: userId },
      data: { totalXP: { increment: xpEarned } },
    });

    const newLevel = levelFromXP(user.totalXP);
    const leveledUp = newLevel > user.level;

    if (leveledUp) {
      await tx.user.update({
        where: { id: userId },
        data: { level: newLevel, levelUpPending: true },
      });
    }

    return { leveledUp, newLevel };
  });
}
