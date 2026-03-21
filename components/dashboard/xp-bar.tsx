"use client";

import { motion } from "framer-motion";

type Props = {
  level: number;
  totalXP: number;
  progress: number; // 0–1
};

export function XPBar({ level, totalXP, progress }: Props) {
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Level {level}</span>
        <span>{totalXP} XP</span>
        <span>Level {level + 1}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
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
