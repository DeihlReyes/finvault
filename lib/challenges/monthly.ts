import { db } from "@/lib/db";
import { awardXP } from "@/lib/gamification/xp";

export const CHALLENGE_TYPE = "TRANSACTION_COUNT";
export const CHALLENGE_TARGET = 15;

export async function seedMonthlyChallenge(
  userId: string,
  month: number,
  year: number,
): Promise<void> {
  await db.monthlyChallenge.upsert({
    where: {
      userId_challengeType_month_year: {
        userId,
        challengeType: CHALLENGE_TYPE,
        month,
        year,
      },
    },
    create: {
      userId,
      challengeType: CHALLENGE_TYPE,
      month,
      year,
      targetValue: CHALLENGE_TARGET,
      currentValue: 0,
    },
    update: {},
  });
}

export async function incrementChallengeProgress(
  userId: string,
  month: number,
  year: number,
): Promise<void> {
  const challenge = await db.monthlyChallenge.findUnique({
    where: {
      userId_challengeType_month_year: {
        userId,
        challengeType: CHALLENGE_TYPE,
        month,
        year,
      },
    },
  });

  if (!challenge || challenge.completedAt) return;

  const newValue = Number(challenge.currentValue) + 1;
  const isComplete = newValue >= Number(challenge.targetValue);

  await db.monthlyChallenge.update({
    where: {
      userId_challengeType_month_year: {
        userId,
        challengeType: CHALLENGE_TYPE,
        month,
        year,
      },
    },
    data: {
      currentValue: { increment: 1 },
      ...(isComplete ? { completedAt: new Date() } : {}),
    },
  });

  if (isComplete) {
    await awardXP(userId, "CHALLENGE_COMPLETE");
  }
}
