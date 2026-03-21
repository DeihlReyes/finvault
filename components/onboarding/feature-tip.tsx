"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dismissTip } from "@/actions/onboarding";

type Props = {
  tipId: string;
  title: string;
  description: string;
  seenTips: string[];
};

export function FeatureTip({ tipId, title, description, seenTips }: Props) {
  const [visible, setVisible] = useState(!seenTips.includes(tipId));

  async function handleDismiss() {
    setVisible(false);
    await dismissTip(tipId);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={tipId}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="relative bg-primary text-primary-foreground rounded-xl shadow-lg px-4 py-3 text-sm"
        >
          {/* Arrow pointing up */}
          <div className="absolute -top-2 left-5 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-primary" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold leading-snug">{title}</p>
              <p className="text-primary-foreground/80 text-xs mt-0.5 leading-snug">
                {description}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors shrink-0 mt-0.5 leading-none"
              aria-label="Dismiss tip"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
