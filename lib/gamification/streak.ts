import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
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
  const db = getDb();

  const [user] = await db
    .select({
      streak: users.streak,
      lastTransactionDate: users.lastTransactionDate,
      streakFreezeAvailable: users.streakFreezeAvailable,
      lastFreezeGrantedAt: users.lastFreezeGrantedAt,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  const now = new Date();
  const todayStr = toDateString(now, user.timezone);

  const daysSinceFreeze = user.lastFreezeGrantedAt
    ? diffDays(
        toDateString(user.lastFreezeGrantedAt, user.timezone),
        todayStr
      )
    : 999;
  const grantFreeze = daysSinceFreeze >= 30;

  if (!user.lastTransactionDate) {
    await db
      .update(users)
      .set({
        streak: 1,
        lastTransactionDate: now,
        ...(grantFreeze
          ? {
              streakFreezeAvailable: sql`${users.streakFreezeAvailable} + 1`,
              lastFreezeGrantedAt: now,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return;
  }

  const lastStr = toDateString(user.lastTransactionDate, user.timezone);
  const diff = diffDays(lastStr, todayStr);

  if (diff === 0) {
    if (grantFreeze) {
      await db
        .update(users)
        .set({
          streakFreezeAvailable: sql`${users.streakFreezeAvailable} + 1`,
          lastFreezeGrantedAt: now,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
    return;
  }

  if (diff === 1) {
    const newStreak = user.streak + 1;
    await db
      .update(users)
      .set({
        streak: newStreak,
        lastTransactionDate: now,
        ...(grantFreeze
          ? {
              streakFreezeAvailable: sql`${users.streakFreezeAvailable} + 1`,
              lastFreezeGrantedAt: now,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    await checkStreakMilestone(userId, newStreak);
    return;
  }

  // Missed day(s) — use freeze if available and only missed 2 days
  if (user.streakFreezeAvailable > 0 && diff === 2) {
    const newStreak = user.streak + 1;
    await db
      .update(users)
      .set({
        streak: newStreak,
        lastTransactionDate: now,
        streakFreezeAvailable: sql`${users.streakFreezeAvailable} - 1`,
        ...(grantFreeze
          ? {
              streakFreezeAvailable: sql`${users.streakFreezeAvailable}`,
              lastFreezeGrantedAt: now,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    await checkStreakMilestone(userId, newStreak);
    return;
  }

  // Streak reset
  await db
    .update(users)
    .set({
      streak: 1,
      lastTransactionDate: now,
      ...(grantFreeze
        ? {
            streakFreezeAvailable: sql`${users.streakFreezeAvailable} + 1`,
            lastFreezeGrantedAt: now,
          }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

async function checkStreakMilestone(
  userId: string,
  streak: number
): Promise<void> {
  if (streak === 7) await awardXP(userId, "STREAK_7");
  if (streak === 30) await awardXP(userId, "STREAK_30");
  if (streak === 100) await awardXP(userId, "STREAK_100");
}
