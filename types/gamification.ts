export type { AchievementType, XPAction } from "@/lib/db/schema";

export const XP_AMOUNTS: Record<string, number> = {
  TRANSACTION: 10,
  BUDGET_SETUP: 50,
  RECURRING_RULE: 30,
  BUDGET_COMPLETED: 100,
  STREAK_7: 50,
  STREAK_30: 150,
  STREAK_100: 500,
  FIRST_WALLET: 25,
  EXPORT: 20,
  CHALLENGE_COMPLETE: 200,
  ACHIEVEMENT: 50,
} as const;

export const LEVEL_MILESTONES = [1, 5, 10, 25, 50, 100] as const;

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function levelFromXP(totalXP: number): number {
  return Math.max(1, Math.floor(Math.sqrt(totalXP / 100)));
}

export function xpProgressToNextLevel(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
} {
  const level = levelFromXP(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const progress = (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
  return { level, currentLevelXP, nextLevelXP, progress: Math.min(1, Math.max(0, progress)) };
}
