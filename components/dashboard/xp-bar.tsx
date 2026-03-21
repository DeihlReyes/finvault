"use client";

import { motion } from "framer-motion";

type Props = {
  level: number;
  totalXP: number;
  progress: number; // 0–1
  currentLevelXP: number;
  nextLevelXP: number;
};

export function XPBar({ level, totalXP, progress, currentLevelXP, nextLevelXP }: Props) {
  const xpIntoLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Level {level}</span>
        <span className="font-medium text-foreground">
          {xpIntoLevel} <span className="text-muted-foreground font-normal">/ {xpNeeded} XP</span>
        </span>
        <span>Level {level + 1}</span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </div>
    </div>
  );
}
