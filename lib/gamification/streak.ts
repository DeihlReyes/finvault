import { db } from "@/lib/db";
import { awardXP } from "./xp";

function toDateString(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function diffDays(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round((msB - msA) / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates the streak for a user after they record a transaction.
 * Grants a streak freeze every 30 days automatically.
 */
export async function evaluateStreak(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      streak: true,
      lastTransactionDate: true,
      streakFreezeAvailable: true,
      lastFreezeGrantedAt: true,
      timezone: true,
    },
  });
  if (!user) return;

  const now = new Date();
  const todayStr = toDateString(now, user.timezone);

  // Auto-grant freeze every 30 days
  const daysSinceFreeze = user.lastFreezeGrantedAt
    ? diffDays(toDateString(user.lastFreezeGrantedAt, user.timezone), todayStr)
    : 999;
  const freezeData =
    daysSinceFreeze >= 30
      ? {
          streakFreezeAvailable: { increment: 1 },
          lastFreezeGrantedAt: now,
        }
      : {};

  if (!user.lastTransactionDate) {
    await db.user.update({
      where: { id: userId },
      data: { streak: 1, lastTransactionDate: now, ...freezeData },
    });
    return;
  }

  const lastStr = toDateString(user.lastTransactionDate, user.timezone);
  const diff = diffDays(lastStr, todayStr);

  if (diff === 0) {
    // Same day — just maybe grant freeze
    if (Object.keys(freezeData).length > 0) {
      await db.user.update({ where: { id: userId }, data: freezeData });
    }
    return;
  }

  if (diff === 1) {
    const newStreak = user.streak + 1;
    await db.user.update({
      where: { id: userId },
      data: { streak: newStreak, lastTransactionDate: now, ...freezeData },
    });
    await checkStreakMilestone(userId, newStreak);
    return;
  }

  // Missed day(s)
  if (user.streakFreezeAvailable > 0 && diff === 2) {
    const newStreak = user.streak + 1;
    await db.user.update({
      where: { id: userId },
      data: {
        streak: newStreak,
        lastTransactionDate: now,
        streakFreezeAvailable: { decrement: 1 },
        ...freezeData,
      },
    });
    await checkStreakMilestone(userId, newStreak);
    return;
  }

  // Streak reset
  await db.user.update({
    where: { id: userId },
    data: { streak: 1, lastTransactionDate: now, ...freezeData },
  });
}

async function checkStreakMilestone(userId: string, streak: number): Promise<void> {
  if (streak === 7) await awardXP(userId, "STREAK_7");
  if (streak === 30) await awardXP(userId, "STREAK_30");
  if (streak === 100) await awardXP(userId, "STREAK_100");
}
