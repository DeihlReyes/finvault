"use client";

import { useEffect, useState } from "react";
import { clearLevelUpPending } from "@/actions/user";

export function useLevelUp(levelUpPending: boolean) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (levelUpPending) {
      setShowCelebration(true);
    }
  }, [levelUpPending]);

  async function dismiss() {
    setShowCelebration(false);
    await clearLevelUpPending();
  }

  return { showCelebration, dismiss };
}
