"use client";

import dynamic from "next/dynamic";
import { useLevelUp } from "@/hooks/use-level-up";
import { XPBar } from "./xp-bar";

const LevelUpCelebration = dynamic(
  () => import("./level-up-celebration").then((m) => m.LevelUpCelebration),
  { ssr: false }
);

type Props = {
  level: number;
  totalXP: number;
  xpProgress: number;
  currentLevelXP: number;
  nextLevelXP: number;
  levelUpPending: boolean;
};

export function DashboardClient({
  level,
  totalXP,
  xpProgress,
  currentLevelXP,
  nextLevelXP,
  levelUpPending,
}: Props) {
  const { showCelebration, dismiss } = useLevelUp(levelUpPending);

  return (
    <>
      <XPBar
        level={level}
        totalXP={totalXP}
        progress={xpProgress}
        currentLevelXP={currentLevelXP}
        nextLevelXP={nextLevelXP}
      />
      {showCelebration && (
        <LevelUpCelebration level={level} onDismiss={dismiss} />
      )}
    </>
  );
}
