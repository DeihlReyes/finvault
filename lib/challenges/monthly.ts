import { getDb } from "@/lib/db";
import { monthlyChallenges } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { awardXP } from "@/lib/gamification/xp";

export const CHALLENGE_TYPE = "TRANSACTION_COUNT";
export const CHALLENGE_TARGET = 15;

export async function seedMonthlyChallenge(
  userId: string,
  month: number,
  year: number
): Promise<void> {
  const db = getDb();

  const existing = await db
    .select({ id: monthlyChallenges.id })
    .from(monthlyChallenges)
    .where(
      and(
        eq(monthlyChallenges.userId, userId),
        eq(monthlyChallenges.challengeType, CHALLENGE_TYPE),
        eq(monthlyChallenges.month, month),
        eq(monthlyChallenges.year, year)
      )
    )
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(monthlyChallenges).values({
    id: crypto.randomUUID(),
    userId,
    challengeType: CHALLENGE_TYPE,
    month,
    year,
    targetValue: String(CHALLENGE_TARGET),
    currentValue: "0",
  });
}

export async function incrementChallengeProgress(
  userId: string,
  month: number,
  year: number
): Promise<void> {
  const db = getDb();

  const [challenge] = await db
    .select({
      id: monthlyChallenges.id,
      currentValue: monthlyChallenges.currentValue,
      targetValue: monthlyChallenges.targetValue,
      completedAt: monthlyChallenges.completedAt,
    })
    .from(monthlyChallenges)
    .where(
      and(
        eq(monthlyChallenges.userId, userId),
        eq(monthlyChallenges.challengeType, CHALLENGE_TYPE),
        eq(monthlyChallenges.month, month),
        eq(monthlyChallenges.year, year)
      )
    )
    .limit(1);

  if (!challenge || challenge.completedAt) return;

  const newValue = Number(challenge.currentValue) + 1;
  const isComplete = newValue >= Number(challenge.targetValue);

  await db
    .update(monthlyChallenges)
    .set({
      currentValue: sql`${monthlyChallenges.currentValue} + 1`,
      ...(isComplete ? { completedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(monthlyChallenges.id, challenge.id));

  if (isComplete) {
    await awardXP(userId, "CHALLENGE_COMPLETE");
  }
}
